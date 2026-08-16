const pool = require("../config/db");

// =====================================
// CREATE SALE
// =====================================

const createSale = async (sale) => {

    const [productRows] = await pool.execute(
        "SELECT cost FROM products WHERE product_id = ?",
        [sale.product_id]
    );

    if (productRows.length === 0) {
        throw new Error("Product not found");
    }

    const cost = Number(productRows[0].cost || 0);
    const unitsSold = Number(sale.units_sold || 0);
    const sellingPrice = Number(sale.selling_price || 0);

    const revenue = unitsSold * sellingPrice;
    const profit = revenue - (unitsSold * cost);

    const sql = `
        INSERT INTO sales
        (
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

    const [result] = await pool.execute(sql, [
        sale.product_id,
        sale.store_id || null,
        sale.sale_date,
        unitsSold,
        sellingPrice,
        revenue,
        profit
    ]);

    return {
        insertId: result.insertId,
        revenue,
        profit
    };
};


// =====================================
// GET ALL SALES
// =====================================

const getSales = async () => {

    const [rows] = await pool.execute(`
        SELECT *
        FROM sales
        ORDER BY sale_date DESC, id DESC
    `);

    return rows;
};


// =====================================
// GET SALES BY PRODUCT
// =====================================

const getSalesByProduct = async (productId) => {

    const [rows] = await pool.execute(`
        SELECT *
        FROM sales
        WHERE product_id = ?
        ORDER BY sale_date DESC, id DESC
    `, [productId]);

    return rows;
};


// =====================================
// GET SALES BY STORE
// =====================================

const getSalesByStore = async (storeId) => {

    const [rows] = await pool.execute(`
        SELECT *
        FROM sales
        WHERE store_id = ?
        ORDER BY sale_date DESC, id DESC
    `, [storeId]);

    return rows;
};


module.exports = {
    createSale,
    getSales,
    getSalesByProduct,
    getSalesByStore
};