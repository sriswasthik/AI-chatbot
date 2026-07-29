export default function Card({ children }) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-lg shadow-2xl p-8">
      {children}
    </div>
  );
}