// Скрипт для проверки совместимости редактора
// Проверяет импорт компонентов и их структуру

import fs from 'fs';
import path from 'path';

// Проверяем, что все необходимые файлы существуют и содержат правильные импорты
const componentFiles = [
  'components/md-editor.tsx',
  'components/mdx-editor.tsx',
  'components/edit-post-form.tsx',
  'components/create-post-form.tsx'
];

console.log('Проверка файлов компонентов редактора...');

for (const file of componentFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Проверяем, что компоненты импортируют MDEditor
    if (file.includes('form')) {
      if (content.includes('MDEditor')) {
        console.log(`✓ ${file} содержит MDEditor`);
      } else {
        console.log(`✗ ${file} НЕ содержит MDEditor`);
      }
    }
    
    // Проверяем, что редакторы содержат необходимые импорты
    if (file.includes('md')) {
      if (content.includes('@mdxeditor/editor')) {
        console.log(`✓ ${file} содержит импорт @mdxeditor/editor`);
      } else {
        console.log(`✗ ${file} НЕ содержит импорт @mdxeditor/editor`);
      }
    }
  } else {
    console.log(`✗ Файл не найден: ${file}`);
  }
}

// Проверяем package.json на наличие зависимости
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  if (packageJson.dependencies['@mdxeditor/editor']) {
    console.log(`✓ @mdxeditor/editor есть в зависимостях: ${packageJson.dependencies['@mdxeditor/editor']}`);
  } else {
    console.log('✗ @mdxeditor/editor НЕТ в зависимостях');
  }
}

console.log('Проверка завершена.');