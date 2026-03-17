# Auth Pages

## Страницы

- `/login` - вход по email/password и запуск OAuth c записью flow в `oauth_audit_logs`.
- `/register` - регистрация и запуск OAuth c записью flow в `oauth_audit_logs`.
- `/forgot-password` - запрос на сброс пароля.
- `/reset-password` - завершение сброса пароля.

## Потоки данных

- `useAuth()` предоставляет клиентские методы авторизации.
- Redirect после успешного входа завершает серверный endpoint `/auth/post-login`.
- Целевой путь прокидывается через query param и `httpOnly` cookie.
- Если вход запущен из server-protected страницы, путь возврата может быть сформирован серверным guard `requireAuth(...)`.
- Перед переходом на provider клиент записывает старт OAuth-flow в `/api/oauth-audit`, а callback дописывает результат и серверные диагностические шаги.
