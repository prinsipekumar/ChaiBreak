jest.mock("../config/db", () => ({
  db: {
    query: jest.fn(),
    getConnection: jest.fn(),
  },
}));

import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../app";
import { db } from "../config/db";

const mockedDb = db as unknown as {
  query: jest.Mock;
  getConnection: jest.Mock;
};

interface FakeItem {
  id: number;
  name: string;
  price: number;
  stock: number;
}

interface FakeOrder {
  id: number;
  user_id: number;
  status: string;
  total_amount: number;
  pickup_code: string;
  note: string | null;
  created_at: Date;
}

interface FakeOrderItem {
  id: number;
  order_id: number;
  item_id: number;
  quantity: number;
  price: number;
}

interface FakeHistory {
  id: number;
  order_id: number;
  status: string;
  created_at: Date;
}

interface FakeState {
  items: FakeItem[];
  orders: FakeOrder[];
  orderItems: FakeOrderItem[];
  history: FakeHistory[];
  nextHistoryId: number;
}

interface FakeConnection {
  owner: symbol;
  undo: Array<() => void>;
  inTransaction: boolean;
}

const createState = (): FakeState => ({
  items: [
    { id: 1, name: "Masala Chai", price: 30, stock: 10 },
    { id: 2, name: "Samosa", price: 25, stock: 5 },
    { id: 3, name: "Filter Coffee", price: 35, stock: 4 },
  ],
  orders: [
    {
      id: 101,
      user_id: 1,
      status: "placed",
      total_amount: 85,
      pickup_code: "1111",
      note: null,
      created_at: new Date("2026-11-09T10:00:00Z"),
    },
    {
      id: 102,
      user_id: 1,
      status: "PREPARING",
      total_amount: 30,
      pickup_code: "2222",
      note: null,
      created_at: new Date("2026-11-09T09:00:00Z"),
    },
    {
      id: 103,
      user_id: 1,
      status: "picked_up",
      total_amount: 30,
      pickup_code: "3333",
      note: null,
      created_at: new Date("2026-11-08T09:00:00Z"),
    },
    {
      id: 104,
      user_id: 2,
      status: "placed",
      total_amount: 35,
      pickup_code: "4444",
      note: null,
      created_at: new Date("2026-11-09T08:00:00Z"),
    },
  ],
  orderItems: [
    { id: 201, order_id: 101, item_id: 1, quantity: 2, price: 30 },
    { id: 202, order_id: 101, item_id: 2, quantity: 1, price: 25 },
    { id: 203, order_id: 102, item_id: 1, quantity: 1, price: 30 },
    { id: 204, order_id: 103, item_id: 1, quantity: 1, price: 30 },
    { id: 205, order_id: 104, item_id: 3, quantity: 1, price: 35 },
  ],
  history: [
    {
      id: 301,
      order_id: 101,
      status: "placed",
      created_at: new Date("2026-11-09T10:00:00Z"),
    },
  ],
  nextHistoryId: 302,
});

class FakeDatabase {
  state = createState();
  lockOwner: symbol | null = null;
  lockWaiters: Array<() => void> = [];
  failOn: ((sql: string) => boolean) | null = null;

  reset(): void {
    this.state = createState();
    this.lockOwner = null;
    this.lockWaiters = [];
    this.failOn = null;
  }

  async query(sql: string, params: unknown[] = []) {
    const rows = await this.execute(null, sql, params);
    return [rows, []];
  }

  async getConnection() {
    const connection: FakeConnection = {
      owner: Symbol("connection"),
      undo: [],
      inTransaction: false,
    };

    return {
      ...connection,
      beginTransaction: async () => {
        connection.inTransaction = true;
        connection.undo = [];
      },
      commit: async () => {
        connection.undo = [];
        connection.inTransaction = false;
        this.releaseLock(connection.owner);
      },
      rollback: async () => {
        for (const undo of connection.undo.reverse()) {
          undo();
        }
        connection.undo = [];
        connection.inTransaction = false;
        this.releaseLock(connection.owner);
      },
      release: () => {
        connection.inTransaction = false;
        connection.undo = [];
        this.releaseLock(connection.owner);
      },
      query: async (sql: string, params: unknown[] = []) =>
        [await this.execute(connection, sql, params), []] as const,
    };
  }

  private async acquireLock(owner: symbol): Promise<void> {
    while (this.lockOwner && this.lockOwner !== owner) {
      await new Promise<void>(resolve => this.lockWaiters.push(resolve));
    }
    this.lockOwner = owner;
  }

  private releaseLock(owner: symbol): void {
    if (this.lockOwner !== owner) {
      return;
    }

    this.lockOwner = null;
    this.lockWaiters.shift()?.();
  }

  private async execute(
    connection: FakeConnection | null,
    sql: string,
    params: unknown[],
  ): Promise<unknown[]> {
    const normalized = sql.replace(/\s+/g, " ").trim();

    if (this.failOn?.(normalized)) {
      throw new Error("Forced database failure");
    }

    if (/FROM orders WHERE id = \? FOR UPDATE/.test(normalized)) {
      if (!connection) {
        throw new Error("Locking requires a transaction connection");
      }
      await this.acquireLock(connection.owner);
      return this.state.orders.filter(
        order => order.id === Number(params[0]),
      );
    }

    if (
      /SELECT id, user_id, status, total_amount, pickup_code, note, created_at FROM orders WHERE user_id = \?/.test(
        normalized,
      )
    ) {
      return this.state.orders
        .filter(order => order.user_id === Number(params[0]))
        .sort(
          (left, right) =>
            right.created_at.getTime() - left.created_at.getTime() ||
            right.id - left.id,
        );
    }

    if (
      /FROM orders WHERE id = \? AND user_id = \?/.test(normalized)
    ) {
      return this.state.orders.filter(
        order =>
          order.id === Number(params[0]) &&
          order.user_id === Number(params[1]),
      );
    }

    if (/FROM order_items oi/.test(normalized)) {
      const requestedIds = params.map(Number);
      const isListQuery = /WHERE oi\.order_id IN/.test(normalized);
      return this.state.orderItems
        .filter(item =>
          isListQuery
            ? requestedIds.includes(item.order_id)
            : item.order_id === Number(params[0]),
        )
        .map(item => ({
          ...item,
          name:
            this.state.items.find(candidate => candidate.id === item.item_id)
              ?.name ?? null,
        }))
        .sort((left, right) => left.id - right.id);
    }

    if (/FROM order_status_history WHERE order_id = \?/.test(normalized)) {
      return this.state.history
        .filter(entry => entry.order_id === Number(params[0]))
        .sort(
          (left, right) =>
            left.created_at.getTime() - right.created_at.getTime(),
        );
    }

    if (/FROM order_items WHERE order_id = \?/.test(normalized)) {
      return this.state.orderItems
        .filter(item => item.order_id === Number(params[0]))
        .sort((left, right) => left.item_id - right.item_id);
    }

    if (/UPDATE items SET stock = stock \+ \? WHERE id = \?/.test(normalized)) {
      const quantity = Number(params[0]);
      const item = this.state.items.find(
        candidate => candidate.id === Number(params[1]),
      );

      if (item) {
        const previousStock = item.stock;
        item.stock += quantity;
        connection?.undo.push(() => {
          item.stock = previousStock;
        });
      }
      return [];
    }

    if (/UPDATE orders SET status = 'cancelled' WHERE id = \?/.test(normalized)) {
      const order = this.state.orders.find(
        candidate => candidate.id === Number(params[0]),
      );

      if (order) {
        const previousStatus = order.status;
        order.status = "cancelled";
        connection?.undo.push(() => {
          order.status = previousStatus;
        });
      }
      return [];
    }

    if (/INSERT INTO order_status_history .*VALUES \(\?, 'cancelled'\)/.test(normalized)) {
      const entry: FakeHistory = {
        id: this.state.nextHistoryId,
        order_id: Number(params[0]),
        status: "cancelled",
        created_at: new Date(),
      };
      this.state.nextHistoryId += 1;
      this.state.history.push(entry);
      connection?.undo.push(() => {
        this.state.history = this.state.history.filter(
          candidate => candidate.id !== entry.id,
        );
      });
      return [];
    }

    throw new Error(`Unhandled fake query: ${normalized}`);
  }
}

const fake = new FakeDatabase();
const AUTH_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev_only";

const tokenFor = (userId: number): string =>
  jwt.sign(
    { userId, phone: "9000000001", role: "employee" },
    AUTH_SECRET,
    { expiresIn: "1h" },
  );

const userOneToken = tokenFor(1);
const userTwoToken = tokenFor(2);

const stockOf = (itemId: number): number =>
  fake.state.items.find(item => item.id === itemId)?.stock ?? -1;

const orderOf = (orderId: number): FakeOrder | undefined =>
  fake.state.orders.find(order => order.id === orderId);

beforeEach(() => {
  fake.reset();
  mockedDb.query.mockImplementation((sql: string, params: unknown[]) =>
    fake.query(sql, params),
  );
  mockedDb.getConnection.mockImplementation(() => fake.getConnection());
});

describe("GET /api/v1/orders/me", () => {
  it("returns only the authenticated user's orders", async () => {
    const response = await request(app)
      .get("/api/v1/orders/me")
      .set("Authorization", `Bearer ${userOneToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.map((order: FakeOrder) => order.id)).toEqual([
      101, 102, 103,
    ]);
    expect(
      response.body.data.find((order: FakeOrder) => order.id === 102).status,
    ).toBe("preparing");
    expect(response.body.data[0].items).toHaveLength(2);
  });

  it("requires authentication", async () => {
    const response = await request(app).get("/api/v1/orders/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "Authorization token missing or malformed.",
    });
  });
});

describe("GET /api/v1/orders/:id", () => {
  it("returns order items, totals and status history", async () => {
    const response = await request(app)
      .get("/api/v1/orders/101")
      .set("Authorization", `Bearer ${userOneToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: 101,
      status: "placed",
      total_amount: 85,
      pickup_code: "1111",
    });
    expect(response.body.data.items).toEqual([
      {
        id: 201,
        order_id: 101,
        item_id: 1,
        name: "Masala Chai",
        quantity: 2,
        price: 30,
      },
      {
        id: 202,
        order_id: 101,
        item_id: 2,
        name: "Samosa",
        quantity: 1,
        price: 25,
      },
    ]);
    expect(response.body.data.status_history).toHaveLength(1);
  });

  it("returns 404 for another user's order", async () => {
    const response = await request(app)
      .get("/api/v1/orders/104")
      .set("Authorization", `Bearer ${userOneToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "Order not found.",
    });
  });

  it("returns 404 for a missing order", async () => {
    const response = await request(app)
      .get("/api/v1/orders/999")
      .set("Authorization", `Bearer ${userTwoToken}`);

    expect(response.status).toBe(404);
  });

  it("validates the order id", async () => {
    const response = await request(app)
      .get("/api/v1/orders/not-a-number")
      .set("Authorization", `Bearer ${userOneToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

describe("PATCH /api/v1/orders/:id/cancel", () => {
  it("cancels a placed order and restores stock", async () => {
    const response = await request(app)
      .patch("/api/v1/orders/101/cancel")
      .set("Authorization", `Bearer ${userOneToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "Order cancelled successfully.",
      data: { id: 101, status: "cancelled" },
    });
    expect(orderOf(101)?.status).toBe("cancelled");
    expect(stockOf(1)).toBe(12);
    expect(stockOf(2)).toBe(6);
    expect(
      fake.state.history.filter(
        entry => entry.order_id === 101 && entry.status === "cancelled",
      ),
    ).toHaveLength(1);
  });

  it("returns 409 for a preparing order and leaves stock untouched", async () => {
    const response = await request(app)
      .patch("/api/v1/orders/102/cancel")
      .set("Authorization", `Bearer ${userOneToken}`);

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(orderOf(102)?.status).toBe("PREPARING");
    expect(stockOf(1)).toBe(10);
  });

  it("returns 404 for another user's order", async () => {
    const response = await request(app)
      .patch("/api/v1/orders/104/cancel")
      .set("Authorization", `Bearer ${userOneToken}`);

    expect(response.status).toBe(404);
    expect(orderOf(104)?.status).toBe("placed");
    expect(stockOf(3)).toBe(4);
  });

  it("does not restore stock twice on repeated cancellation", async () => {
    await request(app)
      .patch("/api/v1/orders/101/cancel")
      .set("Authorization", `Bearer ${userOneToken}`);

    const secondResponse = await request(app)
      .patch("/api/v1/orders/101/cancel")
      .set("Authorization", `Bearer ${userOneToken}`);

    expect(secondResponse.status).toBe(409);
    expect(stockOf(1)).toBe(12);
    expect(stockOf(2)).toBe(6);
    expect(
      fake.state.history.filter(
        entry => entry.order_id === 101 && entry.status === "cancelled",
      ),
    ).toHaveLength(1);
  });

  it("handles concurrent cancellation without duplicate stock restoration", async () => {
    const responses = await Promise.all([
      request(app)
        .patch("/api/v1/orders/101/cancel")
        .set("Authorization", `Bearer ${userOneToken}`),
      request(app)
        .patch("/api/v1/orders/101/cancel")
        .set("Authorization", `Bearer ${userOneToken}`),
    ]);

    expect(responses.map(response => response.status).sort()).toEqual([
      200, 409,
    ]);
    expect(stockOf(1)).toBe(12);
    expect(stockOf(2)).toBe(6);
    expect(
      fake.state.history.filter(
        entry => entry.order_id === 101 && entry.status === "cancelled",
      ),
    ).toHaveLength(1);
  });

  it("rolls back stock and status when the transaction fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    fake.failOn = sql => /UPDATE orders SET status = 'cancelled'/.test(sql);

    const response = await request(app)
      .patch("/api/v1/orders/101/cancel")
      .set("Authorization", `Bearer ${userOneToken}`);

    expect(response.status).toBe(500);
    expect(orderOf(101)?.status).toBe("placed");
    expect(stockOf(1)).toBe(10);
    expect(stockOf(2)).toBe(5);
    expect(
      fake.state.history.filter(
        entry => entry.order_id === 101 && entry.status === "cancelled",
      ),
    ).toHaveLength(0);

    errorSpy.mockRestore();
  });

  it("validates the order id", async () => {
    const response = await request(app)
      .patch("/api/v1/orders/0/cancel")
      .set("Authorization", `Bearer ${userOneToken}`);

    expect(response.status).toBe(400);
  });
});
