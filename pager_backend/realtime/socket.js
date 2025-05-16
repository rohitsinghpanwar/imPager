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

  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    // Store user ID with their socket ID
    socket.on("user_connected", (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit("update_online_users", Array.from(onlineUsers.keys()));
      console.log(`User ${userId} is online`);
    });

    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
      console.log(`User joined chat room: ${chatId}`);
    });

    socket.on("video_call_request", ({ fromUserId, toUserId }) => {
      const toSocketId = onlineUsers.get(toUserId);
      if (toSocketId) {
        io.to(toSocketId).emit("incoming_video_call", { fromUserId });
        console.log(`Video call request from ${fromUserId} to ${toUserId}`);
      } else {
        console.log(`User ${toUserId} not found for video call request`);
      }
    });

    socket.on("video_call_response", ({ toUserId, accepted, fromUserId }) => {
      const toSocketId = onlineUsers.get(toUserId);
      if (toSocketId) {
        io.to(toSocketId).emit("video_call_response", { accepted, fromUserId, toUserId });
        console.log(`Video call response from ${fromUserId} to ${toUserId}: ${accepted ? 'Accepted' : 'Rejected'}`);
      } else {
        console.log(`User ${toUserId} not found for video call response`);
      }
    });

    // In your socket server setup
socket.on("offer", ({ to, offer }) => {
  const receiverSocket = onlineUsers.get(to);
  if (receiverSocket) {
    io.to(receiverSocket).emit("offer", { offer, from: socket.userId });
  }
});

socket.on("answer", ({ to, answer }) => {
  const receiverSocket = onlineUsers.get(to);
  if (receiverSocket) {
    io.to(receiverSocket).emit("answer", { answer, from: socket.userId });
  }
});

socket.on("ice_candidate", ({ to, candidate }) => {
  const receiverSocket = onlineUsers.get(to);
  if (receiverSocket) {
    io.to(receiverSocket).emit("ice_candidate", { candidate, from: socket.userId });
  }
});
    socket.on("call_ended", ({ toUserId, fromUserId }) => {
      const toSocketId = onlineUsers.get(toUserId);
      if (toSocketId) {
        io.to(toSocketId).emit("call_ended", { fromUserId });
        console.log(`Call ended event sent from ${fromUserId} to ${toUserId}`);
      } else {
        console.log(`User ${toUserId} not found for call ended`);
      }
    });

    // Chat messaging
    socket.on("new_message", (data) => {
      io.to(data.chatId).emit("receive_message", data);
      console.log(`New message in chat ${data.chatId}`);
    });

    socket.on("typing", (chatId) => {
      socket.to(chatId).emit("typing", chatId);
      console.log(`Typing in chat ${chatId}`);
    });

    socket.on("stop_typing", (chatId) => {
      socket.to(chatId).emit("stop_typing", chatId);
      console.log(`Stop typing in chat ${chatId}`);
    });

    // Cleanup on disconnect
    socket.on("disconnect", () => {
      const userId = [...onlineUsers.entries()].find(([_, sid]) => sid === socket.id)?.[0];
      if (userId) {
        onlineUsers.delete(userId);
        io.emit("update_online_users", Array.from(onlineUsers.keys()));
        console.log(`🔴 User ${userId} is offline`);
      }
      console.log("🔴 User disconnected:", socket.id);
    });
  });
};

export { setupSocket };