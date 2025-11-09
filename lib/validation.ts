// Функция валидации имени пользователя
export const validateUsername = (username: string): string | null => {
  // Проверка на пустое значение
  if (!username.trim()) {
    return "Имя пользователя обязательно"
  }

  // Проверка на наличие двух слов (имя и фамилия)
  const words = username.trim().split(/\s+/)
  if (words.length < 2) {
    return "Укажите имя и фамилию"
  }

  // Проверка на использование только русских букв и дефиса
  // Добавляем букву Ё/ё и дефис в разрешенные символы
  const cyrillicRegex = /^[\u0410-\u042F\u0401\u0430-\u044F\u0451\s\-]+$/
  if (!cyrillicRegex.test(username)) {
    return "Используйте только русские буквы и дефис для составных фамилий"
  }

  // Разбиваем слова с учетом дефисов
  // Например, "Иванов-Петров" должно считаться как одно слово
  const wordsWithHyphens = []
  for (const word of words) {
    // Если в слове есть дефис, проверяем каждую часть отдельно
    if (word.includes("-")) {
      const parts = word.split("-")
      // Проверяем, что дефис не в начале и не в конце слова
      if (parts[0] === "" || parts[parts.length - 1] === "") {
        return "Дефис не может быть в начале или конце слова"
      }
      // Добавляем все части как отдельные "слова" для проверки
      wordsWithHyphens.push(...parts)
    } else {
      wordsWithHyphens.push(word)
    }
  }

  // Проверка, что каждое слово начинается с заглавной буквы и продолжается строчными
  for (const word of wordsWithHyphens) {
    // Пропускаем пустые слова (если вдруг есть лишние пробелы)
    if (word.length === 0) continue

    // Проверяем, что первая буква заглавная (включая Ё)
    if (!/^[\u0410-\u042F\u0401]/.test(word)) {
      return "Каждое слово должно начинаться с заглавной буквы"
    }

    // Проверяем, что остальные буквы строчные (включая ё)
    if (word.length > 1) {
      const restOfWord = word.substring(1)
      if (!/^[\u0430-\u044F\u0451]+$/.test(restOfWord)) {
        return "После заглавной буквы должны быть строчные буквы"
      }
    }
  }

  return null // Валидация прошла успешно
}

