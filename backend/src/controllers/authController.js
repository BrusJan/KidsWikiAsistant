
const stripe = require('../config/stripe');
const firebaseAdmin = require('../config/firebase');

const SUBSCRIPTION_PRICE_ID = process.env.STRIPE_PRICE_ID;

class AuthController {
  async createUser(req, res) {
    const { userId, email } = req.body;
    try {
      const newUser = {
        email,
        createdAt: new Date().toISOString(),
        subscriptionStatus: 'free',
        apiCallsUsed: 0,
        apiCallsLimit: 10,
        totalSearchQueries: 0
      };
      
      await firebaseAdmin.firestore().collection('users').doc(userId).set(newUser);
      return res.json({ userId });
    } catch (error) {
      console.error('Error registering user:', error);
      return res.status(500).json({
        error: 'Failed to register user',
        details: error.message
      });
    }
  }

  async checkSubscriptionStatus(stripeCustomerId) {
    if (!stripeCustomerId) {
      return { subscription: 'free' };
    }
  
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'active',
        limit: 1
      });
  
      return {
        subscription: subscriptions.data.length > 0 ? 'premium' : 'free'
      };
    } catch (error) {
      console.error('Error checking Stripe subscription:', error);
      return { subscription: 'free' }; // Default to free on error
    }
  }

  async createSubscriptionSession(req, res) {
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
  }

  async getSubscriptionStatus(req, res) {
    const { userId } = req.query;

    try {
      const userDoc = await firebaseAdmin.firestore().collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userDoc.data();
      const subscriptionStatus = await this.checkSubscriptionStatus(userData.stripeCustomerId);

      return res.json({
        ...subscriptionStatus,
        apiCallsUsed: userData.apiCallsUsed || 0,
        apiCallsLimit: userData.apiCallsLimit || 10
      });
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return res.status(500).json({ error: 'Failed to check subscription status' });
    }
  }

  async cancelSubscription(req, res) {
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
  }

  async verifySession(req, res) {
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
  }

  // Add other controller methods...
}

module.exports = new AuthController();