'use client'

import dynamic from 'next/dynamic'
import MarkdownIt from 'markdown-it'
import { useState, useEffect } from 'react'
import 'react-markdown-editor-lite/lib/index.css'

// Динамический импорт для предотвращения проблем с SSR
const MdEditor = dynamic(() => import('react-markdown-editor-lite'), { ssr: false })

// Инициализация парсера markdown
const mdParser = new MarkdownIt({
  breaks: true,        // Конвертировать '\n' в <br>
  html: true,          // Разрешить HTML-теги
  linkify: true,       // Автоматически определять ссылки
  typographer: true,   // Включить типографские замены
})

// Настраиваем обработку изображений
mdParser.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const srcIndex = token.attrIndex('src');
  const altIndex = token.attrIndex('alt');

  if (srcIndex < 0) return self.renderToken(tokens, idx, options);

  const srcAttr = token.attrs[srcIndex];
  const src = srcAttr[1];

  // Проверяем, что src не пустой
  if (!src) return '';

  const alt = altIndex >= 0 ? token.attrs[altIndex][1] : 'Изображение';

  // Проверяем, является ли это base64-изображение
  const isBase64 = src.startsWith('data:image/');

  // Добавляем специальный класс для base64-изображений
  const className = isBase64
    ? "max-w-full h-auto my-4 rounded-md shadow-md base64-image"
    : "max-w-full h-auto my-4 rounded-md shadow-md";

  // Добавляем обработку ошибок загрузки изображения
  return `<img src="${src}" alt="${alt}" class="${className}" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/400x300?text=Изображение+недоступно'; this.alt='Изображение недоступно';" />`;
};

// Локализация для русского языка
const locale = {
  btnHeader: 'Заголовок',
  btnClear: 'Очистить',
  btnBold: 'Жирный',
  btnItalic: 'Курсив',
  btnUnderline: 'Подчеркнутый',
  btnStrikethrough: 'Зачеркнутый',
  btnUnorderedList: 'Маркированный список',
  btnOrderedList: 'Нумерованный список',
  btnQuote: 'Цитата',
  btnWrapCode: 'Блок кода',
  btnInlineCode: 'Строчный код',
  btnTable: 'Таблица',
  btnImage: 'Изображение',
  btnLink: 'Ссылка',
  btnUndo: 'Отменить',
  btnRedo: 'Повторить',
  btnFullscreen: 'Полный экран',
  btnPreview: 'Предпросмотр',
  btnEdit: 'Редактирование',
  btnSplitView: 'Разделенный вид',
}

// Определение типов для props
interface TailwindMarkdownEditorProps {
  value: string
  onChange: (text: string) => void
}

export default function TailwindMarkdownEditor({ value, onChange }: TailwindMarkdownEditorProps) {
  return (
    <div className="w-full">
      {/* Обертка для редактора с использованием Tailwind CSS */}
      <div className="w-full border rounded-md overflow-hidden bg-background">
        <MdEditor
          value={value}
          onChange={({ text }) => onChange(text)}
          style={{ height: '50vh' }}
          renderHTML={text => mdParser.render(text)}
          className="w-full"
          placeholder="Введите текст публикации..."
          locale={locale}
          plugins={[
            'header',
            'font-bold',
            'font-italic',
            'font-underline',
            'font-strikethrough',
            'list-unordered',
            'list-ordered',
            'block-quote',
            'block-code-inline',
            'block-code-block',
            'table',
            'link',
            'image',
            'divider',
            'clear',
            'logger',
            'mode-toggle',
            'full-screen'
          ]}
          config={{
            view: { menu: true, md: true, html: true },
            canView: { fullScreen: true, hideMenu: true },
            table: { maxRow: 6, maxCol: 6 },
            syncScrollMode: ['rightFollowLeft', 'leftFollowRight'],
            imageAccept: '.jpg,.jpeg,.png,.gif',
          }}
          onImageUpload={(file) => {
            return new Promise((resolve) => {
              // Проверяем размер файла (максимум 5 МБ)
              const maxSize = 5 * 1024 * 1024; // 5MB
              if (file.size > maxSize) {
                console.error('Файл слишком большой. Максимальный размер: 5MB');
                alert('Файл слишком большой. Максимальный размер: 5MB');
                resolve('');
                return;
              }

              // Проверяем тип файла
              const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
              if (!allowedTypes.includes(file.type)) {
                console.error('Неподдерживаемый тип файла. Разрешены только: JPEG, PNG, GIF, WebP');
                alert('Неподдерживаемый тип файла. Разрешены только: JPEG, PNG, GIF, WebP');
                resolve('');
                return;
              }

              try {
                const reader = new FileReader()
                reader.onload = (data) => {
                  if (data.target?.result) {
                    // Проверяем, что результат является строкой и начинается с 'data:image/'
                    const result = data.target.result as string;
                    if (typeof result === 'string' && result.startsWith('data:image/')) {
                      console.log('Image loaded successfully:', file.name);
                      resolve(result);
                    } else {
                      console.error('Неверный формат изображения');
                      resolve('');
                    }
                  } else {
                    // Если не удалось прочитать файл, возвращаем пустую строку
                    console.error('Не удалось прочитать файл');
                    resolve('');
                  }
                }
                reader.onerror = () => {
                  console.error('Ошибка при чтении файла');
                  resolve('');
                }
                reader.readAsDataURL(file);
              } catch (error) {
                console.error('Ошибка при обработке изображения:', error);
                resolve('');
              }
            })
          }}
        />
      </div>

      {/* Стили для переопределения стилей редактора */}
      <style jsx global>{`
        /* Основные стили для редактора */
        .rc-md-editor {
          border: none !important;
          font-family: inherit !important;
          background-color: transparent !important;
        }

        /* Стили для панели инструментов */
        .rc-md-editor .rc-md-navigation {
          background-color: transparent !important;
          border-bottom: 1px solid #e5e7eb !important;
          padding: 8px !important;
        }

        .dark .rc-md-editor .rc-md-navigation {
          background-color: transparent !important;
          border-bottom: 1px solid #333 !important;
        }

        /* Стили для кнопок */
        .rc-md-editor .rc-md-navigation .button {
          color: #4b5563 !important;
          margin: 0 2px !important;
          padding: 4px !important;
          border-radius: 4px !important;
        }

        .dark .rc-md-editor .rc-md-navigation .button {
          color: #e5e7eb !important;
        }

        .rc-md-editor .rc-md-navigation .button:hover {
          background-color: #f3f4f6 !important;
          color: #111827 !important;
        }

        .dark .rc-md-editor .rc-md-navigation .button:hover {
          background-color: #374151 !important;
          color: #f9fafb !important;
        }

        .rc-md-editor .rc-md-navigation .button.active {
          background-color: #e5e7eb !important;
          color: #111827 !important;
        }

        .dark .rc-md-editor .rc-md-navigation .button.active {
          background-color: #4b5563 !important;
          color: #f9fafb !important;
        }

        /* Стили для разделителя */
        .rc-md-editor .rc-md-navigation .button.button-type-divider {
          border-left: 1px solid #e5e7eb !important;
          margin: 0 8px !important;
          height: 20px !important;
        }

        .dark .rc-md-editor .rc-md-navigation .button.button-type-divider {
          border-left: 1px solid #4b5563 !important;
        }

        /* Стили для контейнера секций */
        .rc-md-editor .section-container {
          height: calc(50vh - 56px) !important;
          background-color: transparent !important;
        }

        /* Стили для поля ввода */
        .rc-md-editor .section-container .input,
        .rc-md-editor .section-container .rc-md-editor-input {
          background-color: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
          height: 100% !important;
          padding: 16px !important;
          font-size: 1rem !important;
          line-height: 1.5 !important;
        }

        .dark .rc-md-editor .section-container .input,
        .dark .rc-md-editor .section-container .rc-md-editor-input {
          background-color: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
        }

        /* Стили для textarea */
        .rc-md-editor textarea {
          background-color: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
        }

        /* Стили для предпросмотра */
        .rc-md-editor .section-container .rc-md-editor-preview {
          background-color: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
          height: 100% !important;
          padding: 16px !important;
          border-left: 1px solid hsl(var(--border)) !important;
        }

        .dark .rc-md-editor .section-container .rc-md-editor-preview {
          background-color: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
          border-left: 1px solid hsl(var(--border)) !important;
        }

        /* Стили для полноэкранного режима */
        .rc-md-editor.full {
          background-color: hsl(var(--background)) !important;
        }

        .dark .rc-md-editor.full {
          background-color: hsl(var(--background)) !important;
        }

        .rc-md-editor.full .section-container {
          height: calc(100vh - 56px) !important;
        }

        /* Дополнительные стили для исправления белого фона */
        .rc-md-editor .section {
          background-color: hsl(var(--background)) !important;
        }

        .rc-md-editor .section .sec-md {
          background-color: hsl(var(--background)) !important;
        }

        .rc-md-editor .section .sec-html {
          background-color: hsl(var(--background)) !important;
        }

        /* Стили для изображений */
        .rc-md-editor .section-container .rc-md-editor-preview img,
        .rc-md-editor .section-container .rc-md-editor-content img {
          max-width: 100%;
          height: auto;
          margin: 1rem 0;
          border-radius: 0.375rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          display: block;
        }

        /* Специальные стили для base64-изображений */
        .rc-md-editor .section-container .rc-md-editor-preview .base64-image,
        .rc-md-editor .section-container .rc-md-editor-content .base64-image {
          display: block;
          max-width: 100%;
          height: auto;
        }

        /* Исправление для темной темы */
        .dark .rc-md-editor .section-container .rc-md-editor-preview img,
        .dark .rc-md-editor .section-container .rc-md-editor-content img {
          filter: brightness(0.95);
        }
      `}</style>
    </div>
  )
}
