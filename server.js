require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;
const databaseUrl = process.env.DATABASE_URL;

// Connect to MongoDB
mongoose.connect(databaseUrl)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

app.get('/test', (req, res) => {
  // about to connect to MongoDB
  console.log("connecting to MongoDB... with db url: " + databaseUrl);
  if (mongoose.connection.readyState === 1) { // 1 means connected
    res.send('MongoDB connection is established');
  } else {
    res.status(500).send('MongoDB connection is not established'); // Send 500 Internal Server Error
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
