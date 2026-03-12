# Auth Pages

## Страницы

- `/login` - вход по email/password и запуск OAuth.
- `/register` - регистрация и запуск OAuth.
- `/forgot-password` - запрос на сброс пароля.
- `/reset-password` - завершение сброса пароля.

## Потоки данных

- `useAuth()` предоставляет клиентские методы авторизации.
- Redirect после успешного входа завершает серверный endpoint `/auth/post-login`.
- Целевой путь прокидывается через query param и `httpOnly` cookie.
- Если вход запущен из server-protected страницы, путь возврата может быть сформирован серверным guard `requireAuth(...)`.
