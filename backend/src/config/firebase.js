const admin = require('firebase-admin');

function initializeFirebaseAdmin() {
  try {
    // For local development - try to load from file
    try {
      const serviceAccount = require('../serviceAccountKey.json');
      console.log('Firebase: Using service account from file');
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (fileError) {
      console.log('Firebase: Using environment variables');
    }

    // For production - use environment variables
    const serviceAccountConfig = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID?.trim(),
      private_key: process.env.FIREBASE_PRIVATE_KEY ? 
        process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').trim() : undefined,
      client_email: process.env.FIREBASE_CLIENT_EMAIL?.trim(),
    };

    // Validate required fields
    if (!serviceAccountConfig.project_id || !serviceAccountConfig.private_key || !serviceAccountConfig.client_email) {
      throw new Error('Missing required Firebase configuration');
    }

    // Initialize Firebase with environment variables
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccountConfig)
    });
  } catch (error) {
    console.error(`Firebase init error: ${error.message}`);
    throw error;
  }
}

// Initialize Firebase and export the admin instance
const firebaseAdmin = initializeFirebaseAdmin();
module.exports = firebaseAdmin;