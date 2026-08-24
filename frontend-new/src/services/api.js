import axios from 'axios';

// ==========================================
// API CLIENT CONFIGURATION
// ==========================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('demandiq_token') || localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ==========================================
// AUTH ENDPOINTS
// ==========================================

export const authAPI = {
    signup: (data) => apiClient.post('/auth/signup', data),
    login: (data) => apiClient.post('/auth/login', data),
    getProfile: () => apiClient.get('/auth/profile'),
    updateProfile: (data) => apiClient.put('/auth/profile', data)
};

// ==========================================
// PRODUCT ENDPOINTS
// ==========================================

export const productAPI = {
    getAll: () => apiClient.get('/products'),
    getById: (id) => apiClient.get(`/products/${id}`),
    create: (data) => apiClient.post('/products', data),
    update: (id, data) => apiClient.put(`/products/${id}`, data),
    delete: (id) => apiClient.delete(`/products/${id}`)
};

// ==========================================
// INVENTORY ENDPOINTS
// ==========================================

export const inventoryAPI = {
    getAll: () => apiClient.get('/inventory'),
    getByProduct: (productId) => apiClient.get(`/inventory/product/${productId}`),
    create: (data) => apiClient.post('/inventory', data),
    updateStock: (id, data) => apiClient.put(`/inventory/${id}`, data)
};

// ==========================================
// SALES ENDPOINTS
// ==========================================

export const salesAPI = {
    getAll: () => apiClient.get('/sales'),
    getBySales: (saleId) => apiClient.get(`/sales/${saleId}`),
    record: (data) => apiClient.post('/sales', data)
};

// ==========================================
// PREDICTIONS & RECOMMENDATIONS
// ==========================================

export const recommendationAPI = {
    getAll: () => apiClient.get('/recommendations'),
    predict: (data) => apiClient.post('/recommendations/predict', data)
};

// ==========================================
// ANALYTICS ENDPOINTS
// ==========================================

export const analyticsAPI = {
    getSummary: () => apiClient.get('/analytics/summary'),
    getTrends: (days = 30) => apiClient.get(`/analytics/trends?days=${days}`),
    getMetrics: () => apiClient.get('/analytics/metrics')
};

// ==========================================
// ALERTS ENDPOINTS
// ==========================================

export const alertsAPI = {
    getAll: () => apiClient.get('/alerts'),
    acknowledge: (alertId) => apiClient.put(`/alerts/${alertId}/acknowledge`)
};

export default apiClient;
