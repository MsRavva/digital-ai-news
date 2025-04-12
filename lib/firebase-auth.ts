import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  OAuthProvider
} from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Profile } from "@/types/database";

// Регистрация нового пользователя
export const signUp = async (
  email: string,
  password: string,
  username: string,
  role: string
): Promise<{ user: FirebaseUser | null; error: any }> => {
  try {
    // Создаем пользователя в Firebase Auth
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Создаем профиль пользователя в Firestore
    await setDoc(doc(db, "profiles", userCredential.user.uid), {
      id: userCredential.user.uid,
      username,
      role,
      created_at: new Date().toISOString()
    });

    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

// Вход пользователя
export const signIn = async (
  email: string,
  password: string
): Promise<{ user: FirebaseUser | null; error: any }> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

// Выход пользователя
export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

// Получение профиля пользователя
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const profileDoc = await getDoc(doc(db, "profiles", userId));

    if (profileDoc.exists()) {
      return profileDoc.data() as Profile;
    }

    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

// Слушатель изменения состояния аутентификации
export const subscribeToAuthChanges = (
  callback: (user: FirebaseUser | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};

// Аутентификация через Google
export const signInWithGoogle = async (): Promise<{ user: FirebaseUser | null; error: any }> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);

    // Проверяем, существует ли профиль пользователя
    const userProfile = await getUserProfile(userCredential.user.uid);

    // Если профиля нет, создаем его
    if (!userProfile) {
      const username = userCredential.user.displayName || `user_${userCredential.user.uid.substring(0, 6)}`;
      await setDoc(doc(db, "profiles", userCredential.user.uid), {
        id: userCredential.user.uid,
        username,
        role: "student", // По умолчанию роль студента
        created_at: new Date().toISOString()
      });
    }

    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

// Аутентификация через GitHub
export const signInWithGithub = async (): Promise<{ user: FirebaseUser | null; error: any }> => {
  try {
    const provider = new GithubAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);

    // Проверяем, существует ли профиль пользователя
    const userProfile = await getUserProfile(userCredential.user.uid);

    // Если профиля нет, создаем его
    if (!userProfile) {
      const username = userCredential.user.displayName || `user_${userCredential.user.uid.substring(0, 6)}`;
      await setDoc(doc(db, "profiles", userCredential.user.uid), {
        id: userCredential.user.uid,
        username,
        role: "student", // По умолчанию роль студента
        created_at: new Date().toISOString()
      });
    }

    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};
