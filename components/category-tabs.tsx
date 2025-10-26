"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"

const categories = [
  { value: "url", label: "URL" },
  { value: "preview", label: "Предпросмотр" },
  { value: "edit", label: "Редактирование" },
]

interface CategoryTabsProps {
  onCategoryChange: (category: string) => void
  initialCategory?: string
  includeUrl?: boolean
}

export function CategoryTabs({
  onCategoryChange,
  initialCategory = "news",
  includeUrl = false,
}: CategoryTabsProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)

  // Фильтруем категории, если не нужно включать URL
  const filteredCategories = includeUrl
    ? categories
    : categories.filter((cat) => cat.value !== "url")

  // Эффект для инициализации выбранной категории при монтировании
  useEffect(() => {
    onCategoryChange(selectedCategory)
  }, [])

  // Эффект для обновления выбранной категории при изменении initialCategory
  useEffect(() => {
    if (initialCategory && initialCategory !== selectedCategory) {
      setSelectedCategory(initialCategory)
    }
  }, [initialCategory])

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    onCategoryChange(value)
  }

  return (
    <Tabs
      value={selectedCategory}
      onValueChange={handleCategoryChange}
      className="w-full"
    >
      <TabsList className="bg-black dark:bg-black rounded-md p-1 h-10 flex items-center">
        {filteredCategories.map((category) => (
          <TabsTrigger
            key={category.value}
            value={category.value}
            className="px-4 py-1.5 text-gray-400 data-[state=active]:text-white data-[state=active]:bg-transparent rounded-sm"
          >
            {category.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
