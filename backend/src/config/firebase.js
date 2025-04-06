const admin = require('firebase-admin');

let credential;

try {
  // For local development - try to load from file
  const serviceAccount = require('../serviceAccountKey.json');
  credential = admin.credential.cert(serviceAccount);
} catch (error) {
  // For production - use environment variables
  credential = admin.credential.cert({
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
    token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  });
}

admin.initializeApp({
  credential
});

module.exports = admin;