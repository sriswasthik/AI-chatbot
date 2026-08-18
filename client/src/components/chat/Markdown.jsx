import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

/*
|--------------------------------------------------------------------------
| Markdown rendering
|--------------------------------------------------------------------------
|
| Assistant replies are markdown. The bubble previously relied on Tailwind's
| `prose` classes, but the typography plugin is not installed, so every
| heading, list, table and code block rendered as flat unstyled text.
|
| These element overrides style the subset of markdown a chat model
| actually emits. remark-gfm is required for tables, strikethrough and
| task lists -- react-markdown alone is CommonMark only, so a model's
| table would render as a wall of raw pipe characters.
*/

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);

      setCopied(true);

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  }

  return (
    <div className="group/code relative my-3 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
          {language || "code"}
        </span>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code"
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              Copied
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Long lines scroll inside the block instead of stretching the page. */}
      <pre className="overflow-x-auto p-3">
        <code className="font-mono text-[13px] leading-relaxed text-slate-200">
          {code}
        </code>
      </pre>
    </div>
  );
}

const components = {
  code({ inline, className, children, ...props }) {
    const code = String(children).replace(/\n$/, "");

    /*
    | react-markdown reports fenced blocks via a `language-*` class. Some
    | versions omit `inline`, so a newline is used as a secondary signal.
    */

    const match = /language-(\w+)/.exec(className || "");

    const isBlock =
      inline === false || Boolean(match) || code.includes("\n");

    if (!isBlock) {
      return (
        <code
          className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[13px] text-amber-300"
          {...props}
        >
          {children}
        </code>
      );
    }

    return <CodeBlock language={match?.[1]} code={code} />;
  },

  // The wrapper is supplied by CodeBlock, so <pre> passes through.
  pre: ({ children }) => <>{children}</>,

  p: ({ children }) => (
    <p className="mb-3 leading-relaxed last:mb-0">{children}</p>
  ),

  h1: ({ children }) => (
    <h1 className="mb-2 mt-4 text-lg font-bold first:mt-0">
      {children}
    </h1>
  ),

  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 text-base font-bold first:mt-0">
      {children}
    </h2>
  ),

  h3: ({ children }) => (
    <h3 className="mb-2 mt-3 text-sm font-semibold first:mt-0">
      {children}
    </h3>
  ),

  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">
      {children}
    </ul>
  ),

  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">
      {children}
    </ol>
  ),

  li: ({ children }) => (
    <li className="leading-relaxed">{children}</li>
  ),

  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
    >
      {children}
    </a>
  ),

  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-slate-600 pl-3 italic text-slate-400 last:mb-0">
      {children}
    </blockquote>
  ),

  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),

  hr: () => <hr className="my-4 border-slate-700" />,

  // Wide tables scroll rather than pushing the layout sideways.
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  ),

  th: ({ children }) => (
    <th className="border border-slate-700 bg-slate-800/60 px-2 py-1 text-left font-semibold">
      {children}
    </th>
  ),

  td: ({ children }) => (
    <td className="border border-slate-700 px-2 py-1">
      {children}
    </td>
  ),
};

/*
| Memoised: message content never changes once rendered, and re-parsing
| every bubble's markdown on each provider update is wasted work.
*/

function Markdown({ children }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  );
}

export default memo(Markdown);
