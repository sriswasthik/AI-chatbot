import { ChevronDown, Sparkles } from "lucide-react";

import { useChat } from "../../hooks/useChat";

const providers = [
  {
    value: "auto",
    label: "Auto",
  },
  {
    value: "groq",
    label: "Groq",
  },
  {
    value: "gemini",
    label: "Gemini",
  },
//   {
//     value: "openrouter",
//     label: "OpenRouter",
//   },
//   {
//     value: "openai",
//     label: "OpenAI",
//   },
];

export default function ProviderSelector() {
  const { provider, setProvider, loading } = useChat();

  return (
    <div className="relative">
      <Sparkles
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <select
        value={provider}
        onChange={(event) => setProvider(event.target.value)}
        disabled={loading}
        className="
          appearance-none
          rounded-lg
          border
          border-slate-700
          bg-slate-900
          py-2
          pl-9
          pr-9
          text-sm
          text-slate-300
          outline-none
          transition
          hover:border-slate-600
          focus:border-blue-500
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        {providers.map((item) => (
          <option
            key={item.value}
            value={item.value}
          >
            {item.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}