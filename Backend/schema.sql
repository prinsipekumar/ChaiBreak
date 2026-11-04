-- 1. Store Menu Catalog Items
CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price_rupees INT NOT NULL, -- Fixed name and changed from DECIMAL to INT
    stock_left INT NOT NULL DEFAULT 0 -- Aligned name to spec table layout
);

-- 2. Master Orders Table tracking checkout parameters
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_rupees INT NOT NULL, -- Fixed name and changed from DECIMAL to INT
    note TEXT, -- Aligned name to spec table layout ('note')
    status VARCHAR(50) DEFAULT 'placed', -- Aligned default to 'placed' per Page 7 rules
    pickup_code VARCHAR(10) NOT NULL, -- Required for feature F4 success mapping
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Mapping Relation Table tracking distinct quantities purchased
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL, -- Required by spec sheet page 8 schema
    qty INT NOT NULL, -- Fixed name from quantity to qty
    price_rupees INT NOT NULL, -- Fixed name from price_at_purchase to price_rupees as INT
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);
-- 3.5 Status History Table tracking order lifecycle (Required for F4 baseline logs)
CREATE TABLE IF NOT EXISTS order_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(50) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 4. Seed introductory store items for testing calculations
INSERT INTO items (name, price_rupees, stock_left) VALUES
('Classic Chai', 20, 100), -- Removed decimal formatting (.00)
('Masala Chai', 25, 50),
('Ginger Chai', 25, 75);