import { Router } from 'express';
import { placeOrder } from '../controllers/order.controller';

const router = Router();

router.post('/orders', placeOrder);

export default router;