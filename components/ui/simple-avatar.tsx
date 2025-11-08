"use client"

import React from "react"

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
    xl: "h-11 w-11 text-lg",
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full border-2 border-primary flex items-center justify-center overflow-hidden aspect-square ${className}`}
    >
      <div className="flex h-full w-full items-center justify-center bg-card text-primary font-bold">
        {getInitials()}
      </div>
    </div>
  )
}
