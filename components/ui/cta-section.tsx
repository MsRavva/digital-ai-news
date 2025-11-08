"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface CTASectionProps {
  title: string
  description?: string
  primaryAction: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
  variant?: "default" | "gradient"
}

export function CTASection({
  title,
  description,
  primaryAction,
  secondaryAction,
  variant = "default",
}: CTASectionProps) {
  const bgClass =
    variant === "gradient"
      ? "bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent"
      : "bg-muted/50"

  return (
    <section className={`py-16 px-4 ${bgClass} relative overflow-hidden`}>
      {/* Декоративные элементы */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary))/0.1,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,hsl(var(--secondary))/0.1,transparent_50%)]" />

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          {description && (
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {description}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href={primaryAction.href}>
              <Button
                size="lg"
                className="group bg-gradient-to-r from-primary to-primary-700 hover:from-primary-700 hover:to-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300"
              >
                {primaryAction.label}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            {secondaryAction && (
              <Link href={secondaryAction.href}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 hover:bg-accent hover:border-primary transition-all duration-300"
                >
                  {secondaryAction.label}
                </Button>
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

