import { asyncHandler } from "../utils/asyncHandler.js";
import { joinRequest } from "../models/joinGroup.model.js";
import { Group } from "../models/group.model.js";
import jwt from 'jsonwebtoken'
const  groupJoinRequest=asyncHandler(async(req,res)=>{
    const{groupId,sender,groupOwner}=req.body;
    if(!groupId||!sender||!groupOwner) console.log("Invalid Details")
    const response=await joinRequest.create({
        groupId:groupId,
        groupOwner:groupOwner,
        sender:sender,  
    })
    res.status(200).json({message:"Request sent successfully"})
    console.log(response)
})

const showJoinRequests=asyncHandler(async (req,res)=>{
    const accessToken = req.cookies.imPagerAT;
    if (!accessToken) {
        return res.status(400).json({ message: "Access token is required" });
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
        return res.status(400).json({ message: "Token or token secret might be invalid" });
    }

    const groupAdmin = decodedToken._id;
    console.log(groupAdmin)
    if (!groupAdmin) {
        return res.status(400).json({ message: "Id is required to fetch requests for group" });
    }

    const requestReceiver = await joinRequest.find({groupOwner: groupAdmin, status: "pending" }).populate('sender', 'username profilePhoto').populate('groupId','groupName groupAvatar');
    console.log(requestReceiver)
    if (!requestReceiver || requestReceiver.length === 0) {
        return res.status(404).json({ message: "No accepted chat requests found" });
    }

    res.status(200).json({ message: "Group requests fetched successfully", requestReceiver });
})

const joinRequestAccept = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Request ID is required" });
  }

  // Step 1: Get the join request
  const request = await joinRequest.findByIdAndUpdate(
    id,
    { status: "accepted" },
    { new: true }
  );

  if (!request) {
    return res.status(404).json({ error: "Join request not found" });
  }

  const { sender, groupId } = request;
  const updatedGroup = await Group.findByIdAndUpdate(
    groupId,
    { $addToSet: { groupMembers: sender } }, // prevents duplicates
    { new: true }
  );

  if (!updatedGroup) {
    return res.status(404).json({ error: "Group not found" });
  }

  res.status(200).json({ message: "User added to group successfully" });
});


const joinRequestReject=asyncHandler(async (req,res)=>{
const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Request ID is required" });
  }

  // Step 1: Get the join request
  const request = await joinRequest.findByIdAndUpdate(
    id,
    { status: "rejected" },
    { new: true }
  );

  if (!request) {
    return res.status(404).json({ error: "Join request not found" });
  }

  const { sender, groupId } = request;
  const updatedGroup = await Group.findByIdAndUpdate(
    groupId,
    { $addToSet: { groupMembers: sender } }, // prevents duplicates
    { new: true }
  );

  if (!updatedGroup) {
    return res.status(404).json({ error: "Group not found" });
  }

  res.status(200).json({ message: "User added to group successfully" });
})

const joinRequestStatus = asyncHandler(async (req, res) => {
  const { groupId, userId } = req.body;
  console.log(groupId,userId)
  const status = await joinRequest.findOne({
    groupId: groupId,
    sender: userId,
  });

  if (status) {
    return res.status(200).json({ status: status.status });
  } else {
    return res.status(200).json({ status: "new" });
  }
});

export  {groupJoinRequest ,showJoinRequests,joinRequestAccept,joinRequestReject,joinRequestStatus}
