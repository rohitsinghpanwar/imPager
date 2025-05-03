import { Server } from 'socket.io';

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);
    
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
    });
    
    socket.on("typing", (chatId) => {
      socket.to(chatId).emit("typing", chatId);
    });
    
    socket.on("stop_typing", (chatId) => {
      socket.to(chatId).emit("stop_typing", chatId);
    });
    

    socket.on("disconnect", () => {
      const userId = [...onlineUsers].find(([_, sid]) => sid === socket.id)?.[0];
      if (userId) {
        onlineUsers.delete(userId);
        io.emit("update_online_users", Array.from(onlineUsers.keys()));
        console.log(`🔴 User ${userId} is offline`);
      }
    });
  });
};

export { setupSocket };