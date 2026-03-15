import axios from 'axios';

// Create a centralized Axios instance to handle API calls
// This allows us to inject auth tokens automatically and handle global errors later.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002',
  headers: {
    'Content-Type': 'application/json',
  },
});
