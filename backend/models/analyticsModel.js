const pool = require("../config/db");

// =====================================
// DASHBOARD SUMMARY
// =====================================

const getSummary = async () => {

    const [products] = await pool.execute(`
        SELECT COUNT(*) AS total_products
        FROM products
    `);

    const [inventory] = await pool.execute(`
        SELECT
            COALESCE(SUM(current_stock), 0) AS total_stock,
            COUNT(*) AS inventory_items
        FROM inventory
    `);

    const [sales] = await pool.execute(`
        SELECT
            COALESCE(SUM(units_sold), 0) AS total_units_sold,
            COALESCE(SUM(revenue), 0) AS total_revenue,
            COALESCE(SUM(profit), 0) AS total_profit,
            COUNT(*) AS total_sales
        FROM sales
    `);

    return {
        total_products: Number(products[0].total_products),
        total_stock: Number(inventory[0].total_stock),
        inventory_items: Number(inventory[0].inventory_items),
        total_units_sold: Number(sales[0].total_units_sold),
        total_sales: Number(sales[0].total_sales),
        total_revenue: Number(sales[0].total_revenue),
        total_profit: Number(sales[0].total_profit)
    };
};


// =====================================
// TOP PRODUCTS
// =====================================

const getTopProducts = async () => {

    const [rows] = await pool.execute(`
        SELECT
            p.product_id,
            p.product_name,
            p.category,
            COALESCE(SUM(s.units_sold), 0) AS units_sold,
            COALESCE(SUM(s.revenue), 0) AS revenue,
            COALESCE(SUM(s.profit), 0) AS profit
        FROM products p
        LEFT JOIN sales s
            ON p.product_id = s.product_id
        GROUP BY
            p.product_id,
            p.product_name,
            p.category
        ORDER BY units_sold DESC
        LIMIT 10
    `);

    return rows;
};


// =====================================
// SALES TREND
// =====================================

const getSalesTrend = async () => {

    const [rows] = await pool.execute(`
        SELECT
            sale_date,
            SUM(units_sold) AS units_sold,
            SUM(revenue) AS revenue,
            SUM(profit) AS profit
        FROM sales
        GROUP BY sale_date
        ORDER BY sale_date ASC
    `);

    return rows;
};


// =====================================
// LOW STOCK PRODUCTS
// =====================================

const getLowStock = async () => {

    const [rows] = await pool.execute(`
        SELECT
            i.product_id,
            p.product_name,
            p.category,
            i.store_id,
            i.current_stock,
            i.minimum_stock
        FROM inventory i
        LEFT JOIN products p
            ON i.product_id = p.product_id
            AND i.customer_id = p.customer_id
        WHERE i.current_stock <= i.minimum_stock
        ORDER BY i.current_stock ASC
    `);

    return rows;
};


// =====================================
// STORE PERFORMANCE
// =====================================

const getStorePerformance = async () => {

    const [rows] = await pool.execute(`
        SELECT
            store_id,
            SUM(units_sold) AS units_sold,
            SUM(revenue) AS revenue,
            SUM(profit) AS profit,
            COUNT(*) AS sales_count
        FROM sales
        WHERE store_id IS NOT NULL
        GROUP BY store_id
        ORDER BY revenue DESC
    `);

    return rows;
};


module.exports = {
    getSummary,
    getTopProducts,
    getSalesTrend,
    getLowStock,
    getStorePerformance
};