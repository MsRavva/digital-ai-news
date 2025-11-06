import type { FirebaseApp } from "firebase/app"
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage"
import { app } from "./firebase"

const storage = getStorage(app as FirebaseApp)

export async function uploadFile(path: string, file: File): Promise<string> {
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return await getDownloadURL(storageRef)
}

export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(storage, path)
  await deleteObject(storageRef)
}
