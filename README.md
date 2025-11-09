# Digital AI News

Проект на Next.js 16 с Tailwind CSS 4 и shadcn/ui.

## Технологии

- **Next.js** 16.0.1 (App Router)
- **React** 19.2.0
- **TypeScript** 5.9.3
- **Tailwind CSS** 4.0.0
- **shadcn/ui** (latest)

## Установка

Зависимости уже установлены. Если нужно переустановить:

```bash
pnpm install
```

## Запуск

```bash
pnpm dev
```

Проект будет доступен по адресу [http://localhost:3000](http://localhost:3000)

## Структура проекта

```
.
├── app/              # Next.js App Router
│   ├── layout.tsx    # Корневой layout
│   ├── page.tsx      # Главная страница
│   └── globals.css   # Глобальные стили с Tailwind CSS 4
├── components/       # React компоненты
│   └── ui/          # shadcn/ui компоненты
├── lib/             # Утилиты
│   └── utils.ts     # Утилиты (cn функция для классов)
└── public/          # Статические файлы
```

## Добавление компонентов shadcn/ui

```bash
pnpm dlx shadcn@latest add [component-name]
```

Например:
```bash
pnpm dlx shadcn@latest add button
```

## Старые файлы

Все старые файлы проекта находятся в папке `backup/`.


