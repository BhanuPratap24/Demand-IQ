const analyticsModel = require("../models/analyticsModel");

// =====================================
// DASHBOARD SUMMARY
// =====================================

const getSummary = async (req, res) => {
    try {
        const customer_id = req.user.customer_id;
        const data = await analyticsModel.getSummary(customer_id);

        res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error("Analytics Summary Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch analytics summary",
            error: error.message
        });
    }
};


// =====================================
// TOP PRODUCTS
// =====================================

const getTopProducts = async (req, res) => {
    try {
        const customer_id = req.user.customer_id;
        const data = await analyticsModel.getTopProducts(customer_id);

        res.json({
            success: true,
            count: data.length,
            data
        });

    } catch (error) {
        console.error("Top Products Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch top products",
            error: error.message
        });
    }
};


// =====================================
// SALES TREND
// =====================================

const getSalesTrend = async (req, res) => {
    try {
        const customer_id = req.user.customer_id;
        const data = await analyticsModel.getSalesTrend(customer_id);

        res.json({
            success: true,
            count: data.length,
            data
        });

    } catch (error) {
        console.error("Sales Trend Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch sales trend",
            error: error.message
        });
    }
};


// =====================================
// LOW STOCK
// =====================================

const getLowStock = async (req, res) => {
    try {
        const customer_id = req.user.customer_id;
        const data = await analyticsModel.getLowStock(customer_id);

        res.json({
            success: true,
            count: data.length,
            data
        });

    } catch (error) {
        console.error("Low Stock Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch low stock products",
            error: error.message
        });
    }
};


// =====================================
// STORE PERFORMANCE
// =====================================

const getStorePerformance = async (req, res) => {
    try {
        const customer_id = req.user.customer_id;
        const data = await analyticsModel.getStorePerformance(customer_id);

        res.json({
            success: true,
            count: data.length,
            data
        });

    } catch (error) {
        console.error("Store Performance Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch store performance",
            error: error.message
        });
    }
};


module.exports = {
    getSummary,
    getTopProducts,
    getSalesTrend,
    getLowStock,
    getStorePerformance
};