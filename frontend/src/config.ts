import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const AI_BASE_URL = import.meta.env.VITE_AI_URL || '/ai';

const config = {
    API_BASE_URL,
    AI_BASE_URL,
    NETWORK_ID: 'ondc-sandbox-v1',
    SUPPORT_EMAIL: 'support@team-initiative.gov.in'
};

// Attach JWT token automatically
axios.interceptors.request.use(
    (axiosConfig) => {
        const token = localStorage.getItem('authToken');
        if (token && axiosConfig.headers) {
            if (typeof (axiosConfig.headers as any).set === 'function') {
                (axiosConfig.headers as any).set('Authorization', `Bearer ${token}`);
            } else {
                (axiosConfig.headers as any)['Authorization'] = `Bearer ${token}`;
            }
        }
        return axiosConfig;
    },
    (error) => Promise.reject(error)
);

axios.defaults.timeout = 30000;

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;

        if (status === 401) {
            const url: string = error.config?.url || '';
            if (!url.includes('/auth/login') && !url.includes('/auth/send-otp')) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('authRole');
                localStorage.removeItem('authUserId');
                window.dispatchEvent(new CustomEvent('session-expired'));
                window.dispatchEvent(
                    new CustomEvent('app-notification', {
                        detail: { message: 'Session expired. Please login again.', type: 'error' }
                    })
                );
            }
        } else if (status === 500) {
            window.dispatchEvent(
                new CustomEvent('app-notification', {
                    detail: { message: 'Internal Server Error. Please try again later.', type: 'error' }
                })
            );
        } else if (error.code === 'ECONNABORTED') {
            window.dispatchEvent(
                new CustomEvent('app-notification', {
                    detail: { message: 'Request timed out. Please check your connection.', type: 'error' }
                })
            );
        } else if (!error.response) {
            window.dispatchEvent(
                new CustomEvent('app-notification', {
                    detail: { message: 'Network error. Please check your internet connection.', type: 'error' }
                })
            );
        }

        return Promise.reject(error);
    }
);

export default config;
