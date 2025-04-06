const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/create-user', authController.createUser);
router.post('/subscription/create-session', authController.createSubscriptionSession);
router.get('/subscription/status', authController.getSubscriptionStatus);
router.post('/subscription/cancel', authController.cancelSubscription);
router.post('/subscription/verify-session', authController.verifySession);

module.exports = router;