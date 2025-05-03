import mongoose,{Schema} from "mongoose";

const messageSchema=new Schema({
    chatId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chatter',
        required: true,
    },
    sender:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    message:{
        type: String,
        required:true,
    },
    read:{
        type:Boolean,
        default: false,
    },
    timestamp:{
        type:Date,
        default:Date.now,
    }

})
messageSchema.index({ chat: 1 });

export const Message=mongoose.model('Message',messageSchema)