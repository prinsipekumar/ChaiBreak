-- 1. Store Menu Catalog Items (Checked with FOR UPDATE row locks in F4)
CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price_rupees DECIMAL(10, 2) NOT NULL,
    stock_left INT NOT NULL DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE
);

-- 2. Master Orders Table tracking checkout parameters
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    status VARCHAR(50) DEFAULT 'placed',
    total_rupees DECIMAL(10, 2) NOT NULL,
    note TEXT,
    pickup_code VARCHAR(4) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Mapping Relation Table tracking distinct quantities purchased
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    price_rupees DECIMAL(10, 2) NOT NULL,
    qty INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id)
);

-- 4. Order Status History Table
CREATE TABLE IF NOT EXISTS order_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    changed_by INT,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Seed introductory store items for testing calculations
INSERT INTO items (name, price_rupees, stock_left, is_available) VALUES 
('Classic Chai', 20.00, 100, TRUE),
('Masala Chai', 25.00, 50, TRUE),
('Ginger Chai', 25.00, 75, TRUE);