"use client"

/**
 * Добавляет функциональность копирования по клику ко всем элементам code и pre на странице
 */
export function addCodeCopyHandlers() {
  if (typeof window === "undefined") return

  const handleCodeClick = async (element: HTMLElement) => {
    const text = element.textContent || ""
    if (!text.trim()) return

    try {
      await navigator.clipboard.writeText(text)
      
      // Визуальная обратная связь
      const originalBg = element.style.backgroundColor
      const originalColor = element.style.color
      
      element.style.backgroundColor = "hsl(142 76% 36%)" // green-500
      element.style.color = "white"
      element.style.transition = "all 0.2s ease"
      
      // Добавляем иконку галочки
      const checkIcon = document.createElement("span")
      checkIcon.innerHTML = `
        <svg class="inline-block h-3 w-3 ml-1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      `
      checkIcon.style.display = "inline-block"
      checkIcon.style.verticalAlign = "middle"
      element.appendChild(checkIcon)
      
      setTimeout(() => {
        element.style.backgroundColor = originalBg
        element.style.color = originalColor
        checkIcon.remove()
      }, 2000)
    } catch (error) {
      console.error("Failed to copy code:", error)
    }
  }

  const setupCodeElements = () => {
    // Обрабатываем инлайн code элементы (не внутри pre и не в компонентах с кнопками)
    const inlineCodes = document.querySelectorAll("code:not(pre code):not(.shiki-wrapper code):not(.code-block code):not([data-copy-handled])")
    inlineCodes.forEach((code) => {
      // Пропускаем элементы, которые уже обработаны или находятся в компонентах с кнопками
      if (code.closest(".shiki-wrapper") || code.closest(".code-block") || code.closest(".markdown-editor-wrapper")) {
        return
      }
      
      code.setAttribute("data-copy-handled", "true")
      const codeElement = code as HTMLElement
      codeElement.style.cursor = "pointer"
      codeElement.setAttribute("title", "Нажмите, чтобы скопировать")
      
      codeElement.addEventListener("click", (e) => {
        e.stopPropagation()
        handleCodeClick(codeElement)
      })
    })

    // Обрабатываем pre элементы (исключаем те, что уже в компонентах с кнопками)
    const preElements = document.querySelectorAll("pre:not(.shiki-wrapper pre):not(.code-block pre):not([data-copy-handled])")
    preElements.forEach((pre) => {
      // Пропускаем элементы в компонентах с кнопками копирования
      if (pre.closest(".shiki-wrapper") || pre.closest(".code-block") || pre.closest(".markdown-editor-wrapper")) {
        return
      }
      
      pre.setAttribute("data-copy-handled", "true")
      const preElement = pre as HTMLElement
      preElement.style.cursor = "pointer"
      if (!preElement.style.position) {
        preElement.style.position = "relative"
      }
      preElement.setAttribute("title", "Нажмите, чтобы скопировать")
      
      // Проверяем, нет ли уже индикатора
      if (preElement.querySelector(".copy-indicator")) return
      
      // Добавляем визуальный индикатор копирования
      const copyIndicator = document.createElement("div")
      copyIndicator.className = "copy-indicator"
      copyIndicator.innerHTML = `
        <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5; transition: opacity 0.2s;">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
      `
      copyIndicator.style.position = "absolute"
      copyIndicator.style.top = "0.75rem"
      copyIndicator.style.right = "0.75rem"
      copyIndicator.style.padding = "0.5rem"
      copyIndicator.style.background = "hsl(var(--muted))"
      copyIndicator.style.border = "1px solid hsl(var(--border))"
      copyIndicator.style.borderRadius = "0.375rem"
      copyIndicator.style.color = "hsl(var(--foreground))"
      copyIndicator.style.pointerEvents = "none"
      copyIndicator.style.transition = "opacity 0.2s"
      copyIndicator.style.zIndex = "10"
      preElement.appendChild(copyIndicator)
      
      preElement.addEventListener("mouseenter", () => {
        copyIndicator.style.opacity = "1"
      })
      
      preElement.addEventListener("mouseleave", () => {
        copyIndicator.style.opacity = "0.5"
      })
      
      preElement.addEventListener("click", (e) => {
        e.stopPropagation()
        handleCodeClick(preElement)
      })
    })
  }

  // Запускаем сразу и после загрузки DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupCodeElements)
  } else {
    setupCodeElements()
  }

  // Используем MutationObserver для обработки динамически добавленных элементов
  const observer = new MutationObserver(() => {
    setupCodeElements()
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  return () => {
    observer.disconnect()
  }
}

