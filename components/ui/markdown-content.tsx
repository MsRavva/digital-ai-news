"use client";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";
import { InlineCode } from "./inline-code";

interface MarkdownContentProps {
  content: string;
  className?: string;
  disableLinks?: boolean;
}

export function MarkdownContent({
  content,
  className,
  disableLinks = false,
}: MarkdownContentProps) {
  return (
    <div
      className={cn(
        "prose prose-zinc dark:prose-invert max-w-none",
        "prose-headings:font-bold prose-headings:tracking-tight",
        "prose-h1:text-4xl prose-h1:mb-4",
        "prose-h2:text-3xl prose-h2:mb-3 prose-h2:mt-8",
        "prose-h3:text-2xl prose-h3:mb-2 prose-h3:mt-6",
        "prose-p:leading-7 prose-p:mb-4 prose-p:break-words",
        "prose-a:no-underline hover:prose-a:underline prose-a:text-purple-600 dark:prose-a:text-purple-400 hover:prose-a:text-purple-700 dark:hover:prose-a:text-purple-300",
        "prose-pre:bg-transparent prose-pre:p-0 prose-pre:my-4",
        "prose-img:rounded-lg prose-img:shadow-md prose-img:max-w-full prose-img:h-auto prose-img:my-4",
        "prose-blockquote:border-l-4 prose-blockquote:border-zinc-300 dark:prose-blockquote:border-zinc-700",
        "prose-blockquote:pl-4 prose-blockquote:italic",
        "prose-ul:list-disc prose-ul:ml-6",
        "prose-ol:list-decimal prose-ol:ml-6",
        "prose-li:mb-1",
        "prose-table:border-collapse",
        "prose-th:border prose-th:border-zinc-300 dark:prose-th:border-zinc-700 prose-th:p-2 prose-th:bg-zinc-100 dark:prose-th:bg-zinc-800",
        "prose-td:border prose-td:border-zinc-300 dark:prose-td:border-zinc-700 prose-td:p-2",
        // Fallback-стили на случай, если prose-типографика недоступна.
        "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6",
        "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5",
        "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4",
        "[&_p]:leading-7 [&_p]:mb-4",
        "[&_ul]:list-disc [&_ul]:list-inside [&_ul]:pl-2 [&_ul]:mb-4",
        "[&_ol]:list-decimal [&_ol]:list-inside [&_ol]:pl-2 [&_ol]:mb-4",
        "[&_li::marker]:text-foreground",
        "[&_li]:mb-1",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1({ children, ...props }) {
            return (
              <h1 className="mt-6 mb-4 text-3xl font-bold" {...props}>
                {children}
              </h1>
            );
          },
          h2({ children, ...props }) {
            return (
              <h2 className="mt-5 mb-3 text-2xl font-semibold" {...props}>
                {children}
              </h2>
            );
          },
          h3({ children, ...props }) {
            return (
              <h3 className="mt-4 mb-2 text-xl font-semibold" {...props}>
                {children}
              </h3>
            );
          },
          p({ children, ...props }) {
            return (
              <p className="mb-4 leading-7 break-words" {...props}>
                {children}
              </p>
            );
          },
          ul({ children, ...props }) {
            return (
              <ul className="mb-4 list-inside list-disc pl-2" {...props}>
                {children}
              </ul>
            );
          },
          ol({ children, ...props }) {
            return (
              <ol className="mb-4 list-inside list-decimal pl-2" {...props}>
                {children}
              </ol>
            );
          },
          li({ children, ...props }) {
            return (
              <li className="mb-1" {...props}>
                {children}
              </li>
            );
          },
          code({ className, children, node, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : undefined;
            const codeContent = String(children).replace(/\n$/, "");

            // Инлайн код определяется по отсутствию языка и отсутствию переносов строк
            const isInline = !language && !codeContent.includes("\n");

            // Инлайн код (однострочный)
            if (isInline) {
              return <InlineCode className={className}>{codeContent}</InlineCode>;
            }

            // Многострочный код
            return <CodeBlock code={codeContent} language={language} className={className} />;
          },
          pre({ children, node, ...props }) {
            // pre оборачивается автоматически react-markdown, но мы обрабатываем код внутри code компонента
            // Убираем ref и другие специфичные для pre пропсы, чтобы избежать конфликтов типов
            const divProps = props as React.HTMLAttributes<HTMLDivElement>;
            return <div {...divProps}>{children}</div>;
          },
          a({ href, children, node, ref, ...props }) {
            const spanProps = props as React.HTMLAttributes<HTMLSpanElement>;
            const anchorProps = props as React.AnchorHTMLAttributes<HTMLAnchorElement>;
            if (disableLinks) {
              return (
                <span className="text-purple-600 dark:text-purple-400 underline" {...spanProps}>
                  {children}
                </span>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                {...anchorProps}
              >
                {children}
              </a>
            );
          },
          img({ src, alt, node, ref, ...props }) {
            const imgProps = props as React.ImgHTMLAttributes<HTMLImageElement>;
            if (!src || typeof src !== "string") return null;

            const isUrl = src.startsWith("http://") || src.startsWith("https://");

            if (!isUrl) {
              return null;
            }

            return (
              <img
                {...imgProps}
                src={src}
                alt={alt || "Изображение"}
                className="max-w-full h-auto my-4 rounded-lg shadow-md"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/400x300?text=Изображение+недоступно";
                  e.currentTarget.alt = "Изображение недоступно";
                }}
              />
            );
          },
          br() {
            // remark-breaks превращает одиночный перенос в <br>.
            // Делаем его блочным, чтобы визуально это был заметный перенос строки.
            return <br className="block h-3" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
