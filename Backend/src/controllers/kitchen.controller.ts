import fs from "fs";
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

const ITEM_COLUMNS =
  "id, name, stock_left, is_available, photo_url";

const toItemResponse = (row: RowDataPacket) => ({
  id: row.id,
  name: row.name,
  stockLeft: row.stock_left,
  isAvailable: Boolean(row.is_available),
  photoUrl: row.photo_url,
});

// GET /api/v1/kitchen/items
// Every menu item with its stock and availability, grouped by category order.
export const listKitchenItems = async (
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT i.id, i.name, c.name AS category, i.price_rupees,
              i.stock_left, i.is_available, i.photo_url
         FROM items i
         JOIN categories c ON c.id = i.category_id
        ORDER BY c.sort_order ASC, i.name ASC`,
    );

    res.status(200).json({
      success: true,
      data: rows.map((row) => ({
        ...toItemResponse(row),
        category: row.category,
        priceRupees: Number(row.price_rupees),
      })),
    });
  } catch (error) {
    console.error("Kitchen list items error:", error);
    res.status(500).json({ success: false, message: "Failed to load items." });
  }
};

// PATCH /api/v1/kitchen/items/:id   { "isAvailable": false, "stockLeft": 0 }
export const updateKitchenItem = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const itemId = Number(req.params.id);
  const { isAvailable, stockLeft } = req.body;

  const sets: string[] = [];
  const values: number[] = [];

  if (isAvailable !== undefined) {
    sets.push("is_available = ?");
    values.push(isAvailable ? 1 : 0);
  }
  if (stockLeft !== undefined) {
    sets.push("stock_left = ?");
    values.push(Number(stockLeft));
  }

  if (sets.length === 0) {
    res.status(400).json({
      success: false,
      message: "Send at least one of isAvailable or stockLeft.",
    });
    return;
  }

  try {
    const [existing] = await db.query<RowDataPacket[]>(
      "SELECT id FROM items WHERE id = ?",
      [itemId],
    );
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: "Item not found." });
      return;
    }

    await db.query(`UPDATE items SET ${sets.join(", ")} WHERE id = ?`, [
      ...values,
      itemId,
    ]);

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT ${ITEM_COLUMNS} FROM items WHERE id = ?`,
      [itemId],
    );

    res.status(200).json({ success: true, data: toItemResponse(rows[0]) });
  } catch (error) {
    console.error("Kitchen update item error:", error);
    res.status(500).json({ success: false, message: "Failed to update item." });
  }
};

const removeFile = (filePath: string): void => {
  fs.promises.unlink(filePath).catch(() => undefined);
};

// POST /api/v1/kitchen/items/:id/photo   (multipart, field name "photo")
export const uploadKitchenItemPhoto = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const itemId = Number(req.params.id);
  const file = req.file;

  if (!file) {
    res.status(400).json({
      success: false,
      message: "No photo uploaded. Send a JPG or PNG in the 'photo' field.",
    });
    return;
  }

  try {
    const [existing] = await db.query<RowDataPacket[]>(
      "SELECT id FROM items WHERE id = ?",
      [itemId],
    );
    if (existing.length === 0) {
      removeFile(file.path);
      res.status(404).json({ success: false, message: "Item not found." });
      return;
    }

    const photoUrl = `/uploads/items/${file.filename}`;
    await db.query("UPDATE items SET photo_url = ? WHERE id = ?", [
      photoUrl,
      itemId,
    ]);

    res.status(200).json({ success: true, data: { id: itemId, photoUrl } });
  } catch (error) {
    removeFile(file.path);
    console.error("Kitchen item photo error:", error);
    res.status(500).json({ success: false, message: "Failed to save photo." });
  }
};
