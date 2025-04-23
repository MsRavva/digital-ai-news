# Система стилей проекта

## Общая структура

Стили проекта организованы следующим образом:

- `styles/variables.css` - CSS переменные для всего проекта
- `styles/code-blocks.css` - Стили для блоков кода
- `styles/markdown.css` - Стили для Markdown контента

## Использование

### Подключение стилей

Все стили должны быть импортированы в файле `app/globals.css`:

```css
@import '../styles/variables.css';
@import '../styles/code-blocks.css';
@import '../styles/markdown.css';
```

### Блоки кода

Для блоков кода используйте класс `.code-block`:

```html
<div class="code-block">
  <div class="language-label">javascript</div>
  <pre>
    <code class="language-javascript">
      const hello = 'world';
      console.log(hello);
    </code>
  </pre>
  <button class="copy-button">
    <svg>...</svg>
  </button>
</div>
```

### Markdown контент

Для Markdown контента используйте класс `.markdown-content`:

```html
<div class="markdown-content">
  <h1>Заголовок</h1>
  <p>Параграф</p>
  <ul>
    <li>Пункт списка</li>
  </ul>
</div>
```

## CSS переменные

### Основные цвета

- `--primary` - Основной цвет
- `--primary-light` - Светлый вариант основного цвета
- `--primary-dark` - Темный вариант основного цвета

### Цвета для блоков кода

#### Светлая тема

- `--code-bg` - Фон блока кода
- `--code-border` - Граница блока кода
- `--code-text` - Цвет текста в блоке кода
- `--code-label-bg` - Фон метки языка
- `--code-label-text` - Цвет текста метки языка
- `--code-label-border` - Граница метки языка
- `--copy-button-bg` - Фон кнопки копирования
- `--copy-button-text` - Цвет текста кнопки копирования
- `--copy-button-border` - Граница кнопки копирования

#### Темная тема

- `--code-bg-dark` - Фон блока кода
- `--code-border-dark` - Граница блока кода
- `--code-text-dark` - Цвет текста в блоке кода
- `--code-label-bg-dark` - Фон метки языка
- `--code-label-text-dark` - Цвет текста метки языка
- `--code-label-border-dark` - Граница метки языка
- `--copy-button-bg-dark` - Фон кнопки копирования
- `--copy-button-text-dark` - Цвет текста кнопки копирования
- `--copy-button-border-dark` - Граница кнопки копирования

## Рекомендации по стилизации

1. **Используйте CSS переменные** вместо жестко закодированных значений
2. **Не дублируйте стили** - используйте существующие классы
3. **Следуйте соглашению по именованию** - используйте kebab-case для классов
4. **Комментируйте сложные стили** для облегчения поддержки
5. **Группируйте стили** по компонентам и функциональности
6. **Избегайте использования !important** - используйте специфичность селекторов
7. **Тестируйте стили в обеих темах** - светлой и темной
