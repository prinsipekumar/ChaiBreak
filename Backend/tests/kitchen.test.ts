import fs from "fs";
import path from "path";
import request from "supertest";
import jwt from "jsonwebtoken";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import app from "../src/app";
import { db } from "../src/config/db";
import { UPLOAD_ROOT } from "../src/middlewares/upload.middleware";

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

async function statusOf(orderId: number): Promise<string> {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT status FROM orders WHERE id = ?",
    [orderId],
  );
  return rows[0].status;
}

async function historyOf(orderId: number): Promise<RowDataPacket[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT from_status, to_status, changed_by
       FROM order_status_history WHERE order_id = ? ORDER BY id`,
    [orderId],
  );
  return rows;
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
    ["patch", "/orders/1/status"],
    ["post", "/orders/1/pickup"],
    ["patch", "/items/1"],
    ["post", "/items/1/photo"],
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

// ---------- status changes ----------

describe("PATCH /kitchen/orders/:id/status", () => {
  it("moves placed -> preparing and writes a history row", async () => {
    const id = await createOrder("placed");

    const res = await request(app)
      .patch(`${BASE}/orders/${id}/status`)
      .set(auth(kitchenToken))
      .send({ to: "preparing" });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ id, status: "preparing" });
    expect(await statusOf(id)).toBe("preparing");
    expect(await historyOf(id)).toEqual([
      { from_status: "placed", to_status: "preparing", changed_by: kitchenId },
    ]);
  });

  it("returns 409 for placed -> picked_up and changes nothing", async () => {
    const id = await createOrder("placed");

    const res = await request(app)
      .patch(`${BASE}/orders/${id}/status`)
      .set(auth(kitchenToken))
      .send({ to: "picked_up" });

    expect(res.status).toBe(409);
    expect(await statusOf(id)).toBe("placed");
    expect(await historyOf(id)).toHaveLength(0);
  });

  it("returns 409 for ready -> picked_up (must use the pickup endpoint)", async () => {
    const id = await createOrder("ready");

    const res = await request(app)
      .patch(`${BASE}/orders/${id}/status`)
      .set(auth(kitchenToken))
      .send({ to: "picked_up" });

    expect(res.status).toBe(409);
    expect(await statusOf(id)).toBe("ready");
  });

  it("returns 400 for an unknown status and 404 for an unknown order", async () => {
    const id = await createOrder("placed");

    const bad = await request(app)
      .patch(`${BASE}/orders/${id}/status`)
      .set(auth(kitchenToken))
      .send({ to: "banana" });
    expect(bad.status).toBe(400);

    const missing = await request(app)
      .patch(`${BASE}/orders/999999999/status`)
      .set(auth(kitchenToken))
      .send({ to: "preparing" });
    expect(missing.status).toBe(404);
  });

  it("lets exactly one of 5 parallel requests move the order", async () => {
    const id = await createOrder("placed");

    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app)
          .patch(`${BASE}/orders/${id}/status`)
          .set(auth(kitchenToken))
          .send({ to: "preparing" }),
      ),
    );

    const codes = responses.map((r) => r.status).sort();
    expect(codes).toEqual([200, 409, 409, 409, 409]);
    expect(await statusOf(id)).toBe("preparing");
    expect(await historyOf(id)).toHaveLength(1);
  });
});

// ---------- pickup ----------

describe("POST /kitchen/orders/:id/pickup", () => {
  it("rejects a wrong code with 400 and leaves the order ready", async () => {
    const id = await createOrder("ready", "4444");

    const res = await request(app)
      .post(`${BASE}/orders/${id}/pickup`)
      .set(auth(kitchenToken))
      .send({ code: "0000" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/wrong pickup code/i);
    expect(await statusOf(id)).toBe("ready");
    expect(await historyOf(id)).toHaveLength(0);
  });

  it("marks the order picked up with the right code and writes history", async () => {
    const id = await createOrder("ready", "4444");

    const res = await request(app)
      .post(`${BASE}/orders/${id}/pickup`)
      .set(auth(kitchenToken))
      .send({ code: "4444" });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ id, status: "picked_up" });
    expect(await statusOf(id)).toBe("picked_up");
    expect(await historyOf(id)).toEqual([
      { from_status: "ready", to_status: "picked_up", changed_by: kitchenId },
    ]);
  });

  it("returns 409 when the order is not ready yet", async () => {
    const id = await createOrder("preparing", "4444");

    const res = await request(app)
      .post(`${BASE}/orders/${id}/pickup`)
      .set(auth(kitchenToken))
      .send({ code: "4444" });

    expect(res.status).toBe(409);
    expect(await statusOf(id)).toBe("preparing");
  });

  it("returns 400 for a code that is not 4 digits", async () => {
    const id = await createOrder("ready", "4444");

    const res = await request(app)
      .post(`${BASE}/orders/${id}/pickup`)
      .set(auth(kitchenToken))
      .send({ code: "12" });

    expect(res.status).toBe(400);
  });
});

// ---------- menu control ----------

describe("PATCH /kitchen/items/:id", () => {
  it("updates availability and stock", async () => {
    const res = await request(app)
      .patch(`${BASE}/items/${itemId}`)
      .set(auth(kitchenToken))
      .send({ isAvailable: false, stockLeft: 0 });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(
      expect.objectContaining({ id: itemId, isAvailable: false, stockLeft: 0 }),
    );

    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT stock_left, is_available FROM items WHERE id = ?",
      [itemId],
    );
    expect(rows[0].stock_left).toBe(0);
    expect(rows[0].is_available).toBe(0);
  });

  it("rejects negative stock, an empty body and an unknown item", async () => {
    const negative = await request(app)
      .patch(`${BASE}/items/${itemId}`)
      .set(auth(kitchenToken))
      .send({ stockLeft: -5 });
    expect(negative.status).toBe(400);

    const empty = await request(app)
      .patch(`${BASE}/items/${itemId}`)
      .set(auth(kitchenToken))
      .send({});
    expect(empty.status).toBe(400);

    const missing = await request(app)
      .patch(`${BASE}/items/999999999`)
      .set(auth(kitchenToken))
      .send({ stockLeft: 5 });
    expect(missing.status).toBe(404);
  });
});

describe("POST /kitchen/items/:id/photo", () => {
  it("rejects a file bigger than 2 MB", async () => {
    const res = await request(app)
      .post(`${BASE}/items/${itemId}/photo`)
      .set(auth(kitchenToken))
      .attach("photo", Buffer.alloc(3 * 1024 * 1024), {
        filename: "big.jpg",
        contentType: "image/jpeg",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/2 MB/);
  });

  it("rejects a PDF", async () => {
    const res = await request(app)
      .post(`${BASE}/items/${itemId}/photo`)
      .set(auth(kitchenToken))
      .attach("photo", Buffer.alloc(1000), {
        filename: "menu.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/JPG or PNG/);
  });

  it("saves a small PNG and stores its URL on the item", async () => {
    const res = await request(app)
      .post(`${BASE}/items/${itemId}/photo`)
      .set(auth(kitchenToken))
      .attach("photo", Buffer.alloc(1000), {
        filename: "chai.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.photoUrl).toMatch(/^\/uploads\/items\/item-\d+-\d+\.png$/);

    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT photo_url FROM items WHERE id = ?",
      [itemId],
    );
    expect(rows[0].photo_url).toBe(res.body.data.photoUrl);

    // remove the file this test just saved
    fs.unlinkSync(
      path.join(UPLOAD_ROOT, "items", path.basename(res.body.data.photoUrl)),
    );
  });
});