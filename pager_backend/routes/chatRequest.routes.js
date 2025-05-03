import { Router } from "express";
import { chatRequestAccept, chatRequestReject, chatRequestStatus, sendChatRequest, showChatRequests, showChatters } from "../controllers/chatRequest.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router =Router()
router.route("/send").post(verifyJWT,sendChatRequest);
router.route("/show").get(verifyJWT,showChatRequests);
router.route("/status/accept").post(verifyJWT,chatRequestAccept)
router.route("/status/reject").post(verifyJWT,chatRequestReject)
router.route("/chatters").get(verifyJWT,showChatters)
router.route("/status").post(chatRequestStatus)
export default router;