// Функция для преобразования кодов ошибок Firebase в понятные сообщения на русском языке
export function getFirebaseErrorMessage(error: any): string {
  if (!error) return "Произошла неизвестная ошибка"

  console.log("Обработка ошибки Firebase:", error)

  // Получаем код ошибки из объекта ошибки Firebase
  // Проверяем разные форматы ошибок Firebase
  let errorCode = ""

  if (error.code) {
    // Стандартный формат ошибки Firebase
    errorCode = error.code
  } else if (error.message && error.message.includes("auth/")) {
    // Извлекаем код ошибки из сообщения
    const match = error.message.match(/\(([^)]+)\)/)
    if (match && match[1]) {
      errorCode = match[1]
    }
  }

  console.log("Извлеченный код ошибки:", errorCode)

  // Карта соответствия кодов ошибок Firebase и понятных сообщений
  const errorMessages: Record<string, string> = {
    // Ошибки аутентификации
    "auth/email-already-in-use": "Этот email уже используется другим аккаунтом",
    "auth/invalid-email": "Указан некорректный email",
    "auth/user-disabled": "Этот аккаунт был отключен",
    "auth/user-not-found": "Пользователь с таким email не найден",
    "auth/wrong-password": "Неверный пароль",
    "auth/weak-password":
      "Пароль слишком простой. Используйте не менее 6 символов",
    "auth/operation-not-allowed": "Операция не разрешена",
    "auth/account-exists-with-different-credential":
      "Аккаунт с этим email уже существует с другим методом входа",
    "auth/invalid-credential": "Недействительные учетные данные",
    "auth/invalid-verification-code": "Недействительный код подтверждения",
    "auth/invalid-verification-id":
      "Недействительный идентификатор подтверждения",
    "auth/requires-recent-login":
      "Для этой операции требуется повторный вход в систему",
    "auth/too-many-requests":
      "Слишком много неудачных попыток входа. Пожалуйста, попробуйте позже",
    "auth/network-request-failed":
      "Ошибка сети. Проверьте подключение к интернету",
    "auth/popup-closed-by-user":
      "Окно авторизации было закрыто до завершения операции",
    "auth/unauthorized-domain": "Домен не авторизован для операций OAuth",
    "auth/expired-action-code": "Срок действия кода истек",
    "auth/invalid-action-code": "Недействительный код действия",
    "auth/missing-android-pkg-name": "Отсутствует имя пакета Android",
    "auth/missing-continue-uri": "Отсутствует URL для продолжения",
    "auth/missing-ios-bundle-id": "Отсутствует идентификатор пакета iOS",
    "auth/invalid-continue-uri": "Недействительный URL для продолжения",
    "auth/unauthorized-continue-uri":
      "Домен URL для продолжения не авторизован",
    "auth/missing-email": "Не указан email",
    "auth/missing-password": "Не указан пароль",

    // Ошибки Firestore
    "firestore/cancelled": "Операция была отменена",
    "firestore/unknown": "Неизвестная ошибка",
    "firestore/invalid-argument": "Недопустимый аргумент",
    "firestore/deadline-exceeded": "Превышено время ожидания",
    "firestore/not-found": "Документ не найден",
    "firestore/already-exists": "Документ уже существует",
    "firestore/permission-denied": "Недостаточно прав для выполнения операции",
    "firestore/resource-exhausted": "Исчерпаны ресурсы",
    "firestore/failed-precondition": "Операция отклонена",
    "firestore/aborted": "Операция прервана",
    "firestore/out-of-range": "Значение вне допустимого диапазона",
    "firestore/unimplemented": "Операция не реализована",
    "firestore/internal": "Внутренняя ошибка",
    "firestore/unavailable": "Сервис недоступен",
    "firestore/data-loss": "Потеря данных",
    "firestore/unauthenticated": "Требуется аутентификация",

    // Общие ошибки
    "permission-denied": "Недостаточно прав для выполнения операции",
    "not-found": "Запрашиваемый ресурс не найден",
  }

  // Проверяем наличие сообщения в нашем словаре
  const translatedMessage = errorMessages[errorCode]

  // Логируем результат для отладки
  console.log("Переведенное сообщение:", translatedMessage)

  // Возвращаем понятное сообщение или исходное сообщение ошибки
  if (translatedMessage) {
    return translatedMessage
  }

  // Если код ошибки не найден в словаре, но содержит "auth/", пытаемся дать общее сообщение
  if (errorCode.includes("auth/")) {
    return "Ошибка аутентификации. Пожалуйста, проверьте введенные данные."
  }

  // В крайнем случае возвращаем исходное сообщение или общую ошибку
  return error.message || "Произошла неизвестная ошибка"
}

