const admin = require('firebase-admin');

function initializeFirebaseAdmin() {
  try {
    // For local development - try to load from file
    try {
      const serviceAccount = require('../serviceAccountKey.json');
      console.log('Using service account from file');
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (fileError) {
      console.log('Service account file not found, using environment variables');
    }

    // For production - use environment variables
    const serviceAccountConfig = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID?.trim(),
      private_key: process.env.FIREBASE_PRIVATE_KEY ? 
        process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').trim() : undefined,
      client_email: process.env.FIREBASE_CLIENT_EMAIL?.trim(),
    };

    // Log config without sensitive data
    console.log('Firebase config:', {
      project_id: serviceAccountConfig.project_id,
      client_email: serviceAccountConfig.client_email,
      hasPrivateKey: !!serviceAccountConfig.private_key
    });

    // Validate required fields
    if (!serviceAccountConfig.project_id || !serviceAccountConfig.private_key || !serviceAccountConfig.client_email) {
      throw new Error('Missing required Firebase configuration');
    }

    // Initialize Firebase with environment variables
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccountConfig)
    });
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

// Initialize Firebase and export the admin instance
const firebaseAdmin = initializeFirebaseAdmin();
module.exports = firebaseAdmin;