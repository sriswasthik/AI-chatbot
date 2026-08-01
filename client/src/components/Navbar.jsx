import { LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();

    toast.success("Logged out successfully");

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
      {/* Brand */}
      <h1 className="text-xl font-bold text-white">
        Enterprise AI Chatbot
      </h1>

      {/* User */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden items-center gap-2 text-sm text-slate-300 sm:flex">
            <User
              size={17}
              className="text-slate-400"
            />

            <span>
              {user.name || user.email}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={17} />
          <span className="hidden sm:inline">
            Logout
          </span>
        </button>
      </div>
    </header>
  );
}