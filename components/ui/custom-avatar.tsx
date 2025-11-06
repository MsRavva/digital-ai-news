"use client"

import { cn } from "@/lib/utils"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import * as React from "react"

// Проверка, что код выполняется в браузере
const isBrowser = typeof window !== "undefined"

export const CustomAvatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-[hsl(var(--saas-purple))]",
      className,
    )}
    {...props}
  />
))
CustomAvatar.displayName = AvatarPrimitive.Root.displayName

export const CustomAvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
CustomAvatarImage.displayName = AvatarPrimitive.Image.displayName

export const CustomAvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-[#0e1012] text-[hsl(var(--saas-purple))] font-extrabold text-lg",
      className,
    )}
    {...props}
  />
))
CustomAvatarFallback.displayName = AvatarPrimitive.Fallback.displayName
