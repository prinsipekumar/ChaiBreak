import { RowDataPacket, ResultSetHeader } from "mysql2";
import { PoolConnection } from "mysql2/promise";
import { db } from "../config/db";
import { normalizeOrderStatus, OrderStatus } from "../utils/orderStatus";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed orders in production.");
  process.exit(1);
}

interface SeedItem {
  name: string;
  price: number;
  quantity: number;
}

interface SeedHistoryEntry {
  status: OrderStatus;
  minutesAgo: number;
}

interface SeedOrder {
  status: OrderStatus;
  pickupCode: string;
  lines: SeedItem[];
  history: SeedHistoryEntry[];
}

interface SeedItemRecord {
  id: number;
  price: number;
}

const SEED_ITEMS = [
  { name: "Masala Chai", price: 30, stock: 100 },
  { name: "Filter Coffee", price: 35, stock: 100 },
  { name: "Samosa", price: 25, stock: 100 },
  { name: "Veg Sandwich", price: 60, stock: 100 },
  { name: "Chocolate Brownie", price: 80, stock: 100 },
];

const SEED_ORDERS: SeedOrder[] = [
  {
    status: "placed",
    pickupCode: "4101",
    lines: [
      { name: "Masala Chai", price: 30, quantity: 2 },
      { name: "Samosa", price: 25, quantity: 1 },
    ],
    history: [{ status: "placed", minutesAgo: 8 }],
  },
  {
    status: "preparing",
    pickupCode: "4102",
    lines: [
      { name: "Filter Coffee", price: 35, quantity: 1 },
      { name: "Veg Sandwich", price: 60, quantity: 1 },
    ],
    history: [
      { status: "placed", minutesAgo: 15 },
      { status: "preparing", minutesAgo: 9 },
    ],
  },
  {
    status: "ready",
    pickupCode: "4103",
    lines: [
      { name: "Masala Chai", price: 30, quantity: 1 },
      { name: "Chocolate Brownie", price: 80, quantity: 1 },
    ],
    history: [
      { status: "placed", minutesAgo: 25 },
      { status: "preparing", minutesAgo: 17 },
      { status: "ready", minutesAgo: 5 },
    ],
  },
  {
    status: "picked_up",
    pickupCode: "4104",
    lines: [
      { name: "Masala Chai", price: 30, quantity: 2 },
      { name: "Veg Sandwich", price: 60, quantity: 1 },
    ],
    history: [
      { status: "placed", minutesAgo: 90 },
      { status: "preparing", minutesAgo: 75 },
      { status: "ready", minutesAgo: 55 },
      { status: "picked_up", minutesAgo: 30 },
    ],
  },
  {
    status: "cancelled",
    pickupCode: "4105",
    lines: [
      { name: "Filter Coffee", price: 35, quantity: 1 },
      { name: "Samosa", price: 25, quantity: 2 },
    ],
    history: [
      { status: "placed", minutesAgo: 45 },
      { status: "cancelled", minutesAgo: 38 },
    ],
  },
];

const seedMarker = (status: OrderStatus): string => `F5-SEED:${status}`;

const resolveSeedUser = async (): Promise<number> => {
  const phone = process.env.SEED_USER_PHONE?.trim();

  if (phone) {
    const [existing] = await db.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE phone = ?",
      [phone],
    );

    if (existing.length > 0) {
      return Number(existing[0].id);
    }

    const [created] = await db.query<ResultSetHeader>(
      "INSERT INTO users (phone, name, role) VALUES (?, ?, 'employee')",
      [phone, "F5 Seed User"],
    );
    return created.insertId;
  }

  const [employees] = await db.query<RowDataPacket[]>(
    "SELECT id FROM users WHERE role = 'employee' ORDER BY id ASC LIMIT 1",
  );

  if (employees.length > 0) {
    return Number(employees[0].id);
  }

  const [created] = await db.query<ResultSetHeader>(
    "INSERT INTO users (phone, name, role) VALUES ('9000000001', 'F5 Seed User', 'employee')",
  );
  return created.insertId;
};

const ensureItems = async (
  connection: PoolConnection,
): Promise<Map<string, SeedItemRecord>> => {
  const items = new Map<string, SeedItemRecord>();

  for (const item of SEED_ITEMS) {
    const [existing] = await connection.query<RowDataPacket[]>(
      "SELECT id, price FROM items WHERE name = ? ORDER BY id ASC LIMIT 1",
      [item.name],
    );

    if (existing.length > 0) {
      items.set(item.name, {
        id: Number(existing[0].id),
        price: Number(existing[0].price),
      });
      continue;
    }

    const [created] = await connection.query<ResultSetHeader>(
      "INSERT INTO items (name, price, stock) VALUES (?, ?, ?)",
      [item.name, item.price, item.stock],
    );
    items.set(item.name, { id: created.insertId, price: item.price });
  }

  return items;
};

const seedOrder = async (
  connection: PoolConnection,
  userId: number,
  order: SeedOrder,
  items: Map<string, SeedItemRecord>,
): Promise<boolean> => {
  const marker = seedMarker(order.status);
  const [existing] = await connection.query<RowDataPacket[]>(
    "SELECT id FROM orders WHERE user_id = ? AND note = ? LIMIT 1",
    [userId, marker],
  );

  if (existing.length > 0) {
    return false;
  }

  const totalAmount = order.lines.reduce((total, line) => {
    const item = items.get(line.name);
    return total + (item?.price ?? line.price) * line.quantity;
  }, 0);
  const createdAtMinutes = Math.max(
    ...order.history.map(entry => entry.minutesAgo),
  );

  const [created] = await connection.query<ResultSetHeader>(
    `INSERT INTO orders (user_id, total_amount, pickup_code, note, status, created_at)
     VALUES (?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? MINUTE))`,
    [
      userId,
      totalAmount,
      order.pickupCode,
      marker,
      order.status,
      createdAtMinutes,
    ],
  );
  const orderId = created.insertId;

  for (const line of order.lines) {
    const item = items.get(line.name);
    if (!item) {
      throw new Error(`Seed item "${line.name}" is missing.`);
    }

    if (order.status !== "cancelled") {
      await connection.query(
        "UPDATE items SET stock = GREATEST(stock, ?) WHERE id = ?",
        [line.quantity, item.id],
      );
      await connection.query(
        "UPDATE items SET stock = stock - ? WHERE id = ?",
        [line.quantity, item.id],
      );
    }

    await connection.query(
      "INSERT INTO order_items (order_id, item_id, quantity, price) VALUES (?, ?, ?, ?)",
      [orderId, item.id, line.quantity, item.price],
    );
  }

  for (const entry of order.history) {
    await connection.query(
      `INSERT INTO order_status_history (order_id, status, created_at)
       VALUES (?, ?, DATE_SUB(NOW(), INTERVAL ? MINUTE))`,
      [orderId, entry.status, entry.minutesAgo],
    );
  }

  return true;
};

const run = async (): Promise<void> => {
  const userId = await resolveSeedUser();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const items = await ensureItems(connection);

    let createdCount = 0;
    for (const order of SEED_ORDERS) {
      const created = await seedOrder(connection, userId, order, items);
      if (created) {
        createdCount += 1;
      }
    }

    await connection.commit();

    console.log(
      `F5 seed complete for user ${userId}: ${createdCount} order(s) created, ${SEED_ORDERS.length - createdCount} already present.`,
    );
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const [statuses] = await db.query<RowDataPacket[]>(
    "SELECT status, COUNT(*) AS count FROM orders WHERE user_id = ? AND note LIKE 'F5-SEED:%' GROUP BY status",
    [userId],
  );
  console.log(
    statuses
      .map(row => `${normalizeOrderStatus(row.status)}: ${row.count}`)
      .join(", "),
  );
};

run()
  .catch(error => {
    console.error("F5 order seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
