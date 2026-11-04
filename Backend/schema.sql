-- 1. Store Menu Catalog Items (Checked with FOR UPDATE row locks in F4)
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0
);

-- 2. Master Orders Table tracking the checkout parameters
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    custom_notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Mapping Relation Table tracking distinct quantities purchased
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    item_id INT REFERENCES items(id),
    quantity INT NOT NULL,
    price_at_purchase DECIMAL(10, 2) NOT NULL
);

-- Seed introductory store items for testing calculations
INSERT INTO items (name, price, stock) VALUES 
('Classic Chai', 20.00, 100),
('Masala Chai', 25.00, 50),
('Ginger Chai', 25.00, 75);