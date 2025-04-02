const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Replace with your actual Price ID from Stripe Dashboard
const SUBSCRIPTION_PRICE_ID = process.env.STRIPE_PRICE_ID; // Add this to your .env file

router.post('/create-session', async (req, res) => {
  const { email, userId } = req.body;

  try {
    // Validate required fields
    if (!email || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: SUBSCRIPTION_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/profile`,
      customer_email: email,
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

// Verify subscription status
router.get('/status', async (req, res) => {
  const { userId } = req.query;

  try {
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      expand: ['data.customer']
    });

    const userSubscription = subscriptions.data.find(sub => 
      sub.metadata.userId === userId
    );

    res.json({ active: !!userSubscription });
  } catch (error) {
    console.error('Error checking subscription:', error);
    res.status(500).json({ error: 'Failed to check subscription status' });
  }
});

// Cancel subscription
router.post('/cancel', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter' });
  }

  try {
    // First, get all active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      expand: ['data.customer']
    });

    // Debug log
    console.log('Active subscriptions:', subscriptions.data.map(sub => ({
      id: sub.id,
      customerId: sub.customer?.id,
      metadata: sub.metadata
    })));

    // Find subscription for this user
    const subscription = subscriptions.data.find(sub => 
      sub.metadata && sub.metadata.userId === userId
    );

    if (!subscription) {
      console.log(`No active subscription found for userId: ${userId}`);
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel at period end instead of immediate cancellation
    const canceledSubscription = await stripe.subscriptions.update(
      subscription.id,
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

// Verify successful payment
router.post('/verify-session', async (req, res) => {
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

module.exports = router;