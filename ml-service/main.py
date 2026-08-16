from flask import Flask, request, jsonify
import logging

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
    
    Expected JSON:
    {
        "Date": "YYYY-MM-DD",
        "Store ID": "S001",
        "Product ID": "P001",
        "Category": "Groceries",
        "Price": 100,
        "Cost": 50,
        "Inventory Level": 10,
        ...
    }
    """

    try:
        # Get JSON data
        data = request.get_json()

        if not data:
            logger.warning("No JSON data received in request")
            return jsonify({
                "status": "error",
                "code": 400,
                "message": "No JSON data received"
            }), 400

        logger.info(f"Prediction request for product: {data.get('Product ID', 'unknown')}")

        # Validate required fields
        required_fields = ["Product ID", "Inventory Level"]
        missing_fields = [
            field for field in required_fields if field not in data
        ]

        if missing_fields:
            logger.warning(f"Missing required fields: {missing_fields}")
            return jsonify({
                "status": "error",
                "code": 400,
                "message": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400

        # Run prediction + recommendation
        result = analyze_inventory(data)

        logger.info(f"✓ Prediction successful for {data.get('Product ID')}")

        # Return result
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
# BATCH PREDICTION (Optional)
# =========================================================

@app.route("/predict-batch", methods=["POST"])
def predict_batch():
    """
    Predict demand for multiple products.
    
    Expected JSON: List of product objects
    [
        { "Product ID": "P001", "Inventory Level": 10, ... },
        { "Product ID": "P002", "Inventory Level": 20, ... }
    ]
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
                result = analyze_inventory(product_data)
                results.append({
                    "product_id": product_data.get("Product ID"),
                    "status": "success",
                    "data": result
                })
            except Exception as e:
                logger.error(f"Batch prediction error: {str(e)}")
                results.append({
                    "product_id": product_data.get("Product ID"),
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

    logger.info("\n" + "="*50)
    logger.info("      DEMANDIQ ML SERVICE STARTING")
    logger.info("="*50)
    logger.info("Server running on: http://127.0.0.1:5000")
    logger.info("="*50 + "\n")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True,
        use_reloader=True
    )
