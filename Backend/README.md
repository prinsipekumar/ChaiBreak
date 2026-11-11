# Backend

Backend API for ChaiBreak

Status: Under Development

## F5 development orders

Create the shared order tables and seed repeatable development orders:

```bash
mysql -u root -p chaibreak < database/orders.sql
npm run seed:orders
```

Seed the orders for a specific existing account when needed:

```bash
SEED_USER_PHONE=9876543210 npm run seed:orders
```

Move a seeded order through kitchen statuses for polling tests:

```bash
npm run order:status -- <orderId> preparing
npm run order:status -- <orderId> ready
npm run order:status -- <orderId> picked_up
```

These scripts refuse to run with `NODE_ENV=production`, and the status utility only accepts orders created by the F5 seed.

Run tests:

```bash
npm test
```
