const express = require('express');
const bodyParser = require('body-parser');
const wikiRoutes = require('./routes/wikiRoutes');
const mistralRoutes = require('./routes/mistralRoutes');
const mainRoutes = require('./routes/mainRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Routes
app.use('/api/wiki', wikiRoutes);
app.use('/api/mistral', mistralRoutes);
app.use('/api/main', mainRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});