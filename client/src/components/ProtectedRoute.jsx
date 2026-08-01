import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Loader from "./ui/Loader";

export default function ProtectedRoute({ children }) {
  const { token, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}