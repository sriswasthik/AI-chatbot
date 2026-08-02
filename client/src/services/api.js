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
  (response) => response,

  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    const isLoginRequest =
      requestUrl.includes("/auth/login");

    const isRegisterRequest =
      requestUrl.includes("/auth/register");

    const isPublicAuthRequest =
      isLoginRequest || isRegisterRequest;

    // Handle expired/invalid authenticated sessions
    if (status === 401 && !isPublicAuthRequest) {
      removeToken();

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default api;