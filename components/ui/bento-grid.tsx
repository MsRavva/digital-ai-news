import { cn } from "@/lib/utils"
import Link from "next/link"

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[450px] grid-cols-1 md:grid-cols-2 gap-4 w-full mx-auto",
        className
      )}
    >
      {children}
    </div>
  )
}

export const BentoCard = ({
  className,
  title,
  description,
  header,
  icon,
  children,
  href,
  onClick,
}: {
  className?: string
  title?: string | React.ReactNode
  description?: string | React.ReactNode
  header?: React.ReactNode
  icon?: React.ReactNode
  children?: React.ReactNode
  href?: string
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
}) => {
  const content = (
    <div
      onClick={onClick}
      className={cn(
        "row-span-1 rounded-3xl group/bento hover:shadow-2xl transition-all duration-300 p-6 dark:border-white/[0.1] bg-background border border-border/50 flex flex-col h-[450px]",
        "shadow-[0_2px_15px_rgba(0,0,0,0.08),0_8px_25px_rgba(0,0,0,0.05)]",
        "dark:shadow-[0_2px_20px_rgba(98,51,255,0.12),0_8px_35px_rgba(98,51,255,0.08),0_0_0_1px_rgba(255,255,255,0.03)]",
        "hover:shadow-[0_4px_25px_rgba(0,0,0,0.12),0_12px_40px_rgba(0,0,0,0.08)]",
        "dark:hover:shadow-[0_4px_30px_rgba(98,51,255,0.18),0_12px_50px_rgba(98,51,255,0.12),0_0_0_1px_rgba(255,255,255,0.05)]",
        (href || onClick) && "cursor-pointer",
        className
      )}
    >
      {header && (
        <div className="flex-shrink-0">
          {header}
        </div>
      )}
      <div className="flex-1 flex flex-col gap-0 min-h-0">
        {icon}
        {title && (
          <div className="font-sans font-bold text-neutral-600 dark:text-neutral-200 flex-shrink-0">
            {title}
          </div>
        )}
        {description && (
          <div className="flex-1 min-h-0">
            {description}
          </div>
        )}
        {children}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    )
  }

  return content
}

