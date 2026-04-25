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

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You do not have permission to perform this action.",
        action: 'Please verify if your user has the "update:user" feature.',
        status_code: 403,
      });
    });

    test("With duplicated 'username'", async () => {
      await orchestrator.createUser({
        username: "anon-duplicated-username-1",
      });

      await orchestrator.createUser({
        username: "anon-duplicated-username-2",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/anon-duplicated-username-2",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "anon-duplicated-username-1",
          }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You do not have permission to perform this action.",
        action: 'Please verify if your user has the "update:user" feature.',
        status_code: 403,
      });
    });

    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "anon.duplicated.email.1@curso.dev",
      });

      const createdUser2 = await orchestrator.createUser({
        email: "anon.duplicated.email.2@curso.dev",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "anon.duplicated.email.1@curso.dev",
          }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You do not have permission to perform this action.",
        action: 'Please verify if your user has the "update:user" feature.',
        status_code: 403,
      });
    });

    test("With unique 'username'", async () => {
      const createdUser = await orchestrator.createUser();

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
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

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You do not have permission to perform this action.",
        action: 'Please verify if your user has the "update:user" feature.',
        status_code: 403,
      });
    });

    test("With unique 'email'", async () => {
      const createdUser = await orchestrator.createUser();

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
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

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You do not have permission to perform this action.",
        action: 'Please verify if your user has the "update:user" feature.',
        status_code: 403,
      });
    });

    test("With new 'password'", async () => {
      const createdUser = await orchestrator.createUser();

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
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

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "You do not have permission to perform this action.",
        action: 'Please verify if your user has the "update:user" feature.',
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With nonexistent 'username'", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUserByUserId(createdUser.id);
      const createdUserSessionObject = await orchestrator.createSession(
        createdUser.id,
      );

      const response = await fetch(
        "http://localhost:3000/api/v1/users/nonexistent-username",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${createdUserSessionObject.token}`,
          },
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
      await orchestrator.createUser({
        username: "duplicated-username-1",
      });

      const createdUser2 = await orchestrator.createUser({
        username: "duplicated-username-2",
      });
      await orchestrator.activateUserByUserId(createdUser2.id);
      const createdUser2SessionObject = await orchestrator.createSession(
        createdUser2.id,
      );

      const response = await fetch(
        "http://localhost:3000/api/v1/users/duplicated-username-2",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${createdUser2SessionObject.token}`,
          },
          body: JSON.stringify({
            username: "duplicated-username-1",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "The username you provided is already in use.",
        action: "Please type a different username to perform this operation.",
        status_code: 400,
      });
    });

    test("With duplicated 'email'", async () => {
      const createdUser1 = await orchestrator.createUser({
        email: "duplicated.email.1@curso.dev",
      });
      await orchestrator.activateUserByUserId(createdUser1.id);
      const createdUser1SessionObject = await orchestrator.createSession(
        createdUser1.id,
      );

      await orchestrator.createUser({
        email: "duplicated.email.2@curso.dev",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser1.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${createdUser1SessionObject.token}`,
          },
          body: JSON.stringify({
            email: "duplicated.email.2@curso.dev",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "The email address you provided is already in use.",
        action:
          "Please type a different email address to perform this operation.",
        status_code: 400,
      });
    });

    test("With `user-B` targeting `user-A`", async () => {
      await orchestrator.createUser({
        username: "user-A",
      });

      const createdUserB = await orchestrator.createUser({
        username: "user-B",
      });
      await orchestrator.activateUserByUserId(createdUserB.id);
      const sessionObjectB = await orchestrator.createSession(createdUserB.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/user-A",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObjectB.token}`,
          },
          body: JSON.stringify({
            username: "user-C",
          }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        message: "You do not have permission to update another user.",
        action:
          "Please verify if you have the necessary resource to update another user.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });

    test("With unique 'username'", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUserByUserId(createdUser.id);
      const createdUserSessionObject = await orchestrator.createSession(
        createdUser.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${createdUserSessionObject.token}`,
          },
          body: JSON.stringify({
            username: "unique-username-2",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "unique-username-2",
        email: createdUser.email,
        features: ["create:session", "read:session", "update:user"],
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With my own and unique 'username'", async () => {
      const createdUser = await orchestrator.createUser({
        username: "my-own-unique-username",
      });
      await orchestrator.activateUserByUserId(createdUser.id);
      const createdUserSessionObject = await orchestrator.createSession(
        createdUser.id,
      );

      const response = await fetch(
        "http://localhost:3000/api/v1/users/my-own-unique-username",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${createdUserSessionObject.token}`,
          },
          body: JSON.stringify({
            username: "My-Own-Unique-Username",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "My-Own-Unique-Username",
        email: createdUser.email,
        features: ["create:session", "read:session", "update:user"],
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With unique 'email'", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUserByUserId(createdUser.id);
      const createdUserSessionObject = await orchestrator.createSession(
        createdUser.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${createdUserSessionObject.token}`,
          },
          body: JSON.stringify({
            email: "unique.email.2@curso.dev",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: createdUser.username,
        email: "unique.email.2@curso.dev",
        features: ["create:session", "read:session", "update:user"],
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With new 'password'", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUserByUserId(createdUser.id);
      const createdUserSessionObject = await orchestrator.createSession(
        createdUser.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${createdUserSessionObject.token}`,
          },
          body: JSON.stringify({
            password: "newPassword123456",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: createdUser.username,
        email: createdUser.email,
        features: ["create:session", "read:session", "update:user"],
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(createdUser.username);

      const incorrectPasswordMatch = await password.compare(
        createdUser.password,
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

  describe("Privileged user", () => {
    test("With `update:user:others` targeting `defaultUser`", async () => {
      const createdDefaultUser = await orchestrator.createUser();

      const createdPrivilegedUser = await orchestrator.createUser();
      await orchestrator.activateUserByUserId(createdPrivilegedUser.id);
      const privilegedUserSession = await orchestrator.createSession(
        createdPrivilegedUser.id,
      );

      const responseNonPrivileged = await fetch(
        `http://localhost:3000/api/v1/users/${createdDefaultUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${privilegedUserSession.token}`,
          },
          body: JSON.stringify({
            username: "trying-update-by-non-privileged-user",
          }),
        },
      );

      expect(responseNonPrivileged.status).toBe(403);

      const responseNonPrivilegedBody = await responseNonPrivileged.json();

      expect(responseNonPrivilegedBody).toEqual({
        message: "You do not have permission to update another user.",
        action:
          "Please verify if you have the necessary resource to update another user.",
        name: "ForbiddenError",
        status_code: 403,
      });

      await orchestrator.addFeaturesToUser(createdPrivilegedUser, [
        "update:user:others",
      ]);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${createdDefaultUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${privilegedUserSession.token}`,
          },
          body: JSON.stringify({
            username: "updated-by-privileged-user",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdDefaultUser.id,
        username: "updated-by-privileged-user",
        email: createdDefaultUser.email,
        features: createdDefaultUser.features,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
  });
});
