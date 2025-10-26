import admin from "firebase-admin"
import serviceAccount from "./serviceAccountKey.json"

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})
const db = admin.firestore()

async function main() {
  const snap = await db.collection("posts").where("archived", "==", true).get()
  console.log("Архивных публикаций:", snap.size)
  for (const doc of snap.docs) {
    const data = doc.data()
    console.log(
      doc.id,
      data.title,
      "| archived:",
      data.archived,
      "| type:",
      typeof data.archived,
    )
  }
  process.exit(0)
}

main()
