import { AlertCircle } from "lucide-react";

export default function Input({
  label,
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
        )}

        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full rounded-xl border bg-slate-950 py-3 pr-4 ${
            Icon ? "pl-11" : "pl-4"
          } outline-none transition

          ${
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          }`}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </div>
  );
}