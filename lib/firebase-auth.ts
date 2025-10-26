import type { Profile } from "@/types/database"
import {
  type User as FirebaseUser,
  GithubAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  type UserCredential,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  getRedirectResult as getRedirectResultFirebase,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { auth, db } from "./firebase"

// Проверка, что код выполняется в браузере
const isBrowser = typeof window !== "undefined"

// Проверка подключения к интернету
const checkOnlineStatus = (): boolean => {
  return isBrowser && navigator.onLine
}

// Регистрация нового пользователя
export const signUp = async (
  email: string,
  password: string,
  username: string,
  role = "student", // По умолчанию роль student
): Promise<{ user: FirebaseUser | null; error: any }> => {
  // Если код выполняется на сервере, возвращаем ошибку
  if (!isBrowser) {
    return {
      user: null,
      error: { message: "Auth is only available in the browser" },
    }
  }

  try {
    // Проверяем подключение к интернету
    if (!checkOnlineStatus()) {
      return {
        user: null,
        error: {
          message:
            "Нет подключения к интернету. Пожалуйста, проверьте ваше соединение и попробуйте снова.",
        },
      }
    }

    // Добавляем логирование для отладки
    console.log("Starting registration process", {
      email,
      username,
      role,
      isMobile: isMobile(),
    })

    // Создаем пользователя в Firebase Auth
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    )

    console.log("User created in Firebase Auth", userCredential.user.uid)

    // Создаем профиль пользователя в Firestore
    await setDoc(doc(db, "profiles", userCredential.user.uid), {
      id: userCredential.user.uid,
      username,
      role,
      created_at: new Date().toISOString(),
    })

    console.log("User profile created in Firestore")

    return { user: userCredential.user, error: null }
  } catch (error) {
    console.error("Error during registration:", error)
    return { user: null, error }
  }
}

// Вход пользователя
export const signIn = async (
  email: string,
  password: string,
): Promise<{ user: FirebaseUser | null; error: any }> => {
  // Если код выполняется на сервере, возвращаем ошибку
  if (!isBrowser) {
    return {
      user: null,
      error: { message: "Auth is only available in the browser" },
    }
  }

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    )
    return { user: userCredential.user, error: null }
  } catch (error) {
    return { user: null, error }
  }
}

// Выход пользователя
export const signOut = async (): Promise<void> => {
  // Если код выполняется на сервере, ничего не делаем
  if (!isBrowser) {
    return
  }

  await firebaseSignOut(auth)
}

// Получение профиля пользователя
export const getUserProfile = async (
  userId: string,
): Promise<Profile | null> => {
  // Если код выполняется на сервере, возвращаем null
  if (!isBrowser) {
    return null
  }

  try {
    const profileDoc = await getDoc(doc(db, "profiles", userId))

    if (profileDoc.exists()) {
      return profileDoc.data() as Profile
    }

    return null
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

// Обновление профиля пользователя
export const updateUserProfile = async (
  userId: string,
  profileData: Partial<Profile>,
): Promise<{ success: boolean; error: any }> => {
  // Если код выполняется на сервере, возвращаем ошибку
  if (!isBrowser) {
    return {
      success: false,
      error: { message: "Profile update is only available in the browser" },
    }
  }

  try {
    // Обновляем профиль пользователя в Firestore
    await updateDoc(doc(db, "profiles", userId), {
      ...profileData,
      updated_at: new Date().toISOString(),
    })

    return { success: true, error: null }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return { success: false, error }
  }
}

// Слушатель изменения состояния аутентификации
export const subscribeToAuthChanges = (
  callback: (user: FirebaseUser | null) => void,
) => {
  // Если код выполняется на сервере, возвращаем пустую функцию
  if (!isBrowser) {
    return () => {}
  }

  return onAuthStateChanged(auth, callback)
}

// Аутентификация через Google
export const signInWithGoogle = async (): Promise<{
  user: FirebaseUser | null
  error: any
}> => {
  // Если код выполняется на сервере, возвращаем ошибку
  if (!isBrowser) {
    return {
      user: null,
      error: { message: "Auth is only available in the browser" },
    }
  }

  try {
    // Проверяем подключение к интернету
    if (!checkOnlineStatus()) {
      return {
        user: null,
        error: {
          message:
            "Нет подключения к интернету. Пожалуйста, проверьте ваше соединение и попробуйте снова.",
        },
      }
    }

    const provider = new GoogleAuthProvider()

    // Используем разные методы аутентификации в зависимости от типа устройства
    if (isMobile()) {
      // На мобильных устройствах используем редирект
      await signInWithRedirect(auth, provider)
      // Этот код не будет выполнен до возвращения пользователя после редиректа
      return { user: null, error: null }
    } else {
      // На десктопах используем попап
      const userCredential = await signInWithPopup(auth, provider)

      // Проверяем, существует ли профиль пользователя
      const userProfile = await getUserProfile(userCredential.user.uid)

      // Если профиля нет, создаем его
      if (!userProfile) {
        const username =
          userCredential.user.displayName ||
          `user_${userCredential.user.uid.substring(0, 6)}`
        await setDoc(doc(db, "profiles", userCredential.user.uid), {
          id: userCredential.user.uid,
          username,
          role: "student", // По умолчанию роль студента
          created_at: new Date().toISOString(),
        })
      }

      return { user: userCredential.user, error: null }
    }
  } catch (error) {
    // Проверяем, не связана ли ошибка с отсутствием подключения
    if (!checkOnlineStatus()) {
      return {
        user: null,
        error: {
          message:
            "Потеряно подключение к интернету. Пожалуйста, проверьте ваше соединение и попробуйте снова.",
        },
      }
    }
    return { user: null, error }
  }
}

// Проверка, является ли устройство мобильным
const isMobile = (): boolean => {
  if (!isBrowser) return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  )
}

// Аутентификация через GitHub
export const signInWithGithub = async (): Promise<{
  user: FirebaseUser | null
  error: any
}> => {
  // Если код выполняется на сервере, возвращаем ошибку
  if (!isBrowser) {
    return {
      user: null,
      error: { message: "Auth is only available in the browser" },
    }
  }

  try {
    // Проверяем подключение к интернету
    if (!checkOnlineStatus()) {
      return {
        user: null,
        error: {
          message:
            "Нет подключения к интернету. Пожалуйста, проверьте ваше соединение и попробуйте снова.",
        },
      }
    }

    const provider = new GithubAuthProvider()

    // Используем разные методы аутентификации в зависимости от типа устройства
    if (isMobile()) {
      // На мобильных устройствах используем редирект
      await signInWithRedirect(auth, provider)
      // Этот код не будет выполнен до возвращения пользователя после редиректа
      return { user: null, error: null }
    } else {
      // На десктопах используем попап
      const userCredential = await signInWithPopup(auth, provider)

      // Проверяем, существует ли профиль пользователя
      const userProfile = await getUserProfile(userCredential.user.uid)

      // Если профиля нет, создаем его
      if (!userProfile) {
        const username =
          userCredential.user.displayName ||
          `user_${userCredential.user.uid.substring(0, 6)}`
        await setDoc(doc(db, "profiles", userCredential.user.uid), {
          id: userCredential.user.uid,
          username,
          role: "student", // По умолчанию роль студента
          created_at: new Date().toISOString(),
        })
      }

      return { user: userCredential.user, error: null }
    }
  } catch (error) {
    // Проверяем, не связана ли ошибка с отсутствием подключения
    if (!checkOnlineStatus()) {
      return {
        user: null,
        error: {
          message:
            "Потеряно подключение к интернету. Пожалуйста, проверьте ваше соединение и попробуйте снова.",
        },
      }
    }
    return { user: null, error }
  }
}

// Обработка результата редиректа после аутентификации
export const getRedirectResult = async (): Promise<{
  user: FirebaseUser | null
  error: any
}> => {
  if (!isBrowser) {
    return {
      user: null,
      error: { message: "Auth is only available in the browser" },
    }
  }

  try {
    const result = await getRedirectResultFirebase(auth)

    if (result) {
      // Пользователь успешно аутентифицирован
      const userProfile = await getUserProfile(result.user.uid)

      // Если профиля нет, создаем его
      if (!userProfile) {
        const username =
          result.user.displayName || `user_${result.user.uid.substring(0, 6)}`
        await setDoc(doc(db, "profiles", result.user.uid), {
          id: result.user.uid,
          username,
          role: "student", // По умолчанию роль студента
          created_at: new Date().toISOString(),
        })
      }

      return { user: result.user, error: null }
    }

    // Если результат нулевой, значит не было редиректа
    return { user: null, error: null }
  } catch (error) {
    return { user: null, error }
  }
}
