import crypto from "node:crypto";
import database from "infra/database.js";
import { UnauthorizedError } from "infra/errors";

const EXPIRATION_IN_MILLISECONDS = 60 * 60 * 24 * 30 * 1000; // 30 Days

async function create(userId) {
  const token = crypto.randomBytes(48).toString("hex");
  const newSession = await runInsertQuery(token, userId, getNewExpiresAt());
  return newSession;

  async function runInsertQuery(token, userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          sessions (token, user_id, expires_at)
        VALUES
          ($1, $2, $3)
        RETURNING
          *
      ;`,
      values: [token, userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function findOneValidByToken(token) {
  const results = await database.query({
    text: `
      SELECT
        *
      FROM
        sessions
      WHERE
        token = $1
        AND expires_at > timezone('utc', NOW())
      LIMIT 1
    ;`,
    values: [token],
  });

  if (results.rowCount === 0) {
    throw new UnauthorizedError({
      message: "User does not have an active session.",
      action: "Please check if this user is logged in and try again.",
    });
  }
  return results.rows[0];
}

async function renew(sessionId) {
  const renewedSession = await runUpdateQuery(sessionId, getNewExpiresAt());
  return renewedSession;

  async function runUpdateQuery(sessionId, expiresAt) {
    const results = await database.query({
      text: `
        UPDATE
          sessions
        SET
          expires_at = $2,
          updated_at = timezone('utc', NOW())
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [sessionId, expiresAt],
    });

    return results.rows[0];
  }
}

async function expireById(sessionId) {
  const expiredSessionObject = await runUpdateQuery(sessionId);
  return expiredSessionObject;

  async function runUpdateQuery(sessionId) {
    const results = await database.query({
      text: `
        UPDATE
          sessions
        SET
          expires_at = expires_at - interval '1 year',
          updated_at = timezone('utc', NOW())
        WHERE
          id = $1
        RETURNING
          *
        ;`,
      values: [sessionId],
    });

    return results.rows[0];
  }
}

function getNewExpiresAt() {
  const newExpiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
  return newExpiresAt;
}

const session = {
  EXPIRATION_IN_MILLISECONDS,
  create,
  findOneValidByToken,
  renew,
  expireById,
};

export default session;
