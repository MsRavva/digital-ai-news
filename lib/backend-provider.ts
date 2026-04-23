export type BackendProvider = "supabase" | "appwrite";

const APPWRITE_PROVIDER = "appwrite";

export function getBackendProvider(): BackendProvider {
  return process.env.NEXT_PUBLIC_BACKEND_PROVIDER === APPWRITE_PROVIDER
    ? APPWRITE_PROVIDER
    : "supabase";
}

export function isAppwriteProvider(): boolean {
  return getBackendProvider() === APPWRITE_PROVIDER;
}
