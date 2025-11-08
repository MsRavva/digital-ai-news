# Гайд по стилям проекта

## 🎨 Система стилей

### Технологии
- **Tailwind CSS 4** — утилитарный CSS фреймворк
- **Тема Catppuccin** — пастельная цветовая палитра
- **shadcn/ui** — компоненты на базе Radix UI
- **Biome** — линтер и форматтер кода

---

## 🎨 Цветовая система

### CSS переменные (Catppuccin)

Все цвета доступны через CSS переменные в формате `oklch`:

```css
/* Основные цвета */
--background          /* Фон страницы */
--foreground         /* Основной текст */
--primary            /* Основной акцент */
--secondary          /* Вторичный акцент */
--muted              /* Приглушенный фон */
--accent             /* Акцентный цвет */
--destructive        /* Цвет ошибки/удаления */
--border             /* Цвет границ */
--ring               /* Цвет фокуса */
```

### Использование в Tailwind

```tsx
// Прямое использование
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    Кнопка
  </button>
</div>

// Темная тема (автоматически через .dark класс)
<div className="dark:bg-card dark:text-card-foreground">
  Контент
</div>
```

---

## 📦 Компоненты shadcn/ui

### Button

```tsx
import { Button } from "@/components/ui/button"

// Варианты
<Button variant="default">Основная</Button>
<Button variant="destructive">Удалить</Button>
<Button variant="outline">Контур</Button>
<Button variant="secondary">Вторичная</Button>
<Button variant="ghost">Прозрачная</Button>
<Button variant="link">Ссылка</Button>

// Размеры
<Button size="sm">Маленькая</Button>
<Button size="default">Обычная</Button>
<Button size="lg">Большая</Button>
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Заголовок</CardTitle>
  </CardHeader>
  <CardContent>
    Контент карточки
  </CardContent>
</Card>
```

### Badge

```tsx
import { Badge } from "@/components/ui/badge"

<Badge variant="default">По умолчанию</Badge>
<Badge variant="secondary">Вторичный</Badge>
<Badge variant="destructive">Ошибка</Badge>
<Badge variant="outline">Контур</Badge>
```

---

## 🛠️ Утилиты Tailwind

### Отступы

```tsx
<div className="p-4">        {/* padding: 1rem */}
<div className="m-2">        {/* margin: 0.5rem */}
<div className="space-y-4"> {/* gap между детьми */}
```

### Цвета

```tsx
<div className="bg-primary text-primary-foreground">
<div className="bg-secondary text-secondary-foreground">
<div className="bg-muted text-muted-foreground">
<div className="border-border">
```

### Тени

```tsx
<div className="shadow-sm">   {/* Маленькая тень */}
<div className="shadow-md">   {/* Средняя тень */}
<div className="shadow-lg">  {/* Большая тень */}
<div className="shadow-xl">   {/* Очень большая */}
```

### Радиусы

```tsx
<div className="rounded-sm">  {/* 2px */}
<div className="rounded-md">  {/* 6px */}
<div className="rounded-lg">  {/* 8px */}
<div className="rounded-xl"> {/* 12px */}
<div className="rounded-full"> {/* Круг */}
```

---

## 🌓 Темная тема

Тема переключается автоматически через класс `.dark` на элементе `<html>`:

```tsx
// В layout.tsx уже настроено через ThemeProvider
<ThemeProvider attribute="class" defaultTheme="light">
  {children}
</ThemeProvider>
```

Все цвета автоматически адаптируются для темной темы.

---

## 📝 Форматирование кода

### Biome команды

```bash
# Проверка кода
pnpm lint

# Автоматическое исправление
pnpm lint:fix

# Форматирование
pnpm format

# Полная проверка
pnpm check
```

### Правила Biome

- **Отступы**: 2 пробела
- **Кавычки**: двойные (`"`)
- **Точки с запятой**: только где необходимо
- **Ширина строки**: 100 символов
- **Организация импортов**: автоматическая

---

## 🎯 Лучшие практики

### 1. Используйте компоненты shadcn/ui

```tsx
// ✅ Хорошо
<Button variant="primary">Сохранить</Button>

// ❌ Плохо
<button className="bg-primary text-white px-4 py-2 rounded">
  Сохранить
</button>
```

### 2. Комбинируйте классы через `cn()`

```tsx
import { cn } from "@/lib/utils"

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  className // для переопределения из пропсов
)}>
```

### 3. Используйте семантические цвета

```tsx
// ✅ Хорошо
<div className="bg-card text-card-foreground border-border">

// ❌ Плохо
<div className="bg-white text-black border-gray-300">
```

### 4. Адаптивность

```tsx
<div className="
  w-full
  md:w-1/2
  lg:w-1/3
  xl:w-1/4
">
  Адаптивная ширина
</div>
```

---

## 📚 Полезные ссылки

- [Tailwind CSS 4 Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Catppuccin Theme](https://catppuccin.com)
- [Biome Documentation](https://biomejs.dev)

---

## 🚀 Быстрый старт

```tsx
// Пример компонента
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function MyComponent() {
  return (
    <Card className="p-6">
      <CardContent>
        <h2 className="text-2xl font-bold mb-4">Заголовок</h2>
        <p className="text-muted-foreground mb-4">
          Описание
        </p>
        <Button variant="primary">
          Действие
        </Button>
      </CardContent>
    </Card>
  )
}
```

---

**Продолжение следует...**

