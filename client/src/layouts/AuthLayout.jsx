import { Outlet } from "react-router-dom";
import { Bot, ShieldCheck, Database, Sparkles, Cpu } from "lucide-react";

export default function AuthLayout() {
  const features = [
    {
      icon: Sparkles,
      title: "Multi-Provider AI",
      description: "Gemini and Groq behind one gateway, with automatic fallback.",
    },
    {
      icon: Database,
      title: "MongoDB Persistence",
      description: "Conversations and messages stored securely per user.",
    },
    {
      icon: ShieldCheck,
      title: "Secure Authentication",
      description: "JWT authentication with protected routes.",
    },
    {
      icon: Cpu,
      title: "Modern Stack",
      description: "React, Vite, Node.js, Express & MongoDB.",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background Glow */}
      <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-2">
        {/* Left Side */}
        <div className="hidden flex-col justify-center px-12 lg:flex">
          <div className="mb-10 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-600 p-3">
              <Bot className="text-white" size={30} />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-white">
                Enterprise AI
              </h1>

              <p className="text-slate-400">
                Enterprise AI Chatbot
              </p>
            </div>
          </div>

          <h2 className="max-w-lg text-5xl font-bold leading-tight text-white">
            Build intelligent conversations on your own stack.
          </h2>

          <p className="mt-6 max-w-lg text-lg text-slate-400">
            Multi-provider AI, JWT authentication, and persistent
            conversation history in a production-ready chatbot.
          </p>

          <div className="mt-12 space-y-6">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="flex items-start gap-4"
                >
                  <div className="rounded-xl bg-slate-900 p-3">
                    <Icon
                      size={22}
                      className="text-blue-400"
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-white">
                      {feature.title}
                    </h3>

                    <p className="text-slate-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center justify-center p-6 lg:p-12">
          <Outlet />
        </div>
      </div>
    </div>
  );
}