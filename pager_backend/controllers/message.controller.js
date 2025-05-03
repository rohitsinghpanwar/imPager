import { Message } from "../models/message.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import jwt from 'jsonwebtoken'

const handleMessage=asyncHandler(async(req,res)=>{
    console.log(req.body)
const{message,chatId}=req.body.messageInfo;
if (!message || !chatId) {
    throw new apiError(400, "Message and chatId are required");
  }
const accessToken=req.cookies.imPagerAT || req.body.imPagerAT;
if(!accessToken){
    throw new apiError(401,"Unauthorized access token is required")
}
let decodeAccessToken;
try {
  decodeAccessToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
} catch (err) {
  throw new apiError(403, "Invalid or expired token");
}
const messageDeets=await Message.create({
    chatId:chatId,
    sender:decodeAccessToken?._id,
    message:message
})
res.status(200).json({message:"Message sent successfully",data:messageDeets});
  
})

const showMessages=asyncHandler(async (req,res)=>{
  const {chatId}=req.params;
  if(!chatId){
    throw new apiError(400,"chatId is required");
  }
  const messages=await Message.find({chatId}).sort({createdAt: 1})
  console.log(messages)
  res.status(200).json({
    success: true,
    messages,
  })
})

export{handleMessage,showMessages}