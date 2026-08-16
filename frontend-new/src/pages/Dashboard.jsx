import { useState, useEffect } from 'react';
import { 
    productAPI, 
    inventoryAPI, 
    recommendationAPI, 
    analyticsAPI, 
    alertsAPI 
} from '../services/api';
import '../App.css';

// ==========================================
// DASHBOARD COMPONENT
// ==========================================

export default function Dashboard() {
    // State management
    const [user, setUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Load user from localStorage
    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(userData);
    }, []);

    // Fetch all dashboard data
    useEffect(() => {
        if (user?.customer_id) {
            loadDashboardData();
        }
    }, [user]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all data in parallel
            const [productsRes, inventoryRes, predictionsRes, analyticsRes, alertsRes] = 
                await Promise.all([
                    productAPI.getAll().catch(() => ({ data: { data: [] } })),
                    inventoryAPI.getAll().catch(() => ({ data: { data: [] } })),
                    recommendationAPI.getAll().catch(() => ({ data: { data: [] } })),
                    analyticsAPI.getSummary().catch(() => ({ data: { data: {} } })),
                    alertsAPI.getAll().catch(() => ({ data: { data: [] } }))
                ]);

            setProducts(productsRes.data?.data || []);
            setInventory(inventoryRes.data?.data || []);
            setPredictions(predictionsRes.data?.data || []);
            setAnalytics(analyticsRes.data?.data || {});
            setAlerts(alertsRes.data?.data || []);
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    if (loading) {
        return <div style={styles.container}><p>Loading dashboard...</p></div>;
    }

    return (
        <div style={styles.container}>
            {/* HEADER */}
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <h1>🎯 DemandIQ Dashboard</h1>
                    <div style={styles.userSection}>
                        <span>Welcome, {user?.full_name || 'User'}</span>
                        <button onClick={handleLogout} style={styles.logoutBtn}>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {error && <div style={styles.error}>{error}</div>}

            {/* TAB NAVIGATION */}
            <div style={styles.tabs}>
                <button 
                    onClick={() => setActiveTab('overview')}
                    style={{...styles.tab, ...(activeTab === 'overview' ? styles.activeTab : {})}}
                >
                    📊 Overview
                </button>
                <button 
                    onClick={() => setActiveTab('predictions')}
                    style={{...styles.tab, ...(activeTab === 'predictions' ? styles.activeTab : {})}}
                >
                    🔮 Predictions
                </button>
                <button 
                    onClick={() => setActiveTab('inventory')}
                    style={{...styles.tab, ...(activeTab === 'inventory' ? styles.activeTab : {})}}
                >
                    📦 Inventory
                </button>
                <button 
                    onClick={() => setActiveTab('alerts')}
                    style={{...styles.tab, ...(activeTab === 'alerts' ? styles.activeTab : {})}}
                >
                    ⚠️ Alerts ({alerts.length})
                </button>
            </div>

            {/* CONTENT AREA */}
            <div style={styles.content}>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div>
                        <h2>Dashboard Overview</h2>
                        <div style={styles.grid}>
                            <div style={styles.card}>
                                <h3>📦 Total Products</h3>
                                <p style={styles.bigNumber}>{products.length}</p>
                            </div>
                            <div style={styles.card}>
                                <h3>📊 Total Inventory</h3>
                                <p style={styles.bigNumber}>
                                    {inventory.reduce((sum, inv) => sum + (inv.current_stock || 0), 0)}
                                </p>
                            </div>
                            <div style={styles.card}>
                                <h3>🔮 Predictions Ready</h3>
                                <p style={styles.bigNumber}>{predictions.length}</p>
                            </div>
                            <div style={styles.card}>
                                <h3>⚠️ Active Alerts</h3>
                                <p style={styles.bigNumber}>{alerts.length}</p>
                            </div>
                        </div>

                        {/* Analytics Summary */}
                        {analytics && (
                            <div style={styles.card}>
                                <h3>📈 Key Metrics</h3>
                                <div style={styles.metricGrid}>
                                    <div>
                                        <p>Total Sales (This Month)</p>
                                        <p style={styles.metric}>₹{analytics.total_sales || 0}</p>
                                    </div>
                                    <div>
                                        <p>Average Demand</p>
                                        <p style={styles.metric}>{analytics.avg_demand || 0} units</p>
                                    </div>
                                    <div>
                                        <p>Stock Turnover</p>
                                        <p style={styles.metric}>{analytics.turnover_rate || 0}x</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* PREDICTIONS TAB */}
                {activeTab === 'predictions' && (
                    <div>
                        <h2>🔮 AI-Powered Predictions</h2>
                        {predictions.length > 0 ? (
                            <div>
                                {predictions.map((pred) => (
                                    <div key={pred.product_id} style={styles.card}>
                                        <div style={styles.predictionRow}>
                                            <div>
                                                <h4>{pred.product_name || `Product ${pred.product_id}`}</h4>
                                                <p>Category: {pred.category || 'N/A'}</p>
                                            </div>
                                            <div style={styles.predictionData}>
                                                <div>
                                                    <p>📊 Predicted Demand (Next 7 Days)</p>
                                                    <p style={styles.predict}>{pred.ml_predicted_demand || 0} units</p>
                                                </div>
                                                <div>
                                                    <p>📈 Confidence</p>
                                                    <p style={styles.predict}>{pred.confidence_score || 0}%</p>
                                                </div>
                                                <div>
                                                    <p>💡 Recommendation</p>
                                                    <p style={styles.recommend}>{pred.recommendation || 'Monitor'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={styles.empty}>No predictions available yet. Add products and inventory to get started!</p>
                        )}
                    </div>
                )}

                {/* INVENTORY TAB */}
                {activeTab === 'inventory' && (
                    <div>
                        <h2>📦 Inventory Management</h2>
                        {inventory.length > 0 ? (
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Product ID</th>
                                        <th>Current Stock</th>
                                        <th>Minimum Level</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventory.map((inv) => (
                                        <tr key={inv.id}>
                                            <td>{inv.product_id}</td>
                                            <td>{inv.current_stock}</td>
                                            <td>{inv.minimum_stock}</td>
                                            <td>
                                                <span style={{
                                                    ...styles.badge,
                                                    backgroundColor: inv.current_stock <= inv.minimum_stock ? '#ff6b6b' : '#51cf66'
                                                }}>
                                                    {inv.current_stock <= inv.minimum_stock ? '⚠️ Low' : '✅ OK'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p style={styles.empty}>No inventory data. Add products first!</p>
                        )}
                    </div>
                )}

                {/* ALERTS TAB */}
                {activeTab === 'alerts' && (
                    <div>
                        <h2>⚠️ System Alerts</h2>
                        {alerts.length > 0 ? (
                            <div>
                                {alerts.map((alert) => (
                                    <div key={alert.alert_id} style={styles.alertCard}>
                                        <h4>{alert.alert_type}</h4>
                                        <p>{alert.message}</p>
                                        <small>Product ID: {alert.product_id} | {new Date(alert.created_at).toLocaleString()}</small>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={styles.empty}>No active alerts! Everything is good.</p>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}

// ==========================================
// STYLES
// ==========================================

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f5f7fa',
        fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
        backgroundColor: '#1e3a8a',
        color: 'white',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    headerContent: {
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    userSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
    },
    logoutBtn: {
        padding: '8px 16px',
        backgroundColor: '#dc2626',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    tabs: {
        maxWidth: '1200px',
        margin: '20px auto',
        display: 'flex',
        gap: '10px',
        borderBottom: '2px solid #e5e7eb'
    },
    tab: {
        padding: '12px 20px',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        fontSize: '14px',
        borderBottom: '3px solid transparent'
    },
    activeTab: {
        borderBottomColor: '#1e3a8a',
        color: '#1e3a8a',
        fontWeight: 'bold'
    },
    content: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginTop: '15px'
    },
    card: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginTop: '15px'
    },
    bigNumber: {
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#1e3a8a',
        margin: '10px 0 0 0'
    },
    metricGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '15px',
        marginTop: '10px'
    },
    metric: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#059669'
    },
    predictionRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    predictionData: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '15px',
        textAlign: 'right'
    },
    predict: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#0891b2'
    },
    recommend: {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#7c3aed'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        marginTop: '15px'
    },
    badge: {
        padding: '4px 12px',
        borderRadius: '20px',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold'
    },
    alertCard: {
        backgroundColor: '#fef3c7',
        border: '1px solid #fcd34d',
        padding: '15px',
        borderRadius: '8px',
        marginTop: '10px'
    },
    empty: {
        textAlign: 'center',
        color: '#6b7280',
        padding: '40px 20px'
    },
    error: {
        maxWidth: '1200px',
        margin: '20px auto',
        padding: '15px',
        backgroundColor: '#fee2e2',
        color: '#dc2626',
        borderRadius: '8px'
    }
};
