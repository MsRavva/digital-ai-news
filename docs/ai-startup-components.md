# AI Startup UI Kit Components

Коллекция современных компонентов в стиле AI Startup, созданных на основе лучших практик дизайна для AI/Startup веб-сайтов.

## Компоненты

### 1. HeroSection

Главная секция с заголовком, описанием и кнопками действий.

```tsx
import { HeroSection } from "@/components/ui/hero-section"

<HeroSection
  title="Платформа для публикации новостей с ИИ"
  description="Создавайте, публикуйте и обсуждайте новости о веб-разработке"
  primaryAction={{
    label: "Начать работу",
    href: "/create"
  }}
  secondaryAction={{
    label: "Узнать больше",
    href: "/"
  }}
/>
```

**Props:**
- `title: string` - Заголовок секции
- `description: string` - Описание
- `primaryAction?: { label: string, href: string }` - Основная кнопка
- `secondaryAction?: { label: string, href: string }` - Вторичная кнопка

### 2. FeatureCard

Карточка с иконкой, заголовком и описанием функции.

```tsx
import { FeatureCard } from "@/components/ui/feature-card"
import { Sparkles } from "lucide-react"

<FeatureCard
  icon={Sparkles}
  title="ИИ интеграция"
  description="Используйте возможности искусственного интеллекта"
  delay={0.1}
/>
```

**Props:**
- `icon: LucideIcon` - Иконка из lucide-react
- `title: string` - Заголовок карточки
- `description: string` - Описание
- `className?: string` - Дополнительные классы
- `delay?: number` - Задержка анимации (для последовательного появления)

### 3. StatsSection

Секция со статистикой с анимированными числами.

```tsx
import { StatsSection } from "@/components/ui/stats-section"

<StatsSection
  stats={[
    { value: "1000+", label: "Публикаций" },
    { value: "500+", label: "Пользователей" },
    { value: "50+", label: "Категорий" },
    { value: "24/7", label: "Доступность" }
  ]}
/>
```

**Props:**
- `stats: Array<{ value: string, label: string, suffix?: string }>` - Массив статистики
- `className?: string` - Дополнительные классы

### 4. CTASection

Секция призыва к действию с кнопками.

```tsx
import { CTASection } from "@/components/ui/cta-section"

<CTASection
  title="Готовы начать?"
  description="Присоединяйтесь к нашему сообществу"
  primaryAction={{
    label: "Создать публикацию",
    href: "/create"
  }}
  secondaryAction={{
    label: "Посмотреть примеры",
    href: "/"
  }}
  variant="gradient"
/>
```

**Props:**
- `title: string` - Заголовок
- `description?: string` - Описание
- `primaryAction: { label: string, href: string }` - Основная кнопка
- `secondaryAction?: { label: string, href: string }` - Вторичная кнопка
- `variant?: "default" | "gradient"` - Вариант стиля

## Полный пример использования

```tsx
import { AIStartupComponentsDemo } from "@/components/ui/ai-startup-components"

export default function HomePage() {
  return (
    <div>
      <AIStartupComponentsDemo />
    </div>
  )
}
```

## Особенности

- ✅ Полная поддержка темной и светлой тем
- ✅ Плавные анимации с Framer Motion
- ✅ Адаптивный дизайн для всех устройств
- ✅ Градиентные эффекты и современные тени
- ✅ Оптимизированная производительность
- ✅ TypeScript типизация

## Стилизация

Все компоненты используют существующую систему дизайн-токенов проекта:
- Цвета из `styles/tokens/colors.css`
- Типографика из `styles/tokens/typography.css`
- Отступы из `styles/tokens/spacing.css`
- Тени из `styles/tokens/shadows.css`

## Интеграция

Компоненты готовы к использованию и полностью интегрированы с существующей системой стилей проекта. Они автоматически адаптируются к текущей теме (светлая/темная).
















