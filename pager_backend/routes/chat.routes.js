import { Router } from "express";
import { chatId } from "../controllers/chatters.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

router.route("/:chatid").post(verifyJWT,chatId);

export default router;