const recommendationModel =
    require("../models/recommendationModel");

const { predictDemand } =
    require("../services/mlService");


// =====================================
// ALL RECOMMENDATIONS (WITH ML)
// =====================================

const getRecommendations = async (req, res) => {

    try {

        // Get product data from database
        const baseRecommendations =
            await recommendationModel.getRecommendations();

        // Enhance with ML predictions
        const mlEnhancedRecommendations =
            await Promise.all(
                baseRecommendations.map(async (product) => {
                    try {
                        // Prepare data for ML service
                        const mlInput = {
                            Date: new Date().toISOString().split("T")[0],
                            "Store ID": product.store_id,
                            "Product ID": product.product_id,
                            Category: product.category,
                            Price: 100, // Default or from product table
                            Cost: 50,   // Default or from product table
                            Discount: 0,
                            "Competitor Pricing": 0,
                            "Weather Condition": "Clear",
                            Seasonality: "Normal",
                            "Holiday/Promotion": 0,
                            "Inventory Level": product.current_stock,
                            Units_Sold_Lag1: product.units_last_7_days,
                            Units_Sold_RollingMean7: product.average_daily_demand,
                            StoreProduct_AvgDemand: product.average_daily_demand
                        };

                        // Get ML prediction
                        const mlPrediction = await predictDemand(mlInput);

                        // Merge ML prediction with base recommendation
                        return {
                            ...product,
                            ml_predicted_demand: mlPrediction.predicted_demand,
                            ml_recommendation: mlPrediction.recommendation,
                            ml_reorder_quantity: mlPrediction.reorder_quantity,
                            ml_reason: mlPrediction.reason,
                            ml_safety_stock: mlPrediction.safety_stock,
                            ml_required_stock: mlPrediction.required_stock,
                            is_ml_available: mlPrediction.status !== "fallback"
                        };

                    } catch (mlError) {
                        console.warn(
                            `ML prediction failed for product ${product.product_id}:`,
                            mlError.message
                        );

                        // Return with fallback (use base recommendation)
                        return {
                            ...product,
                            ml_predicted_demand: null,
                            ml_recommendation: null,
                            ml_reorder_quantity: null,
                            is_ml_available: false
                        };
                    }
                })
            );

        res.json({
            success: true,
            count: mlEnhancedRecommendations.length,
            data: mlEnhancedRecommendations
        });

    } catch (error) {

        console.error(
            "Recommendation Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to generate recommendations",
            error: error.message
        });
    }
};


// =====================================
// PRODUCT RECOMMENDATION (WITH ML)
// =====================================

const getRecommendationByProduct = async (req, res) => {

    try {

        const { productId } = req.params;

        let data =
            await recommendationModel
                .getRecommendationByProduct(productId);

        if (!data) {

            return res.status(404).json({
                success: false,
                message: "Recommendation not found for product"
            });
        }

        // Enhance with ML prediction
        try {
            const mlInput = {
                Date: new Date().toISOString().split("T")[0],
                "Store ID": data.store_id,
                "Product ID": data.product_id,
                Category: data.category,
                Price: 100,
                Cost: 50,
                Discount: 0,
                "Competitor Pricing": 0,
                "Weather Condition": "Clear",
                Seasonality: "Normal",
                "Holiday/Promotion": 0,
                "Inventory Level": data.current_stock,
                Units_Sold_Lag1: data.units_last_7_days,
                Units_Sold_RollingMean7: data.average_daily_demand,
                StoreProduct_AvgDemand: data.average_daily_demand
            };

            const mlPrediction = await predictDemand(mlInput);

            data = {
                ...data,
                ml_predicted_demand: mlPrediction.predicted_demand,
                ml_recommendation: mlPrediction.recommendation,
                ml_reorder_quantity: mlPrediction.reorder_quantity,
                ml_reason: mlPrediction.reason,
                ml_safety_stock: mlPrediction.safety_stock,
                is_ml_available: mlPrediction.status !== "fallback"
            };

        } catch (mlError) {
            console.warn(
                `ML prediction failed for product ${productId}:`,
                mlError.message
            );
            data.is_ml_available = false;
        }

        res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Product Recommendation Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to generate product recommendation",
            error: error.message
        });
    }
};


module.exports = {
    getRecommendations,
    getRecommendationByProduct
};