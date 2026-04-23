import { Account, Client, TablesDB } from "appwrite";
import { getAppwritePublicConfig } from "./env";

export function createAppwriteBrowserClient(): Client | null {
  const config = getAppwritePublicConfig();

  if (!config) {
    return null;
  }

  return new Client().setEndpoint(config.endpoint).setProject(config.projectId);
}

export function createAppwriteBrowserServices() {
  const client = createAppwriteBrowserClient();

  if (!client) {
    return null;
  }

  return {
    client,
    account: new Account(client),
    tablesDB: new TablesDB(client),
  };
}
