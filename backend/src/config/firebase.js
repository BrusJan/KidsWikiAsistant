const admin = require('firebase-admin');

function initializeFirebaseAdmin() {
  try {
    console.log('Available Firebase environment variables:', {
      projectId: process.env.FIREBASE_PROJECT_ID ? 'set' : 'not set',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'set' : 'not set',
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? 'set' : 'not set'
    });

    const serviceAccountConfig = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID?.trim(),
      private_key: process.env.FIREBASE_PRIVATE_KEY ? 
        process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').trim() : undefined,
      client_email: process.env.FIREBASE_CLIENT_EMAIL?.trim(),
    };

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccountConfig)
    });
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

module.exports = initializeFirebaseAdmin();