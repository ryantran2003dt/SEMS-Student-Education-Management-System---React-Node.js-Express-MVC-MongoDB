import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sems_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sems_token');
      localStorage.removeItem('sems_user');
      // If not already on login page, redirect
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    const responseData = error.response?.data;
    const message = responseData?.message || error.message || 'Lỗi kết nối máy chủ';
    const details = Array.isArray(responseData?.errors)
      ? responseData.errors.filter(Boolean).join('; ')
      : '';
    return Promise.reject(new Error(details ? `${message}: ${details}` : message));
  }
);

export default api;
