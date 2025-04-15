// Функция валидации имени пользователя
export const validateUsername = (username: string): string | null => {
  // Проверка на пустое значение
  if (!username.trim()) {
    return 'Имя пользователя обязательно';
  }

  // Проверка на наличие двух слов (имя и фамилия)
  const words = username.trim().split(/\s+/);
  if (words.length < 2) {
    return 'Укажите имя и фамилию';
  }

  // Проверка на использование только русских букв
  const cyrillicRegex = /^[\u0410-\u042F\u0430-\u044F\s]+$/;
  if (!cyrillicRegex.test(username)) {
    return 'Используйте только русские буквы';
  }

  // Проверка, что каждое слово начинается с заглавной буквы
  const capitalizedRegex = /^[\u0410-\u042F][\u0430-\u044F]*$/;
  for (const word of words) {
    if (!capitalizedRegex.test(word)) {
      return 'Каждое слово должно начинаться с заглавной буквы';
    }
  }

  return null; // Валидация прошла успешно
};
