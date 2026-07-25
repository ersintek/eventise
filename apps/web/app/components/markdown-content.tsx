import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

type MarkdownContentProps = {
  children: string;
  className?: string;
};

/**
 * Shared renderer for editor previews and public-facing Markdown.
 * Raw HTML stays disabled and generated HTML is sanitized.
 */
export function MarkdownContent({ children, className = 'prose' }: MarkdownContentProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeSanitize]}
        skipHtml
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
