import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { getCurrentUser } from "../services/auth.service";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  // Save/remove token
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  // Logout
  const logout = () => {
    setUser(null);
    setToken(null);
  };

  // Restore logged in user
  useEffect(() => {
    async function restoreUser() {
      if (!token) return;

      try {
        const data = await getCurrentUser();

        setUser(data.user);
      } catch (error) {
        console.error(error);
        logout();
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
        setToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}