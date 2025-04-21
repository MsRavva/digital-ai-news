"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const categories = [
  { value: "all", label: "Все категории" },
  { value: "news", label: "Новости" },
  { value: "materials", label: "Учебные материалы" },
  { value: "project-ideas", label: "Идеи проектов" },
]

interface CategoryFilterProps {
  onCategoryChange: (category: string) => void;
  initialCategory?: string;
}

export function CategoryFilter({ onCategoryChange, initialCategory }: CategoryFilterProps) {
  const [open, setOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(() => {
    // Если передана начальная категория, используем её
    if (initialCategory) {
      return initialCategory;
    }

    // Иначе пытаемся получить сохраненную категорию из localStorage
    if (typeof window !== "undefined") {
      const savedCategory = localStorage.getItem("selectedCategory")
      return savedCategory || "all"
    }
    return "all"
  })

  // Эффект для сохранения выбранной категории в localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedCategory", selectedCategory)
    }
  }, [selectedCategory])

  // Эффект для инициализации выбранной категории при монтировании
  useEffect(() => {
    console.log('CategoryFilter: Инициализация с категорией', selectedCategory);
    onCategoryChange(selectedCategory);
  }, []);

  // Эффект для обновления выбранной категории при изменении initialCategory
  useEffect(() => {
    if (initialCategory && initialCategory !== selectedCategory) {
      console.log('CategoryFilter: Обновление категории с', selectedCategory, 'на', initialCategory);
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const handleCategorySelect = (currentValue: string) => {
    console.log('CategoryFilter: Выбрана категория', currentValue);
    setSelectedCategory(currentValue);
    setOpen(false);
    onCategoryChange(currentValue);
  }

  const selectedCategoryLabel = categories.find(
    (category) => category.value === selectedCategory
  )?.label

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between hover:bg-[hsl(var(--saas-purple)/0.1)] hover:text-[hsl(var(--saas-purple))] hover:border-[hsl(var(--saas-purple))] transition-colors duration-200 dark:bg-[#1a1b23] dark:border-[#2a2c35] dark:text-white dark:hover:bg-[hsl(var(--saas-purple)/0.2)] dark:hover:border-[hsl(var(--saas-purple)/0.5)]"
        >
          {selectedCategoryLabel}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 dark:bg-[#1a1b23] dark:border-[#2a2c35]">
        <Command className="dark:bg-[#1a1b23]">
          <CommandGroup className="py-1">
            {categories.map((category) => (
              <CommandItem
                key={category.value}
                value={category.value}
                onSelect={handleCategorySelect}
                className={`px-3 py-1.5 ${selectedCategory === category.value ? 'bg-[hsl(var(--saas-purple)/0.1)] text-[hsl(var(--saas-purple))] dark:bg-[hsl(var(--saas-purple)/0.2)] dark:text-[hsl(var(--saas-purple-light))]' : 'dark:text-white dark:hover:bg-[#2a2c35]'}`}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedCategory === category.value ? "opacity-100 text-[hsl(var(--saas-purple))] dark:text-[hsl(var(--saas-purple-light))]" : "opacity-0"
                  )}
                />
                {category.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
