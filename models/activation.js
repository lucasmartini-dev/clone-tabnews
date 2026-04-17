import email from "infra/email.js";
import database from "infra/database.js";
import webserver from "infra/webserver.js";
import { NotFoundError } from "infra/errors.js";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes

async function findOneValidById(tokenId) {
  const activationTokenObject = await runSelectQuery(tokenId);

  return activationTokenObject;

  async function runSelectQuery(tokenId) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          id = $1
          AND used_at IS NULL
          AND expires_at > NOW()
        LIMIT
          1
        ;`,
      values: [tokenId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message:
          "The activation token submitted was not found in the system or has expired.",
        action: "Please perform a new registration.",
      });
    }

    return results.rows[0];
  }
}

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING
          *
        ;`,
      values: [userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  const bodyMessage = [
    `${user.username}, click the link below to activate your Tab AI account.:`,
    "\n",
    `${webserver.origin}/account/activate/${activationToken.id}`,
    "\n",
    "Atenciosamente,",
    "Equipe Tab AI",
  ];
  await email.send({
    from: "Tab AI <support@tab.ai>",
    to: user.email,
    subject: "Activate your account on Tab AI!",
    text: bodyMessage.join("\n"),
  });
}

const activation = {
  findOneValidById,
  create,
  sendEmailToUser,
};

export default activation;
