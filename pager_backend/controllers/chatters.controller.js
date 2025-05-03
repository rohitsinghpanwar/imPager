import { asyncHandler } from "../utils/asyncHandler.js";
import { Chatter } from "../models/chatters.model.js";
const chatId=asyncHandler(async(req,res)=>{
    const {chatterId,userId}=req.body
    if(!chatterId || !userId){
       return res.status(401).json({message:"sender or receiver id's are required"})
    }

    const existingChat=await Chatter.findOne({
        chatters:{$all:[userId,chatterId]}
    })

    if(existingChat){
        return res.status(200).json({
            message:"Chat exists Already",
            chatId: existingChat._id
        })
    }

    const newChat=await Chatter.create({
        chatters:[
            userId,chatterId
        ]
    })
    res.status(201).json({
        message: "Chat created successfully",
        chatId: newChat._id
      });
})

export {chatId}