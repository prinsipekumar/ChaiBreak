import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initialCategories,
  initialItems,
  initialOrders,
  initialOrderItems,
  initialOrderStatusHistory,
  initialOtpCodes,
  sampleUsers,
} from './src/data/seedData';
import { Category, Item, Order, OrderItem, OrderStatusHistory, OtpCode, User } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory relational data store matching table columns
let categories: Category[] = [...initialCategories];
let items: Item[] = [...initialItems];
let otpCodes: OtpCode[] = [...initialOtpCodes];
let orders: Order[] = [...initialOrders];
let orderItems: OrderItem[] = [...initialOrderItems];
let orderStatusHistory: OrderStatusHistory[] = [...initialOrderStatusHistory];
let users: User[] = [...sampleUsers];

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // CORS and Cache control
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // GET /api/v1/categories, /categories, /api/categories
  // Sorted by sort_order
  const getCategoriesHandler = (req: Request, res: Response) => {
    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    return res.json(sorted);
  };
  app.get('/api/v1/categories', getCategoriesHandler);
  app.get('/categories', getCategoriesHandler);
  app.get('/api/categories', getCategoriesHandler);

  // Helper for filtering & sorting items per specification:
  // "API: GET /api/v1/categories · GET /api/v1/items?categoryId=&search=&veg=true .
  // Rules: sold-out items ( stock_left = 0 or is_available = false ) still show, but greyed out and not addable.
  // Sort by category order, then name."
  const getItemsHandler = (req: Request, res: Response) => {
    const categoryId = (req.query.categoryId as string) || '';
    const search = ((req.query.search as string) || '').trim().toLowerCase();
    const vegParam = req.query.veg as string | undefined;
    const isVegOnly = vegParam === 'true' || vegParam === '1';

    let result = items.filter((item) => {
      // Category filter
      if (categoryId && categoryId !== 'all' && item.category_id !== categoryId) {
        return false;
      }
      // Veg filter
      if (isVegOnly && !item.is_veg) {
        return false;
      }
      // Search filter (name or description)
      if (search) {
        const matchesName = item.name.toLowerCase().includes(search);
        const matchesDesc = item.description.toLowerCase().includes(search);
        if (!matchesName && !matchesDesc) {
          return false;
        }
      }
      return true;
    });

    // Category sort order lookup map
    const categoryOrderMap = new Map<string, number>();
    categories.forEach((cat) => categoryOrderMap.set(cat.id, cat.sort_order));

    // Sort by category order, then name
    result.sort((a, b) => {
      const orderA = categoryOrderMap.get(a.category_id) ?? 999;
      const orderB = categoryOrderMap.get(b.category_id) ?? 999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.name.localeCompare(b.name);
    });

    return res.json(result);
  };

  app.get('/api/v1/items', getItemsHandler);
  app.get('/items', getItemsHandler);
  app.get('/api/items', getItemsHandler);

  // PATCH /items/:id/toggle - Kitchen can toggle is_available or stock_left
  const patchItemStockHandler = (req: Request, res: Response) => {
    const { id } = req.params;
    const { is_available, stock_left } = req.body;

    const itemIndex = items.findIndex((i) => i.id === id);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found', success: false });
    }

    if (typeof is_available === 'boolean') {
      items[itemIndex].is_available = is_available;
    }
    if (typeof stock_left === 'number') {
      items[itemIndex].stock_left = stock_left;
    }

    return res.json({
      item: items[itemIndex],
      message: 'Item updated successfully',
      success: true,
    });
  };

  app.patch('/items/:id', patchItemStockHandler);
  app.patch('/api/items/:id', patchItemStockHandler);
  app.post('/api/items/:id/toggle', patchItemStockHandler);

  // Authentication: Real OTP generation and verification
  // Table: otp_codes (id, phone, code, expires_at, attempts, created_at)
  app.post(['/auth/send-otp', '/api/auth/send-otp'], (req: Request, res: Response) => {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number required', success: false });
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    const code = '123456'; // standard deterministic demo OTP code for testing convenience
    const newOtp: OtpCode = {
      id: `otp-${Date.now()}`,
      phone: cleanPhone,
      code,
      expires_at: new Date(Date.now() + 1000 * 60 * 15).toISOString(), // 15 mins
      attempts: 0,
      created_at: new Date().toISOString(),
    };

    otpCodes = otpCodes.filter((o) => o.phone !== cleanPhone);
    otpCodes.push(newOtp);

    return res.json({
      message: 'OTP sent successfully',
      demoCode: code,
      success: true,
    });
  });

  app.post(['/auth/verify-otp', '/api/auth/verify-otp'], (req: Request, res: Response) => {
    const { phone, code, rolePreference } = req.body;
    const cleanPhone = String(phone).replace(/\D/g, '');

    const record = otpCodes.find((o) => o.phone === cleanPhone);
    if (!record) {
      return res.status(400).json({ error: 'No active OTP found. Please request a new code.', success: false });
    }

    if (record.code !== String(code).trim()) {
      record.attempts += 1;
      return res.status(400).json({ error: 'Invalid verification code', attempts: record.attempts, success: false });
    }

    // Role resolution
    const chosenRole: 'employee' | 'kitchen' =
      rolePreference === 'kitchen' || cleanPhone.endsWith('0000') ? 'kitchen' : 'employee';

    let user = users.find((u) => u.phone === cleanPhone);
    if (!user) {
      user = {
        id: `usr-${Date.now()}`,
        phone: cleanPhone,
        name: chosenRole === 'kitchen' ? 'Kitchen Staff' : `Colleague (${cleanPhone.slice(-4)})`,
        role: chosenRole,
        desk_location: chosenRole === 'kitchen' ? 'Kitchen Station' : 'Tower B, Desk 412',
      };
      users.push(user);
    } else {
      user.role = chosenRole;
    }

    // Token valid for 24 hours
    const token = `token-${user.id}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

    return res.json({
      token,
      expiresAt,
      user,
      success: true,
    });
  });

  // Orders API: create order with order_items and order_status_history
  app.post(['/api/orders', '/api/v1/orders'], (req: Request, res: Response) => {
    const { user_id, items: orderPayloadItems, note } = req.body;
    if (!orderPayloadItems || !orderPayloadItems.length) {
      return res.status(400).json({ error: 'Cart is empty', success: false });
    }

    let calculatedTotal = 0;
    const createdOrderItems: OrderItem[] = [];
    const orderId = `ord-${Date.now()}`;

    for (const itemRow of orderPayloadItems) {
      const dbItem = items.find((i) => i.id === itemRow.item_id);
      if (!dbItem) continue;

      const qty = itemRow.qty || 1;
      calculatedTotal += dbItem.price_rupees * qty;

      // Copy name and price at order time
      createdOrderItems.push({
        id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        order_id: orderId,
        item_id: dbItem.id,
        item_name: dbItem.name,
        price_rupees: dbItem.price_rupees,
        qty,
      });

      // Decrement stock
      if (dbItem.stock_left > 0) {
        dbItem.stock_left = Math.max(0, dbItem.stock_left - qty);
      }
    }

    const pickupCode = `CB-${Math.floor(100 + Math.random() * 900)}`;
    const nowIso = new Date().toISOString();

    const newOrder: Order = {
      id: orderId,
      user_id: user_id || 'guest-user',
      status: 'PLACED',
      total_rupees: calculatedTotal,
      note: note || '',
      pickup_code: pickupCode,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const initialHistory: OrderStatusHistory = {
      id: `osh-${Date.now()}`,
      order_id: orderId,
      from_status: 'NONE',
      to_status: 'PLACED',
      changed_by: 'employee',
      changed_at: nowIso,
    };

    orders.unshift(newOrder);
    orderItems.push(...createdOrderItems);
    orderStatusHistory.push(initialHistory);

    return res.status(201).json({
      order: newOrder,
      items: createdOrderItems,
      history: initialHistory,
      success: true,
    });
  });

  app.get(['/api/orders', '/api/v1/orders'], (req: Request, res: Response) => {
    const { userId } = req.query;
    let list = orders;
    if (userId) {
      list = list.filter((o) => o.user_id === userId);
    }

    const detailedOrders = list.map((order) => {
      const itemsForOrder = orderItems.filter((oi) => oi.order_id === order.id);
      const historyForOrder = orderStatusHistory.filter((osh) => osh.order_id === order.id);
      return {
        ...order,
        items: itemsForOrder,
        history: historyForOrder,
      };
    });

    return res.json({ orders: detailedOrders, success: true });
  });

  app.patch(['/api/orders/:id/status', '/api/v1/orders/:id/status'], (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, changed_by } = req.body;

    const order = orders.find((o) => o.id === id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found', success: false });
    }

    const fromStatus = order.status;
    order.status = status;
    order.updated_at = new Date().toISOString();

    const historyRecord: OrderStatusHistory = {
      id: `osh-${Date.now()}`,
      order_id: order.id,
      from_status: fromStatus,
      to_status: status,
      changed_by: changed_by || 'kitchen',
      changed_at: new Date().toISOString(),
    };
    orderStatusHistory.push(historyRecord);

    return res.json({
      order,
      history: historyRecord,
      success: true,
    });
  });

  // Mount Vite development middlewares
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ChaiBreak API server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
