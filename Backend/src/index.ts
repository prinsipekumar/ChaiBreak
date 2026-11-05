const express = require('express');
const app = express();
const orderRouter = require('./orders');

// Middleware to parse incoming JSON payloads
app.use(express.json());

// Wire up your completed F4 orders endpoint route
app.use('/api', orderRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`ChaiBreak Backend running on port ${PORT}`);
});