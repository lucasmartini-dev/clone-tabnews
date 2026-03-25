import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  return <StatusComponent />;
}

function StatusComponent() {
  let updatedAtText = "Loading...";
  let database;

  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 1999,
  });

  if (!isLoading && data?.updated_at) {
    updatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");
    if (data?.dependencies?.database) {
      database = data.dependencies.database;
    }
  }

  return (
    <>
      <h1>Status</h1>
      <h2>Last update: {updatedAtText}</h2>
      <br></br>
      <h1>Database</h1>
      <ul>
        <li>
          <h2>
            Version: {isLoading && !database ? "Loading..." : database.version}
          </h2>
        </li>
        <li>
          <h2>
            Max Connections:{" "}
            {isLoading && !database ? "Loading..." : database.max_connections}
          </h2>
        </li>
        <li>
          <h2>
            Opened Connections:{" "}
            {isLoading && !database
              ? "Loading..."
              : database.opened_connections}
          </h2>
        </li>
      </ul>
    </>
  );
}
