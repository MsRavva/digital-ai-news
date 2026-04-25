const DEFAULT_DATABASE_ID = "digital_ai_news";

function getEnv(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value || fallback;
}

export function getAppwriteDatabaseId(): string {
  return getEnv("APPWRITE_DATABASE_ID", DEFAULT_DATABASE_ID);
}

export function getAppwriteTableId(name: string): string {
  return getEnv(`APPWRITE_${name.toUpperCase()}_TABLE_ID`, name);
}
