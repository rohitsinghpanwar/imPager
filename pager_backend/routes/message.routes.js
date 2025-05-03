import { verifyJWT } from "../middlewares/auth.middleware.js";
import { handleMessage, showMessages } from "../controllers/message.controller.js";
import { Router } from "express";
const router=Router();

router.route("/send").post(verifyJWT,handleMessage);
router.route("/show/:chatId").get(verifyJWT,showMessages)
export default router