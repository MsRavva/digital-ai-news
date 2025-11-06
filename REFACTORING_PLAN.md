# План рефакторинга системы стилизации

Этот документ описывает полный план рефакторинга системы стилизации проекта с целью создания простой, четкой и масштабируемой архитектуры на основе Tailwind CSS и CSS-переменных.

## 1. Текущее состояние и проблемы

Текущая система стилизации, в основном сосредоточенная в `app/globals.css`, страдает от следующих проблем:

-   **Избыточность:** Существуют две параллельные системы CSS-переменных (семантические от `shadcn/ui` и кастомные с префиксом `saas-`).
-   **Несогласованность:** Цвета задаются через переменные, HSL-значения и жестко закодированные HEX-коды.
-   **Смешение подходов:** В одном файле смешаны утилиты Tailwind, кастомные классы и переопределения для темной темы, что усложняет поддержку.
-   **Отсутствие единого источника правды:** Цветовая палитра разбросана между `globals.css` и `tailwind.config.ts`.

## 2. Цели рефакторинга

-   **Унификация:** Создать единую, семантическую систему CSS-переменных для всех дизайн-токенов (цвета, отступы, тени, радиусы).
-   **Централизация:** Сосредоточить все определения тем и переменных в одном месте.
-   **Масштабируемость:** Упростить добавление новых тем и изменение существующих стилей.
-   **Читаемость:** Сделать код стилей более понятным и предсказуемым.

## 3. Новая архитектура стилей

Мы перейдем к модульной структуре, где каждый файл имеет четкую зону ответственности.

```mermaid
graph TD
    A[app/layout.tsx] --> B[app/globals.css];
    B --> C[@tailwind base];
    B --> D[@tailwind components];
    B --> E[@tailwind utilities];
    B --> F[styles/theme.css];
    B --> G[styles/base.css];
    B --> H[styles/components.css];

    F --> I[:root --primary, --background, ...];
    F --> J[.dark --primary, --background, ...];
    G --> K[body, scrollbar, ...];
    H --> L[.custom-card, .gradient-text, ...];

    subgraph "Tailwind Config"
        M[app/tailwind.config.ts] --> F;
    end

    subgraph "Components"
        N[components/ui/*.tsx] -.-> M;
    end

    style F fill:#f9f,stroke:#333,stroke-width:2px
    style G fill:#ccf,stroke:#333,stroke-width:2px
    style H fill:#cfc,stroke:#333,stroke-width:2px
```

### Структура файлов:

-   **`styles/theme.css`**: **Единственный источник правды** для всех дизайн-токенов. Содержит определения CSS-переменных для светлой (`:root`) и темной (`.dark`) тем.
-   **`styles/base.css`**: Глобальные стили, не являющиеся переменными (стили для `body`, скроллбара, сбросы и т.д.).
-   **`styles/components.css`**: Стили для сложных кастомных компонентов, которые трудно или невозможно реализовать только с помощью утилит Tailwind.
-   **`app/globals.css`**: Будет содержать только директивы `@tailwind` и импорты трех вышеуказанных файлов.
-   **`app/tailwind.config.ts`**: Будет ссылаться на переменные из `theme.css` для расширения темы Tailwind.

## 4. Пошаговый план реализации

### Шаг 1: Создать новую структуру файлов

Создать следующие пустые файлы:
- `styles/theme.css`
- `styles/base.css`
- `styles/components.css`

### Шаг 2: Унифицировать переменные в `styles/theme.css`

Собрать все цвета из `app/globals.css` и `tailwind.config.ts` и определить их в виде единой семантической палитры.

**Пример `styles/theme.css`:**
```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 262 83% 58%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 262 83% 96%;
    --accent-foreground: 262 83% 40%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 262 83% 58%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 220 10% 4%;
    --foreground: 0 0% 98%;
    --card: 220 8% 8%;
    --card-foreground: 0 0% 98%;
    --popover: 220 8% 8%;
    --popover-foreground: 0 0% 98%;
    --primary: 270 83% 58%;
    --primary-foreground: 0 0% 98%;
    --secondary: 220 8% 15%;
    --secondary-foreground: 0 0% 98%;
    --muted: 220 10% 4%;
    --muted-foreground: 220 8% 65%;
    --accent: 270 83% 58%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;
    --border: 220 8% 12%;
    --input: 220 8% 8%;
    --ring: 270 83% 58%;
  }
}
```

### Шаг 3: Перенести базовые стили в `styles/base.css`

Перенести все стили, не являющиеся переменными или компонентными, из `app/globals.css`.

**Пример `styles/base.css`:**
```css
body {
  background-image: radial-gradient(circle at center, rgba(124, 58, 237, 0.35) 0%, rgba(79, 70, 229, 0.15) 40%, transparent 70%);
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

.dark body {
  background-image: radial-gradient(circle at center, rgba(157, 92, 255, 0.35) 0%, rgba(0, 128, 255, 0.15) 40%, transparent 70%);
  background-color: hsl(var(--background));
}

/* Custom scrollbar styles */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
/* ... и так далее ... */
```

### Шаг 4: Перенести кастомные стили компонентов в `styles/components.css`

Изолировать стили для кастомных классов, таких как `.post-card`, `.tag`, `.filter-item` и др.

**Пример `styles/components.css`:**
```css
@layer components {
  .post-card {
    border-radius: 0.375rem;
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    border: 1px solid hsl(var(--border));
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 8px 24px -4px rgba(0, 0, 0, 0.1);
    background-color: hsl(var(--card));
  }

  .post-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2), 0 16px 32px -6px rgba(0, 0, 0, 0.15);
  }

  .dark .post-card:hover {
     box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
     border-color: hsl(var(--primary));
  }
  /* ... и другие компонентные стили ... */
}
```

### Шаг 5: Обновить `app/tailwind.config.ts`

Изменить конфигурацию Tailwind, чтобы она использовала только семантические переменные.

**Пример `app/tailwind.config.ts`:**
```typescript
// ...
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        // ... и так далее для всех цветов
      },
// ...
```
Удалить кастомную секцию `saas`.

### Шаг 6: Очистить `app/globals.css`

Файл `app/globals.css` должен стать очень простым.

**Пример `app/globals.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import '../styles/theme.css';
@import '../styles/base.css';
@import '../styles/components.css';

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Шаг 7: Поэтапная замена старых классов

Начать заменять кастомные классы (`saas-button-primary`, `dark .bg-white` и т.д.) на утилиты Tailwind (`bg-primary`, `text-primary-foreground`, `dark:bg-card` и т.д.) в JSX/TSX файлах.

**Пример (до):**
```jsx
<div className="saas-card">...</div>
```

**Пример (после):**
```jsx
<div className="p-4 bg-card border rounded-lg shadow-md">...</div>
```
Этот шаг является самым объемным и требует аккуратности.

### Шаг 8: Финальная очистка

После того как все компоненты будут переведены на новую систему, можно будет безопасно удалить старые классы из `styles/components.css` и неиспользуемые переменные.

## 5. Стратегия внедрения

Рефакторинг будет проводиться поэтапно, чтобы минимизировать риски:

1.  **Подготовительный этап (Шаги 1-6):** Создание новой структуры и перенос стилей без изменения логики. На этом этапе приложение должно выглядеть так же, как и до рефакторинга.
2.  **Этап миграции (Шаг 7):** Постепенный рефакторинг компонентов, начиная с самых простых (кнопки, инпуты) и заканчивая сложными (карточки, формы).
3.  **Завершающий этап (Шаг 8):** Полное удаление устаревшего кода.

Этот план обеспечивает структурированный и безопасный подход к улучшению системы стилизации проекта.