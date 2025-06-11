import mongoose,{Schema} from "mongoose";
const Request=new Schema({
    groupId:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    groupOwner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    status:{
        type:String,
        enum:['pending','accepted','rejected'],
        default:'pending'
    },
    type: {
        type: String,
        default: "group",
        immutable: true
    }
})

export const joinRequest=mongoose.model("Group_Request",Request)