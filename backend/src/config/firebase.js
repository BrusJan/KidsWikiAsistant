const admin = require('firebase-admin');

function initializeFirebaseAdmin() {
  try {
    // For local development - try to load from file
    const serviceAccount = require('../serviceAccountKey.json');
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    // For production - use environment variables
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error('FIREBASE_PROJECT_ID environment variable is required');
    }

    const serviceAccountConfig = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY ? 
        process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    };

    // Validate required fields
    const requiredFields = ['project_id', 'private_key', 'client_email'];
    for (const field of requiredFields) {
      if (!serviceAccountConfig[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccountConfig)
    });
  }
}

try {
  module.exports = initializeFirebaseAdmin();
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}