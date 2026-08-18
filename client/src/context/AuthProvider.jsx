import { useCallback, useEffect, useState } from "react";

import { AuthContext } from "./AuthContext";
import { getCurrentUser } from "../services/auth.service";

import {
  getToken,
  setToken as saveToken,
  removeToken,
  isTokenExpired,
  getTokenExpiry,
} from "../utils/token";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(() => {
    const stored = getToken();

    /*
    | A token that has already expired is worth nothing. Dropping it here
    | avoids a guaranteed-401 round trip and a flash of the app shell
    | before the redirect to login.
    */

    if (stored && isTokenExpired(stored)) {
      removeToken();

      return null;
    }

    return stored;
  });
  const [authLoading, setAuthLoading] = useState(true);

  const updateToken = useCallback((newToken) => {
    if (newToken) {
      saveToken(newToken);
    } else {
      removeToken();
    }

    setTokenState(newToken);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setTokenState(null);
    setUser(null);
    setAuthLoading(false);
  }, []);

  /*
  | Expire the session the moment the token does, rather than leaving the
  | UI looking signed in until the next request happens to fail.
  */

  useEffect(() => {
    if (!token) return;

    const expiresAt = getTokenExpiry(token);

    if (expiresAt === null) return;

    /*
    | setTimeout overflows above ~24.8 days and would fire immediately, so
    | very long-lived tokens are left to the server and the 401 handler.
    */

    const MAX_DELAY = 2 ** 31 - 1;

    const msRemaining = expiresAt - Date.now();

    if (msRemaining > MAX_DELAY) return;

    /*
    | Always scheduled rather than called inline: logging out synchronously
    | inside an effect body triggers a cascading render.
    */

    const timer = setTimeout(
      logout,
      Math.max(0, msRemaining)
    );

    return () => clearTimeout(timer);
  }, [token, logout]);

  useEffect(() => {
    let cancelled = false;

    async function restoreUser() {
      // No token = definitely logged out
      if (!token) {
        if (!cancelled) {
          setUser(null);
          setAuthLoading(false);
        }

        return;
      }

      try {
        if (!cancelled) {
          setAuthLoading(true);
        }

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
          removeToken();
          setTokenState(null);
          setUser(null);
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
  }, [token]);

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