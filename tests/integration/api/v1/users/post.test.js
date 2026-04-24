import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "lukemartini",
          email: "luke.martini@curso.dev",
          password: "dontknow123456",
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "lukemartini",
        email: "luke.martini@curso.dev",
        features: ["read:activation_token"],
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("With duplicated 'email'", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "duplicated-email-1",
          email: "duplicated.email@curso.dev",
          password: "dontknow123456",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "duplicated-email-2",
          email: "Duplicated.email@curso.dev",
          password: "dontknow123456",
        }),
      });

      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "The email address you provided is already in use.",
        action:
          "Please type a different email address to perform this operation.",
        status_code: 400,
      });
    });

    test("With duplicated 'username'", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "duplicated-username",
          email: "duplicated.username.1@curso.dev",
          password: "dontknow123456",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "Duplicated-Username",
          email: "duplicated.username.2@curso.dev",
          password: "dontknow123456",
        }),
      });

      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "The username you provided is already in use.",
        action: "Please type a different username to perform this operation.",
        status_code: 400,
      });
    });
  });

  describe("Default user", () => {
    test("With unique and valid data", async () => {
      const createdUser1 = await orchestrator.createUser();
      await orchestrator.activateUserByUserId(createdUser1.id);
      const createdUser1SessionObject = await orchestrator.createSession(
        createdUser1.id,
      );

      const createdUser2Response = await fetch(
        "http://localhost:3000/api/v1/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${createdUser1SessionObject.token}`,
          },
          body: JSON.stringify({
            username: "created-and-logged-user-1",
            email: "created.and.logged.user.1@curso.dev",
            password: "dontknow123456",
          }),
        },
      );

      expect(createdUser2Response.status).toBe(403);

      const responseBody = await createdUser2Response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You do not have permission to perform this action.",
        action: 'Please verify if your user has the "create:user" feature.',
        status_code: 403,
      });
    });
  });
});
