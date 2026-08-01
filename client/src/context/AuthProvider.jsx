import { useCallback, useEffect, useState } from "react";

import { AuthContext } from "./AuthContext";
import { getCurrentUser } from "../services/auth.service";

import {
  getToken,
  setToken as saveToken,
  removeToken,
} from "../utils/token";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [token, setTokenState] = useState(() => getToken());

  const [authLoading, setAuthLoading] = useState(true);

  // Save/remove token and update React state
  const updateToken = useCallback((newToken) => {
    if (newToken) {
      saveToken(newToken);
    } else {
      removeToken();
    }

    setTokenState(newToken);
  }, []);

  // Clear complete authentication state
  const logout = useCallback(() => {
    removeToken();
    setTokenState(null);
    setUser(null);
  }, []);

  // Restore authenticated user
  useEffect(() => {
    let cancelled = false;

    async function restoreUser() {
      if (!token) {
        if (!cancelled) {
          setUser(null);
          setAuthLoading(false);
        }

        return;
      }

      try {
        setAuthLoading(true);

        const data = await getCurrentUser();

        if (!cancelled) {
          setUser(data.user);
        }
      } catch (error) {
        console.error(
          "Failed to restore authenticated user:",
          error
        );

        if (!cancelled) {
          logout();
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    }

    restoreUser();

    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        setToken: updateToken,
        logout,
        authLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}