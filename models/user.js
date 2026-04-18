import database from "infra/database.js";
import password from "models/password.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function create(userInputValues) {
  await validateUniqueEmail(userInputValues.email);
  await validateUniqueUsername(userInputValues.username);
  await hashPasswordInObject(userInputValues);
  injectDefaultFeaturesInObject(userInputValues);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function runInsertQuery(userInputValues) {
    const results = await database.query({
      text: `
        INSERT INTO
          users (username, email, password, features)
        VALUES
          ($1, $2, $3, $4)
        RETURNING
          *
        ;`,
      values: [
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
        userInputValues.features,
      ],
    });
    return results.rows[0];
  }

  function injectDefaultFeaturesInObject(userInputValues) {
    userInputValues.features = ["read:activation_token"];
  }
}

async function update(username, userInputValues) {
  const currentUser = await findOneByUsername(username);

  if ("email" in userInputValues) {
    await validateUniqueEmail(userInputValues.email);
  }

  if (
    "username" in userInputValues &&
    username.toLowerCase() !== userInputValues.username.toLowerCase()
  ) {
    await validateUniqueUsername(userInputValues.username);
  }

  if ("password" in userInputValues) {
    await hashPasswordInObject(userInputValues);
  }

  const userWithNewValues = { ...currentUser, ...userInputValues };

  const updatedUser = await runUpdateQuery(userWithNewValues);
  return updatedUser;

  async function runUpdateQuery(userWithNewValues) {
    const results = await database.query({
      text: `
        UPDATE
          users
        SET
          username = $2,
          email = $3,
          password = $4,
          updated_at = timezone('utc', NOW())
        WHERE
          id = $1
        RETURNING
          *
        ;`,
      values: [
        userWithNewValues.id,
        userWithNewValues.username,
        userWithNewValues.email,
        userWithNewValues.password,
      ],
    });

    return results.rows[0];
  }
}

async function findOneById(idParam) {
  const userFound = await runSelectQuery(idParam);
  return userFound;

  async function runSelectQuery(idParam) {
    const results = await database.query({
      text: `
        SELECT 
          *
        FROM 
          users
        WHERE 
          id = $1
        LIMIT 1
        ;`,
      values: [idParam],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "The user ID submitted was not found in the system.",
        action: "Please check if the user ID was typed correctly.",
      });
    }
    return results.rows[0];
  }
}

async function findOneByUsername(usernameParam) {
  const userFound = await runSelectQuery(usernameParam);
  return userFound;

  async function runSelectQuery(usernameParam) {
    const results = await database.query({
      text: `
        SELECT 
          *
        FROM 
          users
        WHERE 
          LOWER(username) = LOWER($1)
        LIMIT 1
        ;`,
      values: [usernameParam],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "The username submitted was not found in the system.",
        action: "Please check if the username was typed correctly.",
      });
    }
    return results.rows[0];
  }
}

async function findOneByEmail(emailParam) {
  const userFound = await runSelectQuery(emailParam);
  return userFound;

  async function runSelectQuery(emailParam) {
    const results = await database.query({
      text: `
        SELECT 
          *
        FROM 
          users
        WHERE 
          LOWER(email) = LOWER($1)
        LIMIT 1
        ;`,
      values: [emailParam],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "The email submitted was not found in the system.",
        action: "Please check if the email was typed correctly.",
      });
    }
    return results.rows[0];
  }
}

async function validateUniqueEmail(email) {
  const results = await database.query({
    text: `
      SELECT
        email
      FROM
        users
      WHERE
        LOWER(email) = LOWER($1)
      LIMIT 1
      ;`,
    values: [email],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "The email address you provided is already in use.",
      action:
        "Please type a different email address to perform this operation.",
    });
  }
}

async function validateUniqueUsername(username) {
  const results = await database.query({
    text: `
      SELECT
        username
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      LIMIT 1
      ;`,
    values: [username],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "The username you provided is already in use.",
      action: "Please type a different username to perform this operation.",
    });
  }
}

async function hashPasswordInObject(userInputValues) {
  const hashedPassword = await password.hash(userInputValues.password);
  userInputValues.password = hashedPassword;
}

async function setFeatures(userId, features) {
  const updatedUser = await runUpdateQuery(userId, features);
  return updatedUser;

  async function runUpdateQuery(userId, features) {
    const results = await database.query({
      text: `
        UPDATE
          users
        SET
          features = $2,
          updated_at = timezone('utc', NOW())
        WHERE
          id = $1
        RETURNING
          *
        ;`,
      values: [userId, features],
    });

    return results.rows[0];
  }
}

const user = {
  create,
  findOneById,
  findOneByUsername,
  findOneByEmail,
  update,
  setFeatures,
};

export default user;
