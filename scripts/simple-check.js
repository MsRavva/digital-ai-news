const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Простая проверка
console.log('Скрипт запущен');

// Проверяем, существует ли документ
db.collection('posts').doc('ahcqo4NHXvD4RTQk6l0O').get()
  .then(doc => {
    if (doc.exists) {
      console.log('Документ существует');
      console.log('Данные:', doc.data());
    } else {
      console.log('Документ не существует');
    }
  })
  .catch(err => {
    console.error('Ошибка:', err);
  })
  .finally(() => {
    console.log('Проверка завершена');
  });
