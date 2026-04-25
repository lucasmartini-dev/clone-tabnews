import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import { ForbiddenError } from "infra/errors.js";
import authorization from "models/authorization.js";
import user from "models/user.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);
router.patch(controller.canRequest("update:user"), patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const usernameParam = request.query.username;
  const userFound = await user.findOneByUsername(usernameParam);
  return response.status(200).json(userFound);
}

async function patchHandler(request, response) {
  const usernameParam = request.query.username;
  const userInputValues = request.body;

  const userTryingToPatch = request.context.user;
  const targetUser = await user.findOneByUsername(usernameParam);

  if (!authorization.can(userTryingToPatch, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "You do not have permission to update another user.",
      action:
        "Please verify if you have the necessary resource to update another user.",
    });
  }

  const updatedUser = await user.update(usernameParam, userInputValues);
  return response.status(200).json(updatedUser);
}
