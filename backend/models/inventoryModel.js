const pool = require("../config/db");

// =====================================
// GET CUSTOMER PRODUCT (CHECK OWNERSHIP)
// =====================================

const getCustomerProduct = async (customer_id, product_id) => {

    const [rows] = await pool.execute(
        `SELECT * FROM products
         WHERE customer_id = ? AND product_id = ?`,
        [customer_id, product_id]
    );

    return rows[0] || null;
};


// =====================================
// CREATE INVENTORY
// =====================================

const createInventory = async (inventory) => {

    const sql = `
        INSERT INTO inventory
        (
            customer_id,
            product_id,
            store_id,
            current_stock,
            minimum_stock
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(sql, [
        inventory.customer_id,
        inventory.product_id,
        inventory.store_id,
        inventory.current_stock ?? 0,
        inventory.minimum_stock ?? 10
    ]);

    return result;
};


// =====================================
// GET OWN INVENTORY ONLY
// =====================================

const getInventory = async (customerId) => {

    const [rows] = await pool.execute(
        `
        SELECT
            i.*,
            p.product_name,
            p.category,
            p.price,
            p.cost
        FROM inventory i
        INNER JOIN products p
            ON p.product_id = i.product_id
            AND p.customer_id = i.customer_id
        WHERE i.customer_id = ?
        ORDER BY i.updated_at DESC
        `,
        [customerId]
    );

    return rows;
};


// =====================================
// GET PRODUCT INVENTORY - OWN ONLY
// =====================================

const getInventoryByProduct = async (
    productId,
    customerId
) => {

    const [rows] = await pool.execute(
        `
        SELECT *
        FROM inventory
        WHERE customer_id = ?
        AND product_id = ?
        `,
        [
            customerId,
            productId
        ]
    );

    return rows;
};


// =====================================
// UPDATE STOCK - PURE MODEL FUNCTION
// =====================================

const updateStock = async (
    id,
    currentStock,
    minimumStock
) => {

    const sql = `
        UPDATE inventory
        SET current_stock = ?,
            minimum_stock = ?
        WHERE id = ?
    `;

    const [result] = await pool.execute(sql, [
        currentStock,
        minimumStock ?? 10,
        id
    ]);

    return result;
};


module.exports = {
    getCustomerProduct,
    createInventory,
    getInventory,
    getInventoryByProduct,
    updateStock
};