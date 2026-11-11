import { RowDataPacket } from "mysql2";
import { db } from "../config/db";
import {
  normalizeOrderStatus,
  OrderStatus,
  isActiveOrderStatus,
} from "../utils/orderStatus";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to change seeded order status in production.");
  process.exit(1);
}

const SUPPORTED_STATUSES: OrderStatus[] = [
  "placed",
  "preparing",
  "ready",
  "picked_up",
  "cancelled",
];

interface SeedOrderRow extends RowDataPacket {
  id: number;
  status: string;
  note: string | null;
}

interface SeedOrderItemRow extends RowDataPacket {
  item_id: number;
  quantity: number;
}

const [orderIdArg, statusArg] = process.argv.slice(2);
const orderId = Number(orderIdArg);
const targetStatus = statusArg
  ? normalizeOrderStatus(statusArg)
  : undefined;

if (!Number.isInteger(orderId) || orderId < 1 || !statusArg) {
  console.error(
    "Usage: npm run order:status -- <seededOrderId> <placed|preparing|ready|picked_up|cancelled>",
  );
  process.exit(1);
}

if (!targetStatus || !SUPPORTED_STATUSES.includes(targetStatus)) {
  console.error(`Unsupported status: ${statusArg}`);
  process.exit(1);
}

const run = async (): Promise<void> => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [orders] = await connection.query<SeedOrderRow[]>(
      "SELECT id, status, note FROM orders WHERE id = ? FOR UPDATE",
      [orderId],
    );

    if (orders.length === 0) {
      await connection.rollback();
      console.error(`Order ${orderId} was not found.`);
      process.exitCode = 1;
      return;
    }

    const order = orders[0];
    if (!order.note?.startsWith("F5-SEED:")) {
      await connection.rollback();
      console.error(
        `Order ${orderId} is not an F5 seeded record. Only seeded orders can be changed.`,
      );
      process.exitCode = 1;
      return;
    }

    const currentStatus = normalizeOrderStatus(order.status);

    if (currentStatus === targetStatus) {
      await connection.commit();
      console.log(`Order ${orderId} is already ${targetStatus}.`);
      return;
    }

    if (currentStatus === "cancelled") {
      await connection.rollback();
      console.error("A cancelled seeded order cannot be moved again.");
      process.exitCode = 1;
      return;
    }

    if (targetStatus === "cancelled") {
      const [items] = await connection.query<SeedOrderItemRow[]>(
        "SELECT item_id, quantity FROM order_items WHERE order_id = ? ORDER BY item_id ASC",
        [orderId],
      );

      for (const item of items) {
        await connection.query(
          "UPDATE items SET stock = stock + ? WHERE id = ?",
          [Number(item.quantity), Number(item.item_id)],
        );
      }
    }

    await connection.query("UPDATE orders SET status = ? WHERE id = ?", [
      targetStatus,
      orderId,
    ]);
    await connection.query(
      "INSERT INTO order_status_history (order_id, status) VALUES (?, ?)",
      [orderId, targetStatus],
    );
    await connection.commit();

    console.log(
      `Order ${orderId} moved from ${currentStatus} to ${targetStatus}${isActiveOrderStatus(targetStatus) ? " (polling remains active)" : ""}.`,
    );
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

run()
  .catch(error => {
    console.error("F5 seeded order status update failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
