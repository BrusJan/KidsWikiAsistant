const express = require('express');
const router = express.Router();
const { controller: authController } = require('../controllers/authController');

router.post('/create-user', authController.createUser.bind(authController));
router.post('/subscription/create-session', authController.createSubscriptionSession.bind(authController));
router.get('/subscription/status', authController.getSubscriptionStatus.bind(authController));
router.post('/subscription/cancel', authController.cancelSubscription.bind(authController));
router.post('/subscription/verify-session', authController.verifySession.bind(authController));
router.get('/user/:userId', authController.getUserData.bind(authController));
router.post('/register', authController.registerUser.bind(authController));

module.exports = router;