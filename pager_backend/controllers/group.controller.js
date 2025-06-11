import { Group } from "../models/group.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const createGroup = asyncHandler(async(req,res)=>{
    const {groupName,creatorId}=req.body;
    const groupAvatarpath=req?.files?.groupAvatar?.[0]?.path;
    const groupExisted=await Group.findOne({groupName})
    if(groupExisted)throw new apiError(409,"Group Name already exists try another!")
    let groupAvatar;
    if (!groupAvatarpath) {
         groupAvatar=process.env.DEFAULT_GROUP_ICON
    }
    else{
         groupAvatar=await uploadOnCloudinary(groupAvatarpath)   
    }
    if(!groupAvatar) throw new apiError(400,"Profile Photo is required");
    const group=await Group.create({
        groupName:groupName.toLowerCase(),
        groupAdmin:creatorId,
        groupAvatar:typeof groupAvatar==="string"?groupAvatar:groupAvatar.url,
        groupMembers:[creatorId]
    })
    res.status(201).json({
    success: true,
    message: "Group created successfully",
  });
})

const showGroups=asyncHandler(async(req,res)=>{
    const {userId}=req.body;
    if(!userId) throw new apiError(400,"user id is required")
    const groups=await Group.find({groupMembers:userId})
    res.status(200).json({
    success: true,
    groups,
  });
})

const searchGroup=asyncHandler(async (req,res)=>{
    const group=req.body.group;
    console.log(group)
    if (!group) {
        return res.status(400).json({ message: "group name  is required" });
      }
    const searchGroup = await Group.findOne({groupName:group}).select("-groupMembers ")
    console.log(searchGroup)
    if(!searchGroup){
        return res.status(404).json({message:"Group Not found"})
    }else{
            return res.status(200).json({message :"group Found",data:searchGroup})
    }

})

const groupDetails=asyncHandler(async (req,res)=>{
  const groupId=req.body.groupId;
  if(!groupId)console.log("Group Id is required");
  const groupDetails=await Group.findById(groupId).populate('groupAdmin','username profilePhoto').populate('groupMembers','username profilePhoto')
  if(!groupDetails){
    res.status(404).json({message:"Group Doesn't exists in the database"})
  }
  res.status(200).json({message:"Group Details Found",data:groupDetails})

})

const removeMember = asyncHandler(async (req, res) => {
  const { memberId, groupId } = req.body;

  const updatedGroup = await Group.findByIdAndUpdate(
    groupId,
    { $pull: { groupMembers: memberId } },
    { new: true } // Return the updated document
  );

  if (!updatedGroup) {
    return res.status(404).json({ message: "Group not found" });
  }

  res.status(200).json({
    message: "Member removed successfully",
    data: updatedGroup,
  });
});



export  {createGroup,showGroups,searchGroup,groupDetails,removeMember};