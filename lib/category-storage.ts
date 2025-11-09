/**
 * Утилиты для сохранения и восстановления выбранной категории публикаций, режима просмотра и темы
 */

const CATEGORY_COOKIE_NAME = "selected-category"
const VIEW_MODE_COOKIE_NAME = "view-mode"
const THEME_COOKIE_NAME = "theme"
const CATEGORY_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 дней
const VIEW_MODE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 дней
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 дней

const CATEGORY_SESSION_KEY = "selected-category"
const VIEW_MODE_SESSION_KEY = "view-mode"
const THEME_SESSION_KEY = "theme"

/**
 * Сохранение категории в cookie (клиентская сторона)
 */
export function saveCategoryToCookie(category: string): void {
  if (typeof document === "undefined") return

  const expires = new Date()
  expires.setTime(expires.getTime() + CATEGORY_COOKIE_MAX_AGE * 1000)

  document.cookie = `${CATEGORY_COOKIE_NAME}=${category}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

/**
 * Чтение категории из cookie (клиентская сторона)
 */
export function getCategoryFromCookie(): string | null {
  if (typeof document === "undefined") return null

  const name = `${CATEGORY_COOKIE_NAME}=`
  const cookies = document.cookie.split(";")

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim()
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length)
    }
  }

  return null
}

/**
 * Сохранение категории в cookie через API (серверная сторона)
 */
export async function saveCategoryToCookieServer(category: string): Promise<void> {
  try {
    const response = await fetch("/api/category/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ category }),
    })

    if (!response.ok) {
      console.error("Failed to save category to cookie")
    }
  } catch (error) {
    console.error("Error saving category to cookie:", error)
  }
}

/**
 * Сохранение категории в профиль пользователя (Firestore)
 */
export async function saveCategoryToProfile(
  userId: string,
  category: string,
): Promise<boolean> {
  try {
    const { db } = await import("./firebase")
    const { doc, updateDoc } = await import("firebase/firestore")

    if (!db) {
      console.error("Firestore is not initialized")
      return false
    }

    const profileRef = doc(db, "profiles", userId)
    await updateDoc(profileRef, {
      preferredCategory: category,
      updated_at: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error("Error saving category to profile:", error)
    return false
  }
}

/**
 * Получение категории из профиля пользователя (Firestore)
 */
export async function getCategoryFromProfile(
  userId: string,
): Promise<string | null> {
  try {
    const { db } = await import("./firebase")
    const { doc, getDoc } = await import("firebase/firestore")

    if (!db) {
      console.error("Firestore is not initialized")
      return null
    }

    const profileDoc = await getDoc(doc(db, "profiles", userId))
    if (profileDoc.exists()) {
      const data = profileDoc.data()
      return data.preferredCategory || null
    }

    return null
  } catch (error) {
    console.error("Error getting category from profile:", error)
    return null
  }
}

// ==================== SessionStorage ====================

/**
 * Сохранение категории в sessionStorage
 */
export function saveCategoryToSession(category: string): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(CATEGORY_SESSION_KEY, category)
  } catch (error) {
    console.error("Error saving category to sessionStorage:", error)
  }
}

/**
 * Получение категории из sessionStorage
 */
export function getCategoryFromSession(): string | null {
  if (typeof window === "undefined") return null
  try {
    return sessionStorage.getItem(CATEGORY_SESSION_KEY)
  } catch (error) {
    console.error("Error getting category from sessionStorage:", error)
    return null
  }
}

/**
 * Сохранение режима просмотра в sessionStorage
 */
export function saveViewModeToSession(viewMode: "table" | "bento"): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(VIEW_MODE_SESSION_KEY, viewMode)
  } catch (error) {
    console.error("Error saving viewMode to sessionStorage:", error)
  }
}

/**
 * Получение режима просмотра из sessionStorage
 */
export function getViewModeFromSession(): "table" | "bento" | null {
  if (typeof window === "undefined") return null
  try {
    const value = sessionStorage.getItem(VIEW_MODE_SESSION_KEY)
    if (value === "table" || value === "bento") {
      return value
    }
    return null
  } catch (error) {
    console.error("Error getting viewMode from sessionStorage:", error)
    return null
  }
}

// ==================== ViewMode Cookie ====================

/**
 * Сохранение режима просмотра в cookie (клиентская сторона)
 */
export function saveViewModeToCookie(viewMode: "table" | "bento"): void {
  if (typeof document === "undefined") return

  const expires = new Date()
  expires.setTime(expires.getTime() + VIEW_MODE_COOKIE_MAX_AGE * 1000)

  document.cookie = `${VIEW_MODE_COOKIE_NAME}=${viewMode}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

/**
 * Чтение режима просмотра из cookie (клиентская сторона)
 */
export function getViewModeFromCookie(): "table" | "bento" | null {
  if (typeof document === "undefined") return null

  const name = `${VIEW_MODE_COOKIE_NAME}=`
  const cookies = document.cookie.split(";")

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim()
    if (cookie.indexOf(name) === 0) {
      const value = cookie.substring(name.length)
      if (value === "table" || value === "bento") {
        return value
      }
    }
  }

  return null
}

/**
 * Сохранение режима просмотра в cookie через API (серверная сторона)
 */
export async function saveViewModeToCookieServer(viewMode: "table" | "bento"): Promise<void> {
  try {
    const response = await fetch("/api/view-mode/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ viewMode }),
    })

    if (!response.ok) {
      console.error("Failed to save viewMode to cookie")
    }
  } catch (error) {
    console.error("Error saving viewMode to cookie:", error)
  }
}

// ==================== ViewMode Profile ====================

/**
 * Сохранение режима просмотра в профиль пользователя (Firestore)
 */
export async function saveViewModeToProfile(
  userId: string,
  viewMode: "table" | "bento",
): Promise<boolean> {
  try {
    const { db } = await import("./firebase")
    const { doc, updateDoc } = await import("firebase/firestore")

    if (!db) {
      console.error("Firestore is not initialized")
      return false
    }

    const profileRef = doc(db, "profiles", userId)
    await updateDoc(profileRef, {
      preferredViewMode: viewMode,
      updated_at: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error("Error saving viewMode to profile:", error)
    return false
  }
}

/**
 * Получение режима просмотра из профиля пользователя (Firestore)
 */
export async function getViewModeFromProfile(
  userId: string,
): Promise<"table" | "bento" | null> {
  try {
    const { db } = await import("./firebase")
    const { doc, getDoc } = await import("firebase/firestore")

    if (!db) {
      console.error("Firestore is not initialized")
      return null
    }

    const profileDoc = await getDoc(doc(db, "profiles", userId))
    if (profileDoc.exists()) {
      const data = profileDoc.data()
      const viewMode = data.preferredViewMode
      if (viewMode === "table" || viewMode === "bento") {
        return viewMode
      }
    }

    return null
  } catch (error) {
    console.error("Error getting viewMode from profile:", error)
    return null
  }
}

// ==================== Theme SessionStorage ====================

/**
 * Сохранение темы в sessionStorage
 */
export function saveThemeToSession(theme: "light" | "dark" | "system"): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(THEME_SESSION_KEY, theme)
  } catch (error) {
    console.error("Error saving theme to sessionStorage:", error)
  }
}

/**
 * Получение темы из sessionStorage
 */
export function getThemeFromSession(): "light" | "dark" | "system" | null {
  if (typeof window === "undefined") return null
  try {
    const value = sessionStorage.getItem(THEME_SESSION_KEY)
    if (value === "light" || value === "dark" || value === "system") {
      return value
    }
    return null
  } catch (error) {
    console.error("Error getting theme from sessionStorage:", error)
    return null
  }
}

// ==================== Theme Cookie ====================

/**
 * Сохранение темы в cookie (клиентская сторона)
 */
export function saveThemeToCookie(theme: "light" | "dark" | "system"): void {
  if (typeof document === "undefined") return

  const expires = new Date()
  expires.setTime(expires.getTime() + THEME_COOKIE_MAX_AGE * 1000)

  document.cookie = `${THEME_COOKIE_NAME}=${theme}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

/**
 * Чтение темы из cookie (клиентская сторона)
 */
export function getThemeFromCookie(): "light" | "dark" | "system" | null {
  if (typeof document === "undefined") return null

  const name = `${THEME_COOKIE_NAME}=`
  const cookies = document.cookie.split(";")

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim()
    if (cookie.indexOf(name) === 0) {
      const value = cookie.substring(name.length)
      if (value === "light" || value === "dark" || value === "system") {
        return value
      }
    }
  }

  return null
}

/**
 * Сохранение темы в cookie через API (серверная сторона)
 */
export async function saveThemeToCookieServer(theme: "light" | "dark" | "system"): Promise<void> {
  try {
    const response = await fetch("/api/theme/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ theme }),
    })

    if (!response.ok) {
      console.error("Failed to save theme to cookie")
    }
  } catch (error) {
    console.error("Error saving theme to cookie:", error)
  }
}

// ==================== Theme Profile ====================

/**
 * Сохранение темы в профиль пользователя (Firestore)
 */
export async function saveThemeToProfile(
  userId: string,
  theme: "light" | "dark" | "system",
): Promise<boolean> {
  try {
    const { db } = await import("./firebase")
    const { doc, updateDoc } = await import("firebase/firestore")

    if (!db) {
      console.error("Firestore is not initialized")
      return false
    }

    const profileRef = doc(db, "profiles", userId)
    await updateDoc(profileRef, {
      preferredTheme: theme,
      updated_at: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error("Error saving theme to profile:", error)
    return false
  }
}

/**
 * Получение темы из профиля пользователя (Firestore)
 */
export async function getThemeFromProfile(
  userId: string,
): Promise<"light" | "dark" | "system" | null> {
  try {
    const { db } = await import("./firebase")
    const { doc, getDoc } = await import("firebase/firestore")

    if (!db) {
      console.error("Firestore is not initialized")
      return null
    }

    const profileDoc = await getDoc(doc(db, "profiles", userId))
    if (profileDoc.exists()) {
      const data = profileDoc.data()
      const theme = data.preferredTheme
      if (theme === "light" || theme === "dark" || theme === "system") {
        return theme
      }
    }

    return null
  } catch (error) {
    console.error("Error getting theme from profile:", error)
    return null
  }
}

