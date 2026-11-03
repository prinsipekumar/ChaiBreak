const express = require('express');
const router = express.Router();
const { Pool } = require('pg'); // Standard database client matching project layout

// Initialize your database connection pool config
const db = new Pool({
    user: process.env.DB_USER || 'root',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'chaibreak_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 3306 // Docker MySQL/Postgres default
});

/**
 * FEATURE F4: PLACE ORDER ENDPOINT
 * Safely processes incoming orders using row-locking database transactions to prevent deadlocks under load.
 */
router.post('/orders', async (req, res) => {
    const { items, customNotes } = req.body;
    const userId = req.user?.id || 1; // Fallback to test user if auth middleware isn't built yet

    // 1. Validation checks
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Your cart cannot be empty." });
    }

    // CRITICAL ENGINE RULE: Sort items numerically by ID to prevent database deadlocks during concurrent loads
    const sortedItems = [...items].sort((a, b) => a.itemId - b.itemId);

    // Get a dedicated client to manage the isolated transaction block manually
    const client = await db.connect();

    try {
        // Start the isolation transaction
        await client.query('BEGIN');

        let totalAmount = 0;
        const processedItems = [];

        // 2. Process items securely with row locking
        for (const item of sortedItems) {
            const { itemId, qty } = item;

            if (!qty || qty <= 0) {
                throw new Error(`Invalid item quantity assigned for item ID: ${itemId}`);
            }

            // CRITICAL ENGINE REQUIREMENT: Use "FOR UPDATE" to row-lock the menu inventory securely
            const itemCheck = await client.query(
                'SELECT id, name, price, stock FROM items WHERE id = $1 FOR UPDATE',
                [itemId]
            );

            if (itemCheck.rows.length === 0) {
                throw new Error(`Item ID ${itemId} was not found on our menu catalog.`);
            }

            const storeItem = itemCheck.rows[0];

            // Verify if there is enough stock available for the order
            if (storeItem.stock < qty) {
                throw new Error(`Insufficient stock for ${storeItem.name}. Only ${storeItem.stock} available.`);
            }

            // Deduct the inventory level safely inside the locked state
            await client.query(
                'UPDATE items SET stock = stock - $1 WHERE id = $2',
                [qty, itemId]
            );

            totalAmount += storeItem.price * qty;
            processedItems.push({
                id: storeItem.id,
                qty: qty,
                price: storeItem.price
            });
        }

        // 3. Create the master order record entry inside your database
        const orderResult = await client.query(
            'INSERT INTO orders (user_id, total_price, custom_notes, status, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
            [userId, totalAmount, customNotes || '', 'pending']
        );
        const orderId = orderResult.rows[0].id;

        // 4. Save individual items into the mapping order items table
        for (const target of processedItems) {
            await client.query(
                'INSERT INTO order_items (order_id, item_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)',
                [orderId, target.id, target.qty, target.price]
            );
        }

        // Commit transaction changes cleanly to the live database configuration
        await client.query('COMMIT');

        // Return completion success state to clear front-end Zustand cart cache
        return res.status(201).json({
            success: true,
            message: "Order placed successfully!",
            orderId: orderId,
            totalAmount: totalAmount
        });

    } catch (error) {
        // If anything fails or stock runs out, discard all changes instantly to maintain consistent data states
        await client.query('ROLLBACK');
        return res.status(400).json({ error: error.message });
    } finally {
        // Return the client wrapper back to the database connection manager
        client.release();
    }
});

module.exports = router;