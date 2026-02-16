import database from "infra/database.js";

async function status(request, response) {
  const dbVersionResult = await database.query("SHOW server_version;");
  const bdVersionValue = dbVersionResult.rows[0].server_version;

  const dbMaxConnectionsResult = await database.query("SHOW max_connections;");
  const dbMaxConnectionsValue = parseInt(
    dbMaxConnectionsResult.rows[0].max_connections,
  );

  const dbOpenedConnectionsResult = await database.query(
    "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();",
  );
  const dbOpenedConnectionsValue = parseInt(
    dbOpenedConnectionsResult.rows[0].count,
  );

  response.status(200).json({
    update_at: new Date().toISOString(),
    dependencies: {
      database: {
        version: bdVersionValue,
        max_connections: dbMaxConnectionsValue,
        opened_connections: dbOpenedConnectionsValue,
      },
    },
  });
}

export default status;
