import { initAdmin } from "@/lib/firebase-admin"
import axios from "axios"
import * as cheerio from "cheerio"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
import { type NextRequest, NextResponse } from "next/server"

// Инициализируем Firebase Admin
initAdmin()

// Проверка прав доступа пользователя
async function verifyUserRole(token: string) {
  try {
    // Проверяем токен
    const decodedToken = await getAuth().verifyIdToken(token)
    const uid = decodedToken.uid

    // Получаем профиль пользователя
    const db = getFirestore()
    const profileDoc = await db.collection("profiles").doc(uid).get()

    if (!profileDoc.exists) {
      return null
    }

    const profile = profileDoc.data()
    return {
      uid,
      role: profile?.role || "student",
      username: profile?.username || "",
    }
  } catch (error) {
    console.error("Error verifying user:", error)
    return null
  }
}

// Функция для скрапинга URL
async function scrapeUrl(url: string) {
  try {
    // Формируем URL для ScraperAPI
    const scraperUrl = `http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&render=true`

    // Выполняем запрос
    const response = await axios.get(scraperUrl, { responseType: "text" })
    const html = response.data

    // Используем cheerio для парсинга HTML
    const $ = cheerio.load(html)

    // Извлекаем заголовок
    const title = $("h1").first().text().trim() || $("title").text().trim()

    // Извлекаем основной контент
    const content = extractContent($)

    // Извлекаем и конвертируем изображения в base64
    const images = await extractImages($, url)

    // Извлекаем теги
    const tags = extractTags($)

    // Формируем Markdown-контент
    const markdown = formatToMarkdown(content, images)

    return {
      title,
      content: markdown,
      tags,
      originalUrl: url,
    }
  } catch (error) {
    console.error("Error scraping URL:", error)
    throw new Error("Failed to scrape content")
  }
}

// Функция для извлечения основного контента
function extractContent($: cheerio.CheerioAPI) {
  // Пытаемся найти основной контент по распространенным селекторам
  const contentSelectors = [
    "article",
    ".post-content",
    ".article-content",
    ".entry-content",
    ".content",
    "main",
    "#content",
    ".post-body",
    ".story-body",
  ]

  let contentHtml = ""

  // Проверяем каждый селектор
  for (const selector of contentSelectors) {
    const element = $(selector)
    if (element.length > 0) {
      // Удаляем ненужные элементы
      element
        .find(
          "script, style, iframe, .comments, .related, .share, .ads, .advertisement",
        )
        .remove()

      // Получаем текст
      contentHtml = element.html() || ""
      break
    }
  }

  // Если не нашли контент по селекторам, берем весь body
  if (!contentHtml) {
    $("body").find("script, style, iframe, header, footer, nav").remove()
    contentHtml = $("body").html() || ""
  }

  // Преобразуем HTML в текст с сохранением базовой структуры
  const content = convertHtmlToText($, contentHtml)

  return content
}

// Функция для преобразования HTML в текст
function convertHtmlToText($: cheerio.CheerioAPI, html: string) {
  const $content = cheerio.load(html)

  // Заменяем заголовки на markdown-заголовки
  $content("h1, h2, h3, h4, h5, h6").each((i, el) => {
    const level = Number.parseInt(el.tagName.substring(1))
    const text = $content(el).text().trim()
    $content(el).replaceWith(`\n${"#".repeat(level)} ${text}\n\n`)
  })

  // Заменяем параграфы
  $content("p").each((i, el) => {
    const text = $content(el).text().trim()
    $content(el).replaceWith(`\n${text}\n\n`)
  })

  // Заменяем списки
  $content("ul, ol").each((i, el) => {
    const items = $content(el)
      .find("li")
      .map((i, li) => {
        return `- ${$content(li).text().trim()}`
      })
      .get()
      .join("\n")
    $content(el).replaceWith(`\n${items}\n\n`)
  })

  // Заменяем ссылки
  $content("a").each((i, el) => {
    const text = $content(el).text().trim()
    const href = $content(el).attr("href") || ""
    $content(el).replaceWith(`[${text}](${href})`)
  })

  // Получаем текст и очищаем от лишних пробелов и переносов
  const text = $content
    .text()
    .trim()
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s{2,}/g, " ")

  return text
}

// Функция для извлечения и конвертации изображений
async function extractImages($: cheerio.CheerioAPI, baseUrl: string) {
  const images = []

  // Находим все изображения в контенте
  const imgElements = $(
    "article img, .content img, .post-content img, main img, .entry-content img",
  ).toArray()

  // Если не нашли изображения в основном контенте, ищем везде
  const allImgs = imgElements.length > 0 ? imgElements : $("img").toArray()

  // Ограничиваем количество изображений для обработки
  const limitedImgs = allImgs.slice(0, 5) // Обрабатываем максимум 5 изображений

  // Обрабатываем каждое изображение
  for (const img of limitedImgs) {
    const src = $(img).attr("src")
    if (!src || src.startsWith("data:")) continue // Пропускаем уже закодированные или пустые

    try {
      // Получаем абсолютный URL изображения
      const imageUrl = src.startsWith("http")
        ? src
        : new URL(src, baseUrl).toString()

      // Загружаем изображение через ScraperAPI для обхода ограничений
      const scraperImgUrl = `http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(imageUrl)}&render=false`

      const imageResponse = await axios.get(scraperImgUrl, {
        responseType: "arraybuffer",
        timeout: 10000, // 10 секунд таймаут
      })

      // Определяем тип изображения
      const contentType = imageResponse.headers["content-type"] || "image/jpeg"

      // Конвертируем в base64
      const base64 = Buffer.from(imageResponse.data).toString("base64")
      const dataUrl = `data:${contentType};base64,${base64}`

      // Добавляем в массив
      images.push({
        original: src,
        base64: dataUrl,
        alt: $(img).attr("alt") || "Изображение",
      })
    } catch (error) {
      console.error(`Failed to process image ${src}:`, error)
    }
  }

  return images
}

// Функция для извлечения тегов
function extractTags($: cheerio.CheerioAPI) {
  const tags: string[] = []

  // Пытаемся найти теги по распространенным селекторам
  const tagSelectors = [
    ".tags a",
    ".post-tags a",
    ".article-tags a",
    ".entry-tags a",
    'meta[name="keywords"]',
    'meta[property="article:tag"]',
  ]

  // Проверяем каждый селектор
  for (const selector of tagSelectors) {
    if (selector.startsWith("meta")) {
      const metaContent = $(selector).attr("content")
      if (metaContent) {
        // Разделяем по запятой и добавляем в массив
        metaContent.split(",").forEach((tag) => {
          const trimmedTag = tag.trim()
          if (trimmedTag && !tags.includes(trimmedTag)) {
            tags.push(trimmedTag)
          }
        })
      }
    } else {
      $(selector).each((i, el) => {
        const tag = $(el).text().trim()
        if (tag && !tags.includes(tag)) {
          tags.push(tag)
        }
      })
    }

    // Если нашли хотя бы 3 тега, останавливаемся
    if (tags.length >= 3) break
  }

  // Ограничиваем количество тегов
  return tags.slice(0, 5) // Максимум 5 тегов
}

// Функция для форматирования в Markdown
function formatToMarkdown(content: string, images: any[]) {
  let markdown = content + "\n\n"

  // Добавляем изображения
  for (const image of images) {
    markdown += `![${image.alt}](${image.base64})\n\n`
  }

  return markdown
}

// Обработчик POST-запроса
export async function POST(request: NextRequest) {
  try {
    // Получаем данные из запроса
    const data = await request.json()
    const { url } = data

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Получаем токен из заголовка
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Проверяем права доступа
    const user = await verifyUserRole(token)
    if (
      !user ||
      (user.role !== "teacher" &&
        user.role !== "admin" &&
        user.uid !== "4J9Vf4tqKOU7vDcz99h6nBu0gHx2")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Скрапим URL
    const scrapedData = await scrapeUrl(url)

    return NextResponse.json(scrapedData)
  } catch (error) {
    console.error("Error in scrape-news API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
