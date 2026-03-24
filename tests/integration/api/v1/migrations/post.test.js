import database from "infra/database.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await cleanDatabase();
});

async function cleanDatabase() {
  await database.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
}

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    describe("Running pending migrations", () => {
      test("For the first time", async () => {
        const response = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
          },
        );
        expect(response.status).toBe(201);
        const responseBody = await response.json();
        expect(Array.isArray(responseBody)).toBe(true);
        expect(responseBody.length).toBeGreaterThan(0);
      });
      test("For the second time", async () => {
        const responseCheck = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
          },
        );
        expect(responseCheck.status).toBe(200);
        const responseCheckBody = await responseCheck.json();
        expect(Array.isArray(responseCheckBody)).toBe(true);
        expect(responseCheckBody.length).toBe(0);
      });
    });
  });
});
