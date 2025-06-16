const stripe = require('../config/stripe');
const firebaseAdmin = require('../config/firebase');

const SUBSCRIPTION_PRICE_ID = process.env.STRIPE_PRICE_ID;

class AuthController {
  // New method to handle complete user registration
  async registerUser(req, res) {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    try {
      // 1. Create the user in Firebase Authentication
      const userRecord = await firebaseAdmin.auth().createUser({
        email,
        password,
        emailVerified: false
      });
      
      const userId = userRecord.uid;
      console.log(`User registered: ${userId} (${email})`);
      
      // 2. Create user record in Firestore
      const newUser = {
        email,
        createdAt: new Date().toISOString(),
        apiCallsUsed: 0,
        apiCallsLimit: 10,
        totalSearchQueries: 0
      };
      
      await firebaseAdmin.firestore().collection('users').doc(userId).set(newUser);
      
      // 3. Return complete user data to frontend
      return res.status(201).json({
        userId,
        email,
        apiCallsUsed: 0,
        apiCallsLimit: 10,
        totalSearchQueries: 0,
        createdAt: newUser.createdAt,
        subscriptionStatus: 'free'
      });
    } catch (error) {
      console.error(`Registration failed for ${email}: ${error.message}`);
      return res.status(500).json({
        error: 'Failed to register user',
        details: error.message
      });
    }
  }

  async createUser(req, res) {
    const { userId, email } = req.body;
    try {
      const newUser = {
        email,
        createdAt: new Date().toISOString(),
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
    const { userId, email } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    try {
      // Get user from Firestore first
      const userDoc = await firebaseAdmin.firestore().collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userDoc.data();
      let { stripeCustomerId } = userData;

      // If user doesn't have a Stripe customer ID yet, create one
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: email || userData.email,
          metadata: { firebaseUserId: userId }
        });
        
        stripeCustomerId = customer.id;
        
        // Update the user record with the new Stripe customer ID
        await firebaseAdmin.firestore().collection('users').doc(userId).update({
          stripeCustomerId: stripeCustomerId
        });
        
        console.log(`Stripe customer created for user ${userId}: ${stripeCustomerId}`);
      }

      // Fix URL formatting by ensuring no double slashes or protocols
      const frontendUrl = process.env.FRONTEND_URL.replace(/^https?:\/\/+/, 'https://').replace(/\/+$/, '');
      const successUrl = `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${frontendUrl}/profile`;

      // Now create the checkout session with the customer ID
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
      console.error(`Failed to create checkout session for user ${userId}: ${error.message}`);
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

      console.log(`Subscription ${canceledSubscription.id} canceled for user ${userId}`);

      res.json({
        success: true,
        message: 'Subscription will be canceled at the end of the billing period'
      });

    } catch (error) {
      console.error(`Failed to cancel subscription for user ${userId}: ${error.message}`);
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
      console.error(`Failed to fetch user data for ${userId}: ${error.message}`);
      return res.status(500).json({
        error: 'Failed to fetch user data',
        details: error.message
      });
    }
  }

  // Add other controller methods...
}

// Create instance and export both the instance and class
const authController = new AuthController();
module.exports = {
  controller: authController,
  AuthController // Export the class so static methods are accessible
};