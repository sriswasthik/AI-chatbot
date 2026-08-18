import axios from "axios";

import { getToken, removeToken } from "../utils/token";

const baseURL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

if (!import.meta.env.VITE_API_URL) {
  console.warn(
    `VITE_API_URL is not set. Falling back to ${baseURL}. See client/.env.example.`
  );
}

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

/*
| Attach the bearer token. The token itself is never logged.
*/

api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/*
|--------------------------------------------------------------------------
| 401 handling
|--------------------------------------------------------------------------
|
| An expired or invalid token used to leave the app in a broken state --
| every request failing while the UI still believed it was signed in.
| Clear the token and send the user to the login page instead.
|
| /auth/me is excluded because AuthProvider calls it precisely to discover
| that the stored token is dead, and handles that case itself.
*/

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    const url = error.config?.url || "";

    if (status === 401 && !url.includes("/auth/me")) {
      removeToken();

      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
