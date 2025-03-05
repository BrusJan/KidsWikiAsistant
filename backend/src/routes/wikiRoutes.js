const express = require('express');
const router = express.Router();
const wikiController = require('../controllers/wikiController');

// Single Wikipedia search route
router.get('/search', wikiController.search);

module.exports = router;