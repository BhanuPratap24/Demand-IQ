import os
import joblib
import pandas as pd
import numpy as np
import logging


# =========================================================
# LOGGING CONFIGURATION
# =========================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# =========================================================
# PATH
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "demand_model.pkl"
)


# =========================================================
# LOAD TRAINED MODEL
# =========================================================

try:
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Trained model not found: {MODEL_PATH}"
        )

    model = joblib.load(MODEL_PATH)
    logger.info("✓ DemandIQ model loaded successfully!")

except Exception as e:
    logger.error(f"✗ Failed to load model: {str(e)}")
    raise


# =========================================================
# FEATURE VALIDATION
# =========================================================

REQUIRED_FEATURES = {
    "categorical": [
        "Store ID",
        "Product ID",
        "Category",
        "Region",
        "Weather Condition",
        "Seasonality"
    ],
    "numeric": [
        "Price",
        "Discount",
        "Cost",
        "Competitor Pricing",
        "Holiday/Promotion",
        "Inventory Level",
        "Units_Sold_Lag1",
        "Units_Sold_RollingMean7",
        "StoreProduct_AvgDemand"
    ],
    "date": ["Date"]
}


def validate_features(data):
    """Validate that input data has required features."""
    missing_features = []

    for feature in REQUIRED_FEATURES["date"] + REQUIRED_FEATURES["categorical"]:
        if feature not in data.columns:
            missing_features.append(feature)

    if missing_features:
        logger.warning(f"Missing features: {missing_features}")

    return len(missing_features) == 0


# =========================================================
# PREDICT DEMAND
# =========================================================

def predict_demand(data):
    """
    Predict product demand using the trained XGBoost/Random
    Forest pipeline.
    
    Args:
        data: dict, list, or DataFrame with product features
        
    Returns:
        numpy array with predicted demand values
        
    Raises:
        TypeError: If input format is invalid
        ValueError: If prediction fails
    """

    try:
        # Convert input into DataFrame
        if isinstance(data, dict):
            data = pd.DataFrame([data])
            logger.info(f"Converted dict to DataFrame (1 row)")

        elif isinstance(data, list):
            data = pd.DataFrame(data)
            logger.info(f"Converted list to DataFrame ({len(data)} rows)")

        elif isinstance(data, pd.DataFrame):
            logger.info(f"Received DataFrame ({len(data)} rows)")

        else:
            raise TypeError(
                "Input must be a dictionary, list of dictionaries, "
                "or pandas DataFrame."
            )

        # Store original data shape for logging
        original_rows = len(data)

        # -----------------------------------------------------
        # Date conversion
        # -----------------------------------------------------

        if "Date" in data.columns:
            try:
                data["Date"] = pd.to_datetime(
                    data["Date"],
                    errors="coerce"
                )

                data["Month"] = data["Date"].dt.month
                data["Year"] = data["Date"].dt.year
                data["DayOfWeek"] = data["Date"].dt.dayofweek
                data["IsWeekend"] = (
                    data["DayOfWeek"] >= 5
                ).astype(int)

                logger.info("✓ Date features extracted")

            except Exception as e:
                logger.error(f"✗ Date conversion failed: {str(e)}")
                raise ValueError(f"Date processing error: {str(e)}")
        else:
            logger.warning("⚠ 'Date' column not found, setting default date")
            data["Date"] = pd.to_datetime(
                pd.Timestamp.now().strftime("%Y-%m-%d")
            )
            data["Month"] = data["Date"].dt.month
            data["Year"] = data["Date"].dt.year
            data["DayOfWeek"] = data["Date"].dt.dayofweek
            data["IsWeekend"] = 0

        # -----------------------------------------------------
        # Fill missing forecasting features
        # -----------------------------------------------------

        feature_defaults = {
            "Units_Sold_Lag1": 0,
            "Units_Sold_RollingMean7": 0,
            "StoreProduct_AvgDemand": 0
        }

        for feature, default_value in feature_defaults.items():
            if feature not in data.columns:
                logger.warning(
                    f"⚠ {feature} not found, using default: {default_value}"
                )
                data[feature] = default_value
            else:
                # Fill NaN values
                data[feature] = pd.to_numeric(
                    data[feature],
                    errors="coerce"
                ).fillna(default_value)

        # -----------------------------------------------------
        # Validate features
        # -----------------------------------------------------

        if not validate_features(data):
            logger.warning("⚠ Some features are missing, using defaults")

        # -----------------------------------------------------
        # Make prediction
        # -----------------------------------------------------

        logger.info(f"Running prediction on {original_rows} sample(s)...")

        prediction = model.predict(data)

        # Demand cannot be negative
        prediction = np.clip(prediction, 0, None)

        logger.info(f"✓ Prediction successful: {prediction}")

        return prediction

    except Exception as e:
        logger.error(f"✗ Prediction failed: {str(e)}")
        raise ValueError(f"Prediction error: {str(e)}")


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


    predicted_demand = predict_demand(
        sample_product
    )


    print("\n===================================")

    print("DEMANDIQ DEMAND PREDICTION")

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
        round(
            float(predicted_demand[0]),
            2
        ),
        "units"
    )

    print(
        "==================================="
    )