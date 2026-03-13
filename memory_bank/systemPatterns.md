# System Patterns

## Общая архитектура

- Frontend и route handlers реализованы через Next.js App Router.
- Auth state на клиенте держится в `context/auth-context.tsx`.
- Middleware выполняет серверную авторизационную проверку до рендера защищенных маршрутов.
- Доступ к данным и auth API инкапсулирован в `lib/supabase-*.ts`.

## Паттерн post-auth redirect

- `middleware.ts` определяет защищенный маршрут и отсутствие сессии.
- Целевой относительный путь собирается из `pathname + search`.
- Значение валидируется и сохраняется в `post_auth_redirect` cookie.
- Пользователь перенаправляется на `/login?redirect=...`.
- Для server-side guard используется `lib/auth-server.ts`, который формирует такой же безопасный redirect на `/login`.
- После успешного входа и при OAuth callback переход выполняется через `/auth/post-login`.
- `app/auth/post-login/route.ts` считывает cookie или query param, повторно валидирует путь, редиректит и очищает cookie.
- В диагностическом режиме `/login?oauth_debug=1` middleware временно не выталкивает авторизованного пользователя с guest-маршрута, чтобы страница успела показать последний успешный шаг перед финальным редиректом.

## Паттерн OAuth callback

- `app/auth/callback/route.ts` обменивает код на сессию Supabase.
- При отсутствии профиля выполняется защитное создание профиля.
- При ошибке callback очищает `post_auth_redirect`, чтобы не использовать устаревший маршрут в следующем логине.
- Callback не вычисляет redirect через `referer`; используется общий post-login flow.
- Для диагностического OAuth flow callback может вернуть пользователя обратно на `/login` с query-параметрами о последнем успешном или ошибочном шаге.

## Паттерн OAuth диагностики

- Страница `/login` запускает OAuth через `skipBrowserRedirect: true` и получает provider URL до навигации.
- Текущее состояние шагов хранится в `sessionStorage` как best-effort debug state.
- Если после `window.location.assign(...)` браузер остается на странице, UI показывает ручную ссылку для перехода на GitHub/Google.

## Паттерны ролей и доступа

- Middleware ограничивает гостевые и защищенные маршруты.
- Admin-маршруты дополнительно проверяют роль профиля.
- Роли профиля читаются из таблицы `profiles`.

## Паттерн CSP

- Заголовок `Content-Security-Policy` задается в `next.config.mjs`.
- Для редактора markdown разрешен `font-src 'self' data:` без расширения других источников.
