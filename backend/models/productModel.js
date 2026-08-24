const pool = require("../config/db");

// =====================================
// CREATE PRODUCT
// =====================================

const createProduct = async (product) => {

    const sql = `
        INSERT INTO products
        (
            customer_id,
            product_id,
            product_name,
            category,
            price,
            cost,
            expiry_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(sql, [
        product.customer_id,
        product.product_id,
        product.product_name,
        product.category || null,
        product.price || 0,
        product.cost || 0,
        product.expiry_date || null
    ]);

    return result;
};


// =====================================
// GET ALL PRODUCTS (BY CUSTOMER)
// =====================================

const getProducts = async (customerId) => {

    const [rows] = await pool.execute(
        "SELECT * FROM products WHERE customer_id = ? ORDER BY created_at DESC",
        [customerId]
    );

    return rows;
};


// =====================================
// GET PRODUCT BY ID (GLOBAL)
// =====================================

const getProductById = async (productId) => {

    const [rows] = await pool.execute(
        "SELECT * FROM products WHERE product_id = ?",
        [productId]
    );

    return rows[0];
};


// =====================================
// GET PRODUCT BY CUSTOMER + PRODUCT_ID
// =====================================

const getCustomerProduct = async (customerId, productId) => {

    const [rows] = await pool.execute(
        "SELECT * FROM products WHERE customer_id = ? AND product_id = ?",
        [customerId, productId]
    );

    return rows[0];
};


// =====================================
// EXPORT
// =====================================

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    getCustomerProduct
};