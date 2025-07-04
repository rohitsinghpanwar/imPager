import mongoose,{Schema} from "mongoose";
const Request=new Schema({
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiver:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    status:{
        type:String,
        enum:['pending','accepted','rejected'],
        default:'pending'
    },
    type: {
    type: String,
    default: "chat",
    immutable: true
}
})

export const chatRequest=mongoose.model("Chat_Request",Request)