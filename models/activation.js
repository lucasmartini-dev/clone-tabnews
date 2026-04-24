import email from "infra/email.js";
import database from "infra/database.js";
import webserver from "infra/webserver.js";
import { NotFoundError, ForbiddenError } from "infra/errors.js";
import authorization from "models/authorization.js";
import user from "models/user.js";

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

async function markTokenAsUsed(activationTokenId) {
  const usedActivationToken = await runUpdateQuery(activationTokenId);
  return usedActivationToken;

  async function runUpdateQuery(activationTokenId) {
    const results = await database.query({
      text: `
        UPDATE
          user_activation_tokens
        SET
          used_at = timezone('utc', NOW()),
          updated_at = timezone('utc', NOW())
        WHERE
          id = $1
          AND used_at IS NULL
          AND expires_at > NOW()
        RETURNING
          *
        ;`,
      values: [activationTokenId],
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

async function activateUserByUserId(userId) {
  const userToActivate = await user.findOneById(userId);

  if (!authorization.can(userToActivate, "read:activation_token")) {
    throw new ForbiddenError({
      message: "You can no longer use activation tokens.",
      action: "Please contact support.",
    });
  }
  const activatedUser = await user.setFeatures(userId, [
    "create:session",
    "read:session",
  ]);
  return activatedUser;
}

const activation = {
  EXPIRATION_IN_MILLISECONDS,
  findOneValidById,
  create,
  sendEmailToUser,
  markTokenAsUsed,
  activateUserByUserId,
};

export default activation;
