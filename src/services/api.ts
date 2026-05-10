import axios from 'axios';

// Centralized API Configuration
// ALL API calls will be prefixed with this base URL.
// In dev: empty string (proxied to localhost:3003)
// In prod: /adminbxp (or whatever is set in .env)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Create axios instance — baseURL is empty so calls stay on the frontend port
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERCEPTORS
// ─────────────────────────────────────────────────────────────────────────────

// Request Interceptor: Attach JWT Authorization header
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('alphabag_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle auth expiry
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        // Handle unauthorized / expired sessions
        if (error.response?.status === 401) {
            sessionStorage.removeItem('alphabag_token');
            sessionStorage.removeItem('alphabag_user');
            
            // Redirect to landing if we are in a protected area
            if (window.location.hash !== '#/' && window.location.hash !== '#/airdrop') {
                window.location.hash = '#/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
