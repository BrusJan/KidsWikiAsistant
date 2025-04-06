require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const wikiRoutes = require('./routes/wikiRoutes');
const mistralRoutes = require('./routes/mistralRoutes');
const mainRoutes = require('./routes/mainRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  console.log(`${req.method} ${req.path}`, req.params);
  next();
});

// Routes
app.use('/api/wiki', wikiRoutes);
app.use('/api/mistral', mistralRoutes);
app.use('/api/main', mainRoutes);
app.use('/api/auth', authRoutes); // Changed from /api/subscription to /api/auth

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});