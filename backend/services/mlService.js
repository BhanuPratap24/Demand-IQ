const axios = require("axios");

// =====================================
// ML SERVICE CONFIGURATION
// =====================================

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:5000";
const ML_PREDICT_ENDPOINT = `${ML_SERVICE_URL}/predict`;
const ML_HEALTH_CHECK = `${ML_SERVICE_URL}/`;

const axiosInstance = axios.create({
    baseURL: ML_SERVICE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json"
    }
});

// =====================================
// HEALTH CHECK
// =====================================

const checkMLServiceHealth = async () => {
    try {
        const response = await axiosInstance.get("/");
        return response.data?.status === "success";
    } catch (error) {
        console.warn("ML Service health check failed:", error.message);
        return false;
    }
};

// =====================================
// PREDICT DEMAND
// =====================================

const predictDemand = async (productData) => {
    try {
        // Validate input
        if (!productData || typeof productData !== "object") {
            throw new Error("Invalid product data format");
        }

        // Ensure required fields
        const requiredFields = [
            "Date",
            "Store ID",
            "Product ID",
            "Category",
            "Price",
            "Cost",
            "Inventory Level"
        ];

        const missingFields = requiredFields.filter(
            field => !(field in productData)
        );

        if (missingFields.length > 0) {
            console.warn(
                `Missing fields in ML request: ${missingFields.join(", ")}`
            );
        }

        // Set defaults for optional fields
        const enrichedData = {
            Date: productData.Date || new Date().toISOString().split("T")[0],
            "Store ID": productData["Store ID"] || "S001",
            "Product ID": productData["Product ID"] || "P001",
            Category: productData.Category || "General",
            Region: productData.Region || "North",
            Price: Number(productData.Price) || 100,
            Discount: Number(productData.Discount) || 0,
            Cost: Number(productData.Cost) || 50,
            "Competitor Pricing": Number(productData["Competitor Pricing"]) || 0,
            "Weather Condition": productData["Weather Condition"] || "Clear",
            Seasonality: productData.Seasonality || "Normal",
            "Holiday/Promotion": Number(productData["Holiday/Promotion"]) || 0,
            "Inventory Level": Number(productData["Inventory Level"]) || 0,
            Units_Sold_Lag1: Number(productData.Units_Sold_Lag1) || 0,
            Units_Sold_RollingMean7: Number(productData.Units_Sold_RollingMean7) || 0,
            StoreProduct_AvgDemand: Number(productData.StoreProduct_AvgDemand) || 0
        };

        // Call ML service
        const response = await axiosInstance.post("/predict", enrichedData);

        if (response.data?.status !== "success") {
            throw new Error(response.data?.message || "ML prediction failed");
        }

        return response.data.data;

    } catch (error) {
        console.error("ML Service Error:", error.message);
        
        // Return fallback recommendation if ML service fails
        return {
            status: "fallback",
            message: "Using fallback recommendation (ML service unavailable)",
            predicted_demand: productData["Inventory Level"] ? 0 : 10,
            current_stock: Number(productData["Inventory Level"]) || 0,
            recommendation: productData["Inventory Level"] <= 0 ? "URGENT REORDER" : "KEEP CURRENT STOCK",
            reorder_quantity: productData["Inventory Level"] <= 0 ? 50 : 0,
            reason: "ML service unavailable - using baseline calculation"
        };
    }
};

// =====================================
// BATCH PREDICT DEMAND
// =====================================

const predictDemandBatch = async (productsData) => {
    try {
        if (!Array.isArray(productsData)) {
            throw new Error("Input must be an array of product data");
        }

        const predictions = await Promise.all(
            productsData.map(product => predictDemand(product))
        );

        return predictions;

    } catch (error) {
        console.error("Batch ML Prediction Error:", error.message);
        throw error;
    }
};

// =====================================
// MODULE EXPORTS
// =====================================

module.exports = {
    checkMLServiceHealth,
    predictDemand,
    predictDemandBatch,
    ML_SERVICE_URL
};
