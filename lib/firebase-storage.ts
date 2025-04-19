import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import type { FirebaseApp } from "firebase/app";
import { app } from "./firebase";

const storage = getStorage(app as FirebaseApp);

export async function uploadFile(path: string, file: File): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}
