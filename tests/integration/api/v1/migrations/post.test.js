import database from "infra/database.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await cleanDatabase();
});

async function cleanDatabase() {
  await database.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
}

test("POST to /api/v1/migrations should return 201 and 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  expect(response.status).toBe(201);
  const responseBody = await response.json();
  expect(Array.isArray(responseBody)).toBe(true);
  expect(responseBody.length).toBeGreaterThan(0);

  const responseCheck = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  expect(responseCheck.status).toBe(200);
  const responseCheckBody = await responseCheck.json();
  expect(Array.isArray(responseCheckBody)).toBe(true);
  expect(responseCheckBody.length).toBe(0);
});
