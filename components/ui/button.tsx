import { Slot } from "@radix-ui/react-slot"
import { type VariantProps, cva } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md active:translate-y-0 transition-all duration-200",
        destructive:
          "bg-error text-error-foreground hover:bg-error/90 shadow-sm hover:shadow-md active:translate-y-0 transition-all duration-200",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md active:translate-y-0 transition-all duration-200",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow-md active:translate-y-0 transition-all duration-200",
        ghost: "hover:bg-accent hover:text-accent-foreground active:translate-y-0 transition-all duration-200",
        link: "text-primary underline-offset-4 hover:underline active:translate-y-0 transition-all duration-200",
        saas: "bg-[hsl(var(--saas-purple))] text-white hover:bg-[hsl(var(--saas-purple-dark))] shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200",
        "saas-secondary": "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200",
        "saas-ghost": "hover:bg-accent hover:text-accent-foreground hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200",
        "saas-gradient":
          "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200",
        "saas-outline":
          "border-2 border-primary text-primary bg-transparent hover:bg-primary/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        xl: "h-12 rounded-md px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
