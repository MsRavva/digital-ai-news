# Auth Flow Components

## Задействованные компоненты и модули

- `context/auth-context.tsx` - клиентское состояние пользователя и профиля.
- `app/login/page.tsx` - форма логина и старт OAuth.
- `app/register/page.tsx` - форма регистрации и старт OAuth.
- `components/auth-oauth-debug-panel.tsx` - правая диагностическая панель шагов OAuth на `/login`.
- `app/auth/callback/route.ts` - серверный OAuth callback.
- `app/auth/post-login/route.ts` - единая точка server-side редиректа после входа.
- `middleware.ts` - первичная защита маршрутов и запись redirect cookie.
- `lib/auth-server.ts` - server-side guard для layouts и server components с сохранением redirect path.
- `lib/oauth-debug.ts` - shared helper для debug query, persisted state и шага финального редиректа.
