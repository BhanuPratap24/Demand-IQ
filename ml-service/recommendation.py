import os
import sys
import logging

# Allow importing predict.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from predict import predict_demand


# =========================================================
# LOGGING CONFIGURATION
# =========================================================

logger = logging.getLogger(__name__)


# =========================================================
# INVENTORY RECOMMENDATION
# =========================================================

def get_inventory_recommendation(
    predicted_demand,
    current_stock,
    safety_stock_percent=0.10
):
    """
    Generate inventory recommendation based on
    predicted demand and current inventory.
    
    Args:
        predicted_demand: Float - ML predicted demand
        current_stock: Float - current inventory level
        safety_stock_percent: Float - safety stock percentage
        
    Returns:
        Dict with recommendation details
    """

    try:
        # Convert to numbers
        predicted_demand = float(predicted_demand)
        current_stock = float(current_stock)
        safety_stock_percent = float(safety_stock_percent)

        # Safety stock
        safety_stock = predicted_demand * safety_stock_percent

        # Required stock
        required_stock = predicted_demand + safety_stock

        # Difference between required and current stock
        stock_difference = required_stock - current_stock

        # -----------------------------------------------------
        # Recommendation logic
        # -----------------------------------------------------

        if current_stock <= 0:

            recommendation = "URGENT REORDER"
            priority = "HIGH"
            reorder_quantity = max(0, round(required_stock))
            reason = "Product is out of stock"

        elif current_stock < predicted_demand:

            recommendation = "INCREASE STOCK"
            priority = "HIGH"
            reorder_quantity = max(0, round(stock_difference))
            reason = "Current inventory is lower than predicted demand"

        elif current_stock > required_stock * 1.30:

            recommendation = "REDUCE STOCK"
            priority = "LOW"
            reorder_quantity = 0
            reason = "Current inventory is significantly higher than expected demand"

        else:

            recommendation = "KEEP CURRENT STOCK"
            priority = "INFO"
            reorder_quantity = 0
            reason = "Current inventory is sufficient for expected demand"

        result = {
            "predicted_demand": round(predicted_demand, 2),
            "current_stock": current_stock,
            "safety_stock": round(safety_stock, 2),
            "required_stock": round(required_stock, 2),
            "stock_difference": round(stock_difference, 2),
            "recommendation": recommendation,
            "priority": priority,
            "reorder_quantity": reorder_quantity,
            "reason": reason
        }

        logger.info(f"Recommendation generated: {recommendation}")
        return result

    except Exception as e:
        logger.error(f"Error generating recommendation: {str(e)}")
        raise ValueError(f"Recommendation generation error: {str(e)}")


# =========================================================
# COMPLETE AI RECOMMENDATION
# =========================================================

def analyze_inventory(product_data):
    """
    Predict demand and generate inventory recommendation.
    
    Args:
        product_data: Dict with product information
        
    Returns:
        Dict with prediction and recommendation
        
    Raises:
        ValueError: If analysis fails
    """

    try:
        if not product_data:
            raise ValueError("Empty product data")

        logger.info(f"Analyzing inventory for product: {product_data.get('Product ID', 'unknown')}")

        # Get current inventory
        current_stock = float(
            product_data.get("Inventory Level", 0)
        )

        # Predict demand
        try:
            prediction = predict_demand(product_data)
            predicted_demand = float(prediction[0])
            logger.info(f"✓ Demand predicted: {predicted_demand} units")

        except Exception as pred_error:
            logger.warning(f"Prediction failed, using fallback: {str(pred_error)}")
            # Fallback: use simple heuristic if ML fails
            predicted_demand = max(10, current_stock * 0.5)

        # Generate recommendation
        recommendation = get_inventory_recommendation(
            predicted_demand,
            current_stock
        )

        return recommendation

    except Exception as e:
        logger.error(f"Inventory analysis failed: {str(e)}", exc_info=True)
        raise ValueError(f"Analysis error: {str(e)}")



# =========================================================
# TEST
# =========================================================

if __name__ == "__main__":

    sample_product = {

        "Date": "2023-07-01",

        "Store ID": "S014",

        "Product ID": "P036",

        "Category": "Groceries",

        "Region": "North",

        "Price": 50,

        "Discount": 5,

        "Cost": 30,

        "Competitor Pricing": 52,

        "Weather Condition": "Rainy",

        "Seasonality": "Monsoon",

        "Holiday/Promotion": 1,

        "Inventory Level": 70,

        "Units_Sold_Lag1": 120,

        "Units_Sold_RollingMean7": 115,

        "StoreProduct_AvgDemand": 125
    }

    result = analyze_inventory(
        sample_product
    )

    print("\n===================================")
    print("      DEMANDIQ AI RECOMMENDATION")
    print("===================================")

    print(
        "Product:",
        sample_product["Product ID"]
    )

    print(
        "Store:",
        sample_product["Store ID"]
    )

    print(
        "Predicted Demand:",
        result["predicted_demand"],
        "units"
    )

    print(
        "Current Stock:",
        result["current_stock"],
        "units"
    )

    print(
        "Safety Stock:",
        result["safety_stock"],
        "units"
    )

    print(
        "Required Stock:",
        result["required_stock"],
        "units"
    )

    print(
        "-----------------------------------"
    )

    print(
        "Recommendation:",
        result["recommendation"]
    )

    print(
        "Reorder Quantity:",
        result["reorder_quantity"],
        "units"
    )

    print(
        "Reason:",
        result["reason"]
    )

    print(
        "==================================="
    )