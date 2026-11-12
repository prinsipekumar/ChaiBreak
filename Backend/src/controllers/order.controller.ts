 import { Request, Response } from 'express';
import { db } from '../config/db';

export const placeOrder = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.id || req.body.userId;
  const { items, note } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, message: 'Order items are required.' });
    return;
  }

  // Operating Hours Check (09:00 - 18:00 IST) per ChaiBreak Spec F4
  const now = new Date();
  const currentHour = now.getHours();
  if (currentHour < 9 || currentHour >= 18) {
    res.status(409).json({ success: false, message: 'Canteen closed' });
    return;
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Sort item IDs to prevent deadlock during row locking (per spec)
    const sortedItems = [...items].sort((a, b) => a.itemId - b.itemId);

    let totalRupees = 0;
    const orderItemsToInsert = [];

    // 2. Lock inventory rows using SELECT ... FOR UPDATE
    for (const item of sortedItems) {
      const [rows]: any = await connection.query(
        'SELECT id, name, price_rupees, stock_left FROM items WHERE id = ? FOR UPDATE',
        [item.itemId]
      );

      if (rows.length === 0) {
        throw new Error(`Item ID ${item.itemId} not found.`);
      }

      const dbItem = rows[0];

      if (dbItem.stock_left < item.qty) {
        throw new Error(`Insufficient stock for item ID ${item.itemId}`);
      }

      totalRupees += dbItem.price_rupees * item.qty;
      orderItemsToInsert.push({
        itemId: item.itemId,
        itemName: dbItem.name,
        qty: item.qty,
        priceRupees: dbItem.price_rupees
      });
    }

    // 3. Generate 4-digit pickup code
    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();

    // 4. Create Order Record
    const [orderResult]: any = await connection.query(
      'INSERT INTO orders (user_id, total_rupees, pickup_code, note, status) VALUES (?, ?, ?, ?, ?)',
      [userId, totalRupees, pickupCode, note || null, 'placed']
    );
    const orderId = orderResult.insertId;

    // 5. Insert Order Items & Deduct Stock
    for (const orderItem of orderItemsToInsert) {
      await connection.query(
        'INSERT INTO order_items (order_id, item_id, item_name, price_rupees, qty) VALUES (?, ?, ?, ?, ?)',
        [orderId, orderItem.itemId, orderItem.itemName, orderItem.priceRupees, orderItem.qty]
      );

      await connection.query(
        'UPDATE items SET stock_left = stock_left - ? WHERE id = ?',
        [orderItem.qty, orderItem.itemId]
      );
    }

    // 6. Record Initial Status History
    await connection.query(
      'INSERT INTO order_status_history (order_id, from_status, to_status, changed_by) VALUES (?, NULL, ?, ?)',
      [orderId, 'placed', userId]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      data: {
        orderId,
        pickupCode,
        totalRupees,
        status: 'placed'
      }
    });
  } catch (error: any) {
    await connection.rollback();
    res.status(409).json({ success: false, message: error.message || 'Failed to place order' });
  } finally {
    connection.release();
  }
};
