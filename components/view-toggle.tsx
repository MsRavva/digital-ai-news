"use client"

import { Button } from "@/components/ui/button"
import { Grid2X2, List } from "lucide-react"
import { useEffect, useState } from "react"

interface ViewToggleProps {
  onViewChange: (view: "grid" | "table") => void
  initialView?: "grid" | "table"
}

export function ViewToggle({
  onViewChange,
  initialView = "table",
}: ViewToggleProps) {
  const [view, setView] = useState<"grid" | "table">(initialView)

  // При первом рендере проверяем localStorage
  useEffect(() => {
    const savedView = localStorage.getItem("viewMode") as
      | "grid"
      | "table"
      | null
    if (savedView) {
      setView(savedView)
      onViewChange(savedView)
    }
  }, [onViewChange])

  const handleViewChange = (newView: "grid" | "table") => {
    setView(newView)
    localStorage.setItem("viewMode", newView)
    onViewChange(newView)
  }

  return (
    <div className="view-mode-container">
      <button
        className={`view-mode-button ${view === "grid" ? "active" : ""}`}
        onClick={() => handleViewChange("grid")}
        title="Отображение карточками"
      >
        <Grid2X2 className="h-4 w-4" />
      </button>
      <button
        className={`view-mode-button ${view === "table" ? "active" : ""}`}
        onClick={() => handleViewChange("table")}
        title="Табличное отображение"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  )
}
