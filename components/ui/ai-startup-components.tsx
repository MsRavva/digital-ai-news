"use client"

/**
 * AI Startup UI Kit Components
 * 
 * Коллекция современных компонентов в стиле AI Startup для использования в проекте.
 * Основано на лучших практиках дизайна для AI/Startup веб-сайтов.
 */

import { HeroSection } from "./hero-section"
import { FeatureCard } from "./feature-card"
import { StatsSection } from "./stats-section"
import { CTASection } from "./cta-section"
import { 
  Sparkles, 
  Zap, 
  Shield, 
  TrendingUp,
  Users,
  FileText,
  MessageSquare,
  BarChart3
} from "lucide-react"

// Пример использования всех компонентов
export function AIStartupComponentsDemo() {
  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <HeroSection
        title="Платформа для публикации новостей с ИИ"
        description="Создавайте, публикуйте и обсуждайте новости о веб-разработке и искусственном интеллекте. Современная платформа для обмена знаниями."
        primaryAction={{
          label: "Начать работу",
          href: "/create"
        }}
        secondaryAction={{
          label: "Узнать больше",
          href: "/"
        }}
      />

      {/* Features Section */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Возможности платформы
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Все инструменты, необходимые для эффективной работы с контентом
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={FileText}
              title="Markdown редактор"
              description="Мощный редактор с поддержкой Markdown и подсветкой синтаксиса"
              delay={0}
            />
            <FeatureCard
              icon={Sparkles}
              title="ИИ интеграция"
              description="Используйте возможности искусственного интеллекта для создания контента"
              delay={0.1}
            />
            <FeatureCard
              icon={Users}
              title="Сообщество"
              description="Общайтесь с другими разработчиками и делитесь опытом"
              delay={0.2}
            />
            <FeatureCard
              icon={Shield}
              title="Безопасность"
              description="Ваши данные защищены современными методами шифрования"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection
        stats={[
          { value: "1000+", label: "Публикаций" },
          { value: "500+", label: "Пользователей" },
          { value: "50+", label: "Категорий" },
          { value: "24/7", label: "Доступность" }
        ]}
      />

      {/* CTA Section */}
      <CTASection
        title="Готовы начать?"
        description="Присоединяйтесь к нашему сообществу и начните публиковать свои материалы уже сегодня"
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
    </div>
  )
}

// Экспорт отдельных компонентов для использования по отдельности
export { HeroSection, FeatureCard, StatsSection, CTASection }

