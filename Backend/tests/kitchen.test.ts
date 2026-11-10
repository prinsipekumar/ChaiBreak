import request from "supertest";
import jwt from "jsonwebtoken";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import app from "../src/app";
import { db } from "../src/config/db";

const BASE = "/api/v1/kitchen";

// ---------- helpers ----------

const tokenFor = (
  userId: number,
  phone: string,
  role: "kitchen" | "employee",
): string =>
  jwt.sign(
    { userId, phone, role },
    process.env.JWT_SECRET || "fallback_secret_for_dev_only",
    { expiresIn: "1h" },
  );

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

let kitchenId: number;
let employeeId: number;
let kitchenToken: string;
let employeeToken: string;
let categoryId: number;
let itemId: number;
const createdOrderIds: number[] = [];

async function ensureUser(
  phone: string,
  name: string,
  role: "kitchen" | "employee",
): Promise<number> {
  await db.query(
    "INSERT IGNORE INTO users (phone, name, role) VALUES (?, ?, ?)",
    [phone, name, role],
  );
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id FROM users WHERE phone = ?",
    [phone],
  );
  return rows[0].id;
}

// Creates an order (with one line item) in the given status.
async function createOrder(status: string, pickupCode = "4444"): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO orders (user_id, status, total_rupees, note, pickup_code)
     VALUES (?, ?, 30, 'test order', ?)`,
    [employeeId, status, pickupCode],
  );
  const orderId = result.insertId;
  createdOrderIds.push(orderId);
  await db.query(
    `INSERT INTO order_items (order_id, item_id, item_name, price_rupees, qty)
     VALUES (?, ?, 'Test Chai', 15, 2)`,
    [orderId, itemId],
  );
  return orderId;
}

// ---------- setup / teardown ----------

beforeAll(async () => {
  kitchenId = await ensureUser("9000000001", "Kitchen Test", "kitchen");
  employeeId = await ensureUser("9000000002", "Employee Test", "employee");
  kitchenToken = tokenFor(kitchenId, "9000000001", "kitchen");
  employeeToken = tokenFor(employeeId, "9000000002", "employee");

  const [cat] = await db.query<ResultSetHeader>(
    "INSERT INTO categories (name, sort_order) VALUES ('__test_category__', 99)",
  );
  categoryId = cat.insertId;

  const [item] = await db.query<ResultSetHeader>(
    `INSERT INTO items (category_id, name, price_rupees, is_veg, stock_left, is_available)
     VALUES (?, '__test_item__', 15, 1, 10, 1)`,
    [categoryId],
  );
  itemId = item.insertId;
});

afterAll(async () => {
  if (createdOrderIds.length > 0) {
    await db.query("DELETE FROM order_status_history WHERE order_id IN (?)", [
      createdOrderIds,
    ]);
    await db.query("DELETE FROM order_items WHERE order_id IN (?)", [
      createdOrderIds,
    ]);
    await db.query("DELETE FROM orders WHERE id IN (?)", [createdOrderIds]);
  }
  if (itemId) {
    await db.query("DELETE FROM order_items WHERE item_id = ?", [itemId]);
    await db.query("DELETE FROM items WHERE id = ?", [itemId]);
  }
  if (categoryId) {
    await db.query("DELETE FROM categories WHERE id = ?", [categoryId]);
  }
  await db.end();
});

// ---------- access control ----------

describe("kitchen access control", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get(`${BASE}/orders`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  const routes: ["get" | "patch" | "post", string][] = [
    ["get", "/orders"],
  ];

  it.each(routes)("returns 403 for an employee token on %s %s", async (method, p) => {
    const res = await request(app)[method](`${BASE}${p}`).set(auth(employeeToken));
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

// ---------- queue ----------

describe("GET /kitchen/orders", () => {
  it("lists only orders in the requested status, with items, note and minutes", async () => {
    const placedId = await createOrder("placed");
    const readyId = await createOrder("ready");

    const res = await request(app)
      .get(`${BASE}/orders?status=placed&limit=100`)
      .set(auth(kitchenToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meta).toEqual(
      expect.objectContaining({ page: 1, limit: 100 }),
    );

    const ids = res.body.data.map((o: { id: number }) => o.id);
    expect(ids).toContain(placedId);
    expect(ids).not.toContain(readyId);

    const order = res.body.data.find((o: { id: number }) => o.id === placedId);
    expect(order.note).toBe("test order");
    expect(order.items).toEqual([{ name: "Test Chai", qty: 2 }]);
    expect(typeof order.minutesSinceOrdered).toBe("number");
    expect(order.minutesSinceOrdered).toBeGreaterThanOrEqual(0);
  });

  it("rejects an unknown status with 400", async () => {
    const res = await request(app)
      .get(`${BASE}/orders?status=banana`)
      .set(auth(kitchenToken));
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
