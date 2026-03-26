import { createRouter } from "next-connect";
import database from "infra/database.js";
import { InternalServerError, MethodNotAllowedError } from "infra/errors";

const router = createRouter();

router.get(getHandler);

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

async function getHandler(request, response) {
  const dbVersionResult = await database.query("SHOW server_version;");
  const bdVersionValue = dbVersionResult.rows[0].server_version;

  const dbMaxConnectionsResult = await database.query("SHOW max_connections;");
  const dbMaxConnectionsValue = parseInt(
    dbMaxConnectionsResult.rows[0].max_connections,
  );

  const dbOpenedConnectionsResult = await database.query(
    "SELECT current_database() as dbname, count(*) FROM pg_stat_activity WHERE datname = current_database();",
  );
  const dbOpenedConnectionsValue = parseInt(
    dbOpenedConnectionsResult.rows[0].count,
  );

  const dbname = dbOpenedConnectionsResult.rows[0].dbname;

  response.status(200).json({
    updated_at: new Date().toISOString(),
    dependencies: {
      database: {
        name: dbname,
        version: bdVersionValue,
        max_connections: dbMaxConnectionsValue,
        opened_connections: dbOpenedConnectionsValue,
      },
    },
  });
}
