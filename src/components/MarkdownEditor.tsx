'use client'

import { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MarkdownRenderer } from '@/components/markdown-renderer'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function MarkdownEditor({ value, onChange, className }: MarkdownEditorProps) {
  const [editorHeight, setEditorHeight] = useState('500px')

  useEffect(() => {
    const calculateHeight = () => {
      // Получаем высоту экрана
      const screenHeight = window.innerHeight
      
      // Рассчитываем высоту для редактора, вычитая высоту других элементов
      // Учитываем высоту заголовка формы, лейблов, навигации и т.д.
      const calculatedHeight = screenHeight - 400 // увеличенный отступ для лучшей видимости нижних кнопок
      
      // Минимальная высота - 250px, максимальная - 70vh
      const minHeight = 250
      const maxHeight = window.innerHeight * 0.7
      
      const finalHeight = Math.max(minHeight, Math.min(calculatedHeight, maxHeight))
      
      setEditorHeight(`${finalHeight}px`)
    }

    // Вычисляем начальную высоту
    calculateHeight()
    
    // Добавляем обработчик события изменения размера окна
    window.addEventListener('resize', calculateHeight)
    
    // Очищаем обработчик при размонтировании
    return () => {
      window.removeEventListener('resize', calculateHeight)
    }
  }, [])

  return (
    <div
      className={`w-full border rounded-md overflow-hidden bg-background flex flex-col ${className}`}
      style={{ minHeight: editorHeight }}
    >
      <Tabs defaultValue="edit" className="w-full flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">Редактор</TabsTrigger>
          <TabsTrigger value="preview">Предпросмотр</TabsTrigger>
        </TabsList>
        <TabsContent value="edit" className="mt-0 flex-1 overflow-hidden">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-full resize-none border-0 p-4"
            placeholder="Введите текст в формате Markdown..."
            style={{ height: 'calc(100% - 2rem)' }}
          />
        </TabsContent>
        <TabsContent value="preview" className="mt-0 flex-1 overflow-auto">
          <div className="h-full p-4">
            <MarkdownRenderer content={value} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}