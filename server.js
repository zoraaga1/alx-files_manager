// server.js

const express = require('express');

const app = express();

const routes = require('./routes/index');

const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', routes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
