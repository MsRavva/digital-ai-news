'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './ui/code-block'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <>
      <div className={cn(
        'prose dark:prose-invert max-w-none',
        'prose-headings:text-slate-900 dark:prose-headings:text-slate-100',
        'prose-p:text-slate-800 dark:prose-p:text-slate-200',
        'prose-strong:text-slate-900 dark:prose-strong:text-white',
        'prose-em:text-slate-800 dark:prose-em:text-slate-200',
        'prose-li:text-slate-800 dark:prose-li:text-slate-200',
        'prose-blockquote:text-slate-800 dark:prose-blockquote:text-slate-200 prose-blockquote:border-[hsl(var(--saas-purple))]',
        'prose-a:text-[hsl(var(--saas-purple))] dark:prose-a:text-[hsl(var(--saas-purple-light))] prose-a:no-underline hover:prose-a:underline',
        className
      )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''

            if (inline) {
              return (
                <code className={cn(
                  'px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium border border-slate-200 dark:border-slate-700',
                  className
                )} {...props}>
                  {children}
                </code>
              )
            }

            return (
              <CodeBlock
                code={String(children).replace(/\n$/, '')}
                language={language}
              />
            )
          },
          img({ node, ...props }) {
            // Проверяем, что src не пустой
            if (!props.src) {
              return null;
            }

            // Проверяем, что src является действительным URL или base64-строкой
            const src = props.src;
            const isBase64 = src.startsWith('data:image/');
            const isUrl = src.startsWith('http://') || src.startsWith('https://');

            // Если это base64-изображение, добавляем специальную обработку
            if (isBase64) {
              console.log('Rendering base64 image, length:', src.length);
              console.log('Base64 image starts with:', src.substring(0, 50) + '...');
              try {
                // Проверяем, что base64-строка корректна
                if (src.length < 1000000) { // Ограничиваем размер для предотвращения проблем с производительностью
                  return (
                    <img
                      {...props}
                      src={src}
                      className="max-w-full h-auto my-4 rounded-md shadow-md base64-image"
                      loading="lazy"
                      alt={props.alt || 'Изображение'}
                      onError={(e) => {
                        console.error('Error loading base64 image');
                        e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Изображение+недоступно';
                        e.currentTarget.alt = 'Изображение недоступно';
                      }}
                    />
                  );
                } else {
                  console.warn('Base64 image too large, not rendering');
                  return (
                    <div className="max-w-full p-4 my-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-md">
                      Изображение слишком большое для отображения
                    </div>
                  );
                }
              } catch (error) {
                console.error('Error processing base64 image:', error);
                return (
                  <div className="max-w-full p-4 my-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-md">
                    Ошибка при обработке изображения
                  </div>
                );
              }
            }

            // Для обычных URL-изображений
            return (
              <img
                {...props}
                src={src}
                className="max-w-full h-auto my-4 rounded-md shadow-md"
                loading="lazy"
                alt={props.alt || 'Изображение'}
                onError={(e) => {
                  console.error('Error loading image:', src);
                  // Устанавливаем замещающее изображение
                  e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Изображение+недоступно';
                  e.currentTarget.alt = 'Изображение недоступно';
                }}
              />
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
      </div>

      {/* Глобальные стили для обработки base64-изображений */}
      <style jsx global>{`
        /* Стили для base64-изображений */
        .base64-image {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 1rem 0;
          border-radius: 0.375rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        /* Исправление для отображения изображений в темной теме */
        .dark .markdown-content img {
          filter: brightness(0.95);
        }

        /* Обеспечиваем, чтобы все изображения были видимы */
        .markdown-content img {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 1rem 0;
        }
      `}</style>
    </>
  )
}
