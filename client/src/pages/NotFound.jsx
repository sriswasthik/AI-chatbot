import { Link } from "react-router-dom";
import { Home, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
        <SearchX size={32} />
      </div>

      <h1 className="mt-6 text-4xl font-bold text-white">404</h1>

      <p className="mt-2 text-slate-400">
        We could not find the page you were looking for.
      </p>

      <Link
        to="/"
        className="mt-8 flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700"
      >
        <Home size={18} />
        Back to chat
      </Link>
    </div>
  );
}
