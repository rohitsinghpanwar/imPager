import mongoose,{Schema} from "mongoose";
const Request=new Schema({
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "User",
        requird: true
    },
    receiver:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    status:{
        type:String,
        enum:['pending','accepted','rejected'],
        default:'pending'
    }
})

export const chatRequest=mongoose.model("Chat_Request",Request)