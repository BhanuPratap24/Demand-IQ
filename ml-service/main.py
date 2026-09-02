from flask import Flask, request, jsonify
import logging
import os

from recommendation import analyze_inventory


# =========================================================
# LOGGING CONFIGURATION
# =========================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# =========================================================
# FLASK APP
# =========================================================

app = Flask(__name__)

# Enable CORS for frontend communication
try:
    from flask_cors import CORS
    CORS(app)
    logger.info("✓ CORS enabled")
except ImportError:
    logger.warning("⚠ flask-cors not installed, CORS disabled")


# =========================================================
# INPUT NORMALIZATION HELPER
# =========================================================

def normalize_input_data(data):
    """Normalize input dictionary keys to canonical feature names expected by the model."""
    if not isinstance(data, dict):
        return data

    def get_val(*keys, default=None):
        for k in keys:
            if k in data and data[k] is not None:
                return data[k]
        return default

    # Handle holiday/promotion string ("Yes"/"No" or 1/0)
    holiday_raw = get_val("Holiday/Promotion", "holiday_promotion", "holidayPromotion", "holiday", default=0)
    if isinstance(holiday_raw, str):
        holiday_val = 1 if holiday_raw.strip().lower() in ("yes", "1", "true", "y") else 0
    else:
        holiday_val = int(bool(holiday_raw))

    price_val = float(get_val("Price", "price", "sellingPrice", "selling_price", default=100))

    normalized = {
        "Date": get_val("Date", "date", default=None),
        "Store ID": str(get_val("Store ID", "store_id", "storeId", default="S001")),
        "Product ID": str(get_val("Product ID", "product_id", "productId", default="P001")),
        "Category": str(get_val("Category", "category", default="Groceries")),
        "Region": str(get_val("Region", "region", default="North")),
        "Price": price_val,
        "Cost": float(get_val("Cost", "cost", "costPrice", "cost_price", default=50)),
        "Discount": float(get_val("Discount", "discount", default=0)),
        "Competitor Pricing": float(get_val("Competitor Pricing", "competitor_pricing", "competitorPrice", "competitor_price", default=price_val)),
        "Weather Condition": str(get_val("Weather Condition", "weather_condition", "weatherCondition", default="Clear")),
        "Seasonality": str(get_val("Seasonality", "seasonality", default="Normal")),
        "Holiday/Promotion": holiday_val,
        "Inventory Level": float(get_val("Inventory Level", "inventory_level", "currentInventory", "current_stock", "currentStock", default=0)),
        "Units_Sold_Lag1": float(get_val("Units_Sold_Lag1", "units_sold_lag1", "unitsSoldYesterday", "units_sold_yesterday", default=0)),
        "Units_Sold_RollingMean7": float(get_val("Units_Sold_RollingMean7", "units_sold_rolling7", "rolling7DayAverage", "rolling_7_day_average", default=0)),
        "StoreProduct_AvgDemand": float(get_val("StoreProduct_AvgDemand", "store_product_avg", "storeProductAverage", "store_product_average", default=0))
    }
    return normalized


# =========================================================
# ERROR HANDLERS
# =========================================================

@app.errorhandler(400)
def bad_request(error):
    """Handle bad request errors."""
    return jsonify({
        "status": "error",
        "code": 400,
        "message": "Bad request - invalid data format",
        "details": str(error)
    }), 400


@app.errorhandler(500)
def internal_error(error):
    """Handle internal server errors."""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        "status": "error",
        "code": 500,
        "message": "Internal server error",
        "details": str(error)
    }), 500


# =========================================================
# HOME / HEALTH CHECK
# =========================================================

@app.route("/", methods=["GET"])
def home():
    """Health check endpoint."""
    logger.info("Health check requested")
    return jsonify({
        "status": "success",
        "service": "DemandIQ ML Service",
        "version": "1.0.0",
        "message": "ML API is running",
        "endpoints": {
            "health": "GET /",
            "predict": "POST /predict"
        }
    }), 200


# =========================================================
# INVENTORY ANALYSIS API
# =========================================================

@app.route("/predict", methods=["POST"])
def predict():
    """
    Predict demand and generate inventory recommendation.
    Supports canonical spaced keys, snake_case, or camelCase.
    """
    try:
        data = request.get_json()

        if not data:
            logger.warning("No JSON data received in request")
            return jsonify({
                "status": "error",
                "code": 400,
                "message": "No JSON data received"
            }), 400

        normalized_data = normalize_input_data(data)
        logger.info(f"Prediction request for product: {normalized_data.get('Product ID')}")

        # Run prediction + recommendation
        result = analyze_inventory(normalized_data)

        logger.info(f"✓ Prediction successful for {normalized_data.get('Product ID')}")

        return jsonify({
            "status": "success",
            "code": 200,
            "data": result
        }), 200

    except ValueError as ve:
        logger.error(f"Validation error: {str(ve)}")
        return jsonify({
            "status": "error",
            "code": 400,
            "message": "Data validation error",
            "details": str(ve)
        }), 400

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "code": 500,
            "message": "Prediction failed",
            "details": str(e)
        }), 500


# =========================================================
# BATCH PREDICTION
# =========================================================

@app.route("/predict-batch", methods=["POST"])
def predict_batch():
    """
    Predict demand for multiple products.
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "status": "error",
                "message": "No JSON data received"
            }), 400

        if not isinstance(data, list):
            return jsonify({
                "status": "error",
                "message": "Expected array of product objects"
            }), 400

        logger.info(f"Batch prediction request for {len(data)} products")

        results = []
        for product_data in data:
            try:
                norm_prod = normalize_input_data(product_data)
                result = analyze_inventory(norm_prod)
                results.append({
                    "product_id": norm_prod.get("Product ID"),
                    "status": "success",
                    "data": result
                })
            except Exception as e:
                logger.error(f"Batch prediction error: {str(e)}")
                results.append({
                    "product_id": product_data.get("Product ID") or product_data.get("productId"),
                    "status": "error",
                    "message": str(e)
                })

        return jsonify({
            "status": "success",
            "count": len(data),
            "results": results
        }), 200

    except Exception as e:
        logger.error(f"Batch prediction failed: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": "Batch prediction failed",
            "details": str(e)
        }), 500


# =========================================================
# RUN SERVER
# =========================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "0.0.0.0")

    logger.info("\n" + "="*50)
    logger.info("      DEMANDIQ ML SERVICE STARTING")
    logger.info("="*50)
    logger.info(f"Server running on: http://{host}:{port}")
    logger.info("="*50 + "\n")

    app.run(
        host=host,
        port=port,
        debug=False,
        use_reloader=False
    )

