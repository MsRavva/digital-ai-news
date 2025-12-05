import type { AuthError } from "@supabase/supabase-js";

// Функция для преобразования кодов ошибок Supabase в понятные сообщения на русском языке
export function getSupabaseErrorMessage(error: AuthError | any): string {
  if (!error) return "Произошла неизвестная ошибка";

  console.log("Обработка ошибки Supabase:", error);

  // Получаем сообщение ошибки
  const errorMessage = error.message || error.error_description || "";
  const errorCode = error.code || error.status || "";

  console.log("Код ошибки:", errorCode, "Сообщение:", errorMessage);

  // Карта соответствия ошибок Supabase и понятных сообщений
  const errorMessages: Record<string, string> = {
    // Ошибки аутентификации
    invalid_credentials: "Неверный email или пароль",
    user_not_found: "Пользователь не найден",
    invalid_grant: "Неверные учетные данные",
    email_not_confirmed: "Email не подтвержден. Проверьте вашу почту",
    user_already_exists: "Пользователь с таким email уже существует",
    email_exists: "Пользователь с таким email уже существует",
    weak_password: "Пароль слишком слабый. Используйте минимум 6 символов",
    password_too_short: "Пароль слишком короткий. Минимум 6 символов",
    invalid_email: "Неверный формат email",
    email_address_invalid: "Неверный формат email",
    signup_disabled: "Регистрация временно отключена",
    email_provider_disabled: "Вход через email временно отключен",
    provider_email_needs_verification: "Необходимо подтвердить email",

    // Ошибки OAuth
    oauth_provider_not_supported: "Этот провайдер OAuth не поддерживается",
    oauth_callback_error: "Ошибка при входе через социальную сеть",

    // Ошибки сессии
    session_not_found: "Сессия не найдена. Пожалуйста, войдите снова",
    refresh_token_not_found: "Токен обновления не найден",
    invalid_refresh_token: "Недействительный токен обновления",

    // Ошибки сети
    network_error: "Ошибка сети. Проверьте подключение к интернету",
    timeout: "Превышено время ожидания. Попробуйте еще раз",

    // Ошибки базы данных
    "23505": "Пользователь с таким email уже существует",
    "23503": "Ошибка связи данных",
    "42501": "Недостаточно прав для выполнения операции",
  };

  // Проверяем код ошибки
  if (errorCode && errorMessages[errorCode]) {
    return errorMessages[errorCode];
  }

  // Проверяем сообщение ошибки на наличие ключевых слов
  const lowerMessage = errorMessage.toLowerCase();

  if (
    lowerMessage.includes("invalid login credentials") ||
    lowerMessage.includes("invalid credentials")
  ) {
    return "Неверный email или пароль";
  }

  if (lowerMessage.includes("email not confirmed")) {
    return "Email не подтвержден. Проверьте вашу почту";
  }

  if (lowerMessage.includes("user already registered") || lowerMessage.includes("already exists")) {
    return "Пользователь с таким email уже существует";
  }

  if (lowerMessage.includes("password") && lowerMessage.includes("weak")) {
    return "Пароль слишком слабый. Используйте минимум 6 символов";
  }

  if (lowerMessage.includes("invalid email")) {
    return "Неверный формат email";
  }

  if (lowerMessage.includes("network") || lowerMessage.includes("fetch")) {
    return "Ошибка сети. Проверьте подключение к интернету";
  }

  // Если не нашли соответствие, возвращаем оригинальное сообщение
  return errorMessage || "Произошла неизвестная ошибка. Попробуйте еще раз";
}
