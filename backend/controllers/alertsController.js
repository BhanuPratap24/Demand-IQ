const recommendationModel = require("../models/recommendationModel");

const getAlerts = async (req, res) => {
    try {

        const recommendations =
            await recommendationModel.getRecommendations();

        const alerts = recommendations
            .filter(item =>
                item.action !== "NO REORDER"
            )
            .map(item => ({
                product_id: item.product_id,
                product_name: item.product_name,
                category: item.category,
                store_id: item.store_id,
                current_stock: item.current_stock,
                minimum_stock: item.minimum_stock,
                predicted_7_day_demand:
                    item.predicted_7_day_demand,
                reorder_quantity:
                    item.reorder_quantity,
                action: item.action,
                priority: item.priority,
                reason: item.reason
            }));

        res.json({
            success: true,
            count: alerts.length,
            data: alerts
        });

    } catch (error) {

        console.error("Alerts Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch alerts",
            error: error.message
        });
    }
};


const getProductAlert = async (req, res) => {
    try {

        const { productId } = req.params;

        const recommendation =
            await recommendationModel
                .getRecommendationByProduct(productId);

        if (!recommendation) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (recommendation.action === "NO REORDER") {
            return res.json({
                success: true,
                alert: false,
                message: "No alert for this product",
                data: recommendation
            });
        }

        res.json({
            success: true,
            alert: true,
            data: recommendation
        });

    } catch (error) {

        console.error("Product Alert Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch product alert",
            error: error.message
        });
    }
};


module.exports = {
    getAlerts,
    getProductAlert
};