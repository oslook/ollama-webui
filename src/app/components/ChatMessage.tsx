import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';
import { UserIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

interface ChatMessageProps {
  role: string;
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div className={`chat ${role === 'user' ? 'chat-end' : 'chat-start'} mb-4 px-4 lg:px-8`}>
      <div className="chat-image avatar placeholder">
        <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center ring-1 ring-base-content/10">
          <div className="w-6 h-6 flex items-center justify-center">
            {role === 'user' ? (
              <UserIcon className="w-5 h-5 text-base-content/70" />
            ) : (
              <ComputerDesktopIcon className="w-5 h-5 text-base-content/70" />
            )}
          </div>
        </div>
      </div>
      <div className={`chat-bubble ${role === 'user' ? 'chat-bubble-neutral' : 'chat-bubble-neutral'} max-w-[85%] lg:max-w-[75%]`}>
        <div className={`prose ${role === 'user' ? 'prose-invert' : ''} prose-headings:text-base-content prose-strong:text-base-content prose-p:text-base-content max-w-none`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                if (inline) {
                  return (
                    <code
                      className={`${className || ''} rounded bg-base-300/50 px-1 text-base-content`}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }

                return (
                  <div className="rounded-lg overflow-hidden my-2">
                    <div className="bg-neutral-focus text-neutral-content text-xs px-3 py-1 flex items-center justify-between">
                      <span>{match?.[1] || 'code'}</span>
                      <button className="btn btn-xs btn-ghost" onClick={() => navigator.clipboard.writeText(String(children))}>
                        Copy
                      </button>
                    </div>
                    <SyntaxHighlighter
                      language={match ? match[1] : ''}
                      style={oneDark}
                      customStyle={{
                        margin: 0,
                        borderRadius: '0 0 0.5rem 0.5rem',
                      }}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                );
              },
              p({ children }) {
                return <p className="mb-4 last:mb-0 leading-7 text-base-content/90">{children}</p>;
              },
              ul({ children }) {
                return <ul className="list-disc list-inside mb-4 last:mb-0 space-y-1 text-base-content/90">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="list-decimal list-inside mb-4 last:mb-0 space-y-1 text-base-content/90">{children}</ol>;
              },
              table({ children }) {
                return (
                  <div className="overflow-x-auto mb-4 last:mb-0">
                    <table className="table table-zebra w-full text-base-content/90">{children}</table>
                  </div>
                );
              },
              a({ href, children }) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary font-medium"
                  >
                    {children}
                  </a>
                );
              },
              blockquote({ children }) {
                return (
                  <blockquote className="border-l-4 border-base-300 pl-4 my-4 text-base-content/90">
                    {children}
                  </blockquote>
                );
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
} 