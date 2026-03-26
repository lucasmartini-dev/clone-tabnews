import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import migrator from "models/migrator.js";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const pendingMigrations = await migrator.listPendingMigrations();
  return response.status(200).json(pendingMigrations);
}

async function postHandler(request, response) {
  const doneMigrations = await migrator.runPendingMigrations();
  if (Array.isArray(doneMigrations) && doneMigrations.length > 0) {
    return response.status(201).json(doneMigrations);
  }
  return response.status(200).json(doneMigrations);
}
