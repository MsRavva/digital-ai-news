import {
  getPosts,
  getPostsByAuthor,
  getPostsByCategory,
  getPostsByTag,
} from "@/lib/client-api"
import type { Post } from "@/types/database"
import useSWR from "swr"

// Функция для получения данных с поддержкой localStorage
const fetcher = async (key: string) => {
  // Проверяем, есть ли данные в localStorage и не устарели ли они
  const cachedData = localStorage.getItem(key)
  const cachedTime = localStorage.getItem(`${key}_time`)

  const now = Date.now()
  const cacheAge = cachedTime
    ? now - Number.parseInt(cachedTime)
    : Number.POSITIVE_INFINITY

  // Если данные в кэше не старше 1 минуты, используем их
  if (cachedData && cacheAge < 60000) {
    // 1 минута
    console.log(`Using cached data for ${key}`)
    return JSON.parse(cachedData)
  }

  // Разбираем ключ для определения параметров запроса
  const [path, params] = key.split("?")
  const searchParams = new URLSearchParams(params || "")

  const category = searchParams.get("category")
  const authorId = searchParams.get("authorId")
  const tag = searchParams.get("tag")

  // Получаем свежие данные в зависимости от параметров
  let data: Post[] = []

  try {
    if (category) {
      data = await getPostsByCategory(category)
    } else if (authorId) {
      data = await getPostsByAuthor(authorId)
    } else if (tag) {
      data = await getPostsByTag(tag)
    } else {
      data = await getPosts()
    }

    // Сохраняем данные в localStorage
    localStorage.setItem(key, JSON.stringify(data))
    localStorage.setItem(`${key}_time`, now.toString())

    return data
  } catch (error) {
    console.error(`Error fetching data for ${key}:`, error)
    // Если есть кэшированные данные, возвращаем их даже если они устарели
    if (cachedData) {
      console.log(`Falling back to cached data for ${key}`)
      return JSON.parse(cachedData)
    }
    throw error
  }
}

// Хук для получения публикаций с кэшированием
export function usePosts(options?: {
  category?: string
  authorId?: string
  tag?: string
}) {
  // Создаем ключ для SWR, который включает параметры запроса
  let key = "posts"
  const params = new URLSearchParams()

  if (options?.category) {
    params.set("category", options.category)
  }

  if (options?.authorId) {
    params.set("authorId", options.authorId)
  }

  if (options?.tag) {
    params.set("tag", options.tag)
  }

  const paramsString = params.toString()
  if (paramsString) {
    key += `?${paramsString}`
  }

  // Используем SWR для кэширования данных
  const { data, error, mutate, isValidating } = useSWR<Post[]>(key, fetcher, {
    // Данные в кэше считаются актуальными в течение 1 минуты
    dedupingInterval: 60000, // 1 минута
    // Автоматически обновлять данные при фокусе на странице
    revalidateOnFocus: true,
    // Автоматически обновлять данные при восстановлении соединения
    revalidateOnReconnect: true,
    // Сохранять данные в кэше при переключении между страницами
    revalidateOnMount: true,
  })

  return {
    posts: data || [],
    isLoading: !error && !data,
    isError: error,
    mutate, // Функция для принудительного обновления данных
    isValidating, // Флаг, указывающий, что данные обновляются
  }
}
