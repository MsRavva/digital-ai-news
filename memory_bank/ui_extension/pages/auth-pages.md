# Auth Pages

## Страницы

- `/login` - вход по email/password, запуск OAuth и диагностическая панель шагов справа от формы.
- `/register` - регистрация и запуск OAuth.
- `/forgot-password` - запрос на сброс пароля.
- `/reset-password` - завершение сброса пароля.

## Потоки данных

- `useAuth()` предоставляет клиентские методы авторизации.
- Redirect после успешного входа завершает серверный endpoint `/auth/post-login`.
- Целевой путь прокидывается через query param и `httpOnly` cookie.
- Если вход запущен из server-protected страницы, путь возврата может быть сформирован серверным guard `requireAuth(...)`.
- В диагностическом OAuth flow `/login` хранит UI-состояние шагов в `sessionStorage` и временно принимает callback обратно на себя перед финальным редиректом.
