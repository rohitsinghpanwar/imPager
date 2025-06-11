import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createGroup, groupDetails, removeMember, searchGroup, showGroups } from "../controllers/group.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router=Router();
router.route("/create").post(upload.fields([{name:"groupAvatar",maxCount:1}]),verifyJWT,createGroup)
router.route("/list").post(verifyJWT,showGroups)
router.route("/search").post(verifyJWT,searchGroup)
router.route("/groupinfo").post(verifyJWT,groupDetails)
router.route("/removemember").post(verifyJWT,removeMember)
export default router