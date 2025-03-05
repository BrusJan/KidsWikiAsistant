const express = require('express');
const router = express.Router();
const mistralController = require('../controllers/mistralController');

// Single Mistral route for getting responses
router.post('/response', mistralController.getMistralResponse);

module.exports = router;