import mongoose,{Schema} from "mongoose";

const chattersSchema=new Schema({
    chatters:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required:true,
        }
    ],
    lastMessage:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Message'
    },
    createdAt: {type:Date,default:Date.now}

});

export const Chatter=mongoose.model("Chatter",chattersSchema)