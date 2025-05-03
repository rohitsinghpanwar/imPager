import jwt from "jsonwebtoken"
import { apiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

export const verifyJWT=asyncHandler(async(req,res,next)=>{
    try{
        const token=req.cookies?.imPagerAT || req.header("Authorization")?.replace("Bearer ","")
        if(!token) throw new apiError(401,"Unauthorized Request")
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user)throw new apiError(400,"Invalid Access Token")
        req.user=user;
        next()
    }
    catch(error){
         return res.status(401).json({
    success: false,
    message: error?.message || "Invalid access token"
  });
    }
})