import axios from 'axios';

const API_URL = 'http://localhost:9000/api'; // Backend runs on port 9000

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
  return config;
});

// Log response errors
api.interceptors.response.use(
  response => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  error => {
    console.error('API Error:', error.response?.status, error.response?.data, error.message);
    return Promise.reject(error);
  }
);

// Example usage:
// await api.post('/auth/login', { ... }); 