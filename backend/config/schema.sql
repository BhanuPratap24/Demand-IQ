CREATE DATABASE IF NOT EXISTS demandiq;
USE demandiq;

-- ---------- STORES ----------
CREATE TABLE IF NOT EXISTS stores (
    store_id     VARCHAR(10)  PRIMARY KEY,
    region       VARCHAR(50)
);

-- ---------- PRODUCTS ----------
CREATE TABLE IF NOT EXISTS products (
    product_id    VARCHAR(10)   PRIMARY KEY,
    product_name  VARCHAR(150)  NOT NULL,
    category      VARCHAR(50),
    price         DECIMAL(10,2),
    cost          DECIMAL(10,2),
    expiry_date   DATE          NULL,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ---------- INVENTORY ----------
-- NOTE: primary key column is named `id` (not `inventory_id`) because
-- inventoryModel.js's updateStock() runs `WHERE id = ?`.
CREATE TABLE IF NOT EXISTS inventory (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    product_id     VARCHAR(10) NOT NULL,
    store_id       VARCHAR(10) NOT NULL,
    current_stock  INT NOT NULL DEFAULT 0,
    minimum_stock  INT NOT NULL DEFAULT 10,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uniq_product_store (product_id, store_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id)   REFERENCES stores(store_id)     ON DELETE CASCADE
);

-- ---------- SALES ----------
-- NOTE: primary key column is named `id` (not `sale_id`) because
-- salesModel.js's getSales()/getSalesByProduct()/getSalesByStore() all
-- run `ORDER BY sale_date DESC, id DESC`.
CREATE TABLE IF NOT EXISTS sales (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    product_id          VARCHAR(10) NOT NULL,
    store_id            VARCHAR(10) NOT NULL,
    sale_date           DATE NOT NULL,
    units_sold          INT NOT NULL,
    selling_price        DECIMAL(10,2) NOT NULL,   -- price actually charged (after discount consideration if any)
    discount             DECIMAL(5,2)  DEFAULT 0,
    competitor_pricing   DECIMAL(10,2),
    weather_condition    VARCHAR(20),
    seasonality          VARCHAR(20),               -- Festival / Normal / Off-Season
    holiday_promotion    TINYINT(1) DEFAULT 0,
    revenue              DECIMAL(12,2),
    profit                DECIMAL(12,2),
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id)   REFERENCES stores(store_id)     ON DELETE CASCADE,
    INDEX idx_sales_date            (sale_date),
    INDEX idx_sales_product_store   (product_id, store_id)
);

-- ---------- CUSTOMERS (matches authController.js exactly) ----------
CREATE TABLE IF NOT EXISTS customers (
    customer_id     INT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    phone           VARCHAR(20),
    password_hash   VARCHAR(255) NOT NULL,
    city            VARCHAR(100),
    address         VARCHAR(255),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);