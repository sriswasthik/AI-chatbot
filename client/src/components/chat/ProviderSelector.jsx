import { ChevronDown, Sparkles } from "lucide-react";

import { useChat } from "../../hooks/useChat";

const LABELS = {
  auto: "Auto",
  groq: "Groq",
  gemini: "Gemini",
};

export default function ProviderSelector() {
  const { provider, setProvider, loading, availableProviders } =
    useChat();

  /*
  | Only offer providers the server actually has a key for. The list used
  | to be hardcoded, so selecting an unconfigured provider failed at send
  | time with a 503. "auto" is always valid -- the gateway resolves it.
  */

  const options = ["auto", ...availableProviders];

  /*
  | If a conversation was answered by a provider that is no longer
  | configured, keep it selectable rather than silently switching it.
  */

  if (provider && !options.includes(provider)) {
    options.push(provider);
  }

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
        aria-label="AI provider"
        className="appearance-none rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-9 text-sm text-slate-300 outline-none transition hover:border-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {options.map((value) => (
          <option key={value} value={value}>
            {LABELS[value] ||
              value.charAt(0).toUpperCase() + value.slice(1)}
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
