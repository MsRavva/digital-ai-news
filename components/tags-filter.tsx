"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

const categories = [
  { id: "news", name: "Новости" },
  { id: "materials", name: "Учебные материалы" },
  { id: "project-ideas", name: "Идеи для проектов" },
]

interface TagsFilterProps {
  tags: { id: string; name: string }[]
}

export function TagsFilter({ tags }: TagsFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get selected categories and tags from URL
  const selectedCategories = searchParams.get("categories")?.split(",") || []
  const selectedTags = searchParams.get("tags")?.split(",") || []

  const [selectedCategoriesState, setSelectedCategoriesState] = useState<string[]>(selectedCategories)
  const [selectedTagsState, setSelectedTagsState] = useState<string[]>(selectedTags)

  const handleCategoryChange = (category: string, checked: boolean) => {
    let newCategories: string[]

    if (checked) {
      newCategories = [...selectedCategoriesState, category]
    } else {
      newCategories = selectedCategoriesState.filter((c) => c !== category)
    }

    setSelectedCategoriesState(newCategories)
    updateUrl(newCategories, selectedTagsState)
  }

  const handleTagClick = (tagName: string) => {
    let newTags: string[]

    if (selectedTagsState.includes(tagName)) {
      newTags = selectedTagsState.filter((t) => t !== tagName)
    } else {
      newTags = [...selectedTagsState, tagName]
    }

    setSelectedTagsState(newTags)
    updateUrl(selectedCategoriesState, newTags)
  }

  const updateUrl = (categories: string[], tags: string[]) => {
    const params = new URLSearchParams()

    if (categories.length > 0) {
      params.set("categories", categories.join(","))
    }

    if (tags.length > 0) {
      params.set("tags", tags.join(","))
    }

    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`
    router.push(newUrl)
  }

  return (
    <div className="space-y-6">
      <Card variant="border" className="overflow-hidden">
        <CardHeader className="pb-3 bg-[hsl(var(--saas-purple)/0.03)]">
          <CardTitle className="text-base font-medium text-[hsl(var(--saas-purple-dark))] dark:text-[hsl(var(--saas-purple-light))]">Категории</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={selectedCategoriesState.includes(category.id)}
                  onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                  className="text-[hsl(var(--saas-purple))] border-[hsl(var(--saas-purple)/0.3)] data-[state=checked]:bg-[hsl(var(--saas-purple))] data-[state=checked]:border-[hsl(var(--saas-purple))] h-4 w-4"
                />
                <Label htmlFor={`category-${category.id}`} className="text-sm font-normal cursor-pointer">
                  {category.name}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card variant="border" className="overflow-hidden">
        <CardHeader className="pb-3 bg-[hsl(var(--saas-purple)/0.03)]">
          <CardTitle className="text-base font-medium text-[hsl(var(--saas-purple-dark))] dark:text-[hsl(var(--saas-purple-light))]">Популярные теги</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className={`tag cursor-pointer transition-all duration-200 ${
                  selectedTagsState.includes(tag.name)
                    ? "bg-[hsl(var(--saas-purple))] text-white hover:bg-[hsl(var(--saas-purple-dark))]"
                    : "hover:bg-[hsl(var(--saas-purple)/0.2)]"
                }`}
                onClick={() => handleTagClick(tag.name)}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
