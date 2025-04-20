'use client'

import React, { useEffect, useState } from 'react'
import MarkdownIt from 'markdown-it'
import { cn } from '@/lib/utils'

interface MarkdownItRendererProps {
  content: string
  className?: string
}

export function MarkdownItRenderer({ content, className }: MarkdownItRendererProps) {
  const [renderedContent, setRenderedContent] = useState<string>('')

  useEffect(() => {
    console.log('MarkdownItRenderer: Rendering content');
    console.log('Content length:', content?.length || 0);
    console.log('Content contains base64 image:', content?.includes('data:image/') || false);

    // Инициализация парсера markdown
    const mdParser = new MarkdownIt({
      breaks: true,        // Конвертировать '\n' в <br>
      html: true,          // Разрешить HTML-теги
      linkify: true,       // Автоматически определять ссылки
      typographer: true,   // Включить типографские замены
    })

    // Настраиваем обработку изображений
    mdParser.renderer.rules.image = (tokens, idx, options, env, self) => {
      console.log('MarkdownItRenderer: Processing image token');

      const token = tokens[idx];
      const srcIndex = token.attrIndex('src');
      const altIndex = token.attrIndex('alt');

      if (srcIndex < 0) {
        console.log('MarkdownItRenderer: No src attribute found');
        return self.renderToken(tokens, idx, options);
      }

      const srcAttr = token.attrs[srcIndex];
      const src = srcAttr[1];

      // Проверяем, что src не пустой
      if (!src) {
        console.log('MarkdownItRenderer: Empty src attribute');
        return '';
      }

      const alt = altIndex >= 0 ? token.attrs[altIndex][1] : 'Изображение';

      // Проверяем, является ли это base64-изображение
      const isBase64 = src.startsWith('data:image/');

      if (isBase64) {
        console.log('MarkdownItRenderer: Found base64 image');
        console.log('Base64 image starts with:', src.substring(0, 50) + '...');
      } else {
        console.log('MarkdownItRenderer: Found regular image URL:', src);
      }

      // Добавляем специальный класс для base64-изображений
      const className = isBase64
        ? "max-w-full h-auto my-4 rounded-md shadow-md base64-image"
        : "max-w-full h-auto my-4 rounded-md shadow-md";

      // Добавляем обработку ошибок загрузки изображения
      return `<img src="${src}" alt="${alt}" class="${className}" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/400x300?text=Изображение+недоступно'; this.alt='Изображение недоступно';" />`;
    };

    // Рендерим контент
    const html = mdParser.render(content || '');
    console.log('MarkdownItRenderer: Rendered HTML length:', html.length);
    console.log('MarkdownItRenderer: HTML contains img tag:', html.includes('<img'));
    console.log('MarkdownItRenderer: HTML contains base64:', html.includes('data:image/'));
    setRenderedContent(html);
  }, [content]);

  return (
    <>
      <div
        className={cn(
          'prose dark:prose-invert max-w-none',
          'prose-headings:text-slate-900 dark:prose-headings:text-slate-100',
          'prose-p:text-slate-800 dark:prose-p:text-slate-200',
          'prose-strong:text-slate-900 dark:prose-strong:text-white',
          'prose-em:text-slate-800 dark:prose-em:text-slate-200',
          'prose-li:text-slate-800 dark:prose-li:text-slate-200',
          'prose-blockquote:text-slate-800 dark:prose-blockquote:text-slate-200 prose-blockquote:border-[hsl(var(--saas-purple))]',
          'prose-a:text-[hsl(var(--saas-purple))] dark:prose-a:text-[hsl(var(--saas-purple-light))] prose-a:no-underline hover:prose-a:underline',
          className
        )}
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />

      {/* Глобальные стили для обработки base64-изображений */}
      <style jsx global>{`
        /* Стили для base64-изображений */
        .base64-image {
          display: block !important;
          max-width: 100% !important;
          height: auto !important;
          margin: 1rem 0 !important;
          border-radius: 0.375rem !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
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
