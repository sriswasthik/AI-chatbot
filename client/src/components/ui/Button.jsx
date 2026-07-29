export default function Button({
  children,
  loading = false,
  type = "button",
}) {
  return (
    <button
      type={type}
      disabled={loading}
      className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          <span>Signing In...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}