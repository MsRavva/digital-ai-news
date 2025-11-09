"use client"

import React from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface SimpleAvatarProps {
  username?: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function SimpleAvatar({
  username,
  size = "md",
  className = "",
}: SimpleAvatarProps) {
  const getInitials = () => {
    if (!username) return "??"
    const nameParts = username.split(" ")
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    } else {
      return username.substring(0, 1).toUpperCase()
    }
  }

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
    xl: "h-12 w-12 text-lg",
  }

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback className="bg-primary/10 text-primary font-bold">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  )
}

