import os
import pandas as pd
import numpy as np
import joblib

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline

from sklearn.ensemble import RandomForestRegressor

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

from xgboost import XGBRegressor


# =========================================================
# 1. PATHS
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "DemandIQ_Dataset.csv"
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "models"
)

os.makedirs(MODEL_DIR, exist_ok=True)


# =========================================================
# 2. LOAD DATA
# =========================================================

print("\nLoading dataset...")

if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(
        f"Dataset not found: {DATA_PATH}"
    )

if os.path.getsize(DATA_PATH) == 0:
    raise ValueError(
        f"Dataset file is empty: {DATA_PATH}"
    )

df = pd.read_csv(DATA_PATH)

print("Dataset shape:", df.shape)

print("\nColumns:")
print(df.columns.tolist())


# =========================================================
# 3. CLEAN DATA
# =========================================================

print("\nCleaning data...")

df["Date"] = pd.to_datetime(
    df["Date"],
    errors="coerce"
)

df = df.drop_duplicates()

df = df.dropna(
    subset=["Date", "Units Sold"]
)

df = df.sort_values(
    ["Store ID", "Product ID", "Date"]
).reset_index(drop=True)

print("After cleaning:", df.shape)


# =========================================================
# 4. DATE FEATURES
# =========================================================

print("\nCreating date features...")

df["Month"] = df["Date"].dt.month
df["Year"] = df["Date"].dt.year
df["DayOfWeek"] = df["Date"].dt.dayofweek

df["IsWeekend"] = (
    df["DayOfWeek"] >= 5
).astype(int)


# =========================================================
# 5. DEMAND HISTORY FEATURES
# =========================================================

print("\nCreating demand history features...")


# ---------------------------------------------------------
# Previous available sales
# ---------------------------------------------------------

df["Units_Sold_Lag1"] = (
    df.groupby(
        ["Store ID", "Product ID"]
    )["Units Sold"]
    .shift(1)
)


# ---------------------------------------------------------
# Previous 7 available sales average
# ---------------------------------------------------------

df["Units_Sold_RollingMean7"] = (
    df.groupby(
        ["Store ID", "Product ID"]
    )["Units Sold"]
    .transform(
        lambda x:
        x.shift(1)
        .rolling(
            window=7,
            min_periods=1
        )
        .mean()
    )
)


# =========================================================
# 6. TIME-BASED TRAIN TEST SPLIT
# =========================================================

print("\nCreating time-based train/test split...")

df_sorted = df.sort_values(
    "Date"
).reset_index(drop=True)

split_point = int(
    len(df_sorted) * 0.80
)

train_df = df_sorted.iloc[
    :split_point
].copy()

test_df = df_sorted.iloc[
    split_point:
].copy()

print(
    "Training rows:",
    len(train_df)
)

print(
    "Testing rows :",
    len(test_df)
)


# =========================================================
# 7. STORE-PRODUCT AVERAGE DEMAND
# =========================================================

print(
    "\nCreating Store-Product average demand..."
)


# ONLY TRAIN DATA
# Prevent data leakage

store_product_avg = (
    train_df
    .groupby(
        ["Store ID", "Product ID"]
    )["Units Sold"]
    .mean()
)

global_avg = (
    train_df["Units Sold"].mean()
)


# Training mapping

train_df[
    "StoreProduct_AvgDemand"
] = (
    train_df.set_index(
        ["Store ID", "Product ID"]
    )
    .index
    .map(store_product_avg)
)


# Testing mapping

test_df[
    "StoreProduct_AvgDemand"
] = (
    test_df.set_index(
        ["Store ID", "Product ID"]
    )
    .index
    .map(store_product_avg)
)


# Unknown combinations use global average

test_df[
    "StoreProduct_AvgDemand"
] = test_df[
    "StoreProduct_AvgDemand"
].fillna(global_avg)


# =========================================================
# 8. FILL LAG FEATURE MISSING VALUES
# =========================================================

median_demand = (
    train_df["Units Sold"].median()
)

for column in [
    "Units_Sold_Lag1",
    "Units_Sold_RollingMean7"
]:

    train_df[column] = (
        train_df[column]
        .fillna(median_demand)
    )

    test_df[column] = (
        test_df[column]
        .fillna(median_demand)
    )


# =========================================================
# 9. FEATURES
# =========================================================

TARGET = "Units Sold"


CATEGORICAL_FEATURES = [
    "Store ID",
    "Product ID",
    "Category",
    "Region",
    "Weather Condition",
    "Seasonality"
]


NUMERIC_FEATURES = [
    "Price",
    "Discount",
    "Cost",
    "Competitor Pricing",
    "Holiday/Promotion",
    "Month",
    "Year",
    "DayOfWeek",
    "IsWeekend",
    "Inventory Level",

    # New forecasting features
    "Units_Sold_Lag1",
    "Units_Sold_RollingMean7",
    "StoreProduct_AvgDemand"
]


FEATURES = (
    CATEGORICAL_FEATURES
    + NUMERIC_FEATURES
)


X_train = train_df[FEATURES]

y_train = train_df[TARGET]

X_test = test_df[FEATURES]

y_test = test_df[TARGET]


# =========================================================
# 10. PREPROCESSOR
# =========================================================

preprocessor = ColumnTransformer(
    transformers=[

        (
            "categorical",
            OneHotEncoder(
                handle_unknown="ignore",
                sparse_output=False
            ),
            CATEGORICAL_FEATURES
        ),

        (
            "numeric",
            "passthrough",
            NUMERIC_FEATURES
        )
    ]
)


# =========================================================
# 11. RANDOM FOREST
# =========================================================

print(
    "\nTraining Random Forest..."
)

rf_model = RandomForestRegressor(

    n_estimators=300,

    max_depth=None,

    min_samples_split=2,

    min_samples_leaf=1,

    random_state=42,

    n_jobs=-1
)


rf_pipeline = Pipeline([

    (
        "preprocessor",
        preprocessor
    ),

    (
        "model",
        rf_model
    )
])


rf_pipeline.fit(
    X_train,
    y_train
)


rf_predictions = (
    rf_pipeline
    .predict(X_test)
)

rf_predictions = np.clip(
    rf_predictions,
    0,
    None
)


# =========================================================
# 12. RANDOM FOREST METRICS
# =========================================================

rf_mae = mean_absolute_error(
    y_test,
    rf_predictions
)

rf_rmse = np.sqrt(
    mean_squared_error(
        y_test,
        rf_predictions
    )
)

rf_r2 = r2_score(
    y_test,
    rf_predictions
)


print(
    "\n=============================="
)

print(
    "RANDOM FOREST RESULTS"
)

print(
    "=============================="
)

print(
    f"MAE  : {rf_mae:.4f}"
)

print(
    f"RMSE : {rf_rmse:.4f}"
)

print(
    f"R2   : {rf_r2:.4f}"
)


# =========================================================
# 13. XGBOOST
# =========================================================

print(
    "\nTraining XGBoost..."
)


xgb_model = XGBRegressor(

    n_estimators=500,

    learning_rate=0.05,

    max_depth=8,

    subsample=0.8,

    colsample_bytree=0.8,

    objective="reg:squarederror",

    random_state=42,

    n_jobs=-1
)


xgb_pipeline = Pipeline([

    (
        "preprocessor",
        preprocessor
    ),

    (
        "model",
        xgb_model
    )
])


xgb_pipeline.fit(
    X_train,
    y_train
)


xgb_predictions = (
    xgb_pipeline
    .predict(X_test)
)

xgb_predictions = np.clip(
    xgb_predictions,
    0,
    None
)


# =========================================================
# 14. XGBOOST METRICS
# =========================================================

xgb_mae = mean_absolute_error(
    y_test,
    xgb_predictions
)

xgb_rmse = np.sqrt(
    mean_squared_error(
        y_test,
        xgb_predictions
    )
)

xgb_r2 = r2_score(
    y_test,
    xgb_predictions
)


print(
    "\n=============================="
)

print(
    "XGBOOST RESULTS"
)

print(
    "=============================="
)

print(
    f"MAE  : {xgb_mae:.4f}"
)

print(
    f"RMSE : {xgb_rmse:.4f}"
)

print(
    f"R2   : {xgb_r2:.4f}"
)


# =========================================================
# 15. BASELINE
# =========================================================

print(
    "\nCalculating baseline..."
)

baseline_predictions = np.full(
    len(y_test),
    y_train.mean()
)


baseline_mae = mean_absolute_error(
    y_test,
    baseline_predictions
)

baseline_rmse = np.sqrt(
    mean_squared_error(
        y_test,
        baseline_predictions
    )
)

baseline_r2 = r2_score(
    y_test,
    baseline_predictions
)


print(
    "\n=============================="
)

print(
    "BASELINE RESULTS"
)

print(
    "=============================="
)

print(
    f"MAE  : {baseline_mae:.4f}"
)

print(
    f"RMSE : {baseline_rmse:.4f}"
)

print(
    f"R2   : {baseline_r2:.4f}"
)


# =========================================================
# 16. SELECT BEST MODEL
# =========================================================

if xgb_mae < rf_mae:

    best_model = xgb_pipeline

    best_model_name = "XGBoost"

    best_predictions = (
        xgb_predictions
    )

    best_mae = xgb_mae

    best_rmse = xgb_rmse

    best_r2 = xgb_r2

else:

    best_model = rf_pipeline

    best_model_name = (
        "Random Forest"
    )

    best_predictions = (
        rf_predictions
    )

    best_mae = rf_mae

    best_rmse = rf_rmse

    best_r2 = rf_r2


# =========================================================
# 17. SAVE MODEL
# =========================================================

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "demand_model.pkl"
)


joblib.dump(
    best_model,
    MODEL_PATH
)


print(
    "\n==================================="
)

print(
    "BEST MODEL"
)

print(
    "==================================="
)

print(
    "Model :",
    best_model_name
)

print(
    f"MAE   : {best_mae:.4f}"
)

print(
    f"RMSE  : {best_rmse:.4f}"
)

print(
    f"R2    : {best_r2:.4f}"
)

print(
    "\nModel saved at:"
)

print(
    MODEL_PATH
)


# =========================================================
# 18. PREDICTION COMPARISON
# =========================================================

comparison = test_df[
    [
        "Date",
        "Store ID",
        "Product ID",
        "Units Sold"
    ]
].copy()


comparison[
    "Predicted Demand"
] = best_predictions


comparison[
    "Prediction Error"
] = (
    comparison["Units Sold"]
    -
    comparison["Predicted Demand"]
)


print(
    "\nSample Predictions:"
)

print(
    comparison.head(20)
)


# =========================================================
# 19. SAVE PREDICTIONS
# =========================================================

prediction_path = os.path.join(
    MODEL_DIR,
    "test_predictions.csv"
)


comparison.to_csv(
    prediction_path,
    index=False
)


print(
    "\nPredictions saved at:"
)

print(
    prediction_path
)


# =========================================================
# 20. FEATURE IMPORTANCE
# =========================================================

print(
    "\nTop Model Features:"
)

if best_model_name == "XGBoost":

    trained_model = (
        best_model.named_steps["model"]
    )

else:

    trained_model = (
        best_model.named_steps["model"]
    )


# Get transformed feature names

transformed_names = (
    best_model
    .named_steps["preprocessor"]
    .get_feature_names_out()
)


importance_df = pd.DataFrame({

    "Feature": transformed_names,

    "Importance":
        trained_model.feature_importances_

})


importance_df = (
    importance_df
    .sort_values(
        "Importance",
        ascending=False
    )
    .head(20)
)


print(
    importance_df.to_string(
        index=False
    )
)


# =========================================================
# DONE
# =========================================================

print(
    "\n==================================="
)

print(
    "DEMANDIQ TRAINING COMPLETED"
)

print(
    "==================================="
)