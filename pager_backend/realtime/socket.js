import { Server } from 'socket.io';

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
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