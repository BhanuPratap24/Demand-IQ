import { useEffect, useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// ==========================================
// MAIN APP COMPONENT
// ==========================================

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!(localStorage.getItem("demandiq_token") || localStorage.getItem("token"))
  );

  const [userProfile, setUserProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("demandiq_customer") || "{}");
    } catch {
      return {};
    }
  });

  const [authMode, setAuthMode] = useState("login");

  const [authForm, setAuthForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    city: "",
    address: "",
  });

  const [forgotForm, setForgotForm] = useState({
    email: "",
    new_password: "",
    confirm_password: "",
  });

  const [forgotSuccess, setForgotSuccess] = useState("");
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
      setForgotSuccess("");

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
        setUserProfile(data.customer);
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

  // ==========================================
  // FORGOT / RESET PASSWORD HANDLER
  // ==========================================

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    try {
      setAuthLoading(true);
      setAuthError("");
      setForgotSuccess("");

      if (!forgotForm.email || !forgotForm.new_password) {
        throw new Error("Email and new password are required");
      }

      if (forgotForm.new_password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      if (forgotForm.new_password !== forgotForm.confirm_password) {
        throw new Error("New password and confirm password do not match");
      }

      const response = await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: forgotForm.email.trim(),
          new_password: forgotForm.new_password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Password reset failed");
      }

      setForgotSuccess(
        data.message ||
          "Password has been reset successfully! You can now log in."
      );
      setForgotForm({ email: "", new_password: "", confirm_password: "" });
    } catch (err) {
      console.error(err);
      setAuthError(err.message || "Password reset failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("demandiq_token");
    localStorage.removeItem("demandiq_customer");

    setIsLoggedIn(false);
    setUserProfile({});
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
    setForgotForm({
      email: "",
      new_password: "",
      confirm_password: "",
    });
    setForgotSuccess("");
    setAuthError("");
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
        "auth/profile",
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
        const matchingInventories = inventoryList.filter(
          (item) =>
            String(item.product_id) ===
            String(product.product_id)
        );

        const totalStock = matchingInventories.reduce(
          (sum, item) => sum + Number(item.current_stock || 0),
          0
        );

        const primaryStore = matchingInventories[0]?.store_id || "";

        return {
          ...product,
          store_id: primaryStore,
          quantity: totalStock,
        };
      });

      setProducts(productsWithStock);
      setSales(getArray(data[8])); 

      if (data[9]?.customer) {
        setUserProfile(data[9].customer);
        localStorage.setItem("demandiq_customer", JSON.stringify(data[9].customer));
      }
    } catch (err) {
      console.error(err);

      setError(
        "Backend connection error. Please make sure Node server is running on port 3000."
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
            {authMode === "login"
              ? "Demand Intelligence Platform"
              : authMode === "signup"
              ? "Create your business account"
              : "Reset Account Password"}
          </p>

          {authMode === "forgot" ? (
            /* ========================================== */
            /* FORGOT / RESET PASSWORD FORM              */
            /* ========================================== */
            <form onSubmit={handleForgotPassword}>
              <p style={{ fontSize: "13px", color: "#9ca3af", textAlign: "center", marginBottom: "16px", lineHeight: "1.5" }}>
                Enter your registered email and choose a new password.
              </p>

              <input
                type="email"
                placeholder="Registered Email Address"
                value={forgotForm.email}
                onChange={(e) =>
                  setForgotForm({
                    ...forgotForm,
                    email: e.target.value,
                  })
                }
                required
              />

              <input
                type="password"
                placeholder="New Password (min 6 characters)"
                value={forgotForm.new_password}
                onChange={(e) =>
                  setForgotForm({
                    ...forgotForm,
                    new_password: e.target.value,
                  })
                }
                required
              />

              <input
                type="password"
                placeholder="Confirm New Password"
                value={forgotForm.confirm_password}
                onChange={(e) =>
                  setForgotForm({
                    ...forgotForm,
                    confirm_password: e.target.value,
                  })
                }
                required
              />

              {forgotSuccess && (
                <div style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "#dcfce7",
                  color: "#166534",
                  fontSize: "13px",
                  fontWeight: "600",
                  marginBottom: "14px",
                  textAlign: "center"
                }}>
                  ✓ {forgotSuccess}
                </div>
              )}

              {authError && (
                <div className="auth-error">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
              >
                {authLoading ? "Resetting Password..." : "Reset Password"}
              </button>

              <div style={{ marginTop: "16px", textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError("");
                    setForgotSuccess("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#3b82f6",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600"
                  }}
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          ) : (
            /* ========================================== */
            /* LOGIN & SIGNUP FORM                       */
            /* ========================================== */
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
                    placeholder="Mobile Phone Number"
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
                    placeholder="Business Address"
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
                placeholder="Email Address"
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

              {authMode === "login" && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("forgot");
                      setAuthError("");
                      setForgotSuccess("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#60a5fa",
                      fontSize: "12px",
                      cursor: "pointer",
                      padding: 0,
                      fontWeight: "500"
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

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
          )}

          {authMode !== "forgot" && (
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
          )}

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
      label: "AI Forecasts",
    },
    {
      id: "profile",
      icon: "👤",
      label: "My Profile",
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

                    <span style={{ fontWeight: "700", color: (item.current_stock ?? 0) === 0 ? "#ef4444" : "#f59e0b" }}>
                      {item.current_stock ?? 0}{" "}
                      units left
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
  // PRODUCTS PAGE (WITH STOCK QUANTITY GRAPHS)
  // ==========================================

  const ProductsPage = () => {
    const [viewMode, setViewMode] = useState("catalog"); // "catalog" | "graphs"
    const [stockFilter, setStockFilter] = useState("all"); // "all" | "low" | "healthy" | "zero"
    const [selectedCategory, setSelectedCategory] = useState("all");
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

        const response = await fetch(`${API}/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(productData),
        });

        const data = await response.json();

        if (response.status === 409) {
          const inventoryResponse = await fetch(`${API}/inventory`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
            throw new Error(inventoryData.message || "Failed to update inventory");
          }

          setProductMessage(
            `Existing product updated. Added ${productData.quantity} units. Total stock: ${inventoryData.current_stock}`
          );
        } else {
          if (!response.ok) {
            throw new Error(data.message || "Failed to add product");
          }

          const inventoryResponse = await fetch(`${API}/inventory`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
            throw new Error(inventoryData.message || "Product created but inventory could not be added");
          }

          setProductMessage(`Product added successfully with ${inventoryData.current_stock} units in stock.`);
        }

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
        await fetchData();
      } catch (err) {
        console.error("Add Product Error:", err);
        setProductError(err.message || "Failed to add product");
      } finally {
        setProductSaving(false);
      }
    };

    // Filter products for graph/catalog
    const categories = ["all", ...new Set(products.map((p) => p.category).filter(Boolean))];
    const filteredProducts = products.filter((p) => {
      const matchCat = selectedCategory === "all" || p.category === selectedCategory;
      const qty = p.quantity || 0;
      if (stockFilter === "low") return matchCat && qty > 0 && qty < 10;
      if (stockFilter === "zero") return matchCat && qty === 0;
      if (stockFilter === "healthy") return matchCat && qty >= 10;
      return matchCat;
    });

    const maxStock = Math.max(...products.map((p) => p.quantity || 0), 20);
    const totalInventoryValue = products.reduce(
      (acc, p) => acc + (Number(p.price) || 0) * (Number(p.quantity) || 0),
      0
    );

    return (
      <Page
        title="Products & Inventory"
        subtitle="Manage product catalog and visualize real-time inventory quantity levels"
      >
        {/* ============================= */}
        {/* TOP BAR WITH VIEW TOGGLES    */}
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
          {/* TAB BUTTONS */}
          <div
            style={{
              display: "flex",
              background: "#1e293b",
              padding: "4px",
              borderRadius: "10px",
              gap: "4px",
            }}
          >
            <button
              onClick={() => setViewMode("catalog")}
              style={{
                padding: "8px 18px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
                background: viewMode === "catalog" ? "#3b82f6" : "transparent",
                color: viewMode === "catalog" ? "white" : "#94a3b8",
                transition: "all 0.2s ease",
              }}
            >
              ▣ Product Catalog ({products.length})
            </button>
            <button
              onClick={() => setViewMode("graphs")}
              style={{
                padding: "8px 18px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
                background: viewMode === "graphs" ? "#3b82f6" : "transparent",
                color: viewMode === "graphs" ? "white" : "#94a3b8",
                transition: "all 0.2s ease",
              }}
            >
              📊 Stock Quantity Graphs
            </button>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setProductMessage("");
              setProductError("");
            }}
            style={{
              padding: "10px 18px",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              background: "#2563eb",
              color: "white",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
            }}
          >
            {showForm ? "✕ Close" : "+ Add Product"}
          </button>
        </div>

        {/* MESSAGES */}
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

        {/* ADD PRODUCT FORM */}
        {showForm && (
          <form
            onSubmit={handleAddProduct}
            style={{
              padding: "24px",
              marginBottom: "30px",
              borderRadius: "16px",
              background: "#ffffff",
              boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "20px" }}>Add New Product</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
              }}
            >
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
                cursor: productSaving ? "not-allowed" : "pointer",
                fontWeight: "600",
                background: "#16a34a",
                color: "white",
              }}
            >
              {productSaving ? "Saving..." : "✓ Save Product"}
            </button>
          </form>
        )}

        {/* ================================================== */}
        {/* VIEW 1: STOCK QUANTITY GRAPHS & VISUAL DISTRIBUTION */}
        {/* ================================================== */}
        {viewMode === "graphs" ? (
          <div>
            {/* KPI STATS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  background: "white",
                  padding: "18px",
                  borderRadius: "14px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                }}
              >
                <small style={{ color: "#64748b", fontWeight: "600" }}>Total Products</small>
                <div style={{ fontSize: "24px", fontWeight: "800", marginTop: "4px", color: "#1e293b" }}>
                  {products.length}
                </div>
              </div>

              <div
                style={{
                  background: "white",
                  padding: "18px",
                  borderRadius: "14px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                }}
              >
                <small style={{ color: "#64748b", fontWeight: "600" }}>Total Stock Units</small>
                <div style={{ fontSize: "24px", fontWeight: "800", marginTop: "4px", color: "#2563eb" }}>
                  {products.reduce((acc, p) => acc + (p.quantity || 0), 0)} units
                </div>
              </div>

              <div
                style={{
                  background: "white",
                  padding: "18px",
                  borderRadius: "14px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                }}
              >
                <small style={{ color: "#64748b", fontWeight: "600" }}>Total Stock Value</small>
                <div style={{ fontSize: "24px", fontWeight: "800", marginTop: "4px", color: "#059669" }}>
                  {money(totalInventoryValue)}
                </div>
              </div>

              <div
                style={{
                  background: "white",
                  padding: "18px",
                  borderRadius: "14px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                }}
              >
                <small style={{ color: "#64748b", fontWeight: "600" }}>Low Stock Alert (&lt; 10)</small>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "800",
                    marginTop: "4px",
                    color: products.some((p) => (p.quantity || 0) < 10) ? "#ef4444" : "#10b981",
                  }}
                >
                  {products.filter((p) => (p.quantity || 0) < 10).length} items
                </div>
              </div>
            </div>

            {/* FILTERS */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "white",
                padding: "16px 20px",
                borderRadius: "14px",
                marginBottom: "20px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                gap: "14px",
                flexWrap: "wrap",
              }}
            >
              {/* Category Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Category:</span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      background: selectedCategory === cat ? "#3b82f6" : "#f1f5f9",
                      color: selectedCategory === cat ? "white" : "#475569",
                    }}
                  >
                    {cat === "all" ? "All Categories" : cat}
                  </button>
                ))}
              </div>

              {/* Stock Health Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Filter:</span>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    outline: "none",
                  }}
                >
                  <option value="all">All Products ({products.length})</option>
                  <option value="healthy">Healthy Stock (&gt;= 10)</option>
                  <option value="low">Low Stock (&lt; 10)</option>
                  <option value="zero">Out of Stock (0)</option>
                </select>
              </div>
            </div>

            {/* VISUAL STOCK QUANTITY BAR CHARTS */}
            <div
              style={{
                background: "white",
                padding: "24px",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                  📊 Product Quantity Levels & Safety Thresholds
                </h3>
                <div style={{ display: "flex", gap: "12px", fontSize: "12px", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981" }}></span>
                    Healthy (&gt;=10)
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }}></span>
                    Low Stock (&lt;10)
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }}></span>
                    Out of Stock (0)
                  </span>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                  No products match the selected filters.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {filteredProducts.map((p) => {
                    const qty = Number(p.quantity || 0);
                    const percentage = Math.min(Math.round((qty / maxStock) * 100), 100);
                    const isLow = qty > 0 && qty < 10;
                    const isOut = qty === 0;
                    const barColor = isOut ? "#ef4444" : isLow ? "#f59e0b" : "#10b981";

                    return (
                      <div
                        key={p.product_id}
                        style={{
                          padding: "14px 16px",
                          borderRadius: "12px",
                          background: "#f8fafc",
                          border: `1px solid ${isOut ? "#fee2e2" : isLow ? "#fef3c7" : "#e2e8f0"}`,
                          transition: "transform 0.15s ease",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "8px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span
                              style={{
                                background: "#0f172a",
                                color: "white",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: "700",
                              }}
                            >
                              {p.product_id}
                            </span>
                            <strong style={{ fontSize: "14px", color: "#1e293b" }}>
                              {p.product_name}
                            </strong>
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#64748b",
                                background: "#e2e8f0",
                                padding: "2px 8px",
                                borderRadius: "10px",
                              }}
                            >
                              {p.category || "General"}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            <span style={{ fontSize: "13px", color: "#64748b" }}>
                              Value: <strong>{money((p.price || 0) * qty)}</strong>
                            </span>
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: "700",
                                background: isOut ? "#fee2e2" : isLow ? "#fef3c7" : "#dcfce7",
                                color: isOut ? "#dc2626" : isLow ? "#d97706" : "#16a34a",
                              }}
                            >
                              {qty} units in stock
                            </span>
                          </div>
                        </div>

                        {/* GRAPH PROGRESS BAR */}
                        <div
                          style={{
                            width: "100%",
                            height: "12px",
                            background: "#e2e8f0",
                            borderRadius: "6px",
                            overflow: "hidden",
                            position: "relative",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.max(percentage, 2)}%`,
                              height: "100%",
                              background: barColor,
                              borderRadius: "6px",
                              transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                          ></div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "11px",
                            color: "#94a3b8",
                            marginTop: "4px",
                          }}
                        >
                          <span>Min Threshold: 10 units</span>
                          <span>{percentage}% of maximum capacity</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ================================================== */
          /* VIEW 2: PRODUCT CATALOG CARDS                      */
          /* ================================================== */
          <div style={pageStyles.grid}>
            {products.length === 0 ? (
              <div style={pageStyles.empty}>No products found in database.</div>
            ) : (
              products.map((product, index) => (
                <div key={index} style={pageStyles.card}>
                  <div style={pageStyles.cardTop}>
                    <div style={pageStyles.productIcon}>
                      {product.product_name?.charAt(0)?.toUpperCase() || "P"}
                    </div>
                    <span style={pageStyles.badge}>{product.product_id}</span>
                  </div>

                  <h3>{product.product_name || product.name || "Unnamed Product"}</h3>
                  <p>{product.category || "General"}</p>

                  <div style={pageStyles.row}>
                    <span>Price</span>
                    <strong>{money(product.price)}</strong>
                  </div>

                  <div style={pageStyles.row}>
                    <span>Cost</span>
                    <strong>{money(product.cost)}</strong>
                  </div>

                  <div style={{ ...pageStyles.row, marginTop: "8px" }}>
                    <span>Quantity</span>
                    <strong
                      style={{
                        color:
                          (product.quantity || 0) === 0
                            ? "#ef4444"
                            : (product.quantity || 0) < 10
                            ? "#f59e0b"
                            : "#10b981",
                      }}
                    >
                      {product.quantity ?? 0} units
                    </strong>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Page>
    );
  };


  // ==========================================
  // SALES PAGE (WITH RECORD SALE FORM)
  // ==========================================

  const SalesPage = () => {
    const [showSaleForm, setShowSaleForm] = useState(false);
    const [saleForm, setSaleForm] = useState({
      product_id: "",
      store_id: "Store-1",
      sale_date: new Date().toISOString().split("T")[0],
      units_sold: "",
      selling_price: ""
    });
    const [saleMessage, setSaleMessage] = useState("");
    const [saleError, setSaleError] = useState("");
    const [saleSaving, setSaleSaving] = useState(false);

    const handleSaleChange = (e) => {
      const { name, value } = e.target;
      setSaleForm((prev) => {
        const updated = { ...prev, [name]: value };
        if (name === "product_id") {
          const selectedProd = products.find(p => p.product_id === value);
          if (selectedProd) {
            if (!prev.selling_price) {
              updated.selling_price = selectedProd.price || "";
            }
            if (selectedProd.store_id) {
              updated.store_id = selectedProd.store_id;
            }
          }
        }
        return updated;
      });
    };

    const handleRecordSale = async (e) => {
      e.preventDefault();
      try {
        setSaleSaving(true);
        setSaleMessage("");
        setSaleError("");

        const token = localStorage.getItem("demandiq_token");

        if (!saleForm.product_id) {
          throw new Error("Please select a product");
        }

        const salePayload = {
          product_id: saleForm.product_id.trim(),
          store_id: saleForm.store_id?.trim() || undefined,
          sale_date: saleForm.sale_date,
          units_sold: Number(saleForm.units_sold),
          selling_price: saleForm.selling_price ? Number(saleForm.selling_price) : undefined
        };

        const res = await fetch(`${API}/sales`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(salePayload)
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to record sale");
        }

        setSaleMessage(`Sale recorded successfully! Revenue: ₹${data.revenue || 0}, Profit: ₹${data.profit || 0}`);
        setSaleForm({
          product_id: "",
          store_id: "Store-1",
          sale_date: new Date().toISOString().split("T")[0],
          units_sold: "",
          selling_price: ""
        });
        setShowSaleForm(false);
        fetchData();
      } catch (err) {
        setSaleError(err.message);
      } finally {
        setSaleSaving(false);
      }
    };

    return (
      <Page
        title="Sales Transactions"
        subtitle="Record and monitor real-time sales transactions"
      >
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
            <h2 style={{ margin: 0, fontSize: "22px" }}>Sales History</h2>
            <p style={{ marginTop: "6px", opacity: 0.7 }}>
              Transactions update store inventory and AI demand metrics in real-time.
            </p>
          </div>

          <button
            onClick={() => {
              setShowSaleForm(!showSaleForm);
              setSaleMessage("");
              setSaleError("");
            }}
            style={{
              padding: "12px 20px",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              background: "#059669",
              color: "white",
            }}
          >
            {showSaleForm ? "✕ Close" : "+ Record Sale"}
          </button>
        </div>

        {saleMessage && (
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
            ✓ {saleMessage}
          </div>
        )}

        {saleError && (
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
            ⚠ {saleError}
          </div>
        )}

        {showSaleForm && (
          <form
            onSubmit={handleRecordSale}
            style={{
              padding: "24px",
              marginBottom: "30px",
              borderRadius: "16px",
              background: "#ffffff",
              boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "20px" }}>Record New Sale</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "18px",
              }}
            >
              <div>
                <label>Select Product</label>
                <select
                  name="product_id"
                  value={saleForm.product_id}
                  onChange={handleSaleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    background: "#f9fafb",
                    marginTop: "6px"
                  }}
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.product_name} ({p.product_id}) - Available: {p.quantity || 0}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Store ID</label>
                <input
                  name="store_id"
                  value={saleForm.store_id}
                  onChange={handleSaleChange}
                  placeholder="Store ID (e.g. S001)"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    background: "#f9fafb",
                    marginTop: "6px"
                  }}
                />
              </div>

              <div>
                <label>Units Sold</label>
                <input
                  type="number"
                  min="1"
                  name="units_sold"
                  value={saleForm.units_sold}
                  onChange={handleSaleChange}
                  placeholder="Units Sold (e.g. 5)"
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    background: "#f9fafb",
                    marginTop: "6px"
                  }}
                />
              </div>

              <div>
                <label>Selling Price (per unit)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="selling_price"
                  value={saleForm.selling_price}
                  onChange={handleSaleChange}
                  placeholder="Price (e.g. 40)"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    background: "#f9fafb",
                    marginTop: "6px"
                  }}
                />
              </div>

              <div>
                <label>Sale Date</label>
                <input
                  type="date"
                  name="sale_date"
                  value={saleForm.sale_date}
                  onChange={handleSaleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    background: "#f9fafb",
                    marginTop: "6px"
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>
              <button
                type="submit"
                disabled={saleSaving}
                style={{
                  padding: "12px 24px",
                  background: "#059669",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                {saleSaving ? "Recording..." : "Save Sale Transaction"}
              </button>
            </div>
          </form>
        )}

        <div style={pageStyles.tableWrapper}>
          {sales.length === 0 ? (
            <div style={pageStyles.empty}>
              No sales records found. Click "+ Record Sale" to add your first transaction.
            </div>
          ) : (
            <table style={pageStyles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Store</th>
                  <th>Date</th>
                  <th>Units Sold</th>
                  <th>Sale Price</th>
                  <th>Revenue</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, index) => (
                  <tr key={index}>
                    <td>#{sale.id}</td>
                    <td>
                      <strong>{sale.product_name || sale.product_id}</strong>
                      <small style={{ display: "block", color: "#6b7280" }}>{sale.product_id}</small>
                    </td>
                    <td>{sale.store_id || "Main"}</td>
                    <td>
                      {sale.sale_date
                        ? new Date(sale.sale_date).toLocaleDateString("en-IN")
                        : "-"}
                    </td>
                    <td>
                      <strong>{sale.units_sold || 0}</strong>
                    </td>
                    <td>{money(sale.selling_price)}</td>
                    <td style={{ color: "#059669", fontWeight: "600" }}>{money(sale.revenue)}</td>
                    <td style={{ color: "#2563eb", fontWeight: "600" }}>{money(sale.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Page>
    );
  };

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
          stores.map((store, index) => (
            <div key={index} style={pageStyles.card}>
              <div style={pageStyles.storeNumber}>#{index + 1}</div>
              <h3>Store {store.store_id}</h3>
              <p>Performance overview</p>
              <div style={pageStyles.row}>
                <span>Units Sold</span>
                <strong>{store.units_sold || 0}</strong>
              </div>
              <div style={pageStyles.row}>
                <span>Revenue</span>
                <strong>{money(store.revenue)}</strong>
              </div>
            </div>
          ))
        )}
      </div>
    </Page>
  );

  // ==========================================
  // RECOMMENDATIONS PAGE (AI & ML ENHANCED)
  // ==========================================

  const RecommendationsPage = () => {
    const [predForm, setPredForm] = useState({
      product_id: "",
      store_id: "S001",
      category: "Groceries",
      region: "North",
      price: "",
      cost: "",
      discount: "0",
      competitor_pricing: "",
      weather_condition: "Clear",
      seasonality: "Normal",
      holiday_promotion: "0",
      inventory_level: "",
      units_sold_lag1: "0",
      units_sold_rolling7: "0",
      store_product_avg: "0",
    });
    const [predResult, setPredResult] = useState(null);
    const [predLoading, setPredLoading] = useState(false);
    const [predError, setPredError] = useState("");
    const [showPredForm, setShowPredForm] = useState(true);

    const handlePredChange = (e) => {
      const { name, value } = e.target;
      setPredForm(prev => ({ ...prev, [name]: value }));
    };

    const handlePredict = async (e) => {
      e.preventDefault();
      setPredLoading(true);
      setPredError("");
      setPredResult(null);
      try {
        const token = localStorage.getItem("demandiq_token");
        const payload = {
          ...predForm,
          price: Number(predForm.price),
          cost: Number(predForm.cost),
          discount: Number(predForm.discount),
          competitor_pricing: Number(predForm.competitor_pricing) || Number(predForm.price),
          holiday_promotion: Number(predForm.holiday_promotion),
          inventory_level: Number(predForm.inventory_level),
          units_sold_lag1: Number(predForm.units_sold_lag1),
          units_sold_rolling7: Number(predForm.units_sold_rolling7),
          store_product_avg: Number(predForm.store_product_avg),
        };
        const res = await fetch(`${API}/recommendations/predict-now`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Prediction failed");
        setPredResult(data.prediction);
      } catch (err) {
        setPredError(err.message || "Prediction failed. Make sure all services are running.");
      } finally {
        setPredLoading(false);
      }
    };

    const recColor = (rec) => {
      if (!rec) return { bg: "#dcfce7", color: "#16a34a" };
      if (rec.includes("URGENT")) return { bg: "#fee2e2", color: "#dc2626" };
      if (rec.includes("INCREASE") || rec.includes("REORDER")) return { bg: "#fff7ed", color: "#c2410c" };
      if (rec.includes("REDUCE")) return { bg: "#eff6ff", color: "#2563eb" };
      return { bg: "#dcfce7", color: "#16a34a" };
    };

    const priorityBadge = (priority) => {
      const map = {
        HIGH: { bg: "#fee2e2", color: "#dc2626", label: "🔴 HIGH" },
        MEDIUM: { bg: "#fff7ed", color: "#ea580c", label: "🟠 MEDIUM" },
        LOW: { bg: "#dcfce7", color: "#16a34a", label: "🟢 LOW" },
        INFO: { bg: "#eff6ff", color: "#2563eb", label: "🔵 INFO" },
      };
      return map[priority] || map.INFO;
    };

    const iStyle = {
      width: "100%", boxSizing: "border-box",
      padding: "10px 12px", border: "1px solid #334155",
      borderRadius: "8px", fontSize: "13px",
      background: "#0f1c2e", color: "#e2e8f0",
      outline: "none", marginTop: "5px",
    };

    return (
      <Page
        title="AI Demand Forecasting & Recommendations"
        subtitle="Machine learning driven demand predictions and inventory replenishment insights"
      >
        {/* ================================================ */}
        {/* LIVE ML PREDICTION FORM                         */}
        {/* ================================================ */}
        <div style={{
          background: "linear-gradient(135deg, #0a0f1e 0%, #0d1a35 100%)",
          border: "1px solid #1e3a5f",
          borderRadius: "20px",
          padding: "28px",
          marginBottom: "32px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                <div style={{
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  borderRadius: "10px", padding: "8px 12px",
                  fontSize: "16px", fontWeight: "800", color: "white"
                }}>🔮 ML</div>
                <h2 style={{ margin: 0, color: "#f1f5f9", fontSize: "20px", fontWeight: "800" }}>
                  Live Demand Predictor
                </h2>
              </div>
              <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
                XGBoost / Random Forest model — enter product details to get instant AI demand prediction
              </p>
            </div>
            <button
              onClick={() => { setShowPredForm(p => !p); setPredResult(null); setPredError(""); }}
              style={{
                padding: "8px 18px", border: "1px solid #334155", borderRadius: "10px",
                background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: "13px", fontWeight: "600"
              }}
            >
              {showPredForm ? "▲ Hide Form" : "▼ Show Form"}
            </button>
          </div>

          {showPredForm && (
            <form onSubmit={handlePredict}>
              {/* Row 1: Product Identification */}
              <p style={{ color: "#475569", fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", marginBottom: "10px", marginTop: 0 }}>PRODUCT IDENTIFICATION</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "20px" }}>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600" }}>Product ID</label>
                  <input name="product_id" value={predForm.product_id} onChange={handlePredChange} placeholder="e.g. P036" style={iStyle} required />
                </div>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600" }}>Store ID</label>
                  <input name="store_id" value={predForm.store_id} onChange={handlePredChange} placeholder="e.g. S014" style={iStyle} required />
                </div>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600" }}>Category</label>
                  <select name="category" value={predForm.category} onChange={handlePredChange} style={iStyle}>
                    <option>Groceries</option>
                    <option>Electronics</option>
                    <option>Clothing</option>
                    <option>Beverages</option>
                    <option>Furniture</option>
                    <option>Toys</option>
                    <option>Sports</option>
                    <option>General</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600" }}>Region</label>
                  <select name="region" value={predForm.region} onChange={handlePredChange} style={iStyle}>
                    <option>North</option>
                    <option>South</option>
                    <option>East</option>
                    <option>West</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Pricing */}
              <p style={{ color: "#475569", fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", marginBottom: "10px" }}>PRICING</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "20px" }}>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600" }}>Selling Price (₹)</label>
                  <input type="number" min="0" name="price" value={predForm.price} onChange={handlePredChange} placeholder="e.g. 50" style={iStyle} required />
                </div>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600" }}>Cost Price (₹)</label>
                  <input type="number" min="0" name="cost" value={predForm.cost} onChange={handlePredChange} placeholder="e.g. 30" style={iStyle} required />
                </div>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600" }}>Discount (%)</label>
                  <input type="number" min="0" max="100" name="discount" value={predForm.discount} onChange={handlePredChange} placeholder="e.g. 5" style={iStyle} />
                </div>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600" }}>Competitor Price (₹)</label>
                  <input type="number" min="0" name="competitor_pricing" value={predForm.competitor_pricing} onChange={handlePredChange} placeholder="e.g. 52" style={iStyle} />
                </div>
              </div>

              {/* Row 3: Market Conditions */}
              <p style={{ color: "#475569", fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", marginBottom: "10px" }}>MARKET CONDITIONS</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "20px" }}>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600" }}>Weather Condition</label>
                  <select name="weather_condition" value={predForm.weather_condition} onChange={handlePredChange} style={iStyle}>
                    <option>Clear</option>
                    <option>Sunny</option>
                    <option>Rainy</option>
                    <option>Cloudy</option>
                    <option>Snowy</option>
                    <option>Windy</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600" }}>Seasonality</label>
                  <select name="seasonality" value={predForm.seasonality} onChange={handlePredChange} style={iStyle}>
                    <option>Normal</option>
                    <option>Summer</option>
                    <option>Winter</option>
                    <option>Monsoon</option>
                    <option>Festival</option>
                    <option>Holiday</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600" }}>Holiday / Promotion</label>
                  <select name="holiday_promotion" value={predForm.holiday_promotion} onChange={handlePredChange} style={iStyle}>
                    <option value="0">No (0)</option>
                    <option value="1">Yes (1)</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600" }}>Current Inventory (units)</label>
                  <input type="number" min="0" name="inventory_level" value={predForm.inventory_level} onChange={handlePredChange} placeholder="e.g. 70" style={iStyle} required />
                </div>
              </div>

              {/* Row 4: Demand History */}
              <p style={{ color: "#475569", fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", marginBottom: "10px" }}>DEMAND HISTORY (optional — fill 0 if no history)</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "24px" }}>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600" }}>Units Sold Yesterday</label>
                  <input type="number" min="0" name="units_sold_lag1" value={predForm.units_sold_lag1} onChange={handlePredChange} placeholder="e.g. 120" style={iStyle} />
                </div>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600" }}>7-Day Rolling Avg (units)</label>
                  <input type="number" min="0" name="units_sold_rolling7" value={predForm.units_sold_rolling7} onChange={handlePredChange} placeholder="e.g. 115" style={iStyle} />
                </div>
                <div>
                  <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600" }}>Store-Product Avg (units)</label>
                  <input type="number" min="0" name="store_product_avg" value={predForm.store_product_avg} onChange={handlePredChange} placeholder="e.g. 125" style={iStyle} />
                </div>
              </div>

              {predError && (
                <div style={{ padding: "12px 16px", borderRadius: "10px", background: "#450a0a", color: "#fca5a5", fontWeight: "600", marginBottom: "16px", fontSize: "13px" }}>
                  ⚠ {predError}
                </div>
              )}

              <button
                type="submit"
                disabled={predLoading}
                style={{
                  width: "100%", padding: "14px",
                  background: predLoading ? "#334155" : "linear-gradient(135deg, #2563eb, #7c3aed)",
                  color: "white", border: "none", borderRadius: "12px",
                  fontWeight: "700", fontSize: "16px", cursor: predLoading ? "not-allowed" : "pointer",
                  boxShadow: predLoading ? "none" : "0 8px 25px rgba(37, 99, 235, 0.4)",
                  transition: "all 0.2s ease", letterSpacing: "0.02em"
                }}
              >
                {predLoading ? "⏳ Running AI Model..." : "🔮 Run AI Demand Prediction"}
              </button>
            </form>
          )}

          {/* PREDICTION RESULT */}
          {predResult && (
            <div style={{
              marginTop: "24px", padding: "24px",
              background: "linear-gradient(135deg, #0c1a2e, #0f2040)",
              border: "1px solid #1e40af", borderRadius: "16px"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                <h3 style={{ margin: 0, color: "#f1f5f9", fontSize: "18px", fontWeight: "800" }}>
                  📊 Prediction Result
                </h3>
                <span style={{
                  padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "700",
                  ...recColor(predResult.recommendation)
                }}>
                  {predResult.recommendation || "KEEP CURRENT STOCK"}
                </span>
              </div>

              {/* Main Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "18px" }}>
                <div style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", padding: "16px", borderRadius: "12px" }}>
                  <div style={{ color: "#60a5fa", fontSize: "11px", fontWeight: "700", marginBottom: "6px" }}>🔮 PREDICTED DEMAND</div>
                  <div style={{ color: "#f1f5f9", fontSize: "28px", fontWeight: "900", lineHeight: 1 }}>{predResult.predicted_demand ?? 0}</div>
                  <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>units expected</div>
                </div>

                <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", padding: "16px", borderRadius: "12px" }}>
                  <div style={{ color: "#34d399", fontSize: "11px", fontWeight: "700", marginBottom: "6px" }}>📦 CURRENT STOCK</div>
                  <div style={{ color: "#f1f5f9", fontSize: "28px", fontWeight: "900", lineHeight: 1 }}>{predResult.current_stock ?? 0}</div>
                  <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>units in inventory</div>
                </div>

                <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", padding: "16px", borderRadius: "12px" }}>
                  <div style={{ color: "#fbbf24", fontSize: "11px", fontWeight: "700", marginBottom: "6px" }}>🛡️ SAFETY STOCK</div>
                  <div style={{ color: "#f1f5f9", fontSize: "28px", fontWeight: "900", lineHeight: 1 }}>{predResult.safety_stock ?? 0}</div>
                  <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>buffer units (10%)</div>
                </div>

                <div style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", padding: "16px", borderRadius: "12px" }}>
                  <div style={{ color: "#a78bfa", fontSize: "11px", fontWeight: "700", marginBottom: "6px" }}>📋 REQUIRED STOCK</div>
                  <div style={{ color: "#f1f5f9", fontSize: "28px", fontWeight: "900", lineHeight: 1 }}>{predResult.required_stock ?? 0}</div>
                  <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>demand + safety</div>
                </div>
              </div>

              {/* Reorder Suggestion */}
              {(predResult.reorder_quantity > 0) ? (
                <div style={{
                  padding: "14px 18px", borderRadius: "12px",
                  background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
                  display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px"
                }}>
                  <span style={{ fontSize: "22px" }}>⚡</span>
                  <div>
                    <div style={{ color: "#fca5a5", fontWeight: "700", fontSize: "15px" }}>
                      Reorder {predResult.reorder_quantity} units now
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "2px" }}>
                      Stock gap: {Math.abs(predResult.stock_difference ?? 0).toFixed(0)} units below required level
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: "14px 18px", borderRadius: "12px",
                  background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                  display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px"
                }}>
                  <span style={{ fontSize: "22px" }}>✅</span>
                  <div style={{ color: "#6ee7b7", fontWeight: "600", fontSize: "14px" }}>No reorder needed</div>
                </div>
              )}

              {/* Reason */}
              <div style={{
                padding: "12px 16px", borderRadius: "10px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)"
              }}>
                <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "700" }}>AI INSIGHT: </span>
                <span style={{ color: "#cbd5e1", fontSize: "13px" }}>{predResult.reason}</span>
              </div>

              <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                <span style={{ color: "#10b981", fontSize: "11px", fontWeight: "600" }}>Powered by XGBoost / Random Forest — DemandIQ ML Model v1.0</span>
              </div>
            </div>
          )}
        </div>

        {/* ================================================ */}
        {/* EXISTING PRODUCT RECOMMENDATIONS                */}
        {/* ================================================ */}
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ color: "#1e293b", fontSize: "20px", fontWeight: "800", margin: 0 }}>Your Product Recommendations</h2>
          <p style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>ML-enhanced insights based on your inventory and sales history</p>
        </div>

        {recommendations.length === 0 ? (
          <div style={{ ...pageStyles.empty, textAlign: "center" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>🧪</div>
            <strong>No product recommendations yet</strong>
            <p style={{ color: "#94a3b8", marginTop: "8px", fontSize: "13px" }}>
              Add products and record sales to generate automatic AI recommendations.<br/>
              Use the Live Demand Predictor above to test predictions instantly.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {recommendations.map((item, index) => {
              const rec = item.ml_recommendation || item.action || "NO REORDER";
              const isUrgent = rec.includes("URGENT");
              const isReorder = rec.includes("REORDER") || rec.includes("INCREASE");
              const isReduce = rec.includes("REDUCE");
              const borderColor = isUrgent ? "#ef4444" : isReorder ? "#f97316" : isReduce ? "#3b82f6" : "#10b981";
              const prio = item.priority || "INFO";
              const prioStyle = priorityBadge(prio);
              const recBadge = recColor(rec);

              return (
                <div
                  key={index}
                  style={{
                    background: "#ffffff",
                    borderLeft: `5px solid ${borderColor}`,
                    borderRadius: "14px",
                    padding: "22px 24px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                    display: "flex", flexDirection: "column", gap: "14px",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                >
                  {/* Header Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={pageStyles.badge}>{item.product_id}</span>
                      <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: prioStyle.bg, color: prioStyle.color }}>
                        {prioStyle.label}
                      </span>
                      {item.is_ml_available && (
                        <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: "#ecfdf5", color: "#059669" }}>● ML Active</span>
                      )}
                    </div>
                    <span style={{ padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", ...recBadge }}>
                      {rec}
                    </span>
                  </div>

                  {/* Product Name */}
                  <div>
                    <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: "700" }}>
                      {item.product_name || item.product_id}
                    </h3>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                      {item.category || "General"} &nbsp;·&nbsp; Store: {item.store_id || "Main"}
                    </p>
                  </div>

                  {/* Metrics Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
                    <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
                      <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "700", marginBottom: "4px" }}>CURRENT STOCK</div>
                      <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>{item.current_stock ?? 0}</div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>units</div>
                    </div>
                    <div style={{ background: "#eff6ff", padding: "12px", borderRadius: "10px" }}>
                      <div style={{ color: "#2563eb", fontSize: "11px", fontWeight: "700", marginBottom: "4px" }}>🔮 ML PREDICTED</div>
                      <div style={{ fontSize: "22px", fontWeight: "800", color: "#1d4ed8" }}>
                        {item.ml_predicted_demand ?? item.predicted_7_day_demand ?? 0}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>7-day demand</div>
                    </div>
                    <div style={{ background: "#fff7ed", padding: "12px", borderRadius: "10px" }}>
                      <div style={{ color: "#ea580c", fontSize: "11px", fontWeight: "700", marginBottom: "4px" }}>SAFETY STOCK</div>
                      <div style={{ fontSize: "22px", fontWeight: "800", color: "#c2410c" }}>
                        {item.ml_safety_stock ?? item.safety_stock ?? 0}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>buffer units</div>
                    </div>
                    {(item.ml_reorder_quantity > 0 || item.reorder_quantity > 0) && (
                      <div style={{ background: "#fee2e2", padding: "12px", borderRadius: "10px" }}>
                        <div style={{ color: "#dc2626", fontSize: "11px", fontWeight: "700", marginBottom: "4px" }}>⚡ REORDER QTY</div>
                        <div style={{ fontSize: "22px", fontWeight: "800", color: "#b91c1c" }}>
                          {item.ml_reorder_quantity || item.reorder_quantity}
                        </div>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>units to order</div>
                      </div>
                    )}
                  </div>

                  {/* Insight */}
                  <div style={{
                    padding: "10px 14px", borderRadius: "8px",
                    background: "#f9fafb", border: "1px solid #e2e8f0",
                    fontSize: "13px", color: "#374151"
                  }}>
                    <strong style={{ color: "#1e293b" }}>AI Insight: </strong>
                    {item.ml_reason || item.reason || "Inventory is at optimal levels."}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Page>
    );
  };


  // ==========================================
  // PROFILE PAGE (USER INFO & EDIT FORM)
  // ==========================================

  const ProfilePage = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
      full_name: userProfile.full_name || "",
      phone: userProfile.phone || "",
      city: userProfile.city || "",
      address: userProfile.address || ""
    });
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState("");
    const [profileError, setProfileError] = useState("");

    const handleEditChange = (e) => {
      const { name, value } = e.target;
      setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async (e) => {
      e.preventDefault();
      try {
        setProfileSaving(true);
        setProfileSuccess("");
        setProfileError("");

        const token = localStorage.getItem("demandiq_token");

        const res = await fetch(`${API}/auth/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(editForm)
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to update profile");
        }

        if (data.customer) {
          setUserProfile(data.customer);
          localStorage.setItem("demandiq_customer", JSON.stringify(data.customer));
        }

        setProfileSuccess("Profile updated successfully!");
        setIsEditing(false);
      } catch (err) {
        setProfileError(err.message);
      } finally {
        setProfileSaving(false);
      }
    };

    return (
      <Page
        title="Account Profile"
        subtitle="Manage your business credentials, contact information, and store details"
      >
        {profileSuccess && (
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
            ✓ {profileSuccess}
          </div>
        )}

        {profileError && (
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
            ⚠ {profileError}
          </div>
        )}

        {/* HERO USER PROFILE CARD */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
            color: "white",
            padding: "30px",
            borderRadius: "16px",
            marginBottom: "24px",
            boxShadow: "0 10px 25px rgba(30, 58, 138, 0.2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(10px)",
                border: "2px solid rgba(255, 255, 255, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: "700"
              }}
            >
              {userProfile.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700" }}>
                {userProfile.full_name || "DemandIQ User"}
              </h2>
              <p style={{ margin: "4px 0 0 0", opacity: 0.9, fontSize: "14px" }}>
                {userProfile.email}
              </p>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <span
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}
                >
                  Account ID: #{userProfile.customer_id || "1"}
                </span>
                <span
                  style={{
                    background: "#10b981",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}
                >
                  ● Verified Active
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setIsEditing(!isEditing);
              setProfileSuccess("");
              setProfileError("");
              setEditForm({
                full_name: userProfile.full_name || "",
                phone: userProfile.phone || "",
                city: userProfile.city || "",
                address: userProfile.address || ""
              });
            }}
            style={{
              padding: "12px 20px",
              background: "white",
              color: "#1e3a8a",
              border: "none",
              borderRadius: "10px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}
          >
            {isEditing ? "✕ Cancel Edit" : "✎ Edit Profile"}
          </button>
        </div>

        {/* EDIT PROFILE FORM */}
        {isEditing && (
          <form
            onSubmit={handleSaveProfile}
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "16px",
              marginBottom: "24px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)"
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "20px" }}>Update Contact & Location Details</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px"
              }}
            >
              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>Full Name</label>
                <input
                  name="full_name"
                  value={editForm.full_name}
                  onChange={handleEditChange}
                  required
                  style={productInputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>Mobile Phone Number</label>
                <input
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  placeholder="+91 9876543210"
                  style={productInputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>City</label>
                <input
                  name="city"
                  value={editForm.city}
                  onChange={handleEditChange}
                  placeholder="e.g. Mumbai, Delhi, Bengaluru"
                  style={productInputStyle}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>Address</label>
                <textarea
                  name="address"
                  value={editForm.address}
                  onChange={handleEditChange}
                  placeholder="Street, Building, Landmark, Pincode"
                  rows="3"
                  style={{
                    ...productInputStyle,
                    fontFamily: "inherit"
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button
                type="submit"
                disabled={profileSaving}
                style={{
                  padding: "12px 24px",
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                {profileSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  padding: "12px 20px",
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* DETAILS GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px"
          }}
        >
          {/* PERSONAL & CONTACT INFORMATION */}
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)"
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "18px", fontSize: "18px" }}>
              👤 User Information
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={pageStyles.row}>
                <span style={{ color: "#6b7280" }}>Full Name</span>
                <strong>{userProfile.full_name || "N/A"}</strong>
              </div>

              <div style={pageStyles.row}>
                <span style={{ color: "#6b7280" }}>Email Address</span>
                <strong>{userProfile.email || "N/A"}</strong>
              </div>

              <div style={pageStyles.row}>
                <span style={{ color: "#6b7280" }}>Mobile Number</span>
                <strong style={{ color: userProfile.phone ? "#111827" : "#9ca3af" }}>
                  {userProfile.phone || "Not specified"}
                </strong>
              </div>

              <div style={pageStyles.row}>
                <span style={{ color: "#6b7280" }}>City</span>
                <strong>{userProfile.city || "Not specified"}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingTop: "8px", borderTop: "1px solid #f3f4f6" }}>
                <span style={{ color: "#6b7280", flexShrink: 0 }}>Business Address</span>
                <strong style={{ textAlign: "right", maxWidth: "60%", color: userProfile.address ? "#111827" : "#9ca3af" }}>
                  {userProfile.address || "Not specified"}
                </strong>
              </div>
            </div>
          </div>

          {/* STORE & DATA ISOLATION METRICS */}
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)"
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "18px", fontSize: "18px" }}>
              🏬 Your Business Summary
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px" }}>
                <small style={{ color: "#64748b" }}>Your Products</small>
                <div style={{ fontSize: "20px", fontWeight: "700", marginTop: "4px" }}>{products.length}</div>
              </div>

              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px" }}>
                <small style={{ color: "#64748b" }}>Current Stock</small>
                <div style={{ fontSize: "20px", fontWeight: "700", marginTop: "4px" }}>{summary.total_stock || 0} units</div>
              </div>

              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px" }}>
                <small style={{ color: "#64748b" }}>Total Sales</small>
                <div style={{ fontSize: "20px", fontWeight: "700", marginTop: "4px" }}>{sales.length} orders</div>
              </div>

              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px" }}>
                <small style={{ color: "#64748b" }}>Total Revenue</small>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#059669", marginTop: "4px" }}>
                  {money(summary.total_revenue)}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "18px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#eff6ff",
                border: "1px solid #dbeafe",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "13px",
                color: "#1e40af"
              }}
            >
              <span>🔒</span>
              <span>
                <strong>Private Workspace:</strong> Your inventory, sales, and AI predictions are completely isolated to this customer account.
              </span>
            </div>
          </div>
        </div>
      </Page>
    );
  };


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

      case "profile":
        return <ProfilePage />;

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

        {/* LOGGED IN USER CARD */}
        <div
          onClick={() => setPage("profile")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 12px",
            margin: "12px 14px 16px 14px",
            borderRadius: "10px",
            background: page === "profile" ? "rgba(59, 130, 246, 0.2)" : "rgba(255, 255, 255, 0.06)",
            border: page === "profile" ? "1px solid rgba(59, 130, 246, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "14px",
              flexShrink: 0
            }}
          >
            {userProfile.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div style={{ overflow: "hidden" }}>
            <strong style={{ display: "block", color: "#f3f4f6", fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {userProfile.full_name || "My Account"}
            </strong>
            <small style={{ color: "#9ca3af", fontSize: "11px", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {userProfile.phone || userProfile.email || "View details"}
            </small>
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

