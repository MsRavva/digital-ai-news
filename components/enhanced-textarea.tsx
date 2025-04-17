'use client'

import React, { useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'

interface EnhancedTextareaProps extends React.ComponentPropsWithoutRef<typeof Textarea> {}

export function EnhancedTextarea({
  value,
  onChange,
  ...props
}: EnhancedTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Обработчик нажатия клавиш для Ctrl+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()

      // Получаем текущую позицию курсора
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd

      // Вставляем перенос строки с двумя пробелами в конце для корректного отображения в Markdown
      const newValue =
        textarea.value.substring(0, start) +
        '  \n' +
        textarea.value.substring(end)

      // Обновляем значение и позицию курсора
      if (onChange) {
        const event = {
          target: {
            value: newValue
          }
        } as React.ChangeEvent<HTMLTextAreaElement>
        onChange(event)

        // Устанавливаем новую позицию курсора после вставки
        setTimeout(() => {
          // Учитываем два пробела и перенос строки (3 символа)
          textarea.selectionStart = start + 3
          textarea.selectionEnd = start + 3
        }, 0)
      }
    }
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        {...props}
      />
      <div className="mt-1 text-xs text-muted-foreground space-y-1">
        <p>Используйте Ctrl+Enter для вставки новой строки. Поддерживается формат Markdown.</p>
        <p>Для создания блока кода с кнопкой копирования используйте три обратных кавычки ``` и укажите язык, например: ```js</p>
      </div>
    </div>
  )
}
