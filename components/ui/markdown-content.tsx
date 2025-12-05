"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
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
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ className, children, ...props }) {
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
          pre({ children, ...props }) {
            // pre оборачивается автоматически react-markdown, но мы обрабатываем код внутри code компонента
            // Убираем ref и другие специфичные для pre пропсы, чтобы избежать конфликтов типов
            const { ref, ...divProps } = props as any;
            return <div {...divProps}>{children}</div>;
          },
          a({ href, children, ...props }) {
            if (disableLinks) {
              return (
                <span className="text-purple-600 dark:text-purple-400 underline" {...props}>
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
                {...props}
              >
                {children}
              </a>
            );
          },
          img({ src, alt, ...props }) {
            if (!src || typeof src !== "string") return null;

            const isUrl = src.startsWith("http://") || src.startsWith("https://");

            if (!isUrl) {
              return null;
            }

            return (
              <img
                {...props}
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
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
