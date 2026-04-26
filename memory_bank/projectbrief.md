# Digital AI News - Project Brief

## Цель проекта

Digital AI News - внутренняя новостная платформа на Next.js 16 для публикации, чтения и администрирования материалов по AI с подтвержденной программой миграции backend-слоя с Supabase на Appwrite.

## Основные возможности

- Аутентификация через текущий auth backend с сохранением email/password и OAuth
- Система ролей: student, teacher, admin
- Создание, редактирование, просмотр публикаций
- Категории: новости, учебные материалы, идеи проектов
- Markdown-редактор с предпросмотром
- Архивирование и закрепление постов
- Административная панель управления пользователями
- Безопасный redirect после авторизации и OAuth
- Поэтапная миграция на Appwrite без потери пользователей, ролей и контента

## Project Deliverables

| ID | Deliverable | Status | Weight |
|---|-------------|--------|---------|
| DA-01 | Базовая frontend-инфраструктура на Next.js | completed | 8 |
| DA-02 | Текущая аутентификация и роли на Supabase | completed | 8 |
| DA-03 | Безопасный redirect flow после авторизации и OAuth | completed | 8 |
| DA-04 | CRUD публикаций с Markdown-редактором | completed | 10 |
| DA-05 | Административные сценарии и управление пользователями | completed | 6 |
| DA-06 | Целостность профилей и cleanup legacy auth-данных | completed | 6 |
| DA-07 | UX-стабилизация редактора публикаций | completed | 2 |
| DA-08 | Appwrite technical blueprint и целевая архитектура миграции | completed | 8 |
| DA-09 | Provider-agnostic service layer для auth и data | completed | 8 |
| DA-10 | Перенос read-path на Appwrite | completed | 8 |
| DA-11 | Перенос auth, sessions и role checks на Appwrite | completed | 9 |
| DA-12 | Перенос write-path и админских операций на Appwrite | completed | 9 |
| DA-13 | Cutover, удаление Supabase legacy, тестирование и финальная документация | completed | 5 |
| DA-14 | Физическая миграция данных из Supabase в Appwrite | completed | 5 |

**Total Weight: 100**
