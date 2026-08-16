const inventoryModel = require("../models/inventoryModel");

// =====================================
// CREATE INVENTORY
// =====================================

const createInventory = async (req, res) => {

    try {

        const {
            product_id,
            store_id,
            current_stock,
            minimum_stock
        } = req.body;

        if (!product_id || !store_id) {
            return res.status(400).json({
                success: false,
                message: "product_id and store_id are required"
            });
        }

        const result = await inventoryModel.createInventory({
            product_id,
            store_id,
            current_stock,
            minimum_stock
        });

        res.status(201).json({
            success: true,
            message: "Inventory added successfully",
            inventory_id: result.insertId
        });

    } catch (error) {

        console.error("Create Inventory Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add inventory",
            error: error.message
        });
    }
};


// =====================================
// GET ALL INVENTORY
// =====================================

const getInventory = async (req, res) => {

    try {

        const data = await inventoryModel.getInventory();

        res.json({
            success: true,
            count: data.length,
            data: data
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Failed to fetch inventory",
            error: error.message
        });
    }
};


// =====================================
// GET INVENTORY BY PRODUCT
// =====================================

const getInventoryByProduct = async (req, res) => {

    try {

        const { productId } = req.params;

        const data =
            await inventoryModel.getInventoryByProduct(productId);

        res.json({
            success: true,
            count: data.length,
            data: data
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Failed to fetch product inventory",
            error: error.message
        });
    }
};


// =====================================
// UPDATE STOCK
// =====================================

const updateStock = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            current_stock,
            minimum_stock
        } = req.body;

        const result = await inventoryModel.updateStock(
            id,
            current_stock,
            minimum_stock
        );

        res.json({
            success: true,
            message: "Inventory updated successfully",
            affectedRows: result.affectedRows
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Failed to update inventory",
            error: error.message
        });
    }
};


module.exports = {
    createInventory,
    getInventory,
    getInventoryByProduct,
    updateStock
};