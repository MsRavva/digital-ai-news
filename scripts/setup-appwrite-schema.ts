import {
  AppwriteException,
  Client,
  Permission,
  Role,
  TablesDB,
  TablesDBIndexType,
} from "node-appwrite";

type TableId = "profiles" | "posts" | "tags" | "post_tags" | "comments" | "likes" | "views";

type ColumnSpec =
  | {
      type: "varchar";
      key: string;
      size: number;
      required: boolean;
      array?: boolean;
    }
  | {
      type: "email" | "url" | "datetime" | "boolean" | "text" | "mediumtext";
      key: string;
      required: boolean;
      array?: boolean;
    }
  | {
      type: "enum";
      key: string;
      elements: string[];
      required: boolean;
      array?: boolean;
    };

interface IndexSpec {
  key: string;
  type: TablesDBIndexType;
  columns: string[];
}

interface TableSpec {
  id: TableId;
  name: string;
  columns: ColumnSpec[];
  indexes: IndexSpec[];
}

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "digital_ai_news";

const TABLES: TableSpec[] = [
  {
    id: "profiles",
    name: "Profiles",
    columns: [
      { type: "varchar", key: "userId", size: 128, required: true },
      { type: "varchar", key: "legacySupabaseUserId", size: 128, required: false },
      { type: "email", key: "email", required: false },
      { type: "varchar", key: "username", size: 255, required: true },
      { type: "enum", key: "role", elements: ["student", "teacher", "admin"], required: true },
      { type: "text", key: "bio", required: false },
      { type: "varchar", key: "location", size: 255, required: false },
      { type: "url", key: "website", required: false },
      { type: "text", key: "social", required: false },
      { type: "url", key: "avatarUrl", required: false },
      { type: "varchar", key: "preferredCategory", size: 64, required: false },
      { type: "varchar", key: "preferredViewMode", size: 32, required: false },
      { type: "varchar", key: "themePreference", size: 32, required: false },
      { type: "datetime", key: "createdAt", required: true },
      { type: "datetime", key: "updatedAt", required: false },
    ],
    indexes: [
      { key: "idx_profiles_userId_uq", type: TablesDBIndexType.Unique, columns: ["userId"] },
      {
        key: "idx_profiles_legacyId_uq",
        type: TablesDBIndexType.Unique,
        columns: ["legacySupabaseUserId"],
      },
      { key: "idx_profiles_email_uq", type: TablesDBIndexType.Unique, columns: ["email"] },
      {
        key: "idx_profiles_username_uq",
        type: TablesDBIndexType.Unique,
        columns: ["username"],
      },
      { key: "idx_profiles_role", type: TablesDBIndexType.Key, columns: ["role"] },
    ],
  },
  {
    id: "posts",
    name: "Posts",
    columns: [
      { type: "varchar", key: "title", size: 512, required: true },
      { type: "mediumtext", key: "content", required: true },
      {
        type: "enum",
        key: "category",
        elements: ["news", "materials", "project-ideas", "archived"],
        required: true,
      },
      { type: "varchar", key: "authorId", size: 128, required: true },
      { type: "varchar", key: "authorUsernameSnapshot", size: 255, required: false },
      { type: "boolean", key: "archived", required: false },
      { type: "boolean", key: "pinned", required: false },
      { type: "url", key: "sourceUrl", required: false },
      { type: "datetime", key: "createdAt", required: true },
      { type: "datetime", key: "updatedAt", required: false },
    ],
    indexes: [
      { key: "idx_posts_authorId", type: TablesDBIndexType.Key, columns: ["authorId"] },
      { key: "idx_posts_category", type: TablesDBIndexType.Key, columns: ["category"] },
      { key: "idx_posts_archived", type: TablesDBIndexType.Key, columns: ["archived"] },
      { key: "idx_posts_pinned", type: TablesDBIndexType.Key, columns: ["pinned"] },
      { key: "idx_posts_createdAt", type: TablesDBIndexType.Key, columns: ["createdAt"] },
    ],
  },
  {
    id: "tags",
    name: "Tags",
    columns: [
      { type: "varchar", key: "name", size: 128, required: true },
      { type: "varchar", key: "normalizedName", size: 128, required: true },
    ],
    indexes: [
      {
        key: "idx_tags_normalizedName_unique",
        type: TablesDBIndexType.Unique,
        columns: ["normalizedName"],
      },
    ],
  },
  {
    id: "post_tags",
    name: "Post Tags",
    columns: [
      { type: "varchar", key: "postId", size: 128, required: true },
      { type: "varchar", key: "tagId", size: 128, required: true },
    ],
    indexes: [
      { key: "idx_post_tags_postId", type: TablesDBIndexType.Key, columns: ["postId"] },
      { key: "idx_post_tags_tagId", type: TablesDBIndexType.Key, columns: ["tagId"] },
      {
        key: "idx_post_tags_unique_pair",
        type: TablesDBIndexType.Unique,
        columns: ["postId", "tagId"],
      },
    ],
  },
  {
    id: "comments",
    name: "Comments",
    columns: [
      { type: "varchar", key: "postId", size: 128, required: true },
      { type: "varchar", key: "authorId", size: 128, required: true },
      { type: "text", key: "content", required: true },
      { type: "varchar", key: "parentId", size: 128, required: false },
      { type: "datetime", key: "createdAt", required: true },
      { type: "datetime", key: "updatedAt", required: false },
    ],
    indexes: [
      { key: "idx_comments_postId", type: TablesDBIndexType.Key, columns: ["postId"] },
      { key: "idx_comments_authorId", type: TablesDBIndexType.Key, columns: ["authorId"] },
      { key: "idx_comments_parentId", type: TablesDBIndexType.Key, columns: ["parentId"] },
      { key: "idx_comments_createdAt", type: TablesDBIndexType.Key, columns: ["createdAt"] },
    ],
  },
  {
    id: "likes",
    name: "Likes",
    columns: [
      { type: "varchar", key: "postId", size: 128, required: true },
      { type: "varchar", key: "userId", size: 128, required: true },
      { type: "datetime", key: "createdAt", required: true },
    ],
    indexes: [
      { key: "idx_likes_postId", type: TablesDBIndexType.Key, columns: ["postId"] },
      { key: "idx_likes_userId", type: TablesDBIndexType.Key, columns: ["userId"] },
      {
        key: "idx_likes_unique_pair",
        type: TablesDBIndexType.Unique,
        columns: ["postId", "userId"],
      },
    ],
  },
  {
    id: "views",
    name: "Views",
    columns: [
      { type: "varchar", key: "postId", size: 128, required: true },
      { type: "varchar", key: "userId", size: 128, required: true },
      { type: "datetime", key: "createdAt", required: true },
    ],
    indexes: [
      { key: "idx_views_postId", type: TablesDBIndexType.Key, columns: ["postId"] },
      { key: "idx_views_userId", type: TablesDBIndexType.Key, columns: ["userId"] },
      {
        key: "idx_views_unique_pair",
        type: TablesDBIndexType.Unique,
        columns: ["postId", "userId"],
      },
    ],
  },
];

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function isAppwriteCode(error: unknown, code: number) {
  return error instanceof AppwriteException && error.code === code;
}

function createTablesDB() {
  const endpoint = process.env.APPWRITE_ENDPOINT || requireEnv("NEXT_PUBLIC_APPWRITE_ENDPOINT");
  const projectId =
    process.env.APPWRITE_PROJECT_ID || requireEnv("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  const apiKey = requireEnv("APPWRITE_API_KEY");

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

  return new TablesDB(client);
}

async function ensureDatabase(tablesDB: TablesDB) {
  try {
    return await tablesDB.get({ databaseId: DATABASE_ID });
  } catch (error) {
    if (!isAppwriteCode(error, 404)) {
      throw error;
    }

    console.log(`Creating database ${DATABASE_ID}`);
    return tablesDB.create({
      databaseId: DATABASE_ID,
      name: "Digital AI News",
      enabled: true,
    });
  }
}

async function ensureTable(tablesDB: TablesDB, table: TableSpec) {
  try {
    return await tablesDB.getTable({ databaseId: DATABASE_ID, tableId: table.id });
  } catch (error) {
    if (!isAppwriteCode(error, 404)) {
      throw error;
    }

    console.log(`Creating table ${table.id}`);
    return tablesDB.createTable({
      databaseId: DATABASE_ID,
      tableId: table.id,
      name: table.name,
      permissions: [Permission.read(Role.users())],
      rowSecurity: false,
      enabled: true,
    });
  }
}

async function ensureColumn(tablesDB: TablesDB, tableId: string, column: ColumnSpec) {
  try {
    await tablesDB.getColumn({ databaseId: DATABASE_ID, tableId, key: column.key });
    return;
  } catch (error) {
    if (!isAppwriteCode(error, 404)) {
      throw error;
    }
  }

  console.log(`Creating column ${tableId}.${column.key}`);

  switch (column.type) {
    case "varchar":
      await tablesDB.createVarcharColumn({
        databaseId: DATABASE_ID,
        tableId,
        key: column.key,
        size: column.size,
        required: column.required,
        array: column.array,
      });
      return;
    case "email":
      await tablesDB.createEmailColumn({
        databaseId: DATABASE_ID,
        tableId,
        key: column.key,
        required: column.required,
        array: column.array,
      });
      return;
    case "url":
      await tablesDB.createUrlColumn({
        databaseId: DATABASE_ID,
        tableId,
        key: column.key,
        required: column.required,
        array: column.array,
      });
      return;
    case "datetime":
      await tablesDB.createDatetimeColumn({
        databaseId: DATABASE_ID,
        tableId,
        key: column.key,
        required: column.required,
        array: column.array,
      });
      return;
    case "boolean":
      await tablesDB.createBooleanColumn({
        databaseId: DATABASE_ID,
        tableId,
        key: column.key,
        required: column.required,
        array: column.array,
      });
      return;
    case "text":
      await tablesDB.createTextColumn({
        databaseId: DATABASE_ID,
        tableId,
        key: column.key,
        required: column.required,
        array: column.array,
      });
      return;
    case "mediumtext":
      await tablesDB.createMediumtextColumn({
        databaseId: DATABASE_ID,
        tableId,
        key: column.key,
        required: column.required,
        array: column.array,
      });
      return;
    case "enum":
      await tablesDB.createEnumColumn({
        databaseId: DATABASE_ID,
        tableId,
        key: column.key,
        elements: column.elements,
        required: column.required,
        array: column.array,
      });
  }
}

async function waitForColumn(tablesDB: TablesDB, tableId: string, key: string) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const column = await tablesDB.getColumn({ databaseId: DATABASE_ID, tableId, key });
    if ("status" in column && column.status === "available") {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function ensureIndex(tablesDB: TablesDB, tableId: string, index: IndexSpec) {
  try {
    await tablesDB.getIndex({ databaseId: DATABASE_ID, tableId, key: index.key });
    return;
  } catch (error) {
    if (!isAppwriteCode(error, 404)) {
      throw error;
    }
  }

  console.log(`Creating index ${tableId}.${index.key}`);
  await tablesDB.createIndex({
    databaseId: DATABASE_ID,
    tableId,
    key: index.key,
    type: index.type,
    columns: index.columns,
  });
}

async function updateEnvWithIds() {
  const fs = await import("node:fs/promises");
  const envPath = ".env";
  const current = await fs.readFile(envPath, "utf8").catch(() => "");
  const entries = new Map([
    ["APPWRITE_DATABASE_ID", DATABASE_ID],
    ...TABLES.map((table) => [`APPWRITE_${table.id.toUpperCase()}_TABLE_ID`, table.id] as const),
  ]);

  const lines = current.split(/\r?\n/).filter((line) => line.length > 0);

  for (const [key, value] of entries) {
    const index = lines.findIndex((line) => line.startsWith(`${key}=`));
    if (index >= 0) {
      lines[index] = `${key}=${value}`;
    } else {
      lines.push(`${key}=${value}`);
    }
  }

  await fs.writeFile(envPath, `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  const tablesDB = createTablesDB();

  await ensureDatabase(tablesDB);

  for (const table of TABLES) {
    await ensureTable(tablesDB, table);

    for (const column of table.columns) {
      await ensureColumn(tablesDB, table.id, column);
    }

    for (const column of table.columns) {
      await waitForColumn(tablesDB, table.id, column.key);
    }

    for (const index of table.indexes) {
      await ensureIndex(tablesDB, table.id, index);
    }
  }

  await updateEnvWithIds();
  console.log("Appwrite schema is ready. Local .env was updated with database and table ids.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
