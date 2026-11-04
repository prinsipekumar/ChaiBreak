import express from 'express';
import orderRouter from './orders.js';

const app = express();
app.use(express.json());

// Wire up endpoints matching required URL prefix version routing rule (Specs Page 2)
app.use('/api/v1', orderRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`ChaiBreak TypeScript Backend running on port ${PORT}`);
});