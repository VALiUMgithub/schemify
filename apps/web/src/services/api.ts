import axios from "axios";
import type { AxiosInstance, AxiosResponse, AxiosError } from "axios";

/**
 * Canonical Axios instance for all API communication.
 *
 * Base URL is configured via the VITE_API_URL environment variable
 * (see .env.example). Falls back to localhost during development.
 *
 * All services import from this file — never create ad-hoc axios instances.
 */
export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3002/api",
  headers: {
    "Content-Type": "application/json",
  },
  // Fail requests that take longer than 15 seconds.
  timeout: 15_000,
});

// ─── Request interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Attach auth token here when authentication is implemented:
    // const token = authStore.getState().token;
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ message?: string; error?: string; code?: string; details?: unknown }>) => {
    const payload = error.response?.data;

    // Normalise error messages so callers get a consistent shape.
    const message =
      payload?.message ??
      payload?.error ??
      error.message ??
      "An unexpected error occurred.";

    // Attach a human-readable message to the error object.
    // Components / hooks can read error.message directly.
    error.message = message;

    // Bubble structured API error payload to callers for richer UI rendering.
    if (payload) {
      (error as AxiosError & { apiError?: typeof payload }).apiError = payload;
    }

    return Promise.reject(error);
  },
);
