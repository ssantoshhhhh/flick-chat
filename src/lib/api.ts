import axios from 'axios';

const API_URL = 'http://localhost:9000/api'; // Backend runs on port 9000

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Example usage:
// await api.post('/auth/login', { ... }); 