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

  // Make checkSubscriptionStatus static so it can be used without instance
  static async checkSubscriptionStatus(stripeCustomerId) {
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

  async createSubscriptionSession(req, res) {
    const { userId } = req.body;

    try {
      // ... existing user validation code ...

      // Fix URL formatting by ensuring no double slashes or protocols
      const frontendUrl = process.env.FRONTEND_URL.replace(/\/+$/, ''); // Remove trailing slashes
      const successUrl = `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${frontendUrl}/profile`;

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID,
            quantity: 1,
          }
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: userId
        },
        allow_promotion_codes: true
      });

      return res.json({ url: session.url });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return res.status(500).json({ error: 'Failed to create checkout session' });
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
      // Use the static method instead of this
      const subscriptionStatus = await AuthController.checkSubscriptionStatus(userData.stripeCustomerId);

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

  async getUserData(req, res) {
    const { userId } = req.params;
    
    try {
      const userDoc = await firebaseAdmin.firestore().collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        console.log(`User ${userId} not found`);
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userDoc.data();
      const response = {
        uid: userId,
        email: userData.email,
        apiCallsUsed: userData.apiCallsUsed || 0,
        apiCallsLimit: userData.apiCallsLimit || 10,
        totalSearchQueries: userData.totalSearchQueries || 0,
        createdAt: userData.createdAt
      };

      return res.json(response);
    } catch (error) {
      console.error('Error fetching user data:', error);
      return res.status(500).json({
        error: 'Failed to fetch user data',
        details: error.message
      });
    }
  }

  // Add other controller methods...
}

// Add static method to the class
AuthController.checkSubscriptionStatus = async (stripeCustomerId) => {
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
};

// Create instance and export both the instance and class
const authController = new AuthController();
module.exports = {
  controller: authController,
  AuthController // Export the class so static methods are accessible
};