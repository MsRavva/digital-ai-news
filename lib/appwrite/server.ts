import { Client, TablesDB, Users } from "node-appwrite";
import { getAppwritePublicConfig, getAppwriteServerConfig } from "./env";

export function createAppwriteAdminClient() {
  const config = getAppwriteServerConfig();

  if (!config) {
    return null;
  }

  const client = new Client().setEndpoint(config.endpoint).setProject(config.projectId);

  client.setKey(config.apiKey);

  return {
    client,
    tablesDB: new TablesDB(client),
    users: new Users(client),
  };
}

export function createAppwriteSessionClient(sessionSecret: string) {
  const config = getAppwritePublicConfig();

  if (!config) {
    return null;
  }

  const client = new Client().setEndpoint(config.endpoint).setProject(config.projectId);

  client.setSession(sessionSecret);

  return {
    client,
    tablesDB: new TablesDB(client),
  };
}
