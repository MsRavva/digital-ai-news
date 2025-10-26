# Руководство по стилю проекта

## Обзор

Это руководство описывает дизайн-систему проекта digital-ai-news. Оно включает в себя информацию о цветах, типографике, интервалах, компонентах и других аспектах визуального дизайна.

## Дизайн-токены

### Цвета

#### Основная палитра (Primary)
- `--color-primary-50`: #f5f3ff
- `--color-primary-100`: #ede9fe
- `--color-primary-200`: #ddd6fe
- `--color-primary-300`: #c4b5fd
- `--color-primary-400`: #a78bfa
- `--color-primary-500`: #8b5cf6
- `--color-primary-600`: #7c3aed
- `--color-primary-700`: #6d28d9
- `--color-primary-800`: #5b21b6
- `--color-primary-900`: #4c1d95
- `--color-primary-950`: #2e1065

#### Вторичная палитра (Secondary)
- `--color-secondary-50`: #f0f9ff
- `--color-secondary-100`: #e0f2fe
- `--color-secondary-200`: #bae6fd
- `--color-secondary-300`: #7dd3fc
- `--color-secondary-400`: #38bdf8
- `--color-secondary-500`: #0ea5e9
- `--color-secondary-600`: #0284c7
- `--color-secondary-700`: #0369a1
- `--color-secondary-800`: #075985
- `--color-secondary-900`: #0c4a6e
- `--color-secondary-950`: #082f49

#### Нейтральная палитра
- `--color-neutral-50`: #f8fafc
- `--color-neutral-100`: #f1f5f9
- `--color-neutral-200`: #e2e8f0
- `--color-neutral-300`: #cbd5e1
- `--color-neutral-400`: #94a3b8
- `--color-neutral-500`: #64748b
- `--color-neutral-600`: #475569
- `--color-neutral-700`: #334155
- `--color-neutral-800`: #1e293b
- `--color-neutral-900`: #0f172a
- `--color-neutral-950`: #020617

#### Семантические цвета
- `--color-success`: Палитра зеленых оттенков
- `--color-warning`: Палитра желтых/оранжевых оттенков
- `--color-error`: Палитра красных оттенков

### Типографика

#### Семейства шрифтов
- `--font-family-base`: 'Mulish', system-ui, sans-serif
- `--font-family-heading`: 'Mulish', system-ui, sans-serif
- `--font-family-mono`: 'SFMono-Regular', Consolas, monospace

#### Размеры шрифтов
- `--font-size-xs`: 0.75rem (12px)
- `--font-size-sm`: 0.875rem (14px)
- `--font-size-base`: 1rem (16px)
- `--font-size-lg`: 1.125rem (18px)
- `--font-size-xl`: 1.25rem (20px)
- `--font-size-2xl`: 1.5rem (24px)
- `--font-size-3xl`: 1.875rem (30px)
- `--font-size-4xl`: 2.25rem (36px)
- `--font-size-5xl`: 3rem (48px)
- `--font-size-6xl`: 3.75rem (60px)
- `--font-size-7xl`: 4.5rem (72px)

### Интервалы

Система интервалов основана на 4px сетке:
- `--spacing-1`: 0.25rem (4px)
- `--spacing-2`: 0.5rem (8px)
- `--spacing-3`: 0.75rem (12px)
- `--spacing-4`: 1rem (16px)
- `--spacing-5`: 1.25rem (20px)
- `--spacing-6`: 1.5rem (24px)
- `--spacing-8`: 2rem (32px)
- `--spacing-10`: 2.5rem (40px)
- `--spacing-12`: 3rem (48px)
- `--spacing-16`: 4rem (64px)
- `--spacing-20`: 5rem (80px)
- `--spacing-24`: 6rem (96px)

### Радиусы границ

- `--border-radius-none`: 0
- `--border-radius-sm`: 0.125rem (2px)
- `--border-radius-base`: 0.25rem (4px)
- `--border-radius-md`: 0.375rem (6px)
- `--border-radius-lg`: 0.5rem (8px)
- `--border-radius-xl`: 0.75rem (12px)
- `--border-radius-2xl`: 1rem (16px)
- `--border-radius-3xl`: 1.5rem (24px)
- `--border-radius-full`: 9999px

### Тени

- `--shadow-xs`: Очень легкая тень
- `--shadow-sm`: Легкая тень
- `--shadow-base`: Базовая тень
- `--shadow-md`: Средняя тень
- `--shadow-lg`: Большая тень
- `--shadow-xl`: Очень большая тень
- `--shadow-2xl`: Экстра большая тень

## Компоненты

### Кнопки

Компонент кнопки имеет несколько вариантов:
- `default`: Основная кнопка с акцентным цветом
- `secondary`: Второстепенная кнопка
- `destructive`: Кнопка для разрушающих действий
- `outline`: Кнопка с границей
- `ghost`: Прозрачная кнопка
- `link`: Стилизация как ссылка
- `saas`: Стилизация для SaaS продукта

Размеры:
- `default`: Стандартный размер
- `sm`: Маленький
- `lg`: Большой
- `xl`: Очень большой
- `icon`: Только для иконок

### Карточки

Компонент карточки имеет несколько вариантов:
- `default`: Стандартная карточка
- `saas`: Стилизация для SaaS продукта
- `elevated`: Карточка с повышенной тенью
- `glass`: Стеклянный эффект
- `border`: Карточка с акцентной границей

### Значки

Компонент значка имеет несколько вариантов:
- `default`: Основной значок
- `secondary`: Второстепенный значок
- `success`: Значок успеха
- `warning`: Значок предупреждения
- `destructive`: Значок ошибки
- `outline`: Значок с границей
- `primary`: Значок с акцентным цветом

Размеры:
- `default`: Стандартный размер
- `sm`: Маленький
- `lg`: Большой

## Анимации и переходы

### Анимации
- `fade-in`: Появление
- `fade-out`: Исчезновение
- `slide-in-top`: Скольжение сверху
- `slide-in-bottom`: Скольжение снизу
- `slide-in-left`: Скольжение слева
- `slide-in-right`: Скольжение справа
- `scale-in`: Масштабирование
- `pulse`: Пульсация
- `bounce`: Отскок
- `spin`: Вращение

### Переходы
- `transition-all`: Переход всех свойств
- `transition-colors`: Переход цветов
- `transition-opacity`: Переход прозрачности
- `transition-shadow`: Переход теней
- `transition-transform`: Переход трансформаций

Длительности:
- `duration-75`: 75ms
- `duration-100`: 100ms
- `duration-150`: 150ms
- `duration-200`: 200ms
- `duration-300`: 300ms
- `duration-500`: 500ms
- `duration-700`: 700ms
- `duration-1000`: 1000ms

Функции времени:
- `ease-linear`: Линейная
- `ease-in`: Ускорение
- `ease-out`: Замедление
- `ease-in-out`: Ускорение и замедление
- `ease-spring`: Пружинная
- `ease-snap`: Резкая
- `ease-bounce`: Отскок

## Темизация

Проект поддерживает светлую и темную темы. Все цвета автоматически адаптируются под выбранную тему.

### Светлая тема
- Фон: `--color-neutral-50`
- Текст: `--color-neutral-900`
- Акцентный цвет: `--color-primary-600`

### Темная тема
- Фон: `--color-neutral-900`
- Текст: `--color-neutral-50`
- Акцентный цвет: `--color-primary-500`

## Использование

Для использования дизайн-токенов в компонентах используйте CSS-переменные:

```css
.my-component {
  background-color: hsl(var(--color-primary-500));
  color: hsl(var(--color-neutral-50));
  padding: var(--spacing-4);
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-base);
  font-family: var(--font-family-base);
}
```

Для использования утилит Tailwind с токенами:

```jsx
<button className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
  Кнопка
</button>
```