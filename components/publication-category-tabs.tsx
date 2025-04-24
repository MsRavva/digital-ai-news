'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const categories = [
  { value: 'all', label: 'Все категории' },
  { value: 'news', label: 'Новости' },
  { value: 'materials', label: 'Учебные материалы' },
  { value: 'project-ideas', label: 'Идеи проектов' }
]

interface PublicationCategoryTabsProps {
  onCategoryChange: (category: string) => void
  initialCategory?: string
}

export function PublicationCategoryTabs({
  onCategoryChange,
  initialCategory = 'news'
}: PublicationCategoryTabsProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)

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
    <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="w-auto">
      <TabsList className="bg-muted dark:bg-muted rounded-md p-1 h-10 flex items-center w-auto">
        {categories.map((category) => (
          <TabsTrigger
            key={category.value}
            value={category.value}
            className="px-4 py-1.5 text-muted-foreground data-[state=active]:text-[hsl(var(--saas-purple))] data-[state=active]:bg-background dark:data-[state=active]:text-[hsl(var(--saas-purple-light))] rounded-sm"
          >
            {category.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
