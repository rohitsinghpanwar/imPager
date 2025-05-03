import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from '../utils/apiError.js'
import {apiResponse} from '../utils/apiResponse.js'
import jwt, { decode } from 'jsonwebtoken'
import { User } from "../models/user.model.js";
import { deleteOldProfile, uploadOnCloudinary } from "../utils/cloudinary.js";
import {sendOtp,verifyOtp} from '../utils/otpEmailVerification.js'

const generateAccessAndRefreshTokens=async(userId)=>{
    try{
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken()
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        console.log(`access:${accessToken} refresh:${refreshToken}`)
        return {accessToken,refreshToken}
    }
    catch(e){
    throw new apiError(500,"Error while generating jwt auth tokens")
    }

}

const registerUser=asyncHandler(async (req,res)=>{
    const {username,email,password}=req.body;
    if([username,email,password].some((field)=>field?.trim()==="")){
        throw new apiError(400,"All fields are required")
    }
    const existedUser=await User.findOne({
        $or: [{username},{email}]
    })
    if (existedUser) throw new apiError(409,"User Already exists,try login or forgot password")
    const profilePhotopath=req?.files?.profilePhoto?.[0]?.path;
    let profilePhoto;
    if (!profilePhotopath) {
         profilePhoto=process.env.DEFAULT_PROFILE_PHOTO
    }
    else{
         profilePhoto=await uploadOnCloudinary(profilePhotopath)
        
    }
    if(!profilePhoto) throw new apiError(400,"Profile Photo is required");
    const user = await User.create({
            username: username.toLowerCase(),
            email,
            password,
            profilePhoto: typeof profilePhoto === "string" ? profilePhoto : profilePhoto.url

    })
    const createdUser =await User.findById(user._id).select("-password -refreshToken")
    if(!createdUser) throw new (500,"Error in registering the user");
    return res.status(201).json(
        new apiResponse(200,"User registered Successfully")
    )
})

const loginUser=asyncHandler(async (req,res)=>{
    const {username,password}=req.body;
    if(!username) throw new apiError(400,"Username is required")
    const user = await User.findOne({username});
    if(!user)throw new apiError(404,"Username do not exists.Try to register")
    const isPasswordValid=await user.isPasswordCorrect(password)
    if(!isPasswordValid) throw new apiError(401,'Password is incorrect')
    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id);
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
    console.log(loggedInUser)
    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200).cookie("imPagerAT",accessToken,options).cookie("imPagerRT",refreshToken,options).json(
        new apiResponse(200,{
            user:loggedInUser,accessToken,refreshToken
        },
    "User logged in successfully"
    )
    )

})

const persistLogin=asyncHandler(async(req,res)=>{
    if(!req.user) throw new apiError(401,"user not authenticated")
    res.status(200).json(
    new apiResponse(200,{user:req.user},"User is authenticated"))
})

const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,{
        $unset:{
            refreshToken:1
        }
    },
    {new:true}
)

const options={
    httpOnly:true,
    secure:true
}
return res.status(200).clearCookie("imPagerAT",options).clearCookie("imPagerRT",options).json(new apiResponse(200,{},"User Logged Out"))
})

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    console.log("📩 Received email:", email);

    const success = await sendOtp(email?.email || email);

    if (success) {
        console.log("Email sent successfully")
        return res.status(200).json(new apiResponse(200, "OTP sent successfully"));
        
    } else {
        throw new apiError(500, "Failed to send OTP");
    }
});

const emailVerification = asyncHandler(async (req, res) => {
    const { otp, email } = req.body;
    console.log("Received OTP:", otp);
    console.log("Received Email:", email);

    const isVerified = await verifyOtp(email, otp);
    if (isVerified) {
        console.log("Otp verified successfully");
        return res.status(200).json(new apiResponse(200, "OTP verified successfully"));
    } else {
        throw new apiError(500, "Failed to verify OTP");
    }
});

const changePassword= asyncHandler(async (req,res)=>{
    const {email,newPassword}=req.body;
    console.log(email,newPassword)
    const user=await User.findOne({email})
    if (!user) {
        return res.status(404).json(new apiResponse(404, {}, "User not found,Please register"));
      }
    user.password = newPassword
    await user.save({validateBeforeSave: false})
    console.log(user.password)
    return res
    .status(200)
    .json(new apiResponse(200, {}, "Password changed successfully"))
})

const refreshAccessToken= asyncHandler(async (req,res)=>{
    const userRefreshToken=req.cookies.imPagerRT || req.body.imPagerRT;
    if(!userRefreshToken){
        throw new apiError(401,"Unauthorized request")
    }
    try{
        const decodeToken = jwt.verify(userRefreshToken,process.env.REFRESH_TOKEN_SECRET);
        const user =await User.findById(decodeToken?._id);
        if(!user){
            throw new apiError(404,"Invalid refresh token")
        }
        if(decodeToken !== user.refreshToken){
            throw new apiError(401,"Refresh token is expired or used,Please Re-login")
        }
        const options={
            httpOnly:true,
            secure:true
        }
        const {accessToken,newRefreshToken}=await generateAccessAndRefreshTokens(user._id)

        return res.status(200).cookie("imPagerAT",accessToken,options).cookie("imPagerRT",newRefreshToken,options).json(
            new apiResponse(200,{accessToken,refreshToken:newRefreshToken},"New access token generated successfully")
        )
    }
    catch(e){
        throw new apiError(401,e?.message || "Invalid refresh token")
    }
})

const searchUser=asyncHandler(async (req,res)=>{
    const username=req.body.username;
    if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
    const searchUser = await User.findOne({username}).select("-password -email -refreshToken")
    if(!searchUser){
        return res.status(404).json({message:"User Not found"})
    }else{
            return res.status(200).json({message :"User Found",data:searchUser})
    }

})

const changeProfilePhoto = asyncHandler(async (req, res) => {
    const { _id } = req.body;
    if (!req.files || !req.files.dp || !req.files.dp[0] || !req.files.dp[0].path) {
      throw new apiError(400, "No profile photo uploaded");
    }
    const profilePath = req.files.dp[0].path;
    const user = await User.findById(_id);
    if (!user) {
      throw new apiError(404, "User not found");
    }
  
    // Delete old profile photo if it exists and is not the default
    const oldProfileUrl = user.profilePhoto;
    if (oldProfileUrl && oldProfileUrl !== process.env.DEFAULT_PROFILE_PHOTO) {
      try {
        const publicId = oldProfileUrl
          .split("/image/upload/")[1]
          .split(".")[0]
          .replace(/^v\d+\//, "");
        await deleteOldProfile(publicId);
      } catch (error) {
        console.error("Error deleting old profile photo:", error);
      }
    }
    const uploadResult = await uploadOnCloudinary(profilePath);
    if (!uploadResult || !uploadResult.url) {
      throw new apiError(500, "Failed to upload new profile photo");
    }
    user.profilePhoto = uploadResult.url;
    await user.save();
    const updatedUser = await User.findById(_id).select("-password -refreshToken");
    return res.status(200).json(
      new apiResponse(200, { user: updatedUser, profilePhoto: uploadResult.url }, "Profile photo updated successfully")
    );
  });


export {registerUser,loginUser,persistLogin,logoutUser,forgotPassword,emailVerification,changePassword,refreshAccessToken,searchUser,changeProfilePhoto}