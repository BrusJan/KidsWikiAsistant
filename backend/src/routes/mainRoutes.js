const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');

router.get('/kids-summary', mainController.getKidsFriendlySummary);

module.exports = router;