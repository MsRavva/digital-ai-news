import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Получаем все публикации в категории "project-ideas"
    const postsQuery = query(
      collection(db, "posts"),
      where("category", "==", "project-ideas"),
    )

    const snapshot = await getDocs(postsQuery)

    if (snapshot.empty) {
      return NextResponse.json(
        { message: "Публикации не найдены" },
        { status: 404 },
      )
    }

    // Разделяем на активные и архивированные
    const active = []
    const archived = []

    for (const doc of snapshot.docs) {
      const data = doc.data()
      const item = {
        id: doc.id,
        title: data.title,
        archived: data.archived || false,
      }

      if (data.archived) {
        archived.push(item)
      } else {
        active.push(item)
      }
    }

    return NextResponse.json({
      active,
      archived,
      total: active.length + archived.length,
    })
  } catch (error) {
    console.error("Ошибка при получении списка идей проектов:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 },
    )
  }
}
