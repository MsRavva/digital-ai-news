# Digital AI News

## Цель проекта
Внутренняя новостная платформа на Next.js 16 для публикации, чтения и администрирования материалов по AI. Проект включает полную миграцию backend-слоя с Supabase на собственный инстанс Appwrite.

## Границы MVP
- Авторизация пользователей (email/password, OAuth) и ролевая модель;
- Публикация, редактирование и просмотр новостей/учебных материалов с Markdown;
- Панель администрирования пользователями и статьями;
- Полный перенос данных и сессий на self-hosted Appwrite.

## Project Deliverables
| ID | Deliverable | Status | Weight |
| --- | --- | --- | --- |
| DA-01 | Базовая инфраструктура и Auth на Supabase | completed | 24 |
| DA-02 | CRUD постов, Markdown и редиректы | completed | 20 |
| DA-03 | UX редактора и управление пользователями | completed | 14 |
| DA-04 | Сервисный слой и схемы Appwrite | completed | 16 |
| DA-05 | Миграция и перенос Auth/Data на Appwrite | completed | 26 |
