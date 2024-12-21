import fs from 'node:fs/promises';
import { Database } from "./types";
import { checkFileExists } from "./fs";
import { createUser } from "./users";
import { UserRole } from "./types";

export const readDatabaseFromJSON = async (): Promise<Database> => {
  let database: Database;

  if (await checkFileExists("database.json")) {
    database = JSON.parse(await fs.readFile("database.json", "utf-8"));
  }
  else {
    database = {
      users: [],
      logs: [],
      config: {
        max_auth_attempts: 3,
        wait_when_failed_ms: 5000, // 5 seconds
        password_min_length: 8,
        password_one_uppercase_and_one_lowercase: true,
        password_one_special_character_and_one_number: true
      }
    }

    await saveDatabaseToJSON(database);

    await createUser(database, "Administrateur", UserRole.ADMIN, "");
    await createUser(database, "Utilisateur1", UserRole.RESIDENTIALS, "");
    await createUser(database, "Utilisateur2", UserRole.COMMERCIALS, "");
  }

  return database;
}

export const saveDatabaseToJSON = async (database: Database): Promise<void> => {
  await fs.writeFile("database.json", JSON.stringify(database, null, 2));
};
