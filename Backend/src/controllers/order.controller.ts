 import { Request, Response } from 'express';
import { db } from '../config/db';

export const placeOrder = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.id || req.body.userId;
  const { items, note } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Order items are required.' });
    return;
  }

  // Operating Hours Check (09:00 - 18:00 IST)
  const now = new Date();
  const currentHour = now.getHours();
  if (currentHour < 9 || currentHour >= 18) {
    res.status(400).json({ error: 'Orders can only be placed between 09:00 and 18:00.' });
    return;
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Sort item IDs to prevent deadlock during row locking
    const sortedItems = [...items].sort((a, b) => a.itemId - b.itemId);

    let totalAmount = 0;
    const orderItemsToInsert = [];

    // 2. Lock inventory rows using SELECT ... FOR UPDATE
    for (const item of sortedItems) {
      const [rows]: any = await connection.query(
        'SELECT id, price, stock FROM items WHERE id = ? FOR UPDATE',
        [item.itemId]
      );

      if (rows.length === 0) {
        throw new Error(`Item ID ${item.itemId} not found.`);
      }

      const dbItem = rows[0];
      if (dbItem.stock < item.quantity) {
        throw new Error(`Insufficient stock for item ID ${item.itemId}.`);
      }

      totalAmount += dbItem.price * item.quantity;
      orderItemsToInsert.push({
        itemId: item.itemId,
        quantity: item.quantity,
        price: dbItem.price
      });
    }

    // 3. Generate 4-digit pickup code
    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();

    // 4. Create Order Record
    const [orderResult]: any = await connection.query(
      'INSERT INTO orders (user_id, total_amount, pickup_code, note, status) VALUES (?, ?, ?, ?, ?)',
      [userId, totalAmount, pickupCode, note || null, 'PENDING']
    );
    const orderId = orderResult.insertId;

    // 5. Insert Order Items & Deduct Stock
    for (const orderItem of orderItemsToInsert) {
      await connection.query(
        'INSERT INTO order_items (order_id, item_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, orderItem.itemId, orderItem.quantity, orderItem.price]
      );

      await connection.query(
        'UPDATE items SET stock = stock - ? WHERE id = ?',
        [orderItem.quantity, orderItem.itemId]
      );
    }

    // 6. Record Initial Status History
    await connection.query(
      'INSERT INTO order_status_history (order_id, status) VALUES (?, ?)',
      [orderId, 'PENDING']
    );

    await connection.commit();

    res.status(201).json({
      message: 'Order placed successfully',
      orderId,
      pickupCode,
      totalAmount
    });
  } catch (error: any) {
    await connection.rollback();
    res.status(400).json({ error: error.message || 'Failed to place order.' });
  } finally {
    connection.release();
  }
};