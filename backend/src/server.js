const express = require('express');
const cors = require('cors');
const mainRoutes = require('./routes/mainRoutes');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.use('/api/main', mainRoutes);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});