const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const firebaseAdmin = require('../config/firebase');

const SUBSCRIPTION_PRICE_ID = process.env.STRIPE_PRICE_ID;

// Creates user in firestore, returns back given userId
router.post('/create-user', async (req, res) => {
  const { userId, email } = req.body;

  try {
    const newUser = {
      email: email,
      createdAt: new Date().toISOString(),
      subscriptionStatus: 'free',
      apiCallsUsed: 0,
      apiCallsLimit: 10
    }

    await firebaseAdmin.firestore().collection('users').doc(userId).set(newUser);
    return res.json({ userId });

  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({
      error: 'Failed to register user',
      details: error.message
    });
  }
});

// Subscription endpoints
router.post('/subscription/create-session', async (req, res) => {
  const { email, userId } = req.body;

  try {
    // Validate required fields
    if (!email || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create new customer in Stripe
    const customer = await stripe.customers.create({
      email: email,
      metadata: { userId: userId }
    });

    // Update user in Firestore with Stripe customer ID
    await firebaseAdmin.firestore().collection('users').doc(userId).update({
      stripeCustomerId: customer.id
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id, // Use newly created customer
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: SUBSCRIPTION_PRICE_ID,
          quantity: 1,
        }
      ],
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/profile`,
      metadata: {
        userId: userId
      },
      allow_promotion_codes: true
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      details: error.message
    });
  }
});

router.get('/subscription/status', async (req, res) => {
  const { userId } = req.query;

  try {
    const userDoc = await firebaseAdmin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const subscriptionStatus = await checkStripeSubscriptionStatus(userData.stripeCustomerId);

    return res.json({
      ...subscriptionStatus,
      apiCallsUsed: userData.apiCallsUsed || 0,
      apiCallsLimit: userData.apiCallsLimit || 10
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return res.status(500).json({ error: 'Failed to check subscription status' });
  }
});

router.post('/subscription/cancel', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter' });
  }

  try {
    // Get user's stripeCustomerId from Firestore
    const userDoc = await firebaseAdmin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const { stripeCustomerId } = userData;

    if (!stripeCustomerId) {
      return res.status(404).json({ error: 'No subscription found - user has no Stripe customer ID' });
    }

    // Get subscriptions using stripeCustomerId like in checkStripeSubscriptionStatus
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel at period end
    const canceledSubscription = await stripe.subscriptions.update(
      subscriptions.data[0].id,
      { cancel_at_period_end: true }
    );

    console.log('Subscription canceled:', {
      id: canceledSubscription.id,
      status: canceledSubscription.status,
      cancelAt: canceledSubscription.cancel_at
    });

    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period'
    });

  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      error: 'Failed to cancel subscription',
      details: error.message
    });
  }
});

router.post('/subscription/verify-session', async (req, res) => {
  const { sessionId } = req.body;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      res.json({ status: 'success' });
    } else {
      res.json({ status: 'pending' });
    }
  } catch (error) {
    console.error('Error verifying session:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

router.post('/subscription/create-customer', async (req, res) => {
  const { email, userId } = req.body;

  try {
    // Validate required fields
    if (!email || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create or get existing Stripe customer
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    let customer;
    if (existingCustomers.data.length > 0) {
      customer = await stripe.customers.update(
        existingCustomers.data[0].id,
        { metadata: { userId: userId } }
      );
    } else {
      customer = await stripe.customers.create({
        email: email,
        metadata: { userId: userId }
      });
    }

    // Create user document in Firestore
    await firebaseAdmin.firestore().collection('users').doc(userId).set({
      email: email,
      createdAt: new Date().toISOString(),
      stripeCustomerId: customer.id,
      subscriptionStatus: 'free',
      apiCallsUsed: 0,
      totalSearchQueries: 0  // Add new counter
    });

    return res.json({ customerId: customer.id });

  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    return res.status(500).json({
      error: 'Failed to create customer',
      details: error.message
    });
  }
});

/**
 * Get user data from Firestore
 * @route GET /api/auth/user/:userId
 */
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  console.log('Fetching user data for userId:', userId);

  if (!userId) {
    console.log('Missing userId parameter');
    return res.status(400).json({ error: 'Missing userId parameter' });
  }

  try {
    // Log before Firestore query
    console.log('Querying Firestore for document:', userId);

    const userDoc = await firebaseAdmin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    // Log after query
    console.log('Firestore query completed. Document exists:', userDoc.exists);

    if (!userDoc.exists) {
      console.log('Document not found in Firestore');
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    console.log('Retrieved user data:', userData);

    const response = {
      uid: userId,
      email: userData.email,
      subscriptionStatus: userData.subscriptionStatus,
      apiCalls: userData.apiCallsUsed || 0,
      totalSearchQueries: userData.totalSearchQueries || 0,  // Add to response
      createdAt: userData.createdAt
    };

    console.log('Sending response:', response);
    return res.json(response);

  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return res.status(500).json({
      error: 'Failed to fetch user data',
      details: error.message
    });
  }
});

async function checkStripeSubscriptionStatus(stripeCustomerId) {
  if (!stripeCustomerId) {
    return { 
      subscription: 'free',
      cancelAtPeriodEnd: false 
    };
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      return {
        subscription: 'premium',
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
      };
    }

    return { 
      subscription: 'free',
      cancelAtPeriodEnd: false 
    };
  } catch (error) {
    console.error('Error checking Stripe subscription:', error);
    return { 
      subscription: 'free',
      cancelAtPeriodEnd: false 
    };
  }
}

module.exports = router;