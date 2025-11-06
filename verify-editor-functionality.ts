// Скрипт для проверки полной функциональности редактора
// Проверяет, все ли необходимые плагины и функции присутствуют

import fs from 'fs';
import path from 'path';

console.log('Проверка полной функциональности редактора...');

// Проверяем компонент mdx-editor.tsx на наличие всех необходимых плагинов
const mdxEditorPath = path.join(__dirname, 'components', 'mdx-editor.tsx');
if (fs.existsSync(mdxEditorPath)) {
  const content = fs.readFileSync(mdxEditorPath, 'utf8');
  
  const requiredPlugins = [
    'headingsPlugin',
    'listsPlugin', 
    'quotePlugin',
    'thematicBreakPlugin',
    'codeBlockPlugin',
    'codeMirrorPlugin',
    'linkPlugin',
    'linkDialogPlugin',
    'imagePlugin',
    'tablePlugin',
    'diffSourcePlugin',
    'markdownShortcutPlugin',
    'toolbarPlugin'
  ];
  
  console.log('\nПроверка плагинов в MDXEditor:');
  for (const plugin of requiredPlugins) {
    if (content.includes(plugin)) {
      console.log(`✓ ${plugin} - присутствует`);
    } else {
      console.log(`✗ ${plugin} - ОТСУТСТВУЕТ`);
    }
  }
  
  // Также проверяем, что импортируются все нужные типы
  const requiredImports = [
    'MDXEditorMethods',
    'CreateEditorArgs'
  ];
  
  console.log('\nПроверка типов:');
  for (const typeImport of requiredImports) {
    if (content.includes(typeImport)) {
      console.log(`✓ ${typeImport} - импортируется`);
    } else {
      console.log(`✗ ${typeImport} - НЕ импортируется`);
    }
  }
  
  // Проверяем CSS импорт
  if (content.includes('import "@mdxeditor/editor/style.css"')) {
    console.log('\n✓ Стили редактора импортируются');
  } else {
    console.log('\n✗ Стили редактора НЕ импортируются');
  }
}

// Проверяем, что редактор правильно используется в формах
const formFiles = [
  'components/create-post-form.tsx',
  'components/edit-post-form.tsx'
];

console.log('\nПроверка использования редактора в формах:');
for (const formFile of formFiles) {
  const filePath = path.join(__dirname, formFile);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('<MDEditor') && content.includes('value={') && content.includes('onChange={')) {
      console.log(`✓ ${formFile} правильно использует MDEditor с value и onChange`);
    } else {
      console.log(`✗ ${formFile} НЕПРАВИЛЬНО использует MDEditor`);
    }
  } else {
    console.log(`✗ Файл не найден: ${formFile}`);
  }
}

// Проверяем, что редакторы обрабатывают темы
const mdxContent = fs.readFileSync(mdxEditorPath, 'utf8');
if (mdxContent.includes('useTheme') && mdxContent.includes('theme')) {
  console.log('\n✓ Редактор поддерживает темы');
} else {
  console.log('\n✗ Редактор НЕ поддерживает темы');
}

console.log('\nПроверка полной функциональности завершена.');