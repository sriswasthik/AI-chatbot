import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
// import { useEffect, useState } from "react";
import { getCurrentUser } from "../services/auth.service";

export default function AuthProvider({ children }) {
  const [user, setUser] =useState(null);
  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  const logout = () => {
    setUser(null);
    setToken(null);
  };

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

useEffect(() => {
  async function restoreUser() {
    if (!token) return;

    try {
      const data = await getCurrentUser();

      setUser(data.user);
    } catch {
      logout();
    }
  }

  restoreUser();
}, []);