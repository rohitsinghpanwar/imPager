import { Server } from 'socket.io';

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "https://im-pager.vercel.app",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const onlineUsers = new Map();
  const activeCalls = new Map(); // Track active calls: Map<callId, { fromUserId, toUserId }>

  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    // Store user ID with their socket ID
    socket.on("user_connected", (userId) => {
      if (!userId || typeof userId !== 'string') {
        console.error("Invalid userId received:", userId);
        return;
      }
      // Remove any existing socket ID for this user to handle reconnects
      for (const [existingUserId, socketId] of onlineUsers) {
        if (existingUserId === userId && socketId !== socket.id) {
          onlineUsers.delete(existingUserId);
          console.log(`Removed stale socket for user ${userId}`);
        }
      }
      onlineUsers.set(userId, socket.id);
      io.emit("update_online_users", Array.from(onlineUsers.keys()));
      console.log(`User ${userId} is online, socketId: ${socket.id}`);
    });

    socket.on("join_chat", (chatId) => {
      if (typeof chatId === 'string') {
        socket.join(chatId);
        console.log(`User joined chat room: ${chatId}`);
      } else {
        console.error("Invalid chatId:", chatId);
      }
    });

    socket.on("video_call_request", ({ fromUserId, toUserId, callId }) => {
      if (!fromUserId || !toUserId || !callId) {
        console.error("Invalid video call request:", { fromUserId, toUserId, callId });
        return;
      }
      const toSocketId = onlineUsers.get(toUserId);
      if (toSocketId) {
        activeCalls.set(callId, { fromUserId, toUserId });
        io.to(toSocketId).emit("incoming_video_call", { fromUserId, callId });
        console.log(`Video call request from ${fromUserId} to ${toUserId}, callId: ${callId}, toSocketId: ${toSocketId}`);
        // Set timeout for response
        setTimeout(() => {
          if (activeCalls.has(callId)) {
            activeCalls.delete(callId);
            io.to(onlineUsers.get(fromUserId)).emit("call_failed", { toUserId, reason: "No response" });
            console.log(`Video call ${callId} timed out for ${toUserId}`);
          }
        }, 30000); // 30 seconds timeout
      } else {
        console.error(`User ${toUserId} not found for video call request`);
        io.to(onlineUsers.get(fromUserId)).emit("call_failed", { toUserId, reason: "User offline" });
      }
    });

    socket.on("video_call_response", ({ toUserId, accepted, fromUserId, callId }) => {
      if (!toUserId || !fromUserId || !callId) {
        console.error("Invalid video call response:", { toUserId, accepted, fromUserId, callId });
        return;
      }
      const toSocketId = onlineUsers.get(toUserId);
      if (toSocketId) {
        io.to(toSocketId).emit("video_call_response", { accepted, fromUserId, toUserId, callId });
        console.log(`Video call response from ${fromUserId} to ${toUserId}: ${accepted ? 'Accepted' : 'Rejected'}, callId: ${callId}, toSocketId: ${toSocketId}`);
        if (!accepted && callId) {
          activeCalls.delete(callId);
        }
      } else {
        console.error(`User ${toUserId} not found for video call response`);
      }
    });

    socket.on("offer", ({ to, offer, callId }) => {
      if (!to || !callId) {
        console.error("Invalid offer:", { to, callId });
        return;
      }
      const toSocketId = onlineUsers.get(to);
      const call = activeCalls.get(callId);
      if (toSocketId && call) {
        io.to(toSocketId).emit("offer", { offer, from: call.fromUserId, callId });
        console.log(`Offer sent to ${to} for callId: ${callId}, toSocketId: ${toSocketId}`);
      } else {
        console.error(`User ${to} not found or invalid callId: ${callId}`);
      }
    });

    socket.on("answer", ({ to, answer, callId }) => {
      if (!to || !callId) {
        console.error("Invalid answer:", { to, callId });
        return;
      }
      const toSocketId = onlineUsers.get(to);
      const call = activeCalls.get(callId);
      if (toSocketId && call) {
        io.to(toSocketId).emit("answer", { answer, from: call.toUserId, callId });
        console.log(`Answer sent to ${to} for callId: ${callId}, toSocketId: ${toSocketId}`);
      } else {
        console.error(`User ${to} not found or invalid callId: ${callId}`);
      }
    });

    socket.on("ice_candidate", ({ to, candidate, callId }) => {
      if (!to || !callId) {
        console.error("Invalid ICE candidate:", { to, callId });
        return;
      }
      const toSocketId = onlineUsers.get(to);
      const call = activeCalls.get(callId);
      if (toSocketId && call) {
        io.to(toSocketId).emit("ice_candidate", { candidate, from: call.fromUserId === to ? call.toUserId : call.fromUserId, callId });
        console.log(`ICE candidate sent to ${to} for callId: ${callId}, toSocketId: ${toSocketId}`);
      } else {
        console.error(`User ${to} not found or invalid callId: ${callId}`);
      }
    });

    socket.on("call_ended", ({ toUserId, fromUserId, callId }) => {
      if (!toUserId || !fromUserId || !callId) {
        console.error("Invalid call_ended:", { toUserId, fromUserId, callId });
        return;
      }
      const toSocketId = onlineUsers.get(toUserId);
      const call = activeCalls.get(callId);
      if (toSocketId && call && (call.fromUserId === fromUserId || call.toUserId === fromUserId)) {
        io.to(toSocketId).emit("call_ended", { fromUserId, callId });
        activeCalls.delete(callId);
        console.log(`Call ended event sent from ${fromUserId} to ${toUserId} for callId: ${callId}, toSocketId: ${toSocketId}`);
      } else {
        console.error(`User ${toUserId} not found or invalid callId: ${callId}`);
      }
    });

    // Chat messaging
    socket.on("new_message", (data) => {
      if (data.chatId) {
        io.to(data.chatId).emit("receive_message", data);
        console.log(`New message in chat ${data.chatId}`);
      } else {
        console.error("Invalid chatId for new_message:", data);
      }
    });

    socket.on("typing", (chatId) => {
      if (chatId) {
        socket.to(chatId).emit("typing", chatId);
        console.log(`Typing in chat ${chatId}`);
      } else {
        console.error("Invalid chatId for typing:", chatId);
      }
    });

    socket.on("stop_typing", (chatId) => {
      if (chatId) {
        socket.to(chatId).emit("stop_typing", chatId);
        console.log(`Stop typing in chat ${chatId}`);
      } else {
        console.error("Invalid chatId for stop_typing:", chatId);
      }
    });

    // Cleanup on disconnect
    socket.on("disconnect", () => {
      const userId = [...onlineUsers.entries()].find(([_, sid]) => sid === socket.id)?.[0];
      if (userId) {
        onlineUsers.delete(userId);
        // Notify other users in active calls
        for (const [callId, call] of activeCalls) {
          if (call.fromUserId === userId || call.toUserId === userId) {
            const toUserId = call.fromUserId === userId ? call.toUserId : call.fromUserId;
            const toSocketId = onlineUsers.get(toUserId);
            if (toSocketId) {
              io.to(toSocketId).emit("call_ended", { fromUserId: userId, callId });
              console.log(`Call ended due to disconnect from ${userId} to ${toUserId}, callId: ${callId}, toSocketId: ${toSocketId}`);
            }
            activeCalls.delete(callId);
          }
        }
        io.emit("update_online_users", Array.from(onlineUsers.keys()));
        console.log(`🔴 User ${userId} is offline`);
      }
      console.log("🔴 User disconnected:", socket.id);
    });
  });
};

export { setupSocket };