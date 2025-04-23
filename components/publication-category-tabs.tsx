'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const categories = [
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
    <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="w-full">
      <TabsList className="bg-black dark:bg-black rounded-md p-1 h-10 flex items-center">
        {categories.map((category) => (
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
