'use client'

import React, { useEffect, useState } from 'react'
import MarkdownIt from 'markdown-it'

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
    // Инициализация парсера markdown
    const mdParser = new MarkdownIt({
      breaks: true,        // Конвертировать '\n' в <br>
      html: true,          // Разрешить HTML-теги
      linkify: true,       // Автоматически определять ссылки
      typographer: true,   // Включить типографские замены
    })

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

    // Настраиваем обработку изображений
    mdParser.renderer.rules.image = (tokens, idx) => {
      const token = tokens[idx];
      const srcIndex = token.attrIndex('src');
      const altIndex = token.attrIndex('alt');

      if (!token.attrs || srcIndex < 0) {
        return '';
      }

      const srcAttr = token.attrs[srcIndex];
      const src = srcAttr ? srcAttr[1] : '';

      if (!src) {
        return '';
      }

      const alt = (token.attrs && altIndex >= 0 && token.attrs[altIndex]) ? token.attrs[altIndex][1] : 'Изображение';
      const isBase64 = src.startsWith('data:image/');
      const className = isBase64 ? "base64-image" : "";

      return `<img src="${src}" alt="${alt}" class="${className}" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/400x300?text=Изображение+недоступно'; this.alt='Изображение недоступно';" />`;
    };

    // Настраиваем обработку встроенных блоков кода (inline code)
    mdParser.renderer.rules.code_inline = (tokens, idx) => {
      const token = tokens[idx];
      const code = token.content;

      return `<code>${escapeHtml(code)}</code>`;
    };

    // Настраиваем обработку блоков кода
    mdParser.renderer.rules.fence = (tokens, idx) => {
      const token = tokens[idx];
      const code = token.content.trim();
      const lang = token.info ? token.info.trim() : '';
      const blockId = `code-block-${idx}`;

      return `
        <div class="code-block">
          ${lang ? `<div class="language-label">${lang}</div>` : ''}
          <pre>
            <button
              class="copy-button"
              data-code="${code.replace(/"/g, '"')}"
              data-block-id="${blockId}"
              aria-label="Копировать код"
              onclick="window.copyCodeBlock(this.dataset.code, this.dataset.blockId)"
            >
              <svg class="copy-icon h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              <svg class="check-icon h-4 w-4 hidden" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
            <code class="${lang ? `language-${lang}` : ''}">${escapeHtml(code)}</code>
          </pre>
        </div>
      `;
    };

    // Рендерим контент
    const html = mdParser.render(content || '');
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
    <div className={`markdown-content ${className || ''}`} dangerouslySetInnerHTML={{ __html: renderedContent }} />
  )
}
