const express = require('express');
const router = express.Router();

const wikiRoutes = require('./wikiRoutes');
const mistralRoutes = require('./mistralRoutes');
const mainRoutes = require('./mainRoutes');
const authRoutes = require('./authRoutes');

// API routes
router.use('/wiki', wikiRoutes);
router.use('/mistral', mistralRoutes);
router.use('/main', mainRoutes);
router.use('/auth', authRoutes);

module.exports = router;