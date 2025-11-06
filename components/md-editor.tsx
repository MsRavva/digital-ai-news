"use client"

import { useEffect, useState, useRef } from "react"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Bold, 
  Italic, 
  Link, 
  Image, 
  Code, 
  Quote 
} from "lucide-react"

interface MDEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function MDEditor({ value, onChange, className = "" }: MDEditorProps) {
  const [isClient, setIsClient] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const hasMounted = useRef(false)

  useEffect(() => {
    setIsClient(true)
    hasMounted.current = true
  }, [])

  // Отладочный вывод - используем только один useEffect
  useEffect(() => {
    if (hasMounted.current) {
      console.log("MDEditor value:", value)
      console.log("MDEditor value length:", value?.length)
      console.log("MDEditor received new value:", value)
    }
  }, [value])

  // Функции для вставки markdown-элементов
  const insertAtCursor = (text: string) => {
    if (!textareaRef.current) return
    
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = value?.substring(0, start) + text + value?.substring(end) || text
    
    onChange(newValue)
    
    // Установка курсора после вставленного текста
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = start + text.length
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
        textareaRef.current.focus()
      }
    }, 0)
  }

  const insertAroundSelection = (before: string, after: string = before) => {
    if (!textareaRef.current) return
    
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value?.substring(start, end) || ""
    const newValue = value?.substring(0, start) + before + selectedText + after + value?.substring(end) || before + selectedText + after
    
    onChange(newValue)
    
    // Установка курсора после вставленного текста
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = start + before.length + selectedText.length
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
        textareaRef.current.focus()
      }
    }, 0)
  }

  // Функции для конкретных элементов
  const insertHeading = (level: number) => {
    const prefix = "#".repeat(level) + " "
    insertAtCursor(prefix)
  }

  const insertBold = () => insertAroundSelection("**")
  const insertItalic = () => insertAroundSelection("*")
  const insertCode = () => insertAroundSelection("`")
  const insertLink = () => insertAtCursor("[Название ссылки](https://)")
  const insertImage = () => insertAtCursor("![Альтернативный текст](https://)")
  const insertQuote = () => insertAtCursor("> ")
  const insertUnorderedList = () => insertAtCursor("- ")
  const insertOrderedList = () => insertAtCursor("1. ")

  if (!isClient) {
    return (
      <div
        className={`w-full h-[500px] border rounded-md p-4 bg-gray-100 text-gray-500 ${className}`}
      >
        Загрузка редактора...
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-col gap-4">
        {/* Панель инструментов */}
        <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-secondary border-border">
          {/* Заголовки */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => insertHeading(1)}
              className="p-2 rounded text-foreground hover:bg-accent"
              title="Заголовок 1"
            >
              <Heading1 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertHeading(2)}
              className="p-2 rounded text-foreground hover:bg-accent"
              title="Заголовок 2"
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertHeading(3)}
              className="p-2 rounded text-foreground hover:bg-accent"
              title="Заголовок 3"
            >
              <Heading3 className="h-4 w-4" />
            </button>
          </div>
          
          <div className="w-px bg-border mx-1"></div>
          
          {/* Списки */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={insertUnorderedList}
              className="p-2 rounded text-foreground hover:bg-accent"
              title="Маркированный список"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={insertOrderedList}
              className="p-2 rounded text-foreground hover:bg-accent"
              title="Нумерованный список"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
          </div>
          
          <div className="w-px bg-border mx-1"></div>
          
          {/* Форматирование */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={insertBold}
              className="p-2 rounded text-foreground hover:bg-accent"
              title="Жирный текст"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={insertItalic}
              className="p-2 rounded text-foreground hover:bg-accent"
              title="Курсив"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={insertCode}
              className="p-2 rounded text-foreground hover:bg-accent"
              title="Код"
            >
              <Code className="h-4 w-4" />
            </button>
          </div>
          
          <div className="w-px bg-border mx-1"></div>
          
          {/* Ссылки и медиа */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={insertLink}
              className="p-2 rounded text-foreground hover:bg-accent"
              title="Ссылка"
            >
              <Link className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={insertImage}
              className="p-2 rounded text-foreground hover:bg-accent"
              title="Изображение"
            >
              <Image className="h-4 w-4" />
            </button>
          </div>
          
          <div className="w-px bg-border mx-1"></div>
          
          {/* Другие элементы */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={insertQuote}
              className="p-2 rounded text-foreground hover:bg-accent"
              title="Цитата"
            >
              <Quote className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Поле ввода и предпросмотр */}
        <div className="flex flex-col gap-4">
          {/* Поле ввода */}
          <div className="flex flex-col gap-2">
            <label htmlFor="markdown-editor" className="text-base font-semibold text-gray-700 dark:text-white">
              Содержание
            </label>
            <textarea
              ref={textareaRef}
              id="markdown-editor"
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 rounded-md text-base resize-y focus:ring-2 focus:ring-[hsl(var(--saas-purple))] focus:border-[hsl(var(--saas-purple))] font-sans bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Введите текст публикации в формате Markdown..."
            />
            
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-base text-[hsl(var(--saas-purple))] hover:text-[hsl(var(--saas-purple-dark))] font-semibold dark:text-[hsl(var(--saas-purple))] dark:hover:text-[hsl(var(--saas-purple-dark))]"
              >
                {showPreview ? "Скрыть предпросмотр" : "Показать предпросмотр"}
              </button>
              
              <div className="text-sm text-gray-500 dark:text-gray-200">
                {value?.length || 0} символов
              </div>
            </div>
          </div>

          {/* Предпросмотр */}
          {showPreview && (
            <div className="flex flex-col gap-2">
              <label className="text-base font-semibold text-gray-700 dark:text-white">
                Предварительный просмотр
              </label>
              <div className="border border-gray-200 rounded-md p-4 bg-white dark:bg-gray-800 h-96 overflow-auto">
                {value ? (
                  <MarkdownRenderer content={value} />
                ) : (
                  <p className="text-gray-500 italic">Нет содержимого для предпросмотра</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}