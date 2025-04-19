const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Инициализация Firebase Admin SDK
let serviceAccount;
try {
  serviceAccount = require('../serviceAccountKey.json');
} catch (e) {
  try {
    serviceAccount = require('../firebase-credentials.json');
  } catch (e2) {
    console.error('Не удалось найти файл с учетными данными Firebase');
    process.exit(1);
  }
}
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

const publicationsDir = path.join(__dirname, '../publications');

async function getAllProjectIdeasFromFirebase() {
  const snapshot = await db.collection('posts')
    .where('category', '==', 'project-ideas')
    .get();
  const ideas = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.title) {
      ideas.push({
        title: data.title.trim(),
        archived: !!data.archived
      });
    }
  });
  return ideas;
}

function extractKeywords(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
}

function getIdeaTheme(text) {
  const themeMatch = text.match(/##\s*Тема:?\s*(.+)/i);
  return themeMatch ? themeMatch[1].toLowerCase().trim() : '';
}

function getIdeaDescription(text) {
  const descMatch = text.match(/##\s*Введение\s+(.+?)(?=\s*##|\s*$)/si);
  return descMatch ? descMatch[1].toLowerCase().trim() : '';
}

function getAllProjectIdeasFromFiles() {
  const files = fs.readdirSync(publicationsDir).filter(f => f.endsWith('.md'));
  const ideas = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(publicationsDir, file), 'utf8');
    const match = content.match(/^#\s+(.+)/m);
    if (match) {
      ideas.push({
        title: match[1].trim(),
        keywords: extractKeywords(content),
        theme: getIdeaTheme(content),
        description: getIdeaDescription(content)
      });
    }
  }
  return ideas;
}

async function checkUniqueIdeas(newIdeas) {
  const firebaseIdeas = await getAllProjectIdeasFromFirebase();
  const firebaseTitles = firebaseIdeas.map(i => i.title.toLowerCase());
  // Получаем все идеи из файлов с расширенной структурой
  const fileIdeas = getAllProjectIdeasFromFiles();
  const fileTitles = fileIdeas.map(i => i.title.toLowerCase());

  newIdeas.forEach(idea => {
    const title = idea.trim().toLowerCase();
    const keywords = extractKeywords(idea);
    let isDuplicate = false;
    let reason = '';
    // Проверка по названию
    if (firebaseTitles.includes(title) || fileTitles.includes(title)) {
      isDuplicate = true;
      reason = 'по названию';
    } else {
      // Проверка по ключевым словам и теме
      for (const fileIdea of fileIdeas) {
        const commonKeywords = fileIdea.keywords.filter(k => keywords.includes(k));
        const themeMatch = fileIdea.theme && getIdeaTheme(idea) && fileIdea.theme === getIdeaTheme(idea);
        const descSim = fileIdea.description && getIdeaDescription(idea) && fileIdea.description.includes(getIdeaDescription(idea));
        if (commonKeywords.length >= 3 || themeMatch || descSim) {
          isDuplicate = true;
          reason = themeMatch ? 'по теме' : descSim ? 'по описанию' : 'по ключевым словам';
          break;
        }
      }
    }
    if (isDuplicate) {
      console.log(`Дубликат: "${idea}" уже существует (${reason})`);
    } else {
      console.log(`Уникально: "${idea}"`);
    }
  });
}

// Пример использования: node scripts/check-unique-project-ideas.js "Идея 1" "Идея 2" ...
const newIdeas = process.argv.slice(2);
if (newIdeas.length === 0) {
  console.log('Укажите новые идеи для проверки через аргументы командной строки.');
  process.exit(0);
}

checkUniqueIdeas(newIdeas)
  .then(() => {
    console.log('\nПроверка завершена.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Ошибка при проверке уникальности:', error);
    process.exit(1);
  });