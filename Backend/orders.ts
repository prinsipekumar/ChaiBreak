 import express, { Request, Response } from 'express';
import mysql from 'mysql2/promise';

const router = express.Router();

// Initialize the database connection pool for local MySQL in Docker
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'chaibreak_db',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10
});

// TypeScript interfaces for request input validation
interface CartItem {
    itemId: number;
    qty: number;
}

interface OrderRequestBody {
    items: CartItem[];
    note?: string;
}

/**
 * FEATURE F4: PLACE ORDER (THE TRANSACTION)
 * Spec Check: Lock items using id order sequence. Deduct inventory levels inside transaction.
 */
// TODO [F1 INTEGRATION]: Wire up your 'requireAuth' middleware here
// Example: router.post('/orders', requireAuth, async (req: Request, res: Response) => {
router.post('/orders', async (req: Request, res: Response) => {
    const { items, note } = req.body as OrderRequestBody;

    // Fallback test ID (Will be extracted via req.user.id once F1 auth middleware is active)
    const userId = 1;

    // Time Guard Validation (Specs Page 7): Canteen takes orders 09:00 to 18:00 IST
    const istHour = parseInt(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }));
    if (istHour < 9 || istHour >= 18) {
        return res.status(409).json({
            success: false,
            message: "Canteen closed"
        });
    }

    // Input Validation (Specs Page 7): Cart empty check & max 5 items validation
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Your cart cannot be empty."
        });
    }

    for (const item of items) {
        if (item.qty > 5 || item.qty <= 0) {
            return res.status(400).json({
                success: false,
                message: "An order can have at most 5 of any one item."
            });
        }
    }

    // Extract item IDs to perform our targeted locking mechanism query
    const itemIds = items.map(item => item.itemId);

    // Declare variables outside the try block so they are correctly scoped for the error catch handlers
    let soldOutIds: number[] = [];
    let orderId: number;
    let connection: mysql.PoolConnection | null = null;

    try {
        // Deadlock Prevention Rule (Specs Page 9): Extract and sort items array by id sequence
        const sortedItems = [...items].sort((a, b) => a.itemId - b.itemId);
        const sortedItemIds = sortedItems.map(item => item.itemId);

        connection = await db.getConnection();
        
        // Start isolated MySQL transaction block
        await connection.beginTransaction();

        // Lock target menu item catalog rows with FOR UPDATE in explicit order sequence to prevent deadlocks
        const [rows] = await connection.query(
            'SELECT id, name, price_rupees, stock_left, is_available FROM items WHERE id IN (?) ORDER BY id FOR UPDATE',
            [sortedItemIds]
        );

        const storeItems = rows as any[];
        let totalRupees = 0;
        const processedItems = [];

        for (const item of sortedItems) {
            const dbItem = storeItems.find(i => i.id === item.itemId);

            if (!dbItem || dbItem.stock_left < item.qty || dbItem.is_available === 0 || dbItem.stock_left === 0) {
                soldOutIds.push(item.itemId);
                continue;
            }

            totalRupees += dbItem.price_rupees * item.qty;
            processedItems.push({
                itemId: dbItem.id,
                name: dbItem.name,
                price: dbItem.price_rupees,
                qty: item.qty
            });
        }

        // Integrity Rule (Specs Page 10): Roll back instantly if items are flagged sold out
        if (soldOutIds.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: `Some items in your cart are sold out: ${soldOutIds.join(', ')}`,
                soldOut: soldOutIds
            });
        }

        // Safely deduct item inventory levels inside the locked state loop block
        for (const item of processedItems) {
            await connection.query(
                'UPDATE items SET stock_left = stock_left - ? WHERE id = ?',
                [item.qty, item.itemId]
            );
        }

        // Generate 4-digit pickup code required for F4 success screens
        const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();

        // Save entry block inside 'orders' master summary data table records
        const [orderResult] = await connection.query(
            'INSERT INTO orders (user_id, status, total_rupees, note, pickup_code) VALUES (?, ?, ?, ?, ?)',
            [userId, 'placed', totalRupees, note || '', pickupCode]
        );

        orderId = (orderResult as any).insertId;

        // Save detailed transaction mappings (Name and Price are copied strictly at order time)
        for (const item of processedItems) {
            await connection.query(
                'INSERT INTO order_items (order_id, item_id, item_name, price_rupees, qty) VALUES (?, ?, ?, ?, ?)',
                [orderId, item.itemId, item.name, item.price, item.qty]
            );
        }

        // Insert baseline state log entry inside 'order_status_history' timeline tracker (Specs Page 11)
        await connection.query(
            'INSERT INTO order_status_history (order_id, from_status, to_status, changed_by) VALUES (?, ?, ?, ?)',
            [orderId, null, 'placed', 'employee']
        );

        // Commit transaction changes cleanly to the database
        await connection.commit();

        // Return exact response shape required by Page 2 specifications guide guidelines
        return res.status(201).json({
            success: true,
            data: {
                id: orderId,
                pickup_code: pickupCode,
                total_rupees: totalRupees,
                status: "placed"
            }
        });

    } catch (error: any) {
        if (connection) {
            await connection.rollback();
        }
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

export default router;