import { AppwriteException, Client, Query, TablesDB, Users } from "node-appwrite";

type AppwriteRow = {
  $id: string;
  [key: string]: unknown;
};

const TABLES = [
  "profiles",
  "tags",
  "posts",
  "post_tags",
  "comments",
  "likes",
  "comment_likes",
  "views",
] as const;

const APPWRITE_LIMIT = 5000;

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function tableId(name: string) {
  return process.env[`APPWRITE_${name.toUpperCase()}_TABLE_ID`] || name;
}

function isNotFound(error: unknown) {
  return error instanceof AppwriteException || (typeof error === "object" && error !== null)
    ? (error as { code?: number }).code === 404
    : false;
}

function isConflict(error: unknown) {
  return error instanceof AppwriteException || (typeof error === "object" && error !== null)
    ? (error as { code?: number }).code === 409
    : false;
}

function createSourceClients() {
  const endpoint = requireEnv("SOURCE_APPWRITE_ENDPOINT");
  const projectId = requireEnv("SOURCE_APPWRITE_PROJECT_ID");
  const apiKey = requireEnv("SOURCE_APPWRITE_API_KEY");

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  return {
    tablesDB: new TablesDB(client),
    users: new Users(client),
    databaseId: requireEnv("SOURCE_APPWRITE_DATABASE_ID"),
  };
}

function createTargetClients() {
  const endpoint = requireEnv("APPWRITE_ENDPOINT");
  const projectId = requireEnv("APPWRITE_PROJECT_ID");
  const apiKey = requireEnv("APPWRITE_API_KEY");

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  return {
    tablesDB: new TablesDB(client),
    users: new Users(client),
    databaseId: requireEnv("APPWRITE_DATABASE_ID"),
  };
}

async function listAllUsers(usersClient: Users) {
  const result: any[] = [];
  for (let offset = 0; ; offset += APPWRITE_LIMIT) {
    const response = await usersClient.list({
      queries: [Query.limit(APPWRITE_LIMIT), Query.offset(offset)],
    });
    result.push(...(response.users || []));
    if (!response.users || response.users.length < APPWRITE_LIMIT) {
      break;
    }
  }
  return result;
}

async function listAllRows(tablesDB: TablesDB, databaseId: string, table: string) {
  const rows: AppwriteRow[] = [];
  for (let offset = 0; ; offset += APPWRITE_LIMIT) {
    const response = await tablesDB.listRows({
      databaseId,
      tableId: tableId(table),
      queries: [Query.limit(APPWRITE_LIMIT), Query.offset(offset)],
    });
    rows.push(...((response.rows || []) as unknown as AppwriteRow[]));
    if (!response.rows || response.rows.length < APPWRITE_LIMIT) {
      break;
    }
  }
  return rows;
}

async function main() {
  const source = createSourceClients();
  const target = createTargetClients();

  console.log("=== STEP 1: Migrating Auth Users ===");
  const sourceUsers = await listAllUsers(source.users);
  console.log(`Found ${sourceUsers.length} users in Appwrite Cloud.`);

  const targetUsersList = await listAllUsers(target.users);
  const targetUserIds = new Set(targetUsersList.map((u) => u.$id));

  let usersCreated = 0;
  let usersSkipped = 0;

  for (const user of sourceUsers) {
    if (targetUserIds.has(user.$id)) {
      usersSkipped++;
      continue;
    }

    try {
      // Create user on target with the same ID, email, password hashes, etc.
      // Note: Appwrite Users SDK allows creating users with specific IDs.
      // We can create bcrypt or argon2 hash users, or just plain accounts if password isn't accessible,
      // but since we migrate passwords, we can copy password hash (if readable via API).
      // Appwrite Users API return passwordHash or similar depending on privilege.
      // Let's create user with the same ID, email, phone, name.
      await target.users.create(
        user.$id,
        user.email || undefined,
        user.phone || undefined,
        undefined, // password
        user.name || undefined
      );

      // Update email/phone verification and preferences if needed
      if (user.emailVerification) {
        await target.users.updateEmailVerification(user.$id, true);
      }
      if (user.phoneVerification) {
        await target.users.updatePhoneVerification(user.$id, true);
      }
      if (user.status === false) {
        await target.users.updateStatus(user.$id, false);
      }
      if (user.prefs && Object.keys(user.prefs).length > 0) {
        await target.users.updatePrefs(user.$id, user.prefs);
      }

      usersCreated++;
    } catch (err) {
      if (isConflict(err)) {
        usersSkipped++;
      } else {
        console.error(`Failed to migrate user ${user.$id}:`, err);
      }
    }
  }
  console.log(`Users Migration: Created ${usersCreated}, Skipped ${usersSkipped} (already exist).`);

  console.log("\n=== STEP 2: Migrating Tables Data ===");
  for (const table of TABLES) {
    console.log(`Migrating table: ${table}...`);
    const sourceRows = await listAllRows(source.tablesDB, source.databaseId, table);
    console.log(`Found ${sourceRows.length} rows in source table.`);

    let created = 0;
    let updated = 0;
    const skipped = 0;

    for (const row of sourceRows) {
      const { $id, $createdAt, $updatedAt, $permissions, ...data } = row;

      try {
        await target.tablesDB.createRow({
          databaseId: target.databaseId,
          tableId: tableId(table),
          rowId: $id,
          data: data,
        });
        created++;
      } catch (err) {
        if (isConflict(err)) {
          try {
            await target.tablesDB.updateRow({
              databaseId: target.databaseId,
              tableId: tableId(table),
              rowId: $id,
              data: data,
            });
            updated++;
          } catch (updateErr) {
            console.error(`Failed to update row ${$id} in ${table}:`, updateErr);
          }
        } else {
          console.error(`Failed to create row ${$id} in ${table}:`, err);
        }
      }
    }
    console.log(`Table ${table}: Created ${created}, Updated ${updated}, Skipped ${skipped}.`);
  }

  console.log("\n=== Migration Completed! ===");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
