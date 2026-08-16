const pool = require("../config/db");

// =====================================
// CREATE PRODUCT
// =====================================

const createProduct = async (product) => {

    const sql = `
        INSERT INTO products
        (
            product_id,
            product_name,
            category,
            price,
            cost,
            expiry_date
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(sql, [
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
// GET ALL PRODUCTS
// =====================================

const getProducts = async () => {

    const [rows] = await pool.execute(
        "SELECT * FROM products ORDER BY created_at DESC"
    );

    return rows;
};


// =====================================
// GET PRODUCT BY ID
// =====================================

const getProductById = async (productId) => {

    const [rows] = await pool.execute(
        "SELECT * FROM products WHERE product_id = ?",
        [productId]
    );

    return rows[0];
};


// =====================================
// EXPORT
// =====================================

module.exports = {
    createProduct,
    getProducts,
    getProductById
};