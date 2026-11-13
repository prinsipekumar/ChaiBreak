import { Response } from "express";
import { RowDataPacket } from "mysql2";
import { db } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

type OrderStatus = "placed" | "preparing" | "ready" | "picked_up" | "cancelled";

// The kitchen moves an order one step at a time.
// ready -> picked_up is NOT listed on purpose: it must go through the
// pickup endpoint, which checks the pickup code.
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: "preparing",
  preparing: "ready",
};

class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

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

// PATCH /api/v1/kitchen/orders/:id/status   { "to": "preparing" }
export const updateOrderStatus = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const orderId = Number(req.params.id);
  const to = req.body.to as OrderStatus;
  const kitchenUserId = req.user!.id;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Lock the order row so two taps / two kitchen screens can't both move it.
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT id, status FROM orders WHERE id = ? FOR UPDATE",
      [orderId],
    );

    if (rows.length === 0) {
      throw new HttpError(404, "Order not found.");
    }

    const from = rows[0].status as OrderStatus;

    if (to === "picked_up" && from === "ready") {
      throw new HttpError(
        409,
        "Use the pickup endpoint with the pickup code to mark an order as picked up.",
      );
    }

    if (NEXT_STATUS[from] !== to) {
      throw new HttpError(
        409,
        `Invalid status change: '${from}' cannot move to '${to}'.`,
      );
    }

    await connection.query("UPDATE orders SET status = ? WHERE id = ?", [
      to,
      orderId,
    ]);

    await connection.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by)
       VALUES (?, ?, ?, ?)`,
      [orderId, from, to, kitchenUserId],
    );

    await connection.commit();

    res.status(200).json({ success: true, data: { id: orderId, status: to } });
  } catch (error) {
    await connection.rollback();

    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      console.error("Kitchen update status error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to update order status." });
    }
  } finally {
    connection.release();
  }
};

// POST /api/v1/kitchen/orders/:id/pickup   { "code": "4444" }
export const pickupOrder = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const orderId = Number(req.params.id);
  const code = String(req.body.code);
  const kitchenUserId = req.user!.id;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT id, status, pickup_code FROM orders WHERE id = ? FOR UPDATE",
      [orderId],
    );

    if (rows.length === 0) {
      throw new HttpError(404, "Order not found.");
    }

    const status = rows[0].status as OrderStatus;

    if (status !== "ready") {
      throw new HttpError(
        409,
        `Order is '${status}'. Only a 'ready' order can be picked up.`,
      );
    }

    // 400, not 401/403: the app logs the user out on a 401.
    if (String(rows[0].pickup_code) !== code) {
      throw new HttpError(400, "Wrong pickup code.");
    }

    await connection.query("UPDATE orders SET status = 'picked_up' WHERE id = ?", [
      orderId,
    ]);

    await connection.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by)
       VALUES (?, 'ready', 'picked_up', ?)`,
      [orderId, kitchenUserId],
    );

    await connection.commit();

    res
      .status(200)
      .json({ success: true, data: { id: orderId, status: "picked_up" } });
  } catch (error) {
    await connection.rollback();

    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      console.error("Kitchen pickup error:", error);
      res.status(500).json({ success: false, message: "Failed to mark pickup." });
    }
  } finally {
    connection.release();
  }
};
