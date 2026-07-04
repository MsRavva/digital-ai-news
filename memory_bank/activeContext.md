# Active Context

## Текущий фокус
- Замена textarea-редактора MarkdownEditor на Plate.js rich text editor.
- Стилизация редактора под дизайн-систему проекта (темы light/dark, отступы, рамки).

## Активные решения
- Использование шрифта JetBrains Mono без лигатур для идеального отображения кириллицы в коде.
- Plate.js редактор интегрирован через `@plate/editor-ai` shadcn-компонент с кастомными плагинами (Bold, Italic, Headings, Lists, CodeBlock, Link).
- Переход с `react-markdown-editor-lite` на Plate.js WYSIWYG с split-режимом (редактор + предпросмотр).
- TooltipProvider добавлен в корневой layout для работы тултипов в тулбаре Plate.js.

## Блокеры
- Отсутствуют.

