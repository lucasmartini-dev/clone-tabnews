import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import user from "models/user.js";
import password from "models/password.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent 'username'", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/nonexistent-username",
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "The username submitted was not found in the system.",
        action: "Please check if the username was typed correctly.",
        status_code: 404,
      });
    });

    test("With duplicated 'username'", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "duplicated-username-1",
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
          username: "duplicated-username-2",
          email: "duplicated.username.2@curso.dev",
          password: "dontknow123456",
        }),
      });

      expect(response2.status).toBe(201);

      const response3 = await fetch(
        "http://localhost:3000/api/v1/users/duplicated-username-2",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "duplicated-username-1",
          }),
        },
      );

      expect(response3.status).toBe(400);

      const response3Body = await response3.json();

      expect(response3Body).toEqual({
        name: "ValidationError",
        message: "The username you provided is already in use.",
        action: "Please use a different username to perform this operation.",
        status_code: 400,
      });
    });

    test("With duplicated 'email'", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "duplicated-email-1",
          email: "duplicated.email.1@curso.dev",
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
          email: "duplicated.email.2@curso.dev",
          password: "dontknow123456",
        }),
      });

      expect(response2.status).toBe(201);

      const response3 = await fetch(
        "http://localhost:3000/api/v1/users/duplicated-email-2",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "duplicated.email.1@curso.dev",
          }),
        },
      );

      expect(response3.status).toBe(400);

      const response3Body = await response3.json();

      expect(response3Body).toEqual({
        name: "ValidationError",
        message: "The email address you provided is already in use.",
        action:
          "Please use a different email address to perform this operation.",
        status_code: 400,
      });
    });

    test("With unique 'username'", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "unique-username-1",
          email: "unique.username.1@curso.dev",
          password: "dontknow123456",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/unique-username-1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "unique-username-2",
          }),
        },
      );

      expect(response2.status).toBe(200);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        id: response2Body.id,
        username: "unique-username-2",
        email: "unique.username.1@curso.dev",
        password: response2Body.password,
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();

      expect(response2Body.updated_at > response2Body.created_at).toBe(true);
    });

    test("With my own and unique 'username'", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "my-own-unique-username",
          email: "my.own.unique.username@curso.dev",
          password: "dontknow123456",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/my-own-unique-username",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "My-Own-Unique-Username",
          }),
        },
      );

      expect(response2.status).toBe(200);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        id: response2Body.id,
        username: "My-Own-Unique-Username",
        email: "my.own.unique.username@curso.dev",
        password: response2Body.password,
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();

      expect(response2Body.updated_at > response2Body.created_at).toBe(true);
    });

    test("With unique 'email'", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "unique-email-1",
          email: "unique.email.1@curso.dev",
          password: "dontknow123456",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/unique-email-1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "unique.email.2@curso.dev",
          }),
        },
      );

      expect(response2.status).toBe(200);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        id: response2Body.id,
        username: "unique-email-1",
        email: "unique.email.2@curso.dev",
        password: response2Body.password,
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();

      expect(response2Body.updated_at > response2Body.created_at).toBe(true);
    });

    test("With new 'password'", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "new-password-1",
          email: "new.password.1@curso.dev",
          password: "dontknow123456",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/new-password-1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: "newPassword123456",
          }),
        },
      );

      expect(response2.status).toBe(200);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        id: response2Body.id,
        username: "new-password-1",
        email: "new.password.1@curso.dev",
        password: response2Body.password,
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();

      expect(response2Body.updated_at > response2Body.created_at).toBe(true);

      const userInDatabase = await user.findOneByUsername("new-password-1");

      const incorrectPasswordMatch = await password.compare(
        "dontknow123456",
        userInDatabase.password,
      );
      expect(incorrectPasswordMatch).toBe(false);

      const correctPasswordMatch = await password.compare(
        "newPassword123456",
        userInDatabase.password,
      );
      expect(correctPasswordMatch).toBe(true);
    });
  });
});
