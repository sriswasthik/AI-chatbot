import Card from "./Card";

export default function AuthCard({
  title,
  description,
  children,
  footer,
}) {
  return (
    <Card>
      <h1 className="mb-2 text-3xl font-bold text-white">
        {title}
      </h1>

      <p className="mb-8 text-slate-400">
        {description}
      </p>

      {children}

      {footer && (
        <div className="mt-6 text-center text-slate-400">
          {footer}
        </div>
      )}
    </Card>
  );
}