import { Response } from "express";
import { RowDataPacket } from "mysql2";
import { db } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

// GET /api/v1/kitchen/orders?status=placed&page=1&limit=20
export const listKitchenOrders = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const status = (req.query.status as string) || "placed";
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    const [countRows] = await db.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total FROM orders WHERE status = ?",
      [status],
    );
    const total = Number(countRows[0].total);

    // Oldest first, so the kitchen works the queue in order.
    // created_at is returned as a UTC ISO string (the app shows it in IST).
    const [orders] = await db.query<RowDataPacket[]>(
      `SELECT id, status, note,
              DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') AS created_at,
              TIMESTAMPDIFF(MINUTE, created_at, UTC_TIMESTAMP()) AS minutes_since_ordered
         FROM orders
        WHERE status = ?
        ORDER BY created_at ASC, id ASC
        LIMIT ? OFFSET ?`,
      [status, limit, offset],
    );

    const itemsByOrder = new Map<number, { name: string; qty: number }[]>();
    if (orders.length > 0) {
      const ids = orders.map((o) => o.id);
      const [itemRows] = await db.query<RowDataPacket[]>(
        "SELECT order_id, item_name, qty FROM order_items WHERE order_id IN (?)",
        [ids],
      );
      for (const row of itemRows) {
        const list = itemsByOrder.get(row.order_id) ?? [];
        list.push({ name: row.item_name, qty: row.qty });
        itemsByOrder.set(row.order_id, list);
      }
    }

    res.status(200).json({
      success: true,
      data: orders.map((o) => ({
        id: o.id,
        status: o.status,
        note: o.note,
        createdAt: o.created_at,
        minutesSinceOrdered: Number(o.minutes_since_ordered),
        items: itemsByOrder.get(o.id) ?? [],
      })),
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error("Kitchen list orders error:", error);
    res.status(500).json({ success: false, message: "Failed to load orders." });
  }
};
