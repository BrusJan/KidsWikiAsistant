const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');
const reportController = require('../controllers/reportController');

router.get('/kids-summary', mainController.getKidsFriendlySummary);
router.post('/report', reportController.submitReport);

module.exports = router;