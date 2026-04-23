const APPWRITE_SESSION_COOKIE_PREFIX = "a_session_";

export interface AppwritePublicConfig {
  endpoint: string;
  projectId: string;
}

export interface AppwriteServerConfig extends AppwritePublicConfig {
  apiKey: string;
}

function getOptionalEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function getAppwritePublicConfig(): AppwritePublicConfig | null {
  const endpoint = getOptionalEnv("NEXT_PUBLIC_APPWRITE_ENDPOINT");
  const projectId = getOptionalEnv("NEXT_PUBLIC_APPWRITE_PROJECT_ID");

  if (!endpoint || !projectId) {
    return null;
  }

  return {
    endpoint,
    projectId,
  };
}

export function getAppwriteServerConfig(): AppwriteServerConfig | null {
  const endpoint =
    getOptionalEnv("APPWRITE_ENDPOINT") || getOptionalEnv("NEXT_PUBLIC_APPWRITE_ENDPOINT");
  const projectId =
    getOptionalEnv("APPWRITE_PROJECT_ID") || getOptionalEnv("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  const apiKey = getOptionalEnv("APPWRITE_API_KEY");

  if (!endpoint || !projectId || !apiKey) {
    return null;
  }

  return {
    endpoint,
    projectId,
    apiKey,
  };
}

export function getAppwriteSessionCookieName(projectId: string): string {
  return `${APPWRITE_SESSION_COOKIE_PREFIX}${projectId}`;
}
