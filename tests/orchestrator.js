import retry from "async-retry";
import { faker } from "@faker-js/faker";
import database from "infra/database.js";
import migrator from "models/migrator.js";
import user from "models/user.js";
import session from "models/session.js";

const emailHttpUrl = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

async function waitForAllServices() {
  // eslint-disable-next-line no-undef
  await Promise.all([waitForWebServer(), waitForEmailServer()]);

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
      onRetry: (error, attemptCount) => {
        console.log(
          `Attempt ${attemptCount} failed to fetch status page: ${error.message}`,
        );
      },
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");
      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }
    }
  }

  async function waitForEmailServer() {
    return retry(fetchEmailPage, {
      retries: 100,
      maxTimeout: 1000,
      onRetry: (error, attemptCount) => {
        console.log(
          `Attempt ${attemptCount} failed to fetch email page: ${error.message}`,
        );
      },
    });

    async function fetchEmailPage() {
      const response = await fetch(emailHttpUrl);
      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }
    }
  }
}

async function clearDatabase() {
  await database.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(userParam) {
  return await user.create({
    username:
      userParam?.username || faker.internet.username().replace(/[_.-]/g, ""),
    email: userParam?.email || faker.internet.email(),
    password: userParam?.password || "dontknow123456",
  });
}

async function createSession(userIdParam) {
  return await session.create(userIdParam);
}

async function getLastEmail() {
  const emailListResponse = await fetch(`${emailHttpUrl}/messages`);
  const emailListBody = await emailListResponse.json();
  const lastEmailItem = emailListBody.pop();
  if (!lastEmailItem) {
    return null;
  }

  const emailTextResponse = await fetch(
    `${emailHttpUrl}/messages/${lastEmailItem.id}.plain`,
  );
  lastEmailItem.text = await emailTextResponse.text();

  return lastEmailItem;
}

async function deleteAllEmails() {
  await fetch(`${emailHttpUrl}/messages`, {
    method: "DELETE",
  });
}

function extractUUID(text) {
  const match = text.match(/[0-9a-fA-F-]{36}/);
  return match ? match[0] : null;
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createSession,
  getLastEmail,
  deleteAllEmails,
  extractUUID,
};
export default orchestrator;
