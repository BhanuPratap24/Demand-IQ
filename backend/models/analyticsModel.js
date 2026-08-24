const pool = require("../config/db");

// =====================================
// DASHBOARD SUMMARY (CUSTOMER-SCOPED)
// =====================================

const getSummary = async (customerId) => {
    const [products] = await pool.execute(`
        SELECT COUNT(*) AS total_products
        FROM products
        WHERE customer_id = ?
    `, [customerId]);

    const [inventory] = await pool.execute(`
        SELECT
            COALESCE(SUM(current_stock), 0) AS total_stock,
            COUNT(*) AS inventory_items
        FROM inventory
        WHERE customer_id = ?
    `, [customerId]);

    const [sales] = await pool.execute(`
        SELECT
            COALESCE(SUM(units_sold), 0) AS total_units_sold,
            COALESCE(SUM(revenue), 0) AS total_revenue,
            COALESCE(SUM(profit), 0) AS total_profit,
            COUNT(*) AS total_sales
        FROM sales
        WHERE customer_id = ?
    `, [customerId]);

    return {
        total_products: Number(products[0]?.total_products || 0),
        total_stock: Number(inventory[0]?.total_stock || 0),
        inventory_items: Number(inventory[0]?.inventory_items || 0),
        total_units_sold: Number(sales[0]?.total_units_sold || 0),
        total_sales: Number(sales[0]?.total_sales || 0),
        total_revenue: Number(sales[0]?.total_revenue || 0),
        total_profit: Number(sales[0]?.total_profit || 0)
    };
};


// =====================================
// TOP PRODUCTS (CUSTOMER-SCOPED)
// =====================================

const getTopProducts = async (customerId) => {
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
            AND p.customer_id = s.customer_id
        WHERE p.customer_id = ?
        GROUP BY
            p.product_id,
            p.product_name,
            p.category
        ORDER BY units_sold DESC
        LIMIT 10
    `, [customerId]);

    return rows;
};


// =====================================
// SALES TREND (CUSTOMER-SCOPED)
// =====================================

const getSalesTrend = async (customerId) => {
    const [rows] = await pool.execute(`
        SELECT
            sale_date,
            SUM(units_sold) AS units_sold,
            SUM(revenue) AS revenue,
            SUM(profit) AS profit
        FROM sales
        WHERE customer_id = ?
        GROUP BY sale_date
        ORDER BY sale_date ASC
    `, [customerId]);

    return rows;
};


// =====================================
// LOW STOCK PRODUCTS (CUSTOMER-SCOPED)
// =====================================

const getLowStock = async (customerId) => {
    const [rows] = await pool.execute(`
        SELECT
            i.product_id,
            p.product_name,
            p.category,
            i.store_id,
            i.current_stock,
            i.minimum_stock
        FROM inventory i
        INNER JOIN products p
            ON i.product_id = p.product_id
            AND i.customer_id = p.customer_id
        WHERE i.customer_id = ? AND i.current_stock <= i.minimum_stock
        ORDER BY i.current_stock ASC
    `, [customerId]);

    return rows;
};


// =====================================
// STORE PERFORMANCE (CUSTOMER-SCOPED)
// =====================================

const getStorePerformance = async (customerId) => {
    const [rows] = await pool.execute(`
        SELECT
            store_id,
            SUM(units_sold) AS units_sold,
            SUM(revenue) AS revenue,
            SUM(profit) AS profit,
            COUNT(*) AS sales_count
        FROM sales
        WHERE customer_id = ? AND store_id IS NOT NULL AND store_id != ''
        GROUP BY store_id
        ORDER BY revenue DESC
    `, [customerId]);

    return rows;
};


module.exports = {
    getSummary,
    getTopProducts,
    getSalesTrend,
    getLowStock,
    getStorePerformance
};