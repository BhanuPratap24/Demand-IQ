const inventoryModel = require("../models/inventoryModel");

// =====================================
// CREATE / ADD INVENTORY
// =====================================

const createInventory = async (req, res) => {
    try {

        // JWT से customer ID
        const customer_id = req.user.customer_id;

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

        const stockToAdd = Number(current_stock || 0);

        if (!Number.isFinite(stockToAdd) || stockToAdd < 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity cannot be negative"
            });
        }

        // =====================================
        // CHECK PRODUCT BELONGS TO CUSTOMER
        // =====================================

        const product =
            await inventoryModel.getCustomerProduct(
                customer_id,
                product_id
            );

        if (!product) {
            return res.status(404).json({
                success: false,
                message:
                    "Product not found for this customer. Add the product first.",
                customer_id,
                product_id
            });
        }

        // =====================================
        // CHECK EXISTING INVENTORY
        // =====================================

        const existingInventory =
            await inventoryModel.getInventoryByProduct(
                product_id,
                customer_id
            );

        const inventory = existingInventory.find(
            item => String(item.store_id) === String(store_id)
        );

        // =====================================
        // EXISTING INVENTORY
        // =====================================

        if (inventory) {

            const oldStock =
                Number(inventory.current_stock || 0);

            const newStock =
                oldStock + stockToAdd;

            await inventoryModel.updateStock(
                inventory.id,
                newStock,
                minimum_stock ?? inventory.minimum_stock
            );

            return res.status(200).json({
                success: true,
                message: "Existing product stock increased successfully",
                product_id,
                previous_stock: oldStock,
                added_quantity: stockToAdd,
                current_stock: newStock
            });
        }

        // =====================================
        // CREATE NEW INVENTORY
        // =====================================

        const result =
            await inventoryModel.createInventory({
                customer_id,
                product_id,
                store_id,
                current_stock: stockToAdd,
                minimum_stock:
                    minimum_stock === undefined
                        ? 10
                        : Number(minimum_stock)
            });

        return res.status(201).json({
            success: true,
            message: "Inventory added successfully",
            inventory_id: result.insertId,
            customer_id,
            product_id,
            current_stock: stockToAdd
        });

    } catch (error) {

        console.error(
            "Create Inventory Error:",
            error
        );

        return res.status(500).json({
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

        const customerId = req.user.customer_id;

        const data =
            await inventoryModel.getInventory(
                customerId
            );

        return res.json({
            success: true,
            count: data.length,
            data
        });

    } catch (error) {

        console.error(
            "Get Inventory Error:",
            error
        );

        return res.status(500).json({
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

        const customerId = req.user.customer_id;
        const { productId } = req.params;

        const data =
            await inventoryModel.getInventoryByProduct(
                productId,
                customerId
            );

        return res.json({
            success: true,
            count: data.length,
            data
        });

    } catch (error) {

        console.error(
            "Get Inventory By Product Error:",
            error
        );

        return res.status(500).json({
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

        if (current_stock === undefined) {
            return res.status(400).json({
                success: false,
                message: "current_stock is required"
            });
        }

        const stock = Number(current_stock);

        if (!Number.isFinite(stock) || stock < 0) {
            return res.status(400).json({
                success: false,
                message: "current_stock must be 0 or greater"
            });
        }

        const result =
            await inventoryModel.updateStock(
                id,
                stock,
                minimum_stock ?? 10
            );

        return res.json({
            success: true,
            message: "Inventory updated successfully",
            affectedRows: result.affectedRows
        });

    } catch (error) {

        console.error(
            "Update Inventory Error:",
            error
        );

        return res.status(500).json({
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