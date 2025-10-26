"use client"

import { 
  MDXEditor, 
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  diffSourcePlugin,
  markdownShortcutPlugin,
  type MDXEditorMethods,
  type CreateEditorArgs
} from "@mdxeditor/editor"
import { useTheme } from "next-themes"
import { useEffect, useState, useCallback, useMemo } from "react"
import "@mdxeditor/editor/style.css"

interface MDXEditorWrapperProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

export function MDXEditorWrapper({ 
  value, 
  onChange, 
  className = "",
  placeholder = "Введите текст публикации..."
}: MDXEditorWrapperProps) {
  const [isClient, setIsClient] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { theme } = useTheme()

  // Используем useCallback для стабильной ссылки на onChange
  const handleChange = useCallback((newValue: string) => {
    // Сбрасываем ошибку при изменении содержимого
    setError(null)
    onChange(newValue)
  }, [onChange])

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Обработчик ошибок редактора
  const handleError = useCallback((error: any) => {
    console.error("MDX Editor Error:", error)
    setError(error)
  }, [])

  if (!isClient) {
    return (
      <div
        className={`w-full h-[500px] border rounded-md p-4 bg-gray-100 text-gray-500 ${className}`}
      >
        Загрузка редактора...
      </div>
    )
  }

  // Если есть ошибка парсинга, показываем содержимое в исходном виде
  if (error) {
    return (
      <div className={`w-full ${className}`}>
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center mb-2">
            <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="text-red-800 font-medium">Ошибка в форматировании текста</h3>
          </div>
          <p className="text-red-700 text-sm mb-3">
            Редактор обнаружил ошибку в форматировании. Ниже отображается содержимое в исходном виде для исправления.
          </p>
          
          <div className="relative">
            <textarea
              value={value || ""}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full h-64 p-3 border border-red-300 rounded-md font-sans text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Введите исправленный текст здесь..."
            />
            
            <div className="mt-2 flex justify-between items-center">
              <div className="text-xs text-red-600">
                {error.message || "Неизвестная ошибка парсинга markdown"}
              </div>
              <button
                onClick={() => setError(null)}
                className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p className="mb-2"><strong>Советы по исправлению:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Проверьте, все ли HTML-теги закрыты правильно (например, &lt;Название&gt; должно быть &lt;Название&gt;&lt;/Название&gt; или заменено на markdown-синтаксис)</li>
            <li>Убедитесь, что все угловые скобки экранированы, если они не являются частью тегов</li>
            <li>Проверьте, нет ли незакрытых кавычек или скобок в markdown-элементах</li>
          </ul>
        </div>
      </div>
    )
  }

  // Используем тему для определения темы подсветки кода
  const codeBlockTheme = theme === 'dark' ? 'github-dark' : 'github'

  return (
    <div
      className={`w-full ${className}`}
    >
      <MDXEditor
        markdown={value || ""}
        onChange={handleChange}
        placeholder={placeholder}
        onError={handleError}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          codeBlockPlugin(),
          codeMirrorPlugin({ 
            codeBlockThemes: { 
              light: 'github', 
              dark: 'github-dark' 
            },
            defaultCodeBlockLanguage: 'text'
          }),
          linkPlugin(),
          linkDialogPlugin(),
          imagePlugin(),
          tablePlugin(),
          markdownShortcutPlugin(),
          diffSourcePlugin({ 
            viewMode: 'rich-text', 
            diffMarkdown: value || "",
            codeView: {
              options: {
                theme: codeBlockTheme
              }
            }
          }),
          toolbarPlugin({
            toolbarContents: () => (
              <></>
            )
          })
        ]}
      />
    </div>
  )
}

// Делаем типы доступными для настройки редактора
export type { CreateEditorArgs, MDXEditorMethods }