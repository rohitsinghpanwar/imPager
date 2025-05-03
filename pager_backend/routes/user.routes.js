import { Router } from "express";
import { registerUser,loginUser,persistLogin,logoutUser,forgotPassword,emailVerification,changePassword,refreshAccessToken, searchUser, changeProfilePhoto } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router()
router.route("/register").post(
    upload.fields([{name:"profilePhoto",maxCount:1}]),
    registerUser
)
router.route("/login").post(loginUser)
router.route("/me").get(verifyJWT,persistLogin)
router.route("/verify").get(verifyJWT, (req, res) => {
    res.status(200).json({ loggedIn: true, user: req.user });
  })
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/forgotpassword").post(forgotPassword)
router.route("/emailverification").post(emailVerification)
router.route("/changepassword").post(changePassword)
router.route("/refreshcreds").get(refreshAccessToken)
router.route("/search").post(verifyJWT,searchUser);
router.route("/changedp").post(verifyJWT,upload.fields([{name:"dp",maxCount:1}]),changeProfilePhoto)

export default router