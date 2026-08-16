const pool = require("../config/db");

// =====================================
// CREATE INVENTORY
// =====================================

const createInventory = async (inventory) => {

    const sql = `
        INSERT INTO inventory
        (
            product_id,
            store_id,
            current_stock,
            minimum_stock
        )
        VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.execute(sql, [
        inventory.product_id,
        inventory.store_id,
        inventory.current_stock || 0,
        inventory.minimum_stock || 10
    ]);

    return result;
};


// =====================================
// GET ALL INVENTORY
// =====================================

const getInventory = async () => {

    const [rows] = await pool.execute(
        "SELECT * FROM inventory ORDER BY updated_at DESC"
    );

    return rows;
};


// =====================================
// GET INVENTORY BY PRODUCT
// =====================================

const getInventoryByProduct = async (productId) => {

    const [rows] = await pool.execute(
        "SELECT * FROM inventory WHERE product_id = ?",
        [productId]
    );

    return rows;
};


// =====================================
// UPDATE STOCK
// =====================================

const updateStock = async (id, currentStock, minimumStock) => {

    const sql = `
        UPDATE inventory
        SET current_stock = ?,
            minimum_stock = ?
        WHERE id = ?
    `;

    const [result] = await pool.execute(sql, [
        currentStock,
        minimumStock,
        id
    ]);

    return result;
};


module.exports = {
    createInventory,
    getInventory,
    getInventoryByProduct,
    updateStock
};