import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  role: string;
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div
      className={`flex ${
        role === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          role === 'user'
            ? 'bg-primary text-white'
            : 'bg-base-200'
        }`}
      >
        <ReactMarkdown
          className="prose dark:prose-invert max-w-none"
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <div className="relative">
                  <SyntaxHighlighter
                    language={match[1]}
                    style={tomorrow}
                    PreTag="div"
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className={className} {...props}>
                  {String(children)}
                </code>
              );
            }
          }}
        >
          {String(content)}
        </ReactMarkdown>
      </div>
    </div>
  );
} 