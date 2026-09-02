const pool = require("../config/db");

// =====================================
// CREATE SALE (CUSTOMER-SCOPED)
// =====================================

const createSale = async (sale) => {
    const {
        customer_id,
        product_id,
        store_id,
        sale_date,
        units_sold,
        selling_price
    } = sale;

    // 1. Verify product belongs to customer & fetch cost
    const [productRows] = await pool.execute(
        "SELECT cost, price, product_name FROM products WHERE customer_id = ? AND product_id = ?",
        [customer_id, product_id]
    );

    if (productRows.length === 0) {
        throw new Error("Product not found or does not belong to this user");
    }

    const cost = Number(productRows[0].cost || 0);
    const unitsSold = Number(units_sold || 0);
    const price = selling_price !== undefined ? Number(selling_price) : Number(productRows[0].price || 0);

    const revenue = unitsSold * price;
    const profit = revenue - (unitsSold * cost);

    // 2. Insert Sale Record
    const sql = `
        INSERT INTO sales
        (
            customer_id,
            product_id,
            store_id,
            sale_date,
            units_sold,
            selling_price,
            revenue,
            profit
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(
        `INSERT INTO sales
        (customer_id, product_id, store_id, sale_date, units_sold, selling_price, revenue, profit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            customer_id,
            product_id,
            store_id || null,
            sale_date,
            unitsSold,
            price,
            revenue,
            profit
        ]
    );

    // 3. Deduct stock from Inventory
    let stockUpdated = false;

    if (store_id && String(store_id).trim()) {
        const trimmedStore = String(store_id).trim();
        // Try exact or case-insensitive match on store_id
        const [storeResult] = await pool.execute(
            `UPDATE inventory 
             SET current_stock = GREATEST(0, current_stock - ?)
             WHERE customer_id = ? AND product_id = ? AND (store_id = ? OR LOWER(store_id) = LOWER(?))
             LIMIT 1`,
            [unitsSold, customer_id, product_id, trimmedStore, trimmedStore]
        );
        if (storeResult.affectedRows > 0) {
            stockUpdated = true;
        }
    }

    // Fallback: If no store-specific inventory matched, update the first inventory entry for this customer & product
    if (!stockUpdated) {
        const [fallbackResult] = await pool.execute(
            `UPDATE inventory 
             SET current_stock = GREATEST(0, current_stock - ?)
             WHERE customer_id = ? AND product_id = ?
             LIMIT 1`,
            [unitsSold, customer_id, product_id]
        );
        if (fallbackResult.affectedRows > 0) {
            stockUpdated = true;
        }
    }

    // If still no inventory record exists at all for this product, insert one
    if (!stockUpdated) {
        await pool.execute(
            `INSERT INTO inventory (customer_id, product_id, store_id, current_stock, minimum_stock)
             VALUES (?, ?, ?, 0, 10)`,
            [customer_id, product_id, store_id || "Store-1"]
        );
    }

    return {
        insertId: result.insertId,
        revenue,
        profit
    };
};


// =====================================
// GET ALL SALES (CUSTOMER-SCOPED)
// =====================================

const getSales = async (customerId) => {
    const [rows] = await pool.execute(
        `SELECT s.*, p.product_name, p.category
         FROM sales s
         LEFT JOIN products p 
           ON s.product_id = p.product_id AND s.customer_id = p.customer_id
         WHERE s.customer_id = ?
         ORDER BY s.sale_date DESC, s.id DESC`,
        [customerId]
    );

    return rows;
};


// =====================================
// GET SALES BY PRODUCT (CUSTOMER-SCOPED)
// =====================================

const getSalesByProduct = async (customerId, productId) => {
    const [rows] = await pool.execute(
        `SELECT s.*, p.product_name, p.category
         FROM sales s
         LEFT JOIN products p 
           ON s.product_id = p.product_id AND s.customer_id = p.customer_id
         WHERE s.customer_id = ? AND s.product_id = ?
         ORDER BY s.sale_date DESC, s.id DESC`,
        [customerId, productId]
    );

    return rows;
};


// =====================================
// GET SALES BY STORE (CUSTOMER-SCOPED)
// =====================================

const getSalesByStore = async (customerId, storeId) => {
    const [rows] = await pool.execute(
        `SELECT s.*, p.product_name, p.category
         FROM sales s
         LEFT JOIN products p 
           ON s.product_id = p.product_id AND s.customer_id = p.customer_id
         WHERE s.customer_id = ? AND s.store_id = ?
         ORDER BY s.sale_date DESC, s.id DESC`,
        [customerId, storeId]
    );

    return rows;
};


module.exports = {
    createSale,
    getSales,
    getSalesByProduct,
    getSalesByStore
};