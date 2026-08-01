import axios from "axios";
import {
  getToken,
  removeToken,
} from "../utils/token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,

  headers: {
    "Content-Type": "application/json",
  },

  withCredentials: false,
});

// ==========================================
// REQUEST INTERCEPTOR
// ==========================================

api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// RESPONSE INTERCEPTOR
// ==========================================

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    const status = error.response?.status;

    const requestUrl = error.config?.url || "";

    // Login/register can legitimately return 401/other errors.
    // Don't globally redirect for authentication-page requests.
    const isAuthRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register");

    if (status === 401 && !isAuthRequest) {
      removeToken();

      // Prevent unnecessary repeated redirects
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default api;