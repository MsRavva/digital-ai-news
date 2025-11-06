import { MarkdownRenderer } from "@/components/markdown-renderer";

export default function TestCodeDisplay() {
  const content = `# Тест отображения кода

## Инлайн-код

Это пример \`инлайн-кода\`, который должен копироваться по клику с появлением зеленой галочки.

## Блок кода с определённым языком

\`\`\`javascript
function helloWorld() {
  console.log('Hello, world!');
}
\`\`\`

## Блок кода без определённого языка (многострочный)

\`\`\`
Это
многострочный
код
без
определённого
языка
\`\`\`

## Ещё один пример инлайн-кода

\`console.log('test')\` - это тоже инлайн-код.

## Блок кода на другом языке

\`\`\`typescript
interface User {
  name: string;
  age: number;
}
\`\`\``;

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Тест отображения кода</h1>
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
}