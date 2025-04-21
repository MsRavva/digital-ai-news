'use client'

import React, { useEffect, useState } from 'react'
import MarkdownIt from 'markdown-it'
import { cn } from '@/lib/utils'
import { Copy, Check } from 'lucide-react'

interface MarkdownItRendererProps {
  content: string
  className?: string
}

export function MarkdownItRenderer({ content, className }: MarkdownItRendererProps) {
  const [renderedContent, setRenderedContent] = useState<string>('')
  const [copiedCodeBlockId, setCopiedCodeBlockId] = useState<string | null>(null)

  // Функция для копирования кода
  const copyCodeToClipboard = (code: string, blockId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeBlockId(blockId);
    setTimeout(() => setCopiedCodeBlockId(null), 2000);
  };

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
      highlight: function (str, lang) {
        return ''; // Пустая строка, так как мы будем использовать собственную обработку
      }
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

    // Функция для экранирования HTML
    const escapeHtml = (text: string) => {
      const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text.replace(/[&<>"']/g, (m) => map[m]);
    };

    // Настраиваем обработку встроенных блоков кода (inline code)
    mdParser.renderer.rules.code_inline = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const code = token.content;

      return `<code class="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium border border-slate-200 dark:border-slate-700">${escapeHtml(code)}</code>`;
    };

    // Настраиваем обработку блоков кода
    mdParser.renderer.rules.fence = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const code = token.content.trim();
      const lang = token.info ? token.info.trim() : '';
      const blockId = `code-block-${idx}`;

      return `
        <div class="code-block-wrapper">
          <pre class="relative overflow-x-auto rounded-md bg-slate-50 dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 my-4">
            ${lang ? `<span class="absolute left-2 top-2 z-10 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">${lang}</span>` : ''}
            <button
              class="copy-button absolute right-2 top-2 z-10 rounded-md p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 transition-all hover:bg-slate-300 dark:hover:bg-slate-600"
              data-code="${code.replace(/"/g, '&quot;')}"
              data-block-id="${blockId}"
              aria-label="Копировать код"
              onclick="window.copyCodeBlock(this.dataset.code, this.dataset.blockId)"
            >
              <svg class="copy-icon h-5 w-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              <svg class="check-icon h-5 w-5 hidden" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
            <code class="block p-4 pt-10 ${lang ? `language-${lang}` : ''}">${escapeHtml(code)}</code>
          </pre>
        </div>
      `;
    };

    // Рендерим контент
    const html = mdParser.render(content || '');
    console.log('MarkdownItRenderer: Rendered HTML length:', html.length);
    console.log('MarkdownItRenderer: HTML contains img tag:', html.includes('<img'));
    console.log('MarkdownItRenderer: HTML contains base64:', html.includes('data:image/'));
    setRenderedContent(html);
  }, [content]);

  // Добавляем функцию копирования кода в глобальный объект window
  useEffect(() => {
    // @ts-ignore
    window.copyCodeBlock = (code: string, blockId: string) => {
      copyCodeToClipboard(code, blockId);

      // Находим кнопку и меняем иконку
      const button = document.querySelector(`button[data-block-id="${blockId}"]`);
      if (button) {
        const copyIcon = button.querySelector('.copy-icon');
        const checkIcon = button.querySelector('.check-icon');

        if (copyIcon && checkIcon) {
          copyIcon.classList.add('hidden');
          checkIcon.classList.remove('hidden');

          setTimeout(() => {
            copyIcon.classList.remove('hidden');
            checkIcon.classList.add('hidden');
          }, 2000);
        }
      }
    };

    return () => {
      // @ts-ignore
      delete window.copyCodeBlock;
    };
  }, []);

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

      {/* Глобальные стили для обработки base64-изображений и блоков кода */}
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

        /* Стили для блоков кода */
        .code-block-wrapper {
          display: inline-block;
          max-width: 100%;
          width: auto;
          margin: 1rem 0;
        }

        .code-block-wrapper pre {
          margin: 0;
          overflow-x: auto;
          width: auto;
          display: inline-block;
          max-width: 100%;
        }

        .code-block-wrapper code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.875rem;
          line-height: 1.5;
          white-space: pre;
        }

        .code-block-wrapper .copy-button {
          opacity: 0.8;
          transition: opacity 0.2s, transform 0.2s;
        }

        .code-block-wrapper:hover .copy-button {
          opacity: 1;
        }

        .code-block-wrapper .copy-button:hover {
          transform: scale(1.05);
        }

        .code-block-wrapper .copy-button:active {
          transform: scale(0.95);
        }

        .hidden {
          display: none;
        }
      `}</style>
    </>
  )
}
