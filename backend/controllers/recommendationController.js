const recommendationModel = require("../models/recommendationModel");
const { predictDemand } = require("../services/mlService");

// =====================================
// ALL RECOMMENDATIONS (WITH ML - USER SCOPED)
// =====================================

const getRecommendations = async (req, res) => {
    try {
        const customer_id = req.user.customer_id;

        // Get product data from database scoped to customer
        const baseRecommendations = await recommendationModel.getRecommendations(customer_id);

        // Enhance with ML predictions
        const mlEnhancedRecommendations = await Promise.all(
            baseRecommendations.map(async (product) => {
                try {
                    // Prepare rich data for ML service
                    const mlInput = {
                        Date: new Date().toISOString().split("T")[0],
                        "Store ID": product.store_id || "Store-1",
                        "Product ID": product.product_id,
                        Category: product.category || "General",
                        Region: "North",
                        Price: product.price || 100,
                        Cost: product.cost || 50,
                        Discount: 0,
                        "Competitor Pricing": product.price || 100,
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
                        ml_predicted_demand: mlPrediction.predicted_demand !== undefined ? mlPrediction.predicted_demand : product.predicted_7_day_demand,
                        ml_recommendation: mlPrediction.recommendation || product.action,
                        ml_reorder_quantity: mlPrediction.reorder_quantity !== undefined ? mlPrediction.reorder_quantity : product.reorder_quantity,
                        ml_reason: mlPrediction.reason || product.reason,
                        ml_safety_stock: mlPrediction.safety_stock !== undefined ? mlPrediction.safety_stock : product.safety_stock,
                        ml_required_stock: mlPrediction.required_stock !== undefined ? mlPrediction.required_stock : (product.predicted_7_day_demand + product.safety_stock),
                        is_ml_available: mlPrediction.status !== "fallback"
                    };

                } catch (mlError) {
                    console.warn(
                        `ML prediction failed for product ${product.product_id}:`,
                        mlError.message
                    );

                    return {
                        ...product,
                        ml_predicted_demand: product.predicted_7_day_demand,
                        ml_recommendation: product.action,
                        ml_reorder_quantity: product.reorder_quantity,
                        ml_reason: product.reason,
                        ml_safety_stock: product.safety_stock,
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
        console.error("Recommendation Error:", error);

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
        const customer_id = req.user.customer_id;
        const { productId } = req.params;

        let data = await recommendationModel.getRecommendationByProduct(customer_id, productId);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Product not found in your inventory"
            });
        }

        // Enhance with ML prediction
        try {
            const mlInput = {
                Date: new Date().toISOString().split("T")[0],
                "Store ID": data.store_id || "Store-1",
                "Product ID": data.product_id,
                Category: data.category || "General",
                Region: "North",
                Price: data.price || 100,
                Cost: data.cost || 50,
                Discount: 0,
                "Competitor Pricing": data.price || 100,
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
                ml_predicted_demand: mlPrediction.predicted_demand !== undefined ? mlPrediction.predicted_demand : data.predicted_7_day_demand,
                ml_recommendation: mlPrediction.recommendation || data.action,
                ml_reorder_quantity: mlPrediction.reorder_quantity !== undefined ? mlPrediction.reorder_quantity : data.reorder_quantity,
                ml_reason: mlPrediction.reason || data.reason,
                ml_safety_stock: mlPrediction.safety_stock !== undefined ? mlPrediction.safety_stock : data.safety_stock,
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
        console.error("Product Recommendation Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to generate product recommendation",
            error: error.message
        });
    }
};


// =====================================
// DIRECT ML PREDICTION (NO DB HISTORY NEEDED)
// =====================================

const predictNow = async (req, res) => {
    try {
        const body = req.body;

        if (!body || Object.keys(body).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Product data is required in request body"
            });
        }

        // Helper to extract values from multiple key conventions (camelCase, snake_case, Spaced)
        const getVal = (...keys) => {
            for (const k of keys) {
                if (body[k] !== undefined && body[k] !== null) return body[k];
            }
            return undefined;
        };

        const price = Number(getVal("price", "Price", "sellingPrice", "selling_price")) || 100;
        const holidayRaw = getVal("holiday_promotion", "Holiday/Promotion", "holidayPromotion", "holiday");
        const holidayVal = typeof holidayRaw === "string"
            ? (["yes", "1", "true", "y"].includes(holidayRaw.trim().toLowerCase()) ? 1 : 0)
            : Number(holidayRaw || 0);

        // Build enriched input for the ML service
        const mlInput = {
            Date: getVal("date", "Date") || new Date().toISOString().split("T")[0],
            "Store ID": String(getVal("store_id", "Store ID", "storeId") || "S001"),
            "Product ID": String(getVal("product_id", "Product ID", "productId") || "P001"),
            Category: String(getVal("category", "Category") || "Groceries"),
            Region: String(getVal("region", "Region") || "North"),
            Price: price,
            Discount: Number(getVal("discount", "Discount") || 0),
            Cost: Number(getVal("cost", "Cost", "costPrice", "cost_price") || 50),
            "Competitor Pricing": Number(getVal("competitor_pricing", "Competitor Pricing", "competitorPrice", "competitor_price") || price),
            "Weather Condition": String(getVal("weather_condition", "Weather Condition", "weatherCondition") || "Clear"),
            Seasonality: String(getVal("seasonality", "Seasonality") || "Normal"),
            "Holiday/Promotion": holidayVal,
            "Inventory Level": Number(getVal("inventory_level", "Inventory Level", "currentInventory", "current_stock", "currentStock") || 0),
            Units_Sold_Lag1: Number(getVal("units_sold_lag1", "Units_Sold_Lag1", "unitsSoldYesterday", "units_sold_yesterday") || 0),
            Units_Sold_RollingMean7: Number(getVal("units_sold_rolling7", "Units_Sold_RollingMean7", "rolling7DayAverage", "rolling_7_day_average") || 0),
            StoreProduct_AvgDemand: Number(getVal("store_product_avg", "StoreProduct_AvgDemand", "storeProductAverage", "store_product_average") || 0)
        };

        const mlPrediction = await predictDemand(mlInput);

        return res.json({
            success: true,
            input: mlInput,
            prediction: mlPrediction
        });

    } catch (error) {
        console.error("Predict Now Error:", error);
        return res.status(500).json({
            success: false,
            message: "Prediction failed",
            error: error.message
        });
    }
};


module.exports = {
    getRecommendations,
    getRecommendationByProduct,
    predictNow
};