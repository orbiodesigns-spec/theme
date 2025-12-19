-- FINAL DATABASE SCHEMA (Clean Import)
-- Run this file to create tables in your ALREADY SELECTED database.
-- Usage: mysql -u user -p your_database_name < import_schema.sql

-- ==========================================
-- 1. Users Table
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone_number VARCHAR(20),
    age INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- ==========================================
-- 2. Layouts (Products) Table
-- ==========================================
CREATE TABLE IF NOT EXISTS layouts (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'master-standard'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    price_1mo DECIMAL(10, 2),
    price_3mo DECIMAL(10, 2),
    price_6mo DECIMAL(10, 2),
    price_1yr DECIMAL(10, 2),
    thumbnail_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE
);

-- ==========================================
-- 3. Transactions Table (Payments)
-- ==========================================
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(100) UNIQUE NOT NULL, -- Cashfree Order ID
    user_id BIGINT UNSIGNED NOT NULL,
    layout_id VARCHAR(50), -- What they tried to buy
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED
    payment_session_id VARCHAR(255),
    metadata TEXT, -- JSON data for product IDs, months, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_transactions_order ON transactions(order_id);

-- ==========================================
-- 4. Subscriptions (Purchases)
-- ==========================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    layout_id VARCHAR(50) NOT NULL,
    
    start_date DATETIME NOT NULL,
    expiry_date DATETIME NOT NULL,
    
    price_paid DECIMAL(10, 2) NOT NULL,
    
    -- Public Token for OBS View
    public_token VARCHAR(64) UNIQUE, 
    
    -- JSON column for saving theme customizations
    saved_theme_config JSON, 
    
    -- Session Locking
    active_session_id VARCHAR(100),
    last_heartbeat DATETIME,
    
    -- Purchase Info
    order_id VARCHAR(100),
    payment_method VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (layout_id) REFERENCES layouts(id)
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_token ON subscriptions(public_token);
CREATE INDEX idx_subscriptions_expiry ON subscriptions(expiry_date);

-- ==========================================
-- 5. Admins Table
-- ==========================================
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- 6. Coupons Table
-- ==========================================
CREATE TABLE IF NOT EXISTS coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type ENUM('PERCENT', 'FIXED') NOT NULL DEFAULT 'PERCENT',
    discount_value DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255),
    layout_id VARCHAR(50), -- NULL means applies to all layouts
    expiry_date DATETIME,
    usage_limit INT,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (layout_id) REFERENCES layouts(id) ON DELETE CASCADE
);


-- ==========================================
-- 7. Products Table (One-Time Purchases)
-- ==========================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    file_url VARCHAR(500) NOT NULL, -- External link to file (Google Drive, Dropbox, etc.)
    file_type VARCHAR(50), -- e.g., 'pdf', 'mp4', 'zip' (for display purposes)
    thumbnail_url VARCHAR(500), -- Optional thumbnail image link
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==========================================
-- 8. Product Purchases Table
-- ==========================================
CREATE TABLE IF NOT EXISTS product_purchases (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    product_id INT NOT NULL,
    price_paid DECIMAL(10, 2) NOT NULL,
    order_id VARCHAR(100), -- Links to transaction
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_product_purchases_user ON product_purchases(user_id);
CREATE INDEX idx_product_purchases_product ON product_purchases(product_id);

-- ==========================================
-- 9. Support Queries Table
-- ==========================================
CREATE TABLE IF NOT EXISTS support_queries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(200),
    message TEXT NOT NULL,
    status ENUM('PENDING', 'SOLVED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- 10. SEED DATA (Initial Layouts & Admins)
-- ==========================================
-- Use INSERT IGNORE to avoid errors if they already exist

-- Layouts
INSERT IGNORE INTO layouts (id, name, description, base_price, price_1mo, price_3mo, price_6mo, price_1yr, thumbnail_url, is_active) VALUES
('master-standard', 'Master Standard', 'The classic reliable layout for everyday streaming.', 500, 500.00, 1250.00, 2250.00, 4000.00, 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', TRUE);

-- Default Admin (orbioadmin / Himanshu@k9311995415)
-- Hash generated via bcrypt (cost 10)
INSERT IGNORE INTO admins (username, password_hash) VALUES
('orbioadmin', '$2a$10$N/WNPfvptYnAE.P4LOti0.a6xqnDG1NexjuhUfPzxKW.C6pqV2PXG');


-- ==========================================
-- 11. Settings Table
-- ==========================================
CREATE TABLE IF NOT EXISTS settings (
    key_name VARCHAR(50) PRIMARY KEY,
    value VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Default Settings
INSERT IGNORE INTO settings (key_name, value) VALUES ('registration_enabled', 'true');
