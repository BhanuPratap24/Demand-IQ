import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import "./App.css";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// ==========================================
// PROTECTED ROUTE COMPONENT
// ==========================================

function ProtectedRoute({ children }) {
    const token = localStorage.getItem('demandiq_token') || localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" />;
    }
    return children;
}

// ==========================================
// MAIN APP COMPONENT
// ==========================================

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!(localStorage.getItem("demandiq_token") || localStorage.getItem("token"))
  );

  const [authMode, setAuthMode] = useState("login");

  const [authForm, setAuthForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    city: "",
    address: "",
  });

  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // ==========================================
  // DASHBOARD STATE
  // ==========================================

  const [page, setPage] = useState("dashboard");

  const [summary, setSummary] = useState({});
  const [topProducts, setTopProducts] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [stores, setStores] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // HELPERS
  // ==========================================

  const money = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const getArray = (result) => {
    if (Array.isArray(result?.data)) return result.data;
    return [];
  };

  // ==========================================
  // AUTH
  // ==========================================

  const handleAuth = async (e) => {
    e.preventDefault();

    try {
      setAuthLoading(true);
      setAuthError("");

      const endpoint =
        authMode === "login"
          ? `${API}/auth/login`
          : `${API}/auth/signup`;

      const body =
        authMode === "login"
          ? {
              email: authForm.email,
              password: authForm.password,
            }
          : authForm;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Authentication failed"
        );
      }

      if (!data.token) {
        throw new Error("Token not received from server");
      }

      localStorage.setItem(
        "demandiq_token",
        data.token
      );

      if (data.customer) {
        localStorage.setItem(
          "demandiq_customer",
          JSON.stringify(data.customer)
        );
      }

      setIsLoggedIn(true);
      setPage("dashboard");
    } catch (err) {
      console.error(err);

      setAuthError(
        err.message ||
          "Authentication failed. Please try again."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("demandiq_token");
    localStorage.removeItem("demandiq_customer");

    setIsLoggedIn(false);
    setPage("dashboard");
    setAuthMode("login");

    setAuthForm({
      full_name: "",
      email: "",
      phone: "",
      password: "",
      city: "",
      address: "",
    });
  };

  // ==========================================
  // LOAD ALL DATA
  // ==========================================

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("demandiq_token");

      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {};

      const endpoints = [
        "analytics/summary",
        "analytics/top-products",
        "analytics/sales-trend",
        "analytics/low-stock",
        "analytics/store-performance",
        "recommendations",
        "products",
        "inventory",
        "sales",
      ];

      const data = await Promise.all(
        endpoints.map(async (endpoint) => {
          try {
            const res = await fetch(`${API}/${endpoint}`, { headers });
            if (res.status === 401) {
              logout();
              return {};
            }
            if (!res.ok) {
              return {};
            }
            return await res.json();
          } catch {
            return {};
          }
        })
      );

      setSummary(data[0]?.data || {});
      setTopProducts(getArray(data[1]));
      setSalesTrend(getArray(data[2]));
      setLowStock(getArray(data[3]));
      setStores(getArray(data[4]));
      setRecommendations(getArray(data[5]));
      const productList = getArray(data[6]);
const inventoryList = getArray(data[7]);

const productsWithStock = productList.map((product) => {
  const inventory = inventoryList.find(
    (item) =>
      String(item.product_id) ===
      String(product.product_id)
  );

  return {
    ...product,
    quantity: inventory
      ? Number(inventory.current_stock || 0)
      : 0,
  };
});

setProducts(productsWithStock);
setSales(getArray(data[8])); 
    } catch (err) {
      console.error(err);

      setError(
        "Backend connection nahi ho raha. Check karo Node server port 3000 par running hai."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // AUTH -> DASHBOARD
  // ==========================================

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  // ==========================================
  // LOGIN / SIGNUP SCREEN
  // ==========================================

  if (!isLoggedIn) {
    return (
      <div className="auth-container">
        <div className="auth-card">

          <div className="brand-logo">
            D
          </div>

          <h1>DemandIQ</h1>

          <p className="auth-subtitle">
            Demand Intelligence Platform
          </p>

          <form onSubmit={handleAuth}>

            {authMode === "signup" && (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={authForm.full_name}
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      full_name: e.target.value,
                    })
                  }
                  required
                />

                <input
                  type="text"
                  placeholder="Phone"
                  value={authForm.phone}
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      phone: e.target.value,
                    })
                  }
                  required
                />

                <input
                  type="text"
                  placeholder="City"
                  value={authForm.city}
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      city: e.target.value,
                    })
                  }
                  required
                />

                <textarea
                  placeholder="Address"
                  value={authForm.address}
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      address: e.target.value,
                    })
                  }
                  required
                />
              </>
            )}

            <input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(e) =>
                setAuthForm({
                  ...authForm,
                  email: e.target.value,
                })
              }
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(e) =>
                setAuthForm({
                  ...authForm,
                  password: e.target.value,
                })
              }
              required
            />

            {authError && (
              <div className="auth-error">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
            >
              {authLoading
                ? "Please wait..."
                : authMode === "login"
                ? "Login"
                : "Create Account"}
            </button>

          </form>

          <div className="auth-switch">

            {authMode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              type="button"
              onClick={() => {
                setAuthMode(
                  authMode === "login"
                    ? "signup"
                    : "login"
                );

                setAuthError("");
              }}
            >
              {authMode === "login"
                ? "Sign Up"
                : "Login"}
            </button>

          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // NAVIGATION
  // ==========================================

  const navItems = [
    {
      id: "dashboard",
      icon: "▦",
      label: "Dashboard",
    },
    {
      id: "products",
      icon: "▣",
      label: "Products",
    },
    {
      id: "sales",
      icon: "↗",
      label: "Sales",
    },
    {
      id: "stores",
      icon: "⌂",
      label: "Stores",
    },
    {
      id: "recommendations",
      icon: "◈",
      label: "Recommendations",
    },
  ];

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-logo">D</div>

        <h1>DemandIQ</h1>

        <p>
          Loading intelligence dashboard...
        </p>

        <div className="spinner"></div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="error-page">

        <div className="error-card">

          <div className="error-icon">
            !
          </div>

          <h1>
            Connection Error
          </h1>

          <p>
            {error}
          </p>

          <button onClick={fetchData}>
            Try Again
          </button>

          <button
            onClick={logout}
            style={{
              marginTop: "10px",
              background: "#dc2626",
            }}
          >
            Logout
          </button>

        </div>

      </div>
    );
  }

  // ==========================================
  // DASHBOARD
  // ==========================================

  const Dashboard = () => (
    <>
      {/* KPI */}
      <section className="kpi-grid">

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Total Products</span>
            <div className="kpi-icon blue">
              ▣
            </div>
          </div>

          <strong>
            {summary.total_products || 0}
          </strong>

          <small>
            Products in catalog
          </small>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Total Stock</span>

            <div className="kpi-icon purple">
              ◫
            </div>
          </div>

          <strong>
            {summary.total_stock || 0}
          </strong>

          <small>
            Units currently available
          </small>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Total Revenue</span>

            <div className="kpi-icon green">
              ₹
            </div>
          </div>

          <strong>
            {money(summary.total_revenue)}
          </strong>

          <small>
            Sales revenue generated
          </small>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Total Profit</span>

            <div className="kpi-icon orange">
              ↗
            </div>
          </div>

          <strong>
            {money(summary.total_profit)}
          </strong>

          <small>
            Estimated business profit
          </small>
        </div>

      </section>

      {/* MAIN ANALYTICS */}
      <section className="dashboard-grid">

        {/* SALES TREND */}
        <div className="panel sales-panel">

          <div className="panel-header">

            <div>
              <h2>
                Sales Trend
              </h2>

              <p>
                Recent sales performance
              </p>
            </div>

            <div className="panel-tag">
              LIVE DATA
            </div>

          </div>

          {salesTrend.length === 0 ? (
            <div className="empty">
              No sales trend data available.
            </div>
          ) : (
            <div className="sales-chart">

              {salesTrend.map(
                (item, index) => {

                  const maxUnits =
                    Math.max(
                      ...salesTrend.map(
                        (x) =>
                          Number(
                            x.units_sold || 0
                          )
                      ),
                      1
                    );

                  const height =
                    (Number(
                      item.units_sold || 0
                    ) /
                      maxUnits) *
                    100;

                  return (
                    <div
                      className="chart-column"
                      key={index}
                    >

                      <div className="chart-value">
                        {item.units_sold || 0}
                      </div>

                      <div className="bar-area">

                        <div
                          className="sales-bar"
                          style={{
                            height: `${Math.max(
                              height,
                              5
                            )}%`,
                          }}
                        ></div>

                      </div>

                      <small>
                        {new Date(
                          item.sale_date
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                          }
                        )}
                      </small>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>

        {/* TOP PRODUCTS */}
        <div className="panel">

          <div className="panel-header">

            <div>
              <h2>
                Top Products
              </h2>

              <p>
                Highest selling products
              </p>
            </div>

            <span className="count-badge">
              {topProducts.length}
            </span>

          </div>

          <div className="product-list">

            {topProducts
              .slice(0, 6)
              .map((product, index) => (

                <div
                  className="product-item"
                  key={index}
                >

                  <div className="rank">
                    {String(
                      index + 1
                    ).padStart(2, "0")}
                  </div>

                  <div className="product-details">

                    <strong>
                      {product.product_name ||
                        product.name ||
                        product.product_id}
                    </strong>

                    <small>
                      {product.product_id}
                    </small>

                  </div>

                  <div className="units">

                    {product.units_sold || 0}

                    <small>
                      {" "}units
                    </small>

                  </div>

                </div>

              ))}

            {topProducts.length === 0 && (
              <div className="empty">
                No products available.
              </div>
            )}

          </div>

        </div>

      </section>

      {/* LOWER */}
      <section className="three-grid">

        {/* INVENTORY */}
        <div className="panel">

          <div className="panel-header">

            <div>
              <h2>
                Inventory Alerts
              </h2>

              <p>
                Low stock products
              </p>
            </div>

            <div className="alert-count">
              {lowStock.length}
            </div>

          </div>

          {lowStock.length === 0 ? (

            <div className="healthy">

              <div className="healthy-icon">
                ✓
              </div>

              <div>

                <strong>
                  Inventory Healthy
                </strong>

                <p>
                  No low-stock products
                  detected.
                </p>

              </div>

            </div>

          ) : (

            <div className="alert-list">

              {lowStock
                .slice(0, 5)
                .map((item, index) => (

                  <div
                    className="alert-item"
                    key={index}
                  >

                    <div>

                      <strong>
                        {item.product_name ||
                          item.product_id}
                      </strong>

                      <small>
                        {item.product_id}
                      </small>

                    </div>

                    <span>
                      {item.stock ||
                        item.quantity ||
                        0}{" "}
                      left
                    </span>

                  </div>

                ))}

            </div>

          )}

        </div>

        {/* STORES */}
        <div className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Store Performance
              </h2>

              <p>
                Store-wise sales
              </p>

            </div>

          </div>

          <div className="store-list">

            {stores
              .slice(0, 5)
              .map((store, index) => (

                <div
                  className="store-item"
                  key={index}
                >

                  <div className="store-rank">
                    {index + 1}
                  </div>

                  <div className="store-details">

                    <strong>
                      {store.store_id}
                    </strong>

                    <small>
                      {store.units_sold || 0}{" "}
                      units sold
                    </small>

                  </div>

                  <strong className="store-revenue">
                    {money(store.revenue)}
                  </strong>

                </div>

              ))}

            {stores.length === 0 && (
              <div className="empty">
                No store data available.
              </div>
            )}

          </div>

        </div>

        {/* AI */}
        <div className="panel ai-panel">

          <div className="panel-header">

            <div>

              <h2>
                AI Recommendations
              </h2>

              <p>
                Demand-driven insights
              </p>

            </div>

            <div className="ai-badge">
              AI
            </div>

          </div>

          {recommendations.length === 0 ? (

            <div className="ai-empty">

              <div className="ai-big">
                AI
              </div>

              <strong>
                No recommendations yet
              </strong>

              <p>
                More sales data will
                generate better demand
                insights.
              </p>

            </div>

          ) : (

            <div className="recommendation-list">

              {recommendations
                .slice(0, 5)
                .map((item, index) => (

                  <div
                    className="recommendation-item"
                    key={index}
                  >

                    <div className="recommendation-icon">
                      ✦
                    </div>

                    <div>

                      <strong>
                        {item.product_name ||
                          item.product_id ||
                          "Product"}
                      </strong>

                      <p>
                        {item.message ||
                          item.recommendation ||
                          "Demand signal detected."}
                      </p>

                    </div>

                  </div>

                ))}

            </div>

          )}

        </div>

      </section>
    </>
  );

  // ==========================================
  // PRODUCTS PAGE
  // ==========================================

  const ProductsPage = () => {
    const [showForm, setShowForm] = useState(false);

    const [productForm, setProductForm] = useState({
      product_id: "",
      product_name: "",
      category: "",
      price: "",
      cost: "",
      quantity: "",
      store_id: "",
      expiry_date: "",
    });

    const [productMessage, setProductMessage] = useState("");
    const [productError, setProductError] = useState("");
    const [productSaving, setProductSaving] = useState(false);

    const handleProductChange = (e) => {
      const { name, value } = e.target;

      setProductForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    const handleAddProduct = async (e) => {
      e.preventDefault();

      try {
        setProductSaving(true);
        setProductMessage("");
        setProductError("");

        const token = localStorage.getItem("demandiq_token");

        const productData = {
          product_id: productForm.product_id.trim(),
          product_name: productForm.product_name.trim(),
          category: productForm.category.trim(),
          price: Number(productForm.price),
          cost: Number(productForm.cost),
          quantity: Number(productForm.quantity),
          store_id: productForm.store_id.trim(),
          minimum_stock: Number(productForm.minimum_stock || 10),
          expiry_date: productForm.expiry_date || null
        };
        if (!productData.product_id || !productData.product_name) {
          throw new Error("Product ID and Product Name are required");
        }

        if (!Number.isFinite(productData.quantity) || productData.quantity < 0) {
          throw new Error("Quantity must be 0 or greater");
        }

        if (!productForm.store_id.trim()) {
          throw new Error("Store ID is required");
        }

        // =====================================
        // STEP 1: CREATE PRODUCT
        // =====================================

        const response = await fetch(`${API}/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
          body: JSON.stringify(productData),
        });

        const data = await response.json();

        // =====================================
        // STEP 2: PRODUCT ALREADY EXISTS
        // =====================================

        if (response.status === 409) {
          const inventoryResponse = await fetch(`${API}/inventory`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },
            body: JSON.stringify({
              product_id: productData.product_id,
              store_id: productForm.store_id.trim(),
              current_stock: productData.quantity,
              minimum_stock: 10,
            }),
          });

          const inventoryData = await inventoryResponse.json();

          if (!inventoryResponse.ok) {
            throw new Error(
              inventoryData.message || "Failed to update inventory"
            );
          }

          setProductMessage(
            `Existing product found. Added ${productData.quantity} units. Current stock: ${inventoryData.current_stock}`
          );
        } else {
          // =====================================
          // STEP 3: NEW PRODUCT
          // =====================================

          if (!response.ok) {
            throw new Error(
              data.message || "Failed to add product"
            );
          }

          // =====================================
          // STEP 4: CREATE INITIAL INVENTORY
          // =====================================

          const inventoryResponse = await fetch(`${API}/inventory`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },
            body: JSON.stringify({
              product_id: productData.product_id,
              store_id: productForm.store_id.trim(),
              current_stock: productData.quantity,
              minimum_stock: 10,
            }),
          });

          const inventoryData = await inventoryResponse.json();

          if (!inventoryResponse.ok) {
            throw new Error(
              inventoryData.message ||
                "Product created but inventory could not be added"
            );
          }

          setProductMessage(
            `Product added successfully with ${inventoryData.current_stock} units in stock.`
          );
        }

        // =====================================
        // RESET FORM
        // =====================================

        setProductForm({
          product_id: "",
          product_name: "",
          category: "",
          price: "",
          cost: "",
          quantity: "",
          store_id: "",
          expiry_date: "",
        });

        setShowForm(false);

        // Refresh dashboard/product data
        await fetchData();
      } catch (err) {
        console.error("Add Product Error:", err);

        setProductError(
          err.message || "Failed to add product"
        );
      } finally {
        setProductSaving(false);
      }
    };

    return (
      <Page
        title="Products"
        subtitle="Manage your product catalog"
      >

        {/* ============================= */}
        {/* HEADER */}
        {/* ============================= */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >

          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "22px",
              }}
            >
              Your Products
            </h2>

            <p
              style={{
                marginTop: "6px",
                opacity: 0.7,
              }}
            >
              Add and manage products used for
              demand forecasting.
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setProductMessage("");
              setProductError("");
            }}
            style={{
              padding: "12px 20px",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              background: "#2563eb",
              color: "white",
            }}
          >
            {showForm ? "✕ Close" : "+ Add Product"}
          </button>

        </div>

        {/* ============================= */}
        {/* SUCCESS MESSAGE */}
        {/* ============================= */}

        {productMessage && (
          <div
            style={{
              padding: "14px 18px",
              marginBottom: "20px",
              borderRadius: "10px",
              background: "#dcfce7",
              color: "#166534",
              fontWeight: "600",
            }}
          >
            ✓ {productMessage}
          </div>
        )}

        {/* ============================= */}
        {/* ERROR MESSAGE */}
        {/* ============================= */}

        {productError && (
          <div
            style={{
              padding: "14px 18px",
              marginBottom: "20px",
              borderRadius: "10px",
              background: "#fee2e2",
              color: "#991b1b",
              fontWeight: "600",
            }}
          >
            ⚠ {productError}
          </div>
        )}

        {/* ============================= */}
        {/* ADD PRODUCT FORM */}
        {/* ============================= */}

        {showForm && (
          <form
            onSubmit={handleAddProduct}
            style={{
              padding: "24px",
              marginBottom: "30px",
              borderRadius: "16px",
              background: "#ffffff",
              boxShadow:
                "0 8px 30px rgba(0,0,0,0.08)",
            }}
          >

            <h3
              style={{
                marginTop: 0,
                marginBottom: "20px",
              }}
            >
              Add New Product
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
              }}
            >

              {/* Product ID */}
              <div>
                <label>Product ID</label>
                <input
                  name="product_id"
                  value={productForm.product_id}
                  onChange={handleProductChange}
                  placeholder="Product ID (e.g. P013)"
                  required
                  style={productInputStyle}
                />
              </div>

              {/* Product Name */}
              <div>
                <label>Product Name</label>
                <input
                  name="product_name"
                  value={productForm.product_name}
                  onChange={handleProductChange}
                  placeholder="Product Name (e.g. Coca Cola 500ml)"
                  required
                  style={productInputStyle}
                />
              </div>

              {/* Category */}
              <div>
                <label>Category</label>
                <input
                  name="category"
                  value={productForm.category}
                  onChange={handleProductChange}
                  placeholder="Category (e.g. Beverages)"
                  style={productInputStyle}
                />
              </div>

              {/* Price */}
              <div>
                <label>Selling Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="price"
                  value={productForm.price}
                  onChange={handleProductChange}
                  placeholder="Selling Price (40)"
                  required
                  style={productInputStyle}
                />
              </div>

              {/* Cost */}
              <div>
                <label>Product Cost</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="cost"
                  value={productForm.cost}
                  onChange={handleProductChange}
                  placeholder="Product Cost (25.00)"
                  required
                  style={productInputStyle}
                />
              </div>

              {/* Store ID */}
              <div>
                <label>Store ID</label>
                <input
                  name="store_id"
                  value={productForm.store_id}
                  onChange={handleProductChange}
                  placeholder="Store ID (e.g. S001)"
                  required
                  style={productInputStyle}
                />
              </div>

              {/* Quantity */}
              <div>
                <label>Quantity</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  name="quantity"
                  value={productForm.quantity}
                  onChange={handleProductChange}
                  placeholder="Quantity (e.g. 100)"
                  required
                  style={productInputStyle}
                />
              </div>

              {/* Expiry */}
              <div>
                <label>Expiry Date</label>
                <input
                  type="date"
                  name="expiry_date"
                  value={productForm.expiry_date}
                  onChange={handleProductChange}
                  style={productInputStyle}
                />
              </div>

            </div>

            <button
              type="submit"
              disabled={productSaving}
              style={{
                marginTop: "24px",
                padding: "12px 24px",
                border: "none",
                borderRadius: "10px",
                cursor: productSaving
                  ? "not-allowed"
                  : "pointer",
                fontWeight: "600",
                background: "#16a34a",
                color: "white",
              }}
            >
              {productSaving
                ? "Saving..."
                : "✓ Save Product"}
            </button>

          </form>
        )}

        {/* ============================= */}
        {/* PRODUCT LIST */}
        {/* ============================= */}

        <div style={pageStyles.grid}>

          {products.length === 0 ? (
            <div style={pageStyles.empty}>
              No products found in database.
            </div>
          ) : (
            products.map(
              (product, index) => (
                <div
                  key={index}
                  style={pageStyles.card}
                >
                  <div
                    style={pageStyles.cardTop}
                  >
                    <div
                      style={pageStyles.productIcon}
                    >
                      {product.product_name
                        ?.charAt(0)
                        ?.toUpperCase() || "P"}
                    </div>

                    <span
                      style={pageStyles.badge}
                    >
                      {product.product_id}
                    </span>
                  </div>

                  <h3>
                    {product.product_name ||
                      product.name ||
                      "Unnamed Product"}
                  </h3>

                  <p>
                    {product.category ||
                      "General"}
                  </p>

                  <div
                    style={pageStyles.row}
                  >
                    <span>Price</span>
                    <strong>
                      {money(product.price)}
                    </strong>
                  </div>

                  <div
                    style={pageStyles.row}
                  >
                    <span>Cost</span>
                    
                    <strong>
                      {money(product.cost)}
                    </strong>
                  </div>
                  <div
                     style={{...pageStyles.row,
                        marginTop: "8px",}}
>
  <span>Quantity</span>

  <strong>
    {product.quantity ?? 0} units
  </strong>
</div>
                </div>
              )
            )
          )}

        </div>

      </Page>
    );
  };

  // ==========================================
  // SALES PAGE
  // ==========================================

  const SalesPage = () => (
    <Page
      title="Sales"
      subtitle="View real sales transactions"
    >

      <div
        style={pageStyles.tableWrapper}
      >

        {sales.length === 0 ? (

          <div style={pageStyles.empty}>
            No sales records found.
          </div>

        ) : (

          <table
            style={pageStyles.table}
          >

            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Store</th>
                <th>Date</th>
                <th>Units</th>
                <th>Sale Price</th>
                <th>Revenue</th>
                <th>Profit</th>
              </tr>
            </thead>

            <tbody>

              {sales.map(
                (sale, index) => (

                  <tr key={index}>

                    <td>
                      {sale.id}
                    </td>

                    <td>
                      <strong>
                        {sale.product_id}
                      </strong>
                    </td>

                    <td>
                      {sale.store_id || "-"}
                    </td>

                    <td>
                      {sale.sale_date
                        ? new Date(
                            sale.sale_date
                          ).toLocaleDateString(
                            "en-IN"
                          )
                        : "-"}
                    </td>

                    <td>
                      {sale.units_sold || 0}
                    </td>

                    <td>
                      {money(
                        sale.selling_price
                      )}
                    </td>

                    <td>
                      {money(
                        sale.revenue
                      )}
                    </td>

                    <td>
                      {money(
                        sale.profit
                      )}
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        )}

      </div>

    </Page>
  );

  // ==========================================
  // STORES PAGE
  // ==========================================

  const StoresPage = () => (
    <Page
      title="Stores"
      subtitle="Store-wise business performance"
    >

      <div style={pageStyles.grid}>

        {stores.length === 0 ? (

          <div style={pageStyles.empty}>
            No store data available.
          </div>

        ) : (

          stores.map(
            (store, index) => (

              <div
                key={index}
                style={pageStyles.card}
              >

                <div
                  style={pageStyles.storeNumber}
                >
                  #{index + 1}
                </div>

                <h3>
                  Store {store.store_id}
                </h3>

                <p>
                  Performance overview
                </p>

                <div
                  style={pageStyles.row}
                >

                  <span>
                    Units Sold
                  </span>

                  <strong>
                    {store.units_sold || 0}
                  </strong>

                </div>

                <div
                  style={pageStyles.row}
                >

                  <span>
                    Revenue
                  </span>

                  <strong>
                    {money(
                      store.revenue
                    )}
                  </strong>

                </div>

              </div>
            )
          )
        )}

      </div>

    </Page>
  );

  // ==========================================
  // RECOMMENDATIONS PAGE
  // ==========================================

  const RecommendationsPage = () => (
    <Page
      title="AI Recommendations"
      subtitle="Demand-driven business intelligence"
    >

      {recommendations.length === 0 ? (

        <div style={pageStyles.empty}>
          No recommendations available
          yet.
        </div>

      ) : (

        <div
          style={
            pageStyles.recommendationGrid
          }
        >

          {recommendations.map(
            (item, index) => (

              <div
                key={index}
                style={pageStyles.aiCard}
              >

                <div
                  style={pageStyles.aiNumber}
                >
                  {index + 1}
                </div>

                <div>

                  <h3>
                    {item.product_name ||
                      item.product_id ||
                      "Product"}
                  </h3>

                  <p>
                    {item.message ||
                      item.recommendation ||
                      "Demand signal detected."}
                  </p>

                  {item.product_id && (
                    <span
                      style={pageStyles.badge}
                    >
                      {item.product_id}
                    </span>
                  )}

                </div>

              </div>
            )
          )}

        </div>

      )}

    </Page>
  );

  // ==========================================
  // PAGE COMPONENT
  // ==========================================

  function Page({
    title,
    subtitle,
    children,
  }) {
    return (
      <>
        <header className="header">

          <div>

            <div className="small-label">
              DEMANDIQ
            </div>

            <h1>
              {title}
            </h1>

            <p>
              {subtitle}
            </p>

          </div>

          <div className="header-actions">

            <div className="live-status">

              <span></span>

              Live

            </div>

            <button
              className="refresh"
              onClick={fetchData}
            >
              ↻ Refresh
            </button>

          </div>

        </header>

        {children}
      </>
    );
  }

  // ==========================================
  // SELECT CURRENT PAGE
  // ==========================================

  const renderPage = () => {

    switch (page) {

      case "products":
        return <ProductsPage />;

      case "sales":
        return <SalesPage />;

      case "stores":
        return <StoresPage />;

      case "recommendations":
        return (
          <RecommendationsPage />
        );

      default:
        return <Dashboard />;
    }
  };

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="brand">

          <div className="brand-logo">
            D
          </div>

          <div>

            <h2>
              DemandIQ
            </h2>

            <span>
              Demand Intelligence
            </span>

          </div>

        </div>

        <div className="nav-title">
          MAIN MENU
        </div>

        <nav>

          {navItems.map(
            (item) => (

              <div
                key={item.id}
                className={`nav-item ${
                  page === item.id
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setPage(item.id)
                }
                style={{
                  cursor: "pointer",
                }}
              >

                <span>
                  {item.icon}
                </span>

                {item.label}

              </div>

            )
          )}

        </nav>

        <div className="sidebar-bottom">

          <div className="connection">

            <span className="online-dot"></span>

            <div>

              <strong>
                System Online
              </strong>

              <small>
                Backend connected
              </small>

            </div>

          </div>

          <button
            className="logout-btn"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </aside>

      {/* MAIN */}
      <main className="main">

        {renderPage()}

        <footer>

          <span>
            DemandIQ © 2026
          </span>

          <span>
            Demand Intelligence Platform
          </span>

        </footer>

      </main>

    </div>
  );
}

// ==========================================
// INLINE PAGE STYLES
// ==========================================
const productInputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 13px",
  marginTop: "7px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "14px",
  outline: "none",
};
const pageStyles = {

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px",
  },

  card: {
    background: "#0d1424",
    border: "1px solid #1b2940",
    borderRadius: "16px",
    padding: "24px",
    color: "#e8eef8",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.18)",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  productIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    fontSize: "20px",
    fontWeight: "700",
  },

  badge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "7px",
    background: "#18243a",
    color: "#72a7ff",
    fontSize: "12px",
    fontWeight: "600",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "11px 0",
    borderTop:
      "1px solid #1a2639",
    color: "#8c9ab0",
  },

  tableWrapper: {
    background: "#0d1424",
    border:
      "1px solid #1b2940",
    borderRadius: "16px",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse:
      "collapse",
    color: "#e8eef8",
    minWidth: "900px",
  },

  empty: {
    padding: "60px 20px",
    textAlign: "center",
    background: "#0d1424",
    border:
      "1px solid #1b2940",
    borderRadius: "16px",
    color: "#8c9ab0",
  },

  storeNumber: {
    color: "#6da4ff",
    fontSize: "13px",
    marginBottom: "10px",
  },

  recommendationGrid: {
    display: "grid",
    gap: "16px",
  },

  aiCard: {
    display: "flex",
    gap: "18px",
    alignItems: "flex-start",
    padding: "22px",
    background:
      "linear-gradient(135deg,#11142b,#10182a)",
    border:
      "1px solid #30265c",
    borderRadius: "16px",
  },

  aiNumber: {
    minWidth: "38px",
    height: "38px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#24174d",
    color: "#b77cff",
    fontWeight: "700",
  },
};

export default App;

