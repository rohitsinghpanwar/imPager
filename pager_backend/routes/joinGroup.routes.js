import { Router } from "express";
import { groupJoinRequest, joinRequestAccept, joinRequestReject, joinRequestStatus, showJoinRequests } from "../controllers/joinGroup.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router =Router()
router.route("/join").post(verifyJWT,groupJoinRequest);
router.route("/show").get(verifyJWT,showJoinRequests);
router.route("/status/accept").post(verifyJWT,joinRequestAccept)
router.route("/status/reject").post(verifyJWT,joinRequestReject)
router.route("/status").post(verifyJWT,joinRequestStatus)
export default router;