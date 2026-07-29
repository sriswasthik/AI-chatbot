import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-10 items-center">

        {/* Left Side */}
        <div className="hidden md:block">
          <h1 className="text-5xl font-bold text-white leading-tight">
            Enterprise AI Chatbot
          </h1>

          <p className="mt-6 text-lg text-slate-400">
            Learn Azure OpenAI, React, Node.js, and Azure Cosmos DB
            by building a production-ready AI application.
          </p>
        </div>

        {/* Right Side */}
        <div>
          <Outlet />
        </div>

      </div>
    </div>
  );
}