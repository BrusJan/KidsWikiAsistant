const express = require('express');
const cors = require('cors');
const mainRoutes = require('./routes/mainRoutes');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/main', mainRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});