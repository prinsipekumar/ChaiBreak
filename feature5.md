# Feature 5 — My Orders & Live Status

**Project:** ChaiBreak (Office Canteen Pre-Ordering App)
**Feature:** F5 — customer-facing order history, live order status, order details, pickup code, and cancellation
**Status:** Implemented, tested, built, installed, and verified on the Android device `10BD8T0YYU000ND`
**Last documented:** 9 November 2026

---

## 1. What Feature 5 Delivers

F5 gives an employee a complete view of their own orders:

- A **My Orders** screen with two sections:
  - **Active Orders** — `placed`, `preparing`, `ready`
  - **Order History** — `picked_up`, `cancelled`
- An **Order Details** screen showing:
  - Order number, date, and current status
  - Large pickup code
  - Four-step status tracker
  - Item-level breakdown and totals
  - Optional customer note
- **Automatic live updates** while an order is active (polling every 5 seconds)
- **Cancel Order** for orders that are still `placed`
- **Stock restoration** when an order is cancelled
- **Status history** persisted in the database
- Proper loading, empty, error, retry, and pull-to-refresh states
- JWT-protected, ownership-checked API endpoints

F5 does **not** create duplicate order tables. It reads and writes the same
`orders`, `order_items`, and `order_status_history` tables used by the rest of
the application.

---

## 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────────────────────┐
│                         React Native App                           │
│                                                                    │
│  App.tsx                                                           │
│    └── EmployeePortal                                              │
│          ├── MyOrdersScreen ──► useMyOrders ──────────┐             │
│          │        └── OrderCard / PickupCode          │             │
│          └── OrderDetailsScreen ─► useOrderDetails ───┤             │
│                   ├── OrderStatusTracker              │             │
│                   ├── OrderItemsList                  │             │
│                   ├── PickupCode                      │             │
│                   └── useCancelOrder ─────────────────┤             │
│                                                       ▼             │
│                                        features/orders/ordersApi.ts │
│                                                       │             │
│                                        services/api.ts (axios)      │
│                                                       │             │
│                                        Zustand authStore (JWT)      │
└───────────────────────────────────────────────────────┼─────────────┘
                                                        │ HTTP
                                                        ▼
┌────────────────────────────────────────────────────────────────────┐
│                         Express Backend                            │
│                                                                    │
│  app.ts  /api/v1/orders                                            │
│    └── order.routes.ts                                             │
│          ├── GET  /me            ─► requireAuth ─► getMyOrders      │
│          ├── GET  /:id           ─► requireAuth ─► getOrderById     │
│          └── PATCH /:id/cancel   ─► requireAuth ─► cancelOrder      │
│                                                                    │
│  auth.middleware.ts  ── verifies JWT, sets req.user.id             │
│  order.controller.ts ── SQL, transactions, serialization           │
│  utils/orderStatus.ts ── status aliases and normalization          │
│  config/db.ts ───────── mysql2 connection pool                     │
└───────────────────────────────────────────────────────┼─────────────┘
                                                        │ SQL
                                                        ▼
┌────────────────────────────────────────────────────────────────────┐
│                          MySQL / MariaDB                           │
│                                                                    │
│  users          otp_codes                                          │
│  items                                                             │
│  orders  ──< order_items >── items                                 │
│     └────< order_status_history                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Design rule used by F5

- **React Query** owns all server state: orders list, order detail, polling,
  mutations, loading and error state.
- **Zustand** owns only authentication/session state (`token`, `user`).
- Screens are presentational and orchestration-only.
- API mapping converts backend `snake_case` DTOs into frontend
  `camelCase` models.
- Backend status values are normalized to one canonical set of lowercase
  values before leaving the API.

---

## 3. File Map and Responsibilities

### 3.1 Backend files

| File | Responsibility |
|---|---|
| `Backend/src/app.ts` | Mounts `orderRoutes` at `/api/v1/orders`. |
| `Backend/src/routes/order.routes.ts` | Declares F5 routes, JWT protection, and `:id` validation. |
| `Backend/src/controllers/order.controller.ts` | Implements list, detail, cancel, serialization, SQL, and transactions. Also contains the existing F4 `placeOrder` handler. |
| `Backend/src/middlewares/auth.middleware.ts` | Verifies `Bearer <JWT>` and exposes `req.user = { id, phone, role }`; also provides `requireRole`. |
| `Backend/src/utils/orderStatus.ts` | Canonical status type, legacy aliases, normalization, and active-status helper. |
| `Backend/src/config/db.ts` | `mysql2/promise` connection pool configured from `.env`. |
| `Backend/database/orders.sql` | Creates `items`, `orders`, `order_items`, and `order_status_history`. |
| `Backend/database/auth-profile.sql` | Creates `users` and `otp_codes` used by login. |
| `Backend/src/scripts/seedOrders.ts` | Development-only deterministic seed data for F5. |
| `Backend/src/scripts/setOrderStatus.ts` | Development-only utility to advance/reset a seeded order and write history. |
| `Backend/src/__tests__/orders.test.ts` | 13 Supertest/Jest tests for F5 endpoints and cancellation behavior. |
| `Backend/jest.config.js` | Jest + `ts-jest` configuration for backend tests. |
| `Backend/package.json` | Adds `test`, `seed:orders`, and `order:status` scripts plus Jest/Supertest dependencies. |

### 3.2 Frontend files

| File | Responsibility |
|---|---|
| `App/App.tsx` | Wires `MyOrdersScreen` and `OrderDetailsScreen` into the employee portal and configures `QueryClient`. |
| `App/src/screens/MyOrdersScreen.tsx` | Orders list screen: loading, error, empty, active/history sections, pull-to-refresh. |
| `App/src/screens/OrderDetailsScreen.tsx` | Details screen: pickup code, tracker, items, totals, note, cancel flow, polling hint. |
| `App/src/features/orders/types.ts` | Frontend domain models and backend DTO types. |
| `App/src/features/orders/orderStatus.ts` | Status normalization, labels/colors, splitting active vs history, formatting helpers. |
| `App/src/features/orders/ordersApi.ts` | Axios calls, envelope handling, DTO→model mapping, `OrderApiError`. |
| `App/src/features/orders/hooks/useOrders.ts` | React Query hooks and query-key factory; polling and cache updates. |
| `App/src/features/orders/components/OrderCard.tsx` | Compact order summary used in the list. |
| `App/src/features/orders/components/PickupCode.tsx` | Large/compact pickup-code display. |
| `App/src/features/orders/components/OrderStatusTracker.tsx` | Four-step progress tracker and cancelled-state card. |
| `App/src/features/orders/components/OrderItemsList.tsx` | Item rows with quantity, unit price, and line total. |
| `App/src/services/api.ts` | Shared axios instance and API host selection. |
| `App/src/store/authStore.ts` | Zustand auth store with AsyncStorage persistence. |
| `App/src/screens/LoginScreen.tsx` | Existing login UI; produces the JWT used by F5. |
| `App/src/services/auth.service.ts` | Existing OTP request/verify API calls. |
| `App/src/features/orders/__tests__/ordersApi.test.ts` | 6 API/mapping tests. |
| `App/src/features/orders/__tests__/orderStatus.test.ts` | 5 status/helper tests. |
| `App/src/features/orders/__tests__/components.test.tsx` | 3 component rendering tests. |

### 3.3 Build/runtime files touched outside F5

| File | Change |
|---|---|
| `App/android/local.properties` | Local `sdk.dir` for the Android SDK (git-ignored). |
| `App/android/gradle.properties` | Reduced Gradle JVM memory for the 8 GB development machine. |
| `App/package.json`, `App/package-lock.json` | Removed the unused `react-native-gesture-handler` dependency to avoid a Windows `MAX_PATH` native-build failure. |

---

## 4. End-to-End Data Flow

### 4.1 Prerequisite — authentication produces the token

F5 needs a JWT. The existing login flow is:

```text
LoginScreen
  └── auth.service.requestOtp(phone)
        └── POST /api/v1/auth/request-otp
              └── auth.controller.requestOtpController
                    └── INSERT INTO otp_codes
                    └── console.log("OTP Request for <phone>: <code>")

LoginScreen
  └── auth.service.verifyOtp(phone, code)
        └── POST /api/v1/auth/verify-otp
              └── auth.controller.verifyOtpController
                    ├── validates OTP, attempts and expiry
                    ├── finds/creates users row
                    └── returns { success, data: { token, user } }
  └── useAuthStore.setAuth(token, user)
        └── Zustand + AsyncStorage ("auth-storage")
```

Every F5 request reads `useAuthStore(state => state.token)` and sends:

```http
Authorization: Bearer <token>
```

`requireAuth` verifies the token and maps the payload:

```ts
req.user = {
  id: decoded.userId,
  phone: decoded.phone,
  role: decoded.role,
};
```

Controllers use `req.user.id` as the only source of ownership. A client cannot
request another user's order by changing a body/query value.

---

### 4.2 Flow — loading the orders list

```text
MyOrdersScreen
  └── useMyOrders()
        ├── token = useAuthStore(state => state.token)
        ├── queryKey = ['orders', 'me']
        ├── enabled = Boolean(token)
        ├── queryFn = fetchMyOrders(token)
        └── refetchInterval = hasActiveOrders(data) ? 5000 : false
              │
              ▼
ordersApi.fetchMyOrders(token)
  └── api.get('/orders/me', { headers: { Authorization: `Bearer ${token}` } })
        │
        ▼
services/api.ts
  └── baseURL = http://localhost:5000/api/v1   (real device + adb reverse)
              │
              ▼
app.ts
  └── app.use('/api/v1/orders', orderRoutes)
        │
        ▼
order.routes.ts
  └── GET /me → requireAuth → getMyOrders
        │
        ▼
order.controller.getMyOrders
  ├── requireUserId(req, res)
  ├── SELECT ... FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC
  ├── SELECT ... FROM order_items LEFT JOIN items
  │     WHERE order_id IN (...) ORDER BY oi.id ASC
  ├── group items by order_id using a Map (avoids N+1 queries)
  └── serializeOrder(order, items)
        ├── Number(...) for numeric columns
        ├── normalizeOrderStatus(row.status)
        └── res.json({ success: true, data: [...] })
              │
              ▼
ordersApi.readEnvelope()
  └── checks response.data.success
  └── checks array shape
  └── toOrder(dto)
        ├── snake_case → camelCase
        ├── total_amount → totalAmount
        ├── pickup_code → pickupCode
        ├── status_history → statusHistory
        └── normalizes every status
              │
              ▼
React Query cache: ['orders', 'me']
              │
              ▼
MyOrdersScreen
  ├── splitOrders(orders)
  │     ├── activeOrders: placed / preparing / ready
  │     └── historyOrders: picked_up / cancelled
  ├── OrderSection("Active Orders")
  └── OrderSection("Order History")
        └── OrderCard → PickupCode
```

The list endpoint is intentionally a small number of queries regardless of how
many orders the user has:

1. One query for all orders belonging to the user.
2. One query for all items belonging to those orders.

Items are grouped in memory, not fetched per order.

---

### 4.3 Flow — opening order details

```text
OrderCard.onPress(order)
  └── MyOrdersScreen.onOpenOrder(order.id)
        └── App.tsx EmployeePortal.setSelectedOrderId(id)
              └── renders <OrderDetailsScreen orderId={id} />

OrderDetailsScreen
  └── useOrderDetails(orderId)
        ├── queryKey = ['orders', 'detail', orderId]
        ├── enabled = Boolean(token) && orderId > 0
        ├── queryFn = fetchOrderDetails(token, orderId)
        └── refetchInterval =
              getOrderPollingInterval(data.status)  // 5000 | false
              │
              ▼
ordersApi.fetchOrderDetails(token, orderId)
  └── api.get(`/orders/${orderId}`, auth headers)
        │
        ▼
order.routes.ts
  └── GET /:id → requireAuth → orderIdValidation → getOrderById
        │
        ▼
order.controller.getOrderById
  ├── SELECT ... FROM orders WHERE id = ? AND user_id = ?
  │     └── 0 rows → 404 { success: false, message: "Order not found." }
  ├── SELECT ... FROM order_items LEFT JOIN items WHERE order_id = ?
  ├── SELECT status, created_at
  │     FROM order_status_history
  │     WHERE order_id = ?
  │     ORDER BY created_at ASC
  └── res.json({ success: true, data: serializeOrder(...) })
        │
        ▼
ordersApi.toOrder(dto)
        │
        ▼
OrderDetailsScreen
  ├── header: Order #id, date, status badge
  ├── PickupCode
  ├── polling hint when active
  ├── OrderStatusTracker
  ├── OrderItemsList
  ├── item total + grand total
  ├── optional note (seed markers hidden)
  └── Cancel Order button when status === "placed"
```

---

### 4.4 Flow — live status polling

Polling is implemented entirely in React Query, so the screens do not manage
timers manually.

**List polling**

```ts
refetchInterval: query =>
  hasActiveOrders(query.state.data ?? []) ? 5000 : false,
```

If any order is `placed`, `preparing`, or `ready`, the list refetches every
5 seconds. Once all orders are `picked_up` or `cancelled`, polling stops.

**Detail polling**

```ts
refetchInterval: query =>
  query.state.data
    ? getOrderPollingInterval(query.state.data.status)
    : false,
```

`getOrderPollingInterval` returns:

| Status | Interval |
|---|---|
| `placed` | 5000 ms |
| `preparing` | 5000 ms |
| `ready` | 5000 ms |
| `picked_up` | `false` |
| `cancelled` | `false` |

This provides "live" updates without WebSockets. F6 can change a status in the
database, and an open F5 screen will show it within roughly 5 seconds.

---

### 4.5 Flow — cancelling an order

```text
OrderDetailsScreen "Cancel Order"
  └── Alert.alert("Cancel this order?", ...)
        └── destructive action
              └── useCancelOrder(orderId).mutate()
                    │
                    ▼
ordersApi.cancelOrderRequest(token, orderId)
  └── api.patch(`/orders/${orderId}/cancel`, undefined, auth headers)
        │
        ▼
order.routes.ts
  └── PATCH /:id/cancel
        ├── requireAuth
        └── orderIdValidation
              │
              ▼
order.controller.cancelOrder
  ├── db.getConnection()
  ├── beginTransaction()
  ├── SELECT id, user_id, status FROM orders
  │     WHERE id = ? FOR UPDATE
  │
  ├── not found or user_id mismatch
  │     └── rollback → 404 "Order not found."
  │
  ├── normalizeOrderStatus(status) !== "placed"
  │     └── rollback → 409 "This order can no longer be cancelled."
  │
  ├── SELECT item_id, quantity FROM order_items WHERE order_id = ?
  ├── for each item:
  │     UPDATE items SET stock = stock + ? WHERE id = ?
  ├── UPDATE orders SET status = 'cancelled' WHERE id = ?
  ├── INSERT INTO order_status_history (order_id, status)
  │     VALUES (?, 'cancelled')
  ├── commit()
  └── 200 { success: true, data: { id, status: "cancelled" } }
        │
        ▼
useCancelOrder.onSuccess
  ├── setQueryData(['orders','detail',id], status: 'cancelled')
  ├── setQueryData(['orders','me'], replace matching order status)
  ├── invalidateQueries(detail)
  └── invalidateQueries(list)
        │
        ▼
OrderDetailsScreen re-renders:
  ├── status badge → Cancelled
  ├── tracker → cancelled card
  ├── Cancel button disappears
  └── polling stops
```

Why a transaction and `FOR UPDATE`:

- The order row is locked while stock is restored.
- Two simultaneous cancel requests cannot both restore stock.
- One request wins with `200`; the other sees `cancelled` and receives `409`.
- Any SQL failure triggers `rollback`, restoring both status and stock.

---

### 4.6 Error flow

Backend responses use one envelope:

```json
{ "success": false, "message": "..." }
```

Frontend translation:

```text
Axios error
  └── ordersApi.readEnvelope
        └── OrderApiError(message, status)
              ├── 401 → "Authentication required." / invalid token
              ├── 404 → "Order not found."
              ├── 409 → "This order can no longer be cancelled."
              └── 500 → generic server error message
                    │
                    ▼
getOrderErrorMessage(error)
  └── screen error banner / alert text
```

List screen behavior:

- First load + error + no cached data → full-page error with **Try again**
- Error with cached data → inline error banner, cached orders remain visible
- Pull-to-refresh calls `refetch()` and shows the native refresh indicator

Details screen behavior:

- Loading → centered spinner
- Missing order → **Order unavailable** + retry + back link
- Cancel conflict → alert with backend message

---

## 5. Backend Deep Dive

### 5.1 Effective API routes

`app.ts` mounts the router at `/api/v1/orders`.

| Method | Effective path | Auth | Validation | Handler |
|---|---|---|---|---|
| `GET` | `/api/v1/orders/me` | JWT | none | `getMyOrders` |
| `GET` | `/api/v1/orders/:id` | JWT | positive integer `id` | `getOrderById` |
| `PATCH` | `/api/v1/orders/:id/cancel` | JWT | positive integer `id` | `cancelOrder` |
| `POST` | `/api/v1/orders/orders` | currently none | none | existing F4 `placeOrder` |

> **F4 integration note:** the existing F4 placement route is declared as
> `router.post("/orders", ...)` inside a router already mounted at
> `/api/v1/orders`. Its effective URL today is
> `POST /api/v1/orders/orders`. When F4 is integrated, either call that exact
> URL or change the route to `router.post("/", ...)` so it becomes the expected
> `POST /api/v1/orders`. Also add `requireAuth` before `placeOrder`; the
> handler currently falls back to `req.body.userId` when no JWT user exists.

### 5.2 Response contracts

**List — `GET /api/v1/orders/me`**

```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "user_id": 1,
      "status": "preparing",
      "total_amount": 95,
      "pickup_code": "4102",
      "note": "F5-SEED:preparing",
      "created_at": "2026-11-09T08:51:34.000Z",
      "items": [
        {
          "id": 4,
          "order_id": 2,
          "item_id": 2,
          "name": "Filter Coffee",
          "quantity": 1,
          "price": 35
        }
      ],
      "status_history": []
    }
  ]
}
```

**Detail — `GET /api/v1/orders/:id`**

Same shape, but `items` and `status_history` are populated:

```json
{
  "success": true,
  "data": {
    "id": 3,
    "status": "ready",
    "pickup_code": "4103",
    "total_amount": 110,
    "items": [],
    "status_history": [
      { "status": "placed", "created_at": "..." },
      { "status": "preparing", "created_at": "..." },
      { "status": "ready", "created_at": "..." }
    ]
  }
}
```

**Cancel — `PATCH /api/v1/orders/:id/cancel`**

```json
{
  "success": true,
  "message": "Order cancelled successfully.",
  "data": { "id": 1, "status": "cancelled" }
}
```

### 5.3 Status normalization

F4 historically wrote `PENDING`. F5 canonicalizes every status on the way out
and defensively on the frontend.

`Backend/src/utils/orderStatus.ts`:

| Stored / legacy value | Canonical output |
|---|---|
| `PENDING` | `placed` |
| `PLACED` | `placed` |
| `PREPARING` | `preparing` |
| `READY` | `ready` |
| `PICKED_UP` | `picked_up` |
| `PICKEDUP` | `picked_up` |
| `COMPLETED` | `picked_up` |
| `CANCELLED` | `cancelled` |
| `CANCELED` | `cancelled` |

Active statuses:

```ts
["placed", "preparing", "ready"]
```

This dual normalization is deliberate:

- Backend keeps existing F4 rows readable without a migration.
- Frontend remains safe if an older backend response accidentally leaks a
  legacy value.

### 5.4 Database schema

```text
items
  id            PK
  name
  price         DECIMAL(10,2)
  stock         INT

orders
  id            PK
  user_id       INT  (indexed)
  total_amount  DECIMAL(10,2)
  pickup_code   VARCHAR(10)
  note          TEXT
  status        VARCHAR(50) DEFAULT 'placed'  (indexed)
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP

order_items
  id            PK
  order_id      FK → orders.id ON DELETE CASCADE
  item_id       FK → items.id
  quantity      INT
  price         DECIMAL(10,2)  (price snapshot at order time)

order_status_history
  id            PK
  order_id      FK → orders.id ON DELETE CASCADE
  status        VARCHAR(50)
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
```

Important details:

- `order_items.price` is a **snapshot**, so later menu price changes do not
  rewrite historical totals.
- `orders` and `order_items` already existed as the shared order model; F5 did
  not introduce parallel tables.
- `order_status_history` is the audit trail used to render future timelines and
  to confirm cancellation.
- The existing schema does **not** declare a foreign key from `orders.user_id`
  to `users.id`. Ownership is enforced by the controller queries. A future
  migration can add the FK after cleaning legacy rows.

### 5.5 Query strategy and ownership

`getMyOrders`:

```sql
SELECT id, user_id, status, total_amount, pickup_code, note, created_at
FROM orders
WHERE user_id = ?
ORDER BY created_at DESC, id DESC;
```

```sql
SELECT oi.id, oi.order_id, oi.item_id, oi.quantity, oi.price, i.name
FROM order_items oi
LEFT JOIN items i ON i.id = oi.item_id
WHERE oi.order_id IN (?, ?, ...)
ORDER BY oi.id ASC;
```

`getOrderById`:

```sql
SELECT id, user_id, status, total_amount, pickup_code, note, created_at
FROM orders
WHERE id = ? AND user_id = ?;
```

```sql
SELECT oi.id, oi.order_id, oi.item_id, oi.quantity, oi.price, i.name
FROM order_items oi
LEFT JOIN items i ON i.id = oi.item_id
WHERE oi.order_id = ?
ORDER BY oi.id ASC;
```

```sql
SELECT status, created_at
FROM order_status_history
WHERE order_id = ?
ORDER BY created_at ASC;
```

Ownership is part of the SQL predicate. A valid JWT for user 2 asking for user
1's order receives `404`, not `403`, so the API does not reveal that the order
exists.

### 5.6 Cancellation rules

An order can be cancelled only when its normalized status is exactly `placed`.

| Current status | Cancel result |
|---|---|
| `placed` / `PENDING` | `200`, stock restored, history appended |
| `preparing` | `409` |
| `ready` | `409` |
| `picked_up` | `409` |
| `cancelled` | `409` |
| Other user's order | `404` |
| Missing order | `404` |
| Invalid id (`0`, text) | `400` |
| SQL failure mid-transaction | `500`, rollback |

---

## 6. Frontend Deep Dive

### 6.1 Navigation wiring

`App.tsx` owns simple state-based navigation; there is no separate navigation
stack for F5.

```text
EmployeePortal
  state:
    activeTopTab: 'menu' | 'orders' | 'profile'
    selectedOrderId: number | null

  if selectedOrderId !== null:
      <OrderDetailsScreen orderId={selectedOrderId}
                          onBack={() => setSelectedOrderId(null)} />
  else if activeTopTab === 'orders':
      <MyOrdersScreen onOpenOrder={setSelectedOrderId} />
  else if activeTopTab === 'profile':
      <ProfileScreen />
  else:
      <MenuScreen />
```

Selecting any top/bottom tab clears `selectedOrderId`, returning to the list.
The app is wrapped in `QueryClientProvider`; `retry` is disabled globally so
errors surface immediately instead of being retried invisibly.

### 6.2 React Query keys and cache

`orderKeys`:

```ts
export const orderKeys = {
  all: ['orders'],
  list: ['orders', 'me'],
  detail: (orderId: number) => ['orders', 'detail', orderId],
};
```

| Hook | Query key | Enabled when | Polling |
|---|---|---|---|
| `useMyOrders` | `['orders','me']` | token exists | `5000` if any active order |
| `useOrderDetails(id)` | `['orders','detail',id]` | token exists and `id > 0` | `5000` if that order is active |
| `useCancelOrder(id)` | mutation | on demand | invalidates list + detail |

After a successful cancellation:

1. The detail cache is patched immediately with the returned status.
2. The list cache is patched so the card moves to history instantly.
3. Both queries are invalidated to reconcile with the server.

This gives an immediate UI response while still guaranteeing server truth.

### 6.3 DTO mapping

Backend columns are intentionally kept out of the UI:

```text
OrderDto                         Order
--------                         -----
id                               id
user_id                          (not exposed)
status (string)                  status (OrderStatus)
total_amount (string|number)     totalAmount (number)
pickup_code                      pickupCode
note                             note
created_at                       createdAt
items[].item_id                  items[].itemId
items[].name                     items[].name
items[].quantity                 items[].quantity
items[].price (string|number)    items[].price (number)
status_history[].created_at      statusHistory[].createdAt
```

`mysql2` returns `DECIMAL` columns as strings, so every numeric conversion is
explicit (`Number(...)`).

### 6.4 Status presentation helpers

`App/src/features/orders/orderStatus.ts` centralizes:

- canonical status type
- legacy alias normalization
- active vs history split
- cancellable check (`placed` only)
- human labels
- badge colors
- polling interval
- price formatting (`₹85`, `₹85.50`)
- date formatting (`9 Nov, 2:28 pm`, `en-IN`)
- item count (sum of quantities, not number of rows)

Status badge colors:

| Status | Background | Text |
|---|---|---|
| `placed` | `#FFF4E5` | `#B26A00` |
| `preparing` | `#EAF4FF` | `#1565C0` |
| `ready` | `#E8F5E9` | `#2E7D32` |
| `picked_up` | `#F0EDEA` | `#6D4C41` |
| `cancelled` | `#FDECEA` | `#C62828` |

### 6.5 Component responsibilities

| Component | What it renders | Inputs |
|---|---|---|
| `OrderCard` | Order #, date, status badge, 2 item lines + "+N more", quantity count, compact pickup code, total, "View details" | `order`, `onPress` |
| `PickupCode` | Dashed pickup-code panel, large or compact | `code`, `compact` |
| `OrderStatusTracker` | Four steps with completed/current styling, or a red cancelled card | `status` |
| `OrderItemsList` | One row per item: quantity badge, name, unit price, line total | `items` |

Accessibility:

- `OrderCard` uses `accessibilityRole="button"` and a label like
  `Order 2, Preparing`.
- This made on-device UI automation possible and also improves screen-reader
  behavior.

### 6.6 Screen states

**MyOrdersScreen**

1. **Loading** — spinner + "Loading your orders…"
2. **Fatal error, no cache** — icon, title, message, retry button
3. **Empty** — `EmptyState` with "No orders yet" and refresh action
4. **Loaded** — Active Orders section + Order History section
5. **Background error with cache** — inline banner + Retry, cached data stays
6. **Pull-to-refresh** — native `RefreshControl`

**OrderDetailsScreen**

1. **Loading** — spinner + "Loading order details…"
2. **Not found / failed with no data** — error message, retry, back link
3. **Loaded**
   - back link `← My Orders`
   - order number, date, status badge
   - large pickup code
   - polling hint only when active
   - status tracker
   - item list
   - item total + grand total
   - note (unless it is an `F5-SEED:` marker)
   - cancel button only when status is `placed`

---

## 7. Order Lifecycle

```text
                 ┌──────────────┐
                 │    placed    │  ← F4 checkout / F5 seed
                 └──────┬───────┘
                        │ F6 kitchen accepts
                        ▼
                 ┌──────────────┐
                 │  preparing   │
                 └──────┬───────┘
                        │ F6 kitchen marks ready
                        ▼
                 ┌──────────────┐
                 │    ready     │
                 └──────┬───────┘
                        │ F6 kitchen hands over
                        ▼
                 ┌──────────────┐
                 │  picked_up   │
                 └──────────────┘

  placed ──(employee cancels)──► cancelled
```

- F5 displays this lifecycle and allows the `placed → cancelled` edge only.
- F6 will own the forward kitchen transitions in the future.
- Status history rows are appended at every transition.
- Only active statuses poll; terminal statuses stop polling.

---

## 8. Dummy / Seed Data

### 8.1 Why dummy data is used

F5 is a read-and-display feature, but at the time it was built:

- **F4 (cart/checkout UI)** was not yet creating real orders through the app.
- **F6 (kitchen dashboard)** was not yet advancing order statuses.
- A single new account would otherwise see an empty list.
- All five statuses needed to be exercised visually and on-device:
  `placed`, `preparing`, `ready`, `picked_up`, `cancelled`.
- Cancellation needed a real `placed` order to test stock restoration.

Therefore F5 uses deterministic **development seed data**. The UI itself has no
hardcoded order data. Everything displayed is fetched from the real backend and
the real MySQL tables through the same API used in production.

### 8.2 Where the dummy data lives

**Seed definitions — `Backend/src/scripts/seedOrders.ts`**

Seed menu items:

| Item | Price | Initial stock |
|---|---|---|
| Masala Chai | ₹30 | 100 |
| Filter Coffee | ₹35 | 100 |
| Samosa | ₹25 | 100 |
| Veg Sandwich | ₹60 | 100 |
| Chocolate Brownie | ₹80 | 100 |

Seed orders for user `9000000001` (`F5 Seed User`, role `employee`):

| Status | Pickup code | Items | Total | History |
|---|---|---|---|---|
| `placed` | `4101` | 2× Masala Chai, 1× Samosa | ₹85 | placed |
| `preparing` | `4102` | 1× Filter Coffee, 1× Veg Sandwich | ₹95 | placed → preparing |
| `ready` | `4103` | 1× Masala Chai, 1× Chocolate Brownie | ₹110 | placed → preparing → ready |
| `picked_up` | `4104` | 2× Masala Chai, 1× Veg Sandwich | ₹120 | placed → preparing → ready → picked_up |
| `cancelled` | `4105` | 1× Filter Coffee, 2× Samosa | ₹85 | placed → cancelled |

Seed behavior:

- If `SEED_USER_PHONE` is set, that user is used/created.
- Otherwise the first `employee` user is used.
- If no employee exists, `9000000001` / `F5 Seed User` is created.
- Items are reused by name if they already exist.
- Each order gets `note = "F5-SEED:<status>"`.
- The seed checks for that marker before inserting, so running it repeatedly is
  idempotent.
- Non-cancelled seed orders deduct stock. Cancelled orders do not deduct stock.
- All inserts run inside one transaction.

**Status-change utility — `Backend/src/scripts/setOrderStatus.ts`**

Used to simulate F6 activity before F6 exists:

```bash
cd Backend
npm run order:status -- 2 preparing
npm run order:status -- 2 ready
npm run order:status -- 2 picked_up
npm run order:status -- 1 cancelled
```

Rules:

- Only orders whose `note` starts with `F5-SEED:` can be changed.
- A cancelled seeded order cannot be moved again.
- Moving to `cancelled` restores stock.
- Every change appends an `order_status_history` row.
- Changing to an active status keeps F5 polling active.

**Database rows created by the seed**

- `users` — seed user if missing
- `items` — seed items if missing
- `orders` — 5 seeded rows linked to the seed user
- `order_items` — item snapshots
- `order_status_history` — status timeline used by the details screen

### 8.3 Seed safety guards

Both scripts start with:

```ts
if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed orders in production.");
  process.exit(1);
}
```

Additional protection:

- `setOrderStatus.ts` refuses to touch non-`F5-SEED:` orders.
- The details screen hides notes beginning with `F5-SEED:` so internal markers
  never appear as customer notes.
- The seed is idempotent because of the marker lookup.

### 8.4 Dummy data that is *not* F5

`App/src/features/menu/data/menuData.ts` and the fallback inside
`App/src/services/menuApi.ts` contain bundled menu/category mock data for the
**menu feature**. F5 does not read that mock data. Orders always come from the
backend.

### 8.5 Test data is separate from seed data

`Backend/src/__tests__/orders.test.ts` uses an in-memory `FakeDatabase`, not the
MySQL seed rows. This keeps tests deterministic and independent of local data.

The fake DB implements only the SQL patterns F5 uses:

- order lookup by user
- order lookup by id + user
- order locking
- order items
- status history
- stock restoration
- cancellation update
- cancellation history insert

It also supports forced failures and transaction undo to test rollback.

---

## 9. Test Cases

### 9.1 Backend tests — 13/13 passing

Command:

```bash
cd Backend
npm test
```

File: `Backend/src/__tests__/orders.test.ts`

| # | Area | Scenario | Expected |
|---|---|---|---|
| 1 | List | Authenticated user requests their orders | `200`, only user 1's orders `101,102,103`, statuses normalized (`PREPARING` → `preparing`), items attached |
| 2 | List | Request without `Authorization` | `401` with "Authorization token missing or malformed." |
| 3 | Detail | Request own order with items/history | `200`, correct total `85`, pickup `1111`, 2 item rows, history returned |
| 4 | Detail | Request another user's order | `404` "Order not found." |
| 5 | Detail | Request missing order | `404` |
| 6 | Detail | Invalid id (`not-a-number`) | `400`, `success: false` |
| 7 | Cancel | Cancel a `placed` order | `200`, status `cancelled`, stock +2/+1 restored, one cancelled history row |
| 8 | Cancel | Cancel a `preparing` order | `409`, status unchanged, stock untouched |
| 9 | Cancel | Cancel another user's order | `404`, status/stock unchanged |
| 10 | Cancel | Cancel the same order twice | First `200`, second `409`, stock restored only once |
| 11 | Cancel | Two concurrent cancel requests | Exactly one `200` and one `409`, single stock restoration |
| 12 | Cancel | Force a DB failure during status update | `500`, transaction rolled back: status, stock, history unchanged |
| 13 | Cancel | Invalid id (`0`) | `400` |

Notable test mechanics:

- JWT tokens are signed directly with the test secret.
- The fake DB serializes order locking so the concurrency test is meaningful.
- `rollback()` reverses recorded undo operations.
- `console.error` is spied on for the failure test to keep output clean.

### 9.2 Frontend tests — 33/33 passing (14 F5-specific)

Command:

```bash
cd App
npm test
```

F5-specific tests:

**`ordersApi.test.ts` — 6 tests**

| # | Scenario | Expected |
|---|---|---|
| 1 | Map an order DTO | No `snake_case` leaks into the UI model; numbers and item IDs converted |
| 2 | Fetch list with token | Calls `GET /orders/me` with `Bearer jwt-token`; returns mapped orders |
| 3 | Fetch one order | Calls `GET /orders/101`; pickup code and 2 history entries preserved |
| 4 | Cancel order | Calls `PATCH /orders/101/cancel`; normalizes returned `CANCELLED` → `cancelled` |
| 5 | Backend `409` | Surfaces `OrderApiError` with status `409` and server message |
| 6 | Empty token | Rejects before any HTTP request |

**`orderStatus.test.ts` — 5 tests**

| # | Scenario | Expected |
|---|---|---|
| 1 | Normalize statuses | `PENDING`→`placed`, `PREPARING`→`preparing`, `CANCELED`→`cancelled` |
| 2 | Split orders | IDs `1,2,3` active; `4,5` history |
| 3 | Polling intervals | Active → 5000; `picked_up`/`cancelled` → `false` |
| 4 | Helpers | `hasActiveOrders` and `isCancellableOrderStatus('PENDING')` behave correctly |
| 5 | Price formatting | `85` → `₹85`; `85.5` → `₹85.50` |

**`components.test.tsx` — 3 tests**

| # | Scenario | Expected |
|---|---|---|
| 1 | Tracker with `preparing` | Renders all four labels |
| 2 | Tracker with `cancelled` | Renders "Order cancelled" instead of progress |
| 3 | Order card | Renders order number, pickup code, item summary, total |

The remaining 19 passing tests belong to the existing menu feature.

### 9.3 Type checks, lint, and build

Run from the project root:

```bash
cd Backend
npx tsc --noEmit
npm run build

cd ../App
npx tsc --noEmit
npm run lint
```

Verified results during F5 development:

- Backend TypeScript check: passed
- Backend build: passed
- Frontend TypeScript check: passed
- Frontend ESLint: passed
- Backend Jest: 13/13
- Frontend Jest: 33/33
- Android Gradle `app:installDebug`: **BUILD SUCCESSFUL**
- App installed and launched on `10BD8T0YYU000ND`

### 9.4 Manual on-device verification

Device: `V2222`, Android 15, ABI `arm64-v8a`

| Check | Result |
|---|---|
| App launches from Metro bundle | Passed |
| Login with `9000000001` via OTP | Passed |
| Active Orders shows #1 Placed, #2 Preparing, #3 Ready | Passed |
| Pickup codes `4101`, `4102`, `4103` shown | Passed |
| Order History shows #4 Picked up, #5 Cancelled | Passed |
| Detail screen for #3 shows Ready tracker | Passed |
| Detail for #1 shows Cancel Order | Passed |
| Item totals and grand totals correct | Passed |
| No React Native redbox / fatal logcat errors | Passed |
| `adb reverse` `tcp:5000` and `tcp:8081` | Active |

### 9.5 Recommended manual regression checklist

1. Log in as a user with no orders → empty state.
2. Open Orders → verify sections and counts.
3. Pull to refresh → spinner and updated data.
4. Open an active order → verify tracker, code, items, totals.
5. Cancel a `placed` order → confirm dialog → success alert → moves to history.
6. Open a `preparing` order → confirm Cancel Order is absent.
7. Run seed status utility to move an order → wait ≤5 s → verify UI updates.
8. Stop the backend → verify error banner and retry behavior.
9. Use a second user's JWT to request order 1 → verify `404`.
10. Toggle airplane mode / remove reverse tunnel → verify network error message.

---

## 10. How to Run the Project

### 10.1 Prerequisites

- Node.js `>= 22.11.0`
- npm
- JDK 21
- Android SDK (platform-tools, platform, build-tools, NDK)
- Android device or emulator
- MySQL 8 / MariaDB (the local setup uses XAMPP MariaDB 10.4)
- XAMPP MySQL running on port `3306`

### 10.2 Database setup

Create the database:

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS chaibreak CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Import the schema:

```powershell
# PowerShell
Get-Content Backend\database\auth-profile.sql -Raw | & "C:\xampp\mysql\bin\mysql.exe" -u root chaibreak
Get-Content Backend\database\orders.sql -Raw | & "C:\xampp\mysql\bin\mysql.exe" -u root chaibreak
```

```bash
# Bash / macOS
mysql -u root chaibreak < Backend/database/auth-profile.sql
mysql -u root chaibreak < Backend/database/orders.sql
```

Verify:

```sql
SHOW TABLES;
-- users, otp_codes, items, orders, order_items, order_status_history
```

### 10.3 Backend environment

Create `Backend/.env` (git-ignored):

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=chaibreak

JWT_SECRET=chaibreak_local_dev_secret
```

`Backend/.env.example` uses port `3307`; adjust it to the port used by your
local MySQL/MariaDB instance.

### 10.4 Install dependencies

```bash
cd Backend
npm install

cd ../App
npm install
```

### 10.5 Seed F5 data (development only)

```bash
cd Backend
npm run seed:orders
```

Expected output:

```text
F5 seed complete for user 1: 5 order(s) created, 0 already present.
cancelled: 1, picked_up: 1, placed: 1, preparing: 1, ready: 1
```

Change a seeded status while developing F6:

```bash
npm run order:status -- <orderId> <status>
# examples
npm run order:status -- 2 ready
npm run order:status -- 2 picked_up
```

### 10.6 Start the backend

```bash
cd Backend
npm run dev
```

Expected output:

```text
Server running on port 5000
MySQL Connected
```

Health check:

```bash
curl http://localhost:5000/chai
# {"success":true,"data":{"status":"ok"}}
```

The OTP for login is printed in this terminal/log:

```text
OTP Request for 9000000001: 5206
```

### 10.7 Connect the Android device

```bash
adb devices
# 10BD8T0YYU000ND    device

adb reverse tcp:5000 tcp:5000
adb reverse tcp:8081 tcp:8081
adb reverse --list
```

Why `adb reverse` is required:

- A physical device cannot reach the development machine's `localhost`.
- `adb reverse` forwards the device's `localhost:5000` to the host backend.
- The same is needed for Metro on `8081`.
- The emulator path uses `10.0.2.2` instead; `App/src/services/api.ts` selects
  this automatically via `DeviceInfo.isEmulatorSync()`.

### 10.8 Start Metro

```bash
cd App
npm start
```

### 10.9 Build and install the app

```powershell
cd App\android
$env:ANDROID_HOME = "C:\Users\<you>\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
.\gradlew.bat app:installDebug -PreactNativeArchitectures=arm64-v8a --no-daemon
```

Or use the React Native CLI:

```bash
cd App
npm run android
```

`npm run dev` combines the reverse tunnel and Android build:

```bash
cd App
npm run dev
```

### 10.10 Log in and view F5

1. Open **ChaiBreak** on the device.
2. Enter phone `9000000001`.
3. Tap **Get OTP**.
4. Read the 4-digit OTP from the backend terminal/log.
5. Enter the OTP and tap **Verify & Login**.
6. Tap **Orders**.
7. Verify the seeded active/history sections.
8. Tap any order to open details.
9. For a `placed` order, tap **Cancel Order** to test the cancellation flow.

### 10.11 Run only the tests

```bash
cd Backend
npm test

cd ../App
npm test
```

### 10.12 Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `SDK location not found` | No `ANDROID_HOME` and no `local.properties` | Set `ANDROID_HOME` and/or create `App/android/local.properties` with `sdk.dir=...` |
| Gradle daemon disappears / JVM crash | Low RAM, heap too large | Use the reduced `App/android/gradle.properties` settings, close other apps, build one ABI |
| `Filename longer than 260 characters` | Windows `MAX_PATH` during native codegen | Build from a shorter path or remove unused native modules; this repo removed unused `react-native-gesture-handler` |
| `Cannot find the path specified` in Ninja | Stale `.cxx` after dependency changes | Purge `App/android/app/.cxx` with a long-path-aware tool, then rebuild |
| `Network Error` in the app | Backend not running or reverse tunnel missing | Start backend, run `adb reverse tcp:5000 tcp:5000`, verify `curl localhost:5000/chai` |
| Login says "No verification code" | OTP expired or backend restarted | Request a new OTP; codes expire after 5 minutes |
| Empty orders list | Seed not run or wrong user | Run `npm run seed:orders`; confirm the logged-in user is `9000000001` |
| `409` on cancel | Order already moved past `placed` | Only freshly placed orders are cancellable |
| Menu loads but Orders fails | JWT missing/expired | Log out and log in again |

---

## 11. Future Integration with F4 (Order Placement)

F4 owns cart, checkout, and order creation. F5 is already prepared for it.

### 11.1 Shared model

F4 must write into the existing tables:

- `orders`
- `order_items`
- `order_status_history`
- `items` (stock deduction)

No new order tables or parallel order types should be introduced.

### 11.2 The existing placement endpoint

`placeOrder` currently:

- Validates non-empty `items`.
- Enforces operating hours `09:00–18:00`.
- Starts a transaction.
- Locks item rows with `SELECT ... FOR UPDATE` in sorted item-id order to
  avoid deadlocks.
- Validates stock.
- Computes the total from database prices, never trusting the client total.
- Generates a 4-digit pickup code.
- Inserts the order with legacy status `PENDING`.
- Inserts `order_items` with price snapshots.
- Deducts stock.
- Inserts an initial `order_status_history` row.
- Commits or rolls back.
- Returns `{ message, orderId, pickupCode, totalAmount }`.

### 11.3 Required integration changes

1. **Fix the route path**
   - Today: `router.post("/orders", placeOrder)` mounted at
     `/api/v1/orders` → `/api/v1/orders/orders`.
   - Preferred contract: change to `router.post("/", placeOrder)` →
     `/api/v1/orders`.

2. **Protect the endpoint**
   - Add `requireAuth`.
   - Read `userId` only from `req.user.id`.
   - Remove/retire the `req.body.userId` fallback.

3. **Write a canonical status**
   - F4 may keep writing `PENDING`; F5 normalizes it.
   - Better long-term: write `placed` directly so new rows are canonical.

4. **Refresh F5 after checkout success**

   ```ts
   queryClient.invalidateQueries({ queryKey: orderKeys.all });
   ```

   Then navigate to the Orders tab or the new order's details. F5 will fetch the
   new order automatically; no extra event bus is required.

5. **Reuse the pickup code response**
   - F4 can show the returned `pickupCode` in its confirmation screen.
   - F5 will show the same code in the card and details screen.

6. **Handle insufficient stock**
   - F4 should display the backend's `400` error message returned from
     `placeOrder` (`Insufficient stock for item ID ...`).
   - Consider adding structured error codes later.

### 11.4 Suggested F4 → F5 sequence

```text
Cart screen
  └── POST /api/v1/orders  { items: [{ itemId, quantity }], note }
        └── placeOrder transaction
              ├── orders row
              ├── order_items rows
              ├── stock deduction
              └── history row "placed"
        └── response { orderId, pickupCode, totalAmount }
              ├── show confirmation
              ├── invalidate orderKeys.all
              └── navigate to Orders / OrderDetails
                    └── F5 fetches and polls the new order
```

### 11.5 Data-contract expectations between F4 and F5

| Field | F4 responsibility | F5 consumption |
|---|---|---|
| `orders.user_id` | Authenticated user | Ownership filter |
| `orders.status` | Initially `placed` (or legacy `PENDING`) | Normalized + displayed/polled |
| `orders.total_amount` | Computed server-side | Displayed as grand total |
| `orders.pickup_code` | Generated server-side | Displayed prominently |
| `orders.note` | Optional customer note | Displayed unless seed marker |
| `orders.created_at` | DB timestamp | Formatted date |
| `order_items.quantity` | From cart | Line item + item count |
| `order_items.price` | DB price snapshot | Unit price + line total |

---

## 12. Future Integration with F6 (Kitchen Dashboard)

F6 owns the kitchen-side workflow: accepting, preparing, and handing over
orders. F5 already polls for those changes; no F5 rewrite is required.

### 12.1 What F6 needs to add

A kitchen-only endpoint, for example:

```http
PATCH /api/v1/orders/:id/status
Authorization: Bearer <kitchen-jwt>
Content-Type: application/json

{ "status": "preparing" }
```

Recommended behavior:

1. `requireAuth` + `requireRole("kitchen")`.
2. Validate `:id` is a positive integer.
3. Validate the target status is one of `preparing`, `ready`, `picked_up`.
4. Start a transaction.
5. `SELECT ... FROM orders WHERE id = ? FOR UPDATE`.
6. Enforce allowed transitions:
   - `placed → preparing`
   - `preparing → ready`
   - `ready → picked_up`
7. Update `orders.status`.
8. Insert into `order_status_history`.
9. Commit.

Return:

```json
{ "success": true, "data": { "id": 2, "status": "ready" } }
```

### 12.2 How F5 reacts automatically

Because F5 polls:

- Open list screen → refetches every 5 seconds while any active order exists.
- Open detail screen → refetches every 5 seconds while that order is active.
- F6 changes status → next poll sees it → UI updates.
- When status becomes `picked_up` or `cancelled`, polling stops.

No change to `useOrders.ts` is needed for basic F6 integration.

### 12.3 If F6 adds push updates later

Polling can be replaced without changing screens:

- Add a WebSocket/SSE channel.
- On a status event, call:
  `queryClient.invalidateQueries({ queryKey: orderKeys.all })`
- Remove or lengthen `refetchInterval`.

The query-key factory and cache layout were designed for this.

### 12.4 Cancellation vs F6

Current F5 rule: the customer can cancel only while `placed`.

Once F6 moves an order to `preparing`:

- F5 hides the cancel button.
- Backend returns `409` if cancellation is attempted anyway.
- This protects kitchen work and stock.

Future policies (for example, kitchen-initiated rejection or refunds) should
append their own status/history records rather than mutating past history.

### 12.5 Kitchen role

Login already returns a `role` (`employee` or `kitchen`) and the JWT carries it.
`requireRole("kitchen")` exists in `auth.middleware.ts`. `App.tsx` currently
renders a placeholder `KitchenDashboard` for kitchen accounts; F6 will replace
that placeholder with the real dashboard.

### 12.6 Shared integration checklist

- [ ] Use only `orders`, `order_items`, `order_status_history`, `items`.
- [ ] Keep prices as snapshots in `order_items`.
- [ ] Always append history on status changes.
- [ ] Keep all status writes transactional.
- [ ] Normalize legacy `PENDING` until F4 writes `placed`.
- [ ] Keep employee ownership checks in SQL (`user_id = ?`).
- [ ] Restrict kitchen status changes with `requireRole("kitchen")`.
- [ ] Invalidate React Query caches after any write if a shared cache exists.
- [ ] Keep seed scripts development-only.
- [ ] Add an F6 status endpoint before relying on the dev-only
      `setOrderStatus.ts` utility.

---

## 13. Design Decisions and Trade-offs

| Decision | Reason | Trade-off |
|---|---|---|
| Use React Query for orders | Built-in cache, polling, retries, mutations, invalidation | Extra dependency, but already used by the app |
| Use Zustand only for auth | Server state and client state kept separate | Two state systems to understand |
| Poll every 5 seconds | Simple, works over USB and plain HTTP, no server push infrastructure | Up to 5 s delay; some battery/network usage |
| Normalize legacy statuses | Avoids blocking on an F4 migration | Two alias tables (backend + frontend) must stay in sync |
| Return `404` for other users' orders | Does not reveal order existence | Cannot distinguish "missing" from "not yours" in the UI |
| Cancel only `placed` | Prevents wasting prepared food and simplify stock semantics | Customers cannot cancel after the kitchen starts |
| Transactional cancel with `FOR UPDATE` | Correct stock restoration under concurrency | Slightly more complex controller |
| Price snapshot in `order_items` | Historical totals stay correct after menu price changes | Storage duplication |
| Seed with `F5-SEED:` markers | Idempotent, identifiable, safe for dev utilities | Markers must be hidden from customers |
| In-memory fake DB for tests | Fast, deterministic, no MySQL dependency | SQL patterns must be maintained in the fake |
| Simple state navigation in `App.tsx` | Matches the existing app pattern | Not a full navigation stack; deep links are not supported |

---

## 14. Known Limitations and Future Improvements

1. **Polling, not push** — updates are near-real-time (≤5 s), not instant.
2. **No pagination** — `/orders/me` returns all orders for the user. Fine for a
   canteen, but should be paginated for very old history.
3. **Pickup codes are not guaranteed unique** — a 4-digit random code can
   collide. A future migration can add a unique constraint and retry logic.
4. **No F6 status endpoint yet** — only the cancel transition exists. Kitchen
   transitions currently require the dev-only script.
5. **F4 placement route and auth need cleanup** — see Section 11.
6. **No `orders.user_id → users.id` foreign key** — ownership is enforced by
   queries. A migration should add the FK after legacy rows are cleaned.
7. **Cart badge is still a placeholder** — `App.tsx` passes `cartCount={2}` to
   `BottomNav`; F4 should replace this with the real cart count.
8. **Status alias maps are duplicated** in backend and frontend. A shared
   package could remove the duplication.
9. **Windows long-path workaround** — `react-native-gesture-handler` was removed
   because it was unused and its native codegen exceeded Windows `MAX_PATH`. If
   gesture handling is needed later, enable Windows long paths or build from a
   shorter directory before re-adding it.
10. **Seed scripts require direct database access** — they are dev utilities,
    not API endpoints.

---

## 15. File Inventory

### Backend — created

```text
Backend/src/utils/orderStatus.ts
Backend/src/scripts/seedOrders.ts
Backend/src/scripts/setOrderStatus.ts
Backend/src/__tests__/orders.test.ts
Backend/database/orders.sql
Backend/jest.config.js
```

### Backend — modified

```text
Backend/src/controllers/order.controller.ts   (F5 list/detail/cancel + serialization)
Backend/src/routes/order.routes.ts            (F5 routes + validation)
Backend/src/middlewares/auth.middleware.ts    (AuthenticatedRequest + JWT/role middleware)
Backend/src/app.ts                            (already mounted order routes)
Backend/package.json                          (test/seed/status scripts + dependencies)
Backend/package-lock.json
Backend/README.md
Backend/.env.example
```

### Frontend — created

```text
App/src/features/orders/types.ts
App/src/features/orders/orderStatus.ts
App/src/features/orders/ordersApi.ts
App/src/features/orders/hooks/useOrders.ts
App/src/features/orders/components/OrderCard.tsx
App/src/features/orders/components/PickupCode.tsx
App/src/features/orders/components/OrderStatusTracker.tsx
App/src/features/orders/components/OrderItemsList.tsx
App/src/features/orders/__tests__/ordersApi.test.ts
App/src/features/orders/__tests__/orderStatus.test.ts
App/src/features/orders/__tests__/components.test.tsx
App/src/screens/MyOrdersScreen.tsx
App/src/screens/OrderDetailsScreen.tsx
```

### Frontend — modified

```text
App/App.tsx                    (QueryClientProvider + F5 screen wiring)
App/package.json               (removed unused gesture-handler)
App/package-lock.json
App/README.md
App/android/gradle.properties  (reduced JVM memory for local builds)
```

### Frontend — local only, git-ignored

```text
App/android/local.properties   (sdk.dir)
```

### Database — shared, not duplicated

```text
chaibreak.users
chaibreak.otp_codes
chaibreak.items
chaibreak.orders
chaibreak.order_items
chaibreak.order_status_history
```

---

## 16. Summary

F5 follows a clean separation:

- **Backend** owns authentication, ownership, SQL, transactions, status
  normalization, stock restoration, and history.
- **Frontend API layer** owns HTTP calls, response-envelope validation, and
  DTO-to-domain mapping.
- **React Query** owns server state, caching, polling, and invalidation.
- **Screens and components** own presentation only.
- **Zustand** owns the JWT/session.

The feature works today with seeded data, is verified on a physical Android
device, and is ready to consume real orders from F4 and live status changes from
F6 without changing its UI or duplicating the order data model.
