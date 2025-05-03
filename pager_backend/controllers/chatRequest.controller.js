import { chatRequest } from "../models/chatRequest.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'


const sendChatRequest=asyncHandler(async(req,res)=>{
    const {userId,receiverId}=req.body;
    if(!userId || !receiverId) console.log("UserId or SenderId is required");
    await chatRequest.create({
        sender: userId,
        receiver: receiverId,
    })
    res.status(200).json({message:"Request sent successfully"})
})

const showChatRequests=asyncHandler(async (req,res)=>{
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

    const receiverId = decodedToken._id;
    if (!receiverId) {
        return res.status(400).json({ message: "Id is required to fetch requests for a particular user" });
    }

    const requestReceiver = await chatRequest.find({ receiver: receiverId, status: "pending" }).populate('sender', 'username profilePhoto');
    
    if (!requestReceiver || requestReceiver.length === 0) {
        return res.status(404).json({ message: "No accepted chat requests found" });
    }

    res.status(200).json({ message: "Chat requests fetched successfully", requestReceiver });
})

const chatRequestAccept=asyncHandler(async (req,res)=>{
    const {id}=req.body;
    if(!id) console.log("Request id is needed")
    const updateStatus=await chatRequest.findByIdAndUpdate(id,{status:"accepted"},{new:true})
    console.log(updateStatus)
    res.status(200).json({message:'Chat request Accepted successfully'})
})

const chatRequestReject=asyncHandler(async (req,res)=>{
    const {id}=req.body;
    console.log(id)
    if(!id) console.log("Request id is needed")
    const updateStatus=await chatRequest.findByIdAndUpdate(id,{status:"rejected"},{new:true})
    console.log(updateStatus)
    res.status(200).json({message:'Chat request Rejected successfully'})
})

const showChatters = asyncHandler(async (req, res) => {
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

    const userId = decodedToken._id;

    const requests = await chatRequest.find({
        status: "accepted",
        $or: [
            { receiver: userId },
            { sender: userId }
        ]
    })
    .populate('sender', 'username profilePhoto')
    .populate('receiver', 'username profilePhoto');

    if (!requests || requests.length === 0) {
        return res.status(404).json({ message: "No accepted chat requests found" });
    }

    // Extract "the other user" from each request
    const chatters = requests.map(req => {
        if (req.sender._id.toString() === userId) {
            return req.receiver;
        } else {
            return req.sender;
        }
    });

    res.status(200).json({ message: "Chat requests fetched successfully", chatters });
});
const chatRequestStatus = asyncHandler(async (req, res) => {
    const { userId, searchUserId } = req.body;
  
    const status = await chatRequest.findOne({
      $or: [
        { sender: userId, receiver: searchUserId },
        { sender: searchUserId, receiver: userId }
      ]
    });
    console.log(status)
    if (status) {
      return res.status(200).json({ status: status.status });
    } else {
      return res.status(200).json({ status: "new" }); // this means no previous request
    }
  });
  



export {sendChatRequest,showChatRequests,chatRequestAccept,chatRequestReject,showChatters,chatRequestStatus}