 import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import { db } from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { normalizeOrderStatus } from '../utils/orderStatus';

interface OrderRow extends RowDataPacket {
  id: number;
  user_id: number;
  status: string;
  total_amount: string | number;
  pickup_code: string;
  note: string | null;
  created_at: Date | string;
}

interface OrderItemRow extends RowDataPacket {
  id: number;
  order_id: number;
  item_id: number;
  name: string | null;
  quantity: number;
  price: string | number;
}

interface StatusHistoryRow extends RowDataPacket {
  status: string;
  created_at: Date | string;
}

const ORDER_COLUMNS =
  'id, user_id, status, total_amount, pickup_code, note, created_at';

const serializeItems = (items: OrderItemRow[]) =>
  items.map(item => ({
    id: Number(item.id),
    order_id: Number(item.order_id),
    item_id: Number(item.item_id),
    name: item.name ?? 'Item',
    quantity: Number(item.quantity),
    price: Number(item.price),
  }));

const serializeOrder = (
  row: OrderRow,
  items: OrderItemRow[] = [],
  history: StatusHistoryRow[] = [],
) => ({
  id: Number(row.id),
  user_id: Number(row.user_id),
  status: normalizeOrderStatus(row.status),
  total_amount: Number(row.total_amount),
  pickup_code: row.pickup_code,
  note: row.note,
  created_at: row.created_at,
  items: serializeItems(items),
  status_history: history.map(entry => ({
    status: normalizeOrderStatus(entry.status),
    created_at: entry.created_at,
  })),
});

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

const requireUserId = (
  req: AuthenticatedRequest,
  res: Response,
): number | null => {
  if (!req.user?.id) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized token payload context.',
    });
    return null;
  }

  return req.user.id;
};

// GET /api/v1/orders/me
export const getMyOrders = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = requireUserId(req, res);
  if (userId === null) {
    return;
  }

  try {
    const [orders] = await db.query<OrderRow[]>(
      `SELECT ${ORDER_COLUMNS} FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC`,
      [userId],
    );

    if (orders.length === 0) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const orderIds = orders.map(order => Number(order.id));
    const placeholders = orderIds.map(() => '?').join(', ');
    const [items] = await db.query<OrderItemRow[]>(
      `SELECT oi.id, oi.order_id, oi.item_id, oi.quantity, oi.price, i.name
       FROM order_items oi
       LEFT JOIN items i ON i.id = oi.item_id
       WHERE oi.order_id IN (${placeholders})
       ORDER BY oi.id ASC`,
      orderIds,
    );

    const itemsByOrder = new Map<number, OrderItemRow[]>();
    for (const item of items) {
      const orderId = Number(item.order_id);
      const existing = itemsByOrder.get(orderId) ?? [];
      existing.push(item);
      itemsByOrder.set(orderId, existing);
    }

    res.status(200).json({
      success: true,
      data: orders.map(order =>
        serializeOrder(order, itemsByOrder.get(Number(order.id)) ?? []),
      ),
    });
  } catch (error) {
    console.error('Error fetching orders for user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error encountered while fetching orders.',
    });
  }
};

// GET /api/v1/orders/:id
export const getOrderById = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = requireUserId(req, res);
  if (userId === null) {
    return;
  }

  try {
    const orderId = Number(req.params.id);
    const [orders] = await db.query<OrderRow[]>(
      `SELECT ${ORDER_COLUMNS} FROM orders WHERE id = ? AND user_id = ?`,
      [orderId, userId],
    );

    if (orders.length === 0) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    const [items] = await db.query<OrderItemRow[]>(
      `SELECT oi.id, oi.order_id, oi.item_id, oi.quantity, oi.price, i.name
       FROM order_items oi
       LEFT JOIN items i ON i.id = oi.item_id
       WHERE oi.order_id = ?
       ORDER BY oi.id ASC`,
      [orderId],
    );

    const [history] = await db.query<StatusHistoryRow[]>(
      `SELECT status, created_at
       FROM order_status_history
       WHERE order_id = ?
       ORDER BY created_at ASC`,
      [orderId],
    );

    res.status(200).json({
      success: true,
      data: serializeOrder(orders[0], items, history),
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error encountered while fetching order details.',
    });
  }
};

// PATCH /api/v1/orders/:id/cancel
export const cancelOrder = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = requireUserId(req, res);
  if (userId === null) {
    return;
  }

  const orderId = Number(req.params.id);
  let connection: Awaited<ReturnType<typeof db.getConnection>>;

  try {
    connection = await db.getConnection();
  } catch (error) {
    console.error('Error acquiring a database connection:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error encountered while cancelling order.',
    });
    return;
  }

  try {
    await connection.beginTransaction();

    const [orders] = await connection.query<OrderRow[]>(
      `SELECT id, user_id, status FROM orders WHERE id = ? FOR UPDATE`,
      [orderId],
    );

    if (orders.length === 0 || Number(orders[0].user_id) !== userId) {
      await connection.rollback();
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    if (normalizeOrderStatus(orders[0].status) !== 'placed') {
      await connection.rollback();
      res.status(409).json({
        success: false,
        message: 'This order can no longer be cancelled.',
      });
      return;
    }

    const [items] = await connection.query<OrderItemRow[]>(
      `SELECT item_id, quantity FROM order_items WHERE order_id = ? ORDER BY item_id ASC`,
      [orderId],
    );

    for (const item of items) {
      await connection.query(
        `UPDATE items SET stock = stock + ? WHERE id = ?`,
        [Number(item.quantity), Number(item.item_id)],
      );
    }

    await connection.query(
      `UPDATE orders SET status = 'cancelled' WHERE id = ?`,
      [orderId],
    );

    await connection.query(
      `INSERT INTO order_status_history (order_id, status) VALUES (?, 'cancelled')`,
      [orderId],
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully.',
      data: { id: orderId, status: 'cancelled' },
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error('Error rolling back order cancellation:', rollbackError);
    }
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error encountered while cancelling order.',
    });
  } finally {
    connection.release();
  }
};