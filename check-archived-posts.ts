const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
const db = admin.firestore();

async function main() {
  const snap = await db.collection('posts').where('archived', '==', true).get();
  console.log('Архивных публикаций:', snap.size);
  snap.docs.forEach((doc: any) => {
    const data = doc.data();
    console.log(doc.id, data.title, '| archived:', data.archived, '| type:', typeof data.archived);
  });
  process.exit(0);
}

main(); 