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
        'markdown-content prose dark:prose-invert max-w-none',
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
                <code className={className} {...props}>
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
                      className="base64-image"
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
                className="markdown-image"
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


    </>
  )
}
