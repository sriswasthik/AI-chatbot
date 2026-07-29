import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthProvider } from "../context/AuthProvider";

export default function ProtectedRoute({ children }) {
  const { user } = useContext(AuthProvider);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}