import { useEffect, useState } from "react";

import { AuthContext } from "./AuthContext";
import { getCurrentUser } from "../services/auth.service";

import {
  getToken,
  setToken,
  removeToken,
} from "../utils/token";

export default function AuthProvider({ children }) {
  // Stores the currently logged-in user
  const [user, setUser] = useState(null);

  // Load existing JWT token when the application starts
  const [token, setTokenState] = useState(() => getToken());

  // Controls authentication restoration/loading
  const [authLoading, setAuthLoading] = useState(true);

  // Update token from components such as Login.jsx
  const updateToken = (newToken) => {
    setTokenState(newToken);
  };

  // Logout user
  const logout = () => {
    setUser(null);
    removeToken();
    setTokenState(null);
  };

  // Keep localStorage synchronized with token state
  useEffect(() => {
    if (token) {
      setToken(token);
    } else {
      removeToken();
    }
  }, [token]);

  // Restore authenticated user when app loads
  // or whenever the token changes
  useEffect(() => {
    async function restoreUser() {
      if (!token) {
        setUser(null);
        setAuthLoading(false);
        return;
      }

      try {
        setAuthLoading(true);

        const data = await getCurrentUser();

        setUser(data.user);
      } catch (error) {
        console.error(
          "Failed to restore authenticated user:",
          error
        );

        logout();
      } finally {
        setAuthLoading(false);
      }
    }

    restoreUser();
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,

        token,

        // Components can continue calling setToken(...)
        setToken: updateToken,

        logout,

        authLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}