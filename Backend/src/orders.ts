import { Router, Request, Response } from 'express';
import mysql from 'mysql2/promise';

const router = Router();

// Create connection pool for MySQL
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'chaibreak_db',
    password: process.env.DB_PASSWORD || '',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10
});

/**
 * FEATURE F4: PLACE ORDER ENDPOINT
 * Row-locking transaction preventing race conditions under load.
 */
router.post('/orders', async (req: Request, res: Response) => {
    const { items, note } = req.body;
    // Assuming auth middleware attaches user object
    const userId = (req as any).user?.id; 

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: "Your cart cannot be empty." });
    }

    // 1. Check operating hours (09:00 to 18:00 IST)
    const currentHour = new Date().getHours();
    if (currentHour < 9 || currentHour >= 18) {
        return res.status(409).json({ success: false, message: "Canteen closed" });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 2. Sort item IDs ascending to prevent deadlocks
        const sortedItems = [...items].sort((a, b) => a.itemId - b.itemId);
        const itemIds = sortedItems.map(i => i.itemId);
        const placeholders = itemIds.map(() => '?').join(',');

        // 3. Lock items using FOR UPDATE
        const [rows]: any = await connection.execute(
            `SELECT id, name, price_rupees, stock_left, is_available 
             FROM items WHERE id IN (${placeholders}) ORDER BY id ASC FOR UPDATE`,
            itemIds
        );

        const itemMap = new Map(rows.map((row: any) => [row.id, row]));
        const soldOutIds: number[] = [];
        let totalRupees = 0;
        const processedItems = [];

        for (const clientItem of sortedItems) {
            const dbItem: any = itemMap.get(clientItem.itemId);

            if (!dbItem || !dbItem.is_available || dbItem.stock_left < clientItem.qty) {
                soldOutIds.push(clientItem.itemId);
            } else {
                totalRupees += dbItem.price_rupees * clientItem.qty;
                processedItems.push({
                    id: dbItem.id,
                    name: dbItem.name,
                    price: dbItem.price_rupees,
                    qty: clientItem.qty
                });
            }
        }

        if (soldOutIds.length > 0) {
            await connection.rollback();
            connection.release();
            return res.status(409).json({
                success: false,
                message: "Some items are sold out or have insufficient stock.",
                soldOut: soldOutIds
            });
        }

        // 4. Generate 4-digit pickup code
        const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();

        // 5. Insert order
        const [orderResult]: any = await connection.execute(
            `INSERT INTO orders (user_id, status, total_rupees, note, pickup_code, created_at, updated_at) 
             VALUES (?, 'placed', ?, ?, ?, NOW(), NOW())`,
            [userId, totalRupees, note || null, pickupCode]
        );
        const orderId = orderResult.insertId;

        // 6. Insert order items & deduct stock
        for (const item of processedItems) {
            await connection.execute(
                `INSERT INTO order_items (order_id, item_id, item_name, price_rupees, qty) 
                 VALUES (?, ?, ?, ?, ?)`,
                [orderId, item.id, item.name, item.price, item.qty]
            );

            await connection.execute(
                `UPDATE items SET stock_left = stock_left - ? WHERE id = ?`,
                [item.qty, item.id]
            );
        }

        // 7. Record status history
        await connection.execute(
            `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, changed_at) 
             VALUES (?, NULL, 'placed', ?, NOW())`,
            [orderId, userId]
        );

        await connection.commit();
        connection.release();

        return res.status(201).json({
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
        connection.release();
        return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
});

export default router;