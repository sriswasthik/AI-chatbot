import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const { logout } = useContext(AuthContext);

<button
  onClick={logout}
  className="rounded bg-red-600 px-4 py-2"
>
  Logout
</button>

export default function Navbar() {
  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center px-6">
      <h1 className="text-xl font-bold">
        Enterprise AI Chatbot
      </h1>
    </header>
  );
}