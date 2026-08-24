const salesModel = require("../models/salesModel");

// =====================================
// CREATE SALE
// =====================================

const createSale = async (req, res) => {
    try {
        const customer_id = req.user.customer_id;

        const {
            product_id,
            store_id,
            sale_date,
            units_sold,
            selling_price
        } = req.body;

        // Validation
        if (
            !product_id ||
            !sale_date ||
            units_sold === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "product_id, sale_date, and units_sold are required"
            });
        }

        if (Number(units_sold) <= 0) {
            return res.status(400).json({
                success: false,
                message: "units_sold must be greater than 0"
            });
        }

        if (selling_price !== undefined && Number(selling_price) < 0) {
            return res.status(400).json({
                success: false,
                message: "selling_price cannot be negative"
            });
        }

        const result = await salesModel.createSale({
            customer_id,
            product_id,
            store_id,
            sale_date,
            units_sold: Number(units_sold),
            selling_price: selling_price !== undefined ? Number(selling_price) : undefined
        });

        res.status(201).json({
            success: true,
            message: "Sale recorded successfully and inventory updated",
            sale_id: result.insertId,
            revenue: result.revenue,
            profit: result.profit
        });

    } catch (error) {
        console.error("Create Sale Error:", error);

        if (error.message && error.message.includes("Product not found")) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to record sale",
            error: error.message
        });
    }
};


// =====================================
// GET ALL SALES
// =====================================

const getSales = async (req, res) => {
    try {
        const customer_id = req.user.customer_id;
        const data = await salesModel.getSales(customer_id);

        res.json({
            success: true,
            count: data.length,
            data
        });

    } catch (error) {
        console.error("Get Sales Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch sales",
            error: error.message
        });
    }
};


// =====================================
// GET SALES BY PRODUCT
// =====================================

const getSalesByProduct = async (req, res) => {
    try {
        const customer_id = req.user.customer_id;
        const { productId } = req.params;

        const data = await salesModel.getSalesByProduct(customer_id, productId);

        res.json({
            success: true,
            count: data.length,
            data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch product sales",
            error: error.message
        });
    }
};


// =====================================
// GET SALES BY STORE
// =====================================

const getSalesByStore = async (req, res) => {
    try {
        const customer_id = req.user.customer_id;
        const { storeId } = req.params;

        const data = await salesModel.getSalesByStore(customer_id, storeId);

        res.json({
            success: true,
            count: data.length,
            data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch store sales",
            error: error.message
        });
    }
};


module.exports = {
    createSale,
    getSales,
    getSalesByProduct,
    getSalesByStore
};