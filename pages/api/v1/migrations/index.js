import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database.js";
import { createRouter } from "next-connect";
import { InternalServerError, MethodNotAllowedError } from "infra/errors";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.log(" --! Error within the catch block in the next-connect: !--");
  console.error(publicErrorObject);

  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

const defaultMigrationOptions = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  verbose: true,
  migrationsTable: "pgmigrations",
};

async function getHandler(request, response) {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    if (request.method === "GET") {
      const pendingMigrations = await migrationRunner({
        ...defaultMigrationOptions,
        dbClient: dbClient,
      });
      await dbClient.end();
      return response.status(200).json(pendingMigrations);
    }
  } finally {
    await dbClient?.end();
  }
}

async function postHandler(request, response) {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    if (request.method === "POST") {
      const doneMigrations = await migrationRunner({
        ...defaultMigrationOptions,
        dbClient: dbClient,
        dryRun: false,
      });
      await dbClient.end();

      if (Array.isArray(doneMigrations) && doneMigrations.length > 0) {
        return response.status(201).json(doneMigrations);
      }
      return response.status(200).json(doneMigrations);
    }
  } finally {
    await dbClient?.end();
  }
}
