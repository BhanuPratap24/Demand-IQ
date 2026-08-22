const pool = require("../config/db");

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
            ON p.customer_id = i.customer_id
            AND p.product_id = i.product_id
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
// UPDATE STOCK - OWN DATA ONLY
// =====================================

const updateStock = async (req, res) => {

    try {

        const customer_id =
            req.user.customer_id;

        const { id } = req.params;

        const {
            current_stock,
            minimum_stock
        } = req.body;

        if (current_stock === undefined) {
            return res.status(400).json({
                success: false,
                message:
                    "current_stock is required"
            });
        }

        const result =
            await inventoryModel.updateStock(
                id,
                customer_id,
                Number(current_stock),
                minimum_stock
            );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Inventory not found or does not belong to you"
            });
        }

        return res.json({
            success: true,
            message:
                "Inventory updated successfully"
        });

    } catch (error) {

        console.error(
            "Update Stock Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update inventory"
        });
    }
};

module.exports = {
    createInventory,
    getInventory,
    getInventoryByProduct,
    updateStock
};