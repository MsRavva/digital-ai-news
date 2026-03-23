# Digital AI News - Project Brief

## Цель проекта

Digital AI News - внутренняя новостная платформа на Next.js 16 и Supabase для публикации, чтения и администрирования материалов по AI.

## Основные возможности

- Аутентификация через Supabase Auth (email/password + OAuth GitHub)
- Система ролей: student, teacher, admin
- Создание, редактирование, просмотр публикаций
- Категории: новости, учебные материалы, идеи проектов
- Markdown-редактор с предпросмотром
- Архивирование и закрепление постов
- Административная панель управления пользователями
- OAuth audit log для диагностики

## Project Deliverables

| ID | Deliverable | Status | Weight |
|---|-------------|--------|---------|
| DA-01 | Базовая инфраструктура (Next.js + Supabase) | completed | 10 |
| DA-02 | Аутентификация и система ролей | completed | 15 |
| DA-03 | CRUD публикаций с Markdown-редактором | completed | 20 |
| DA-04 | OAuth GitHub интеграция | completed | 10 |
| DA-05 | Административная панель | completed | 10 |
| DA-06 | OAuth audit log и диагностика | completed | 10 |
| DA-07 | Backfill orphan-профилей | completed | 5 |
| DA-08 | Исправление потери данных в редакторе | completed | 5 |
| DA-09 | UI/UX полировка и рефакторинг | in_progress | 10 |
| DA-10 | Тестирование и документация | pending | 5 |

**Total Weight: 100**