const pool = require("../config/db");

// =====================================
// GET PRODUCT RECOMMENDATIONS
// =====================================

const getRecommendations = async () => {

    const [rows] = await pool.execute(`
        SELECT
            p.product_id,
            p.product_name,
            p.category,

            COALESCE(i.store_id, 'N/A') AS store_id,

            COALESCE(i.current_stock, 0) AS current_stock,
            COALESCE(i.minimum_stock, 0) AS minimum_stock,

            COALESCE(SUM(s.units_sold), 0) AS total_units_sold,

            COALESCE(
                SUM(
                    CASE
                        WHEN s.sale_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                        THEN s.units_sold
                        ELSE 0
                    END
                ),
                0
            ) AS units_last_7_days,

            COALESCE(
                SUM(
                    CASE
                        WHEN s.sale_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                        THEN s.units_sold
                        ELSE 0
                    END
                ),
                0
            ) AS units_last_30_days

        FROM products p

        LEFT JOIN inventory i
            ON p.product_id = i.product_id

        LEFT JOIN sales s
            ON p.product_id = s.product_id

        GROUP BY
            p.product_id,
            p.product_name,
            p.category,
            i.store_id,
            i.current_stock,
            i.minimum_stock

        ORDER BY total_units_sold DESC
    `);

    return rows.map(product => {

        const currentStock = Number(product.current_stock);
        const minimumStock = Number(product.minimum_stock);
        const unitsLast7Days = Number(product.units_last_7_days);
        const unitsLast30Days = Number(product.units_last_30_days);

        // Average daily demand based on last 30 days
        const averageDailyDemand =
            unitsLast30Days / 30;

        // Estimated demand for next 7 days
        const predictedDemand =
            Math.ceil(averageDailyDemand * 7);

        // Safety stock
        const safetyStock =
            Math.max(minimumStock, Math.ceil(averageDailyDemand * 3));

        // Recommended reorder quantity
        const requiredStock =
            predictedDemand + safetyStock;

        const reorderQuantity =
            Math.max(0, requiredStock - currentStock);

        let action;
        let priority;
        let reason;

        if (currentStock <= 0) {

            action = "URGENT REORDER";
            priority = "HIGH";
            reason = "Product is out of stock";

        } else if (currentStock <= minimumStock) {

            action = "REORDER";
            priority = "HIGH";
            reason = "Current stock is below minimum stock level";

        } else if (
            predictedDemand > currentStock
        ) {

            action = "REORDER";
            priority = "MEDIUM";
            reason = "Predicted demand may exceed available stock";

        } else {

            action = "NO REORDER";
            priority = "LOW";
            reason = "Current stock is sufficient";
        }

        return {
            product_id: product.product_id,
            product_name: product.product_name,
            category: product.category,
            store_id: product.store_id,

            current_stock: currentStock,
            minimum_stock: minimumStock,

            total_units_sold:
                Number(product.total_units_sold),

            units_last_7_days:
                unitsLast7Days,

            units_last_30_days:
                unitsLast30Days,

            average_daily_demand:
                Number(averageDailyDemand.toFixed(2)),

            predicted_7_day_demand:
                predictedDemand,

            safety_stock:
                safetyStock,

            reorder_quantity:
                reorderQuantity,

            action,
            priority,
            reason
        };
    });
};


// =====================================
// GET SINGLE PRODUCT RECOMMENDATION
// =====================================

const getRecommendationByProduct = async (productId) => {

    const recommendations =
        await getRecommendations();

    return recommendations.find(
        item => item.product_id === productId
    );
};


module.exports = {
    getRecommendations,
    getRecommendationByProduct
};