const admin = require('firebase-admin');

function initializeFirebaseAdmin() {
  try {
    // Debug log to see what environment variables are available
    console.log('Available Firebase environment variables:', {
      projectId: process.env.FIREBASE_PROJECT_ID ? 'set' : 'not set',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'set' : 'not set',
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? 'set' : 'not set'
    });

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
    if (!process.env.FIREBASE_PROJECT_ID) {
      console.error('Environment variables check:', {
        NODE_ENV: process.env.NODE_ENV,
        envVars: Object.keys(process.env).filter(key => key.startsWith('FIREBASE_'))
      });
      throw new Error('FIREBASE_PROJECT_ID environment variable is required');
    }

    const serviceAccountConfig = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID.trim(),
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID?.trim(),
      private_key: process.env.FIREBASE_PRIVATE_KEY ? 
        process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').trim() : undefined,
      client_email: process.env.FIREBASE_CLIENT_EMAIL?.trim(),
      client_id: process.env.FIREBASE_CLIENT_ID?.trim(),
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL?.trim()
    };

    // Log config without sensitive data
    console.log('Service account config:', {
      project_id: serviceAccountConfig.project_id,
      client_email: serviceAccountConfig.client_email,
      hasPrivateKey: !!serviceAccountConfig.private_key
    });

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
  } catch (error) {
    console.error('Detailed initialization error:', error);
    throw error;
  }
}

try {
  module.exports = initializeFirebaseAdmin();
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}