import express, { Request, Response } from 'express';
import mysql from 'mysql2/promise';

const router = express.Router();

// Initialize the database connection pool for local MySQL in Docker (Specs Page 1 & 2)
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
 * Spec Check: Lock items using id order sequence. Deduct inventory, copy prices, and track logs.
 */
// TODO [F1 INTEGRATION]: Wire up your 'requireAuth' middleware here once F1 is merged.
// Example: router.post('/orders', requireAuth, async (req: Request, res: Response) => {
router.post('/orders', async (req: Request, res: Response) => {
    const { items, note } = req.body as OrderRequestBody;
    
    // Fallback test ID (Will be extracted via req.user.id once F1 middleware is hooked up)
    const userId = 1; 

    // Time Guard Validation (Specs Page 7): Canteen takes orders 09:00 to 18:00
    const currentHour = new Date().getUTCHours() + 5; 
    if (currentHour < 9 || currentHour >= 18) {
        return res.status(409).json({ 
            success: false, 
            message: "Canteen closed" 
        });
    }

    // Input Validation (Specs Page 7): Cart empty check & max 5 items of any one type limit
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

    // Deadlock Prevention Rule (Specs Page 9): Extract and sort IDs numerically
    const sortedItems = [...items].sort((a, b) => a.itemId - b.itemId);
    const itemIds = sortedItems.map(item => item.itemId);

    const connection = await db.getConnection();

    try {
        // Start isolated MySQL transaction block
        await connection.beginTransaction();

        // Lock target menu item catalog rows with FOR UPDATE (Specs Page 9)
        const [rows] = await connection.query(
            `SELECT id, name, price_rupees, stock_left, is_available FROM items WHERE id IN (?) ORDER BY id FOR UPDATE`,
            [itemIds]
        );
        
        const storeItems = rows as any[];
        let totalRupees = 0;
        const processedItems = [];
        const soldOutIds: number[] = [];

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

        // Integrity Rule (Specs Page 10): Roll back instantly if any items are sold out
        if (soldOutIds.length > 0) {
            await connection.rollback();
            return res.status(409).json({ 
                success: false, 
                soldOut: soldOutIds 
            });
        }

        // Safely deduct item inventory levels inside the locked state
        for (const item of processedItems) {
            await connection.query(
                'UPDATE items SET stock_left = stock_left - ? WHERE id = ?',
                [item.qty, item.itemId]
            );
        }

        // Generate 4-digit pickup code required for F4 success screens (Specs Page 9)
        const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();

        // Save entry block inside 'orders' master summary data table
        const [orderResult] = await connection.query(
            'INSERT INTO orders (user_id, status, total_rupees, note, pickup_code, created_at, updated_at) VALUES (?, "placed", ?, ?, ?, NOW(), NOW())',
            [userId, totalRupees, note || '', pickupCode]
        );
        const orderId = (orderResult as any).insertId;

        // Save detailed transaction mappings (Name and Price are copied at order time per Page 8 spec)
        for (const item of processedItems) {
            await connection.query(
                'INSERT INTO order_items (order_id, item_id, item_name, price_rupees, qty) VALUES (?, ?, ?, ?, ?)',
                [orderId, item.itemId, item.name, item.price, item.qty]
            );
        }

        // Insert baseline state log entry inside 'order_status_history' data mapper (Specs Page 11)
        await connection.query(
            'INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, changed_at) VALUES (?, NULL, "placed", "employee", NOW())',
            [orderId]
        );

        // Commit transaction changes cleanly to the database
        await connection.commit();

        // Return exact response shape required by page 2 specs guidelines
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
        await connection.rollback();
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    } finally {
        connection.release();
    }
});

export default router;