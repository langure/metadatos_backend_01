const express = require('express');
const app = express();
const port = 3000; // You can use any port you prefer

app.get('/test', (req, res) => {
  res.send('Hello, world!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
