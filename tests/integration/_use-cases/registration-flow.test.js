import activation from "models/activation";
import user from "models/user.js";
import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all success paths)", () => {
  let createdUserResponseBody;
  let activationTokenId;

  describe("With anonymous user", () => {
    test("Create user account", async () => {
      const createdUserResponse = await fetch(
        "http://localhost:3000/api/v1/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "registration-flow",
            email: "registration.flow@curso.dev",
            password: "registration-flow-password",
          }),
        },
      );

      expect(createdUserResponse.status).toBe(201);

      createdUserResponseBody = await createdUserResponse.json();

      expect(createdUserResponseBody).toEqual({
        id: createdUserResponseBody.id,
        username: "registration-flow",
        email: "registration.flow@curso.dev",
        features: ["read:activation_token"],
        password: createdUserResponseBody.password,
        created_at: createdUserResponseBody.created_at,
        updated_at: createdUserResponseBody.updated_at,
      });
    });

    test("Receive activation email", async () => {
      const lastEmail = await orchestrator.getLastEmail();

      expect(lastEmail.sender).toBe("<support@tab.ai>");
      expect(lastEmail.recipients[0]).toBe("<registration.flow@curso.dev>");
      expect(lastEmail.subject).toBe("Activate your account on Tab AI!");
      expect(lastEmail.text).toContain("registration-flow");

      activationTokenId = orchestrator.extractUUID(lastEmail.text);

      expect(lastEmail.text).toContain(
        `${webserver.origin}/account/activate/${activationTokenId}`,
      );

      const activationTokenObject =
        await activation.findOneValidById(activationTokenId);

      expect(activationTokenObject.user_id).toBe(createdUserResponseBody.id);
      expect(activationTokenObject.used_at).toBe(null);
    });

    test("Activate account", async () => {
      const activationResponse = await fetch(
        `${webserver.origin}/api/v1/activations/${activationTokenId}`,
        {
          method: "PATCH",
        },
      );

      expect(activationResponse.status).toBe(200);

      const activationResponseBody = await activationResponse.json();

      expect(Date.parse(activationResponseBody.used_at)).not.toBeNaN();

      const activatedUser = await user.findOneByUsername("registration-flow");
      expect(activatedUser.features).toEqual(["create:session"]);
    });
  });
  describe("With activated user", () => {
    test("Login", async () => {
      const createSessionsResponse = await fetch(
        "http://localhost:3000/api/v1/sessions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "registration.flow@curso.dev",
            password: "registration-flow-password",
          }),
        },
      );

      expect(createSessionsResponse.status).toBe(201);

      const createSessionsResponseBody = await createSessionsResponse.json();

      expect(createSessionsResponseBody.user_id).toBe(
        createdUserResponseBody.id,
      );
    });

    test("Get user information", async () => {});
  });
});
