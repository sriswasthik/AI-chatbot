import { LogOut, Menu, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../hooks/useAuth";

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();

    toast.success("Logged out successfully");

    navigate("/login", { replace: true });
  }

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {/*
          The only way into the conversation list below md, where the
          sidebar is an overlay drawer rather than a column.
        */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle conversations"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-800 hover:text-white md:hidden"
        >
          <Menu size={20} />
        </button>

        <h1 className="truncate text-base font-bold text-white sm:text-xl">
          Enterprise AI Chatbot
        </h1>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2 sm:gap-4">
        {user && (
          <div className="hidden items-center gap-2 text-sm text-slate-300 sm:flex">
            <User size={17} className="text-slate-400" />

            <span className="max-w-[12rem] truncate">
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
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
