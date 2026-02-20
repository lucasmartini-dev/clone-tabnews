import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database.js";

async function migrations(request, response) {
  if (request.method !== "GET" && request.method !== "POST") {
    return response.status(405).json({});
  }

  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const defaultMigrationOptions = {
      dbClient: dbClient,
      dryRun: true,
      dir: join("infra", "migrations"),
      direction: "up",
      verbose: true,
      migrationsTable: "pgmigrations",
    };
    if (request.method === "GET") {
      const pendingMigrations = await migrationRunner(defaultMigrationOptions);
      await dbClient.end();
      return response.status(200).json(pendingMigrations);
    }
    if (request.method === "POST") {
      const doneMigrations = await migrationRunner({
        ...defaultMigrationOptions,
        dryRun: false,
      });
      await dbClient.end();

      if (Array.isArray(doneMigrations) && doneMigrations.length > 0) {
        return response.status(201).json(doneMigrations);
      }
      return response.status(200).json(doneMigrations);
    }
  } catch (error) {
    console.log(error);
    throw new Error("Error handling migrations.");
  } finally {
    await dbClient.end();
  }
}

export default migrations;
