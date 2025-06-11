import mongoose,{Schema} from "mongoose";
const groupSchema=new Schema({
    groupName:{
        type: String,
        required:true
    },
    groupAdmin:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    groupMembers:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }
        ],
    groupAvatar:{
        type:String,
        required:true
    },
}
,{
    timestamps:true
}
);
export const Group=mongoose.model("Group",groupSchema)