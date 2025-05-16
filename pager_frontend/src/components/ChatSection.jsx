import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import socket from "./socket";
import sendIcon from "../assets/paper-plane.png";

function ChatSection(props) {
  if (!props?.chat?.chatId || !props?.chat?.chatterUsername || !props?.chat?.chatterProfilePhoto) {
    return (
      <div className="w-full  flex items-center justify-center bg-gradient-to-bl from-white to-gray-500">
        <h1 className="font-bold text-xl italic ">No Chat Selected</h1>
      </div>
    );
  }
  const chatterName=!props?.chat?.chatterUsername
  console.log(chatterName)
  const [message, setMessage] = useState("");
  const [disable, setDisable] = useState(true);
  const [messages, setMessages] = useState([]);
  const chatContainerRef = useRef(null);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  let chatId = props.chat.chatId;
  let userId = props.chat.userId;

  useEffect(() => {
    if (!chatId) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URI}message/show/${chatId}`, { withCredentials: true });
        const sortedMessages = res.data.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(sortedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
    socket.emit("join_chat", chatId);

    return () => {
      socket.emit("leave_chat", chatId);
    };
  }, [chatId]);

  useEffect(() => {
    const handleReceiveMessage = (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleTyping = (chatIdFromSocket) => {
      if (chatIdFromSocket === chatId) {
        setIsTyping(true);
      }
    };
  
    const handleStopTyping = (chatIdFromSocket) => {
      if (chatIdFromSocket === chatId) {
        setIsTyping(false);
      }
    };
  
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
  
    return () => {
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
    };
  }, [chatId]);

  const handleMessage = (e) => {
    const value = e.target.value;
    setMessage(value);
    setDisable(value.trim() === "");
    socket.emit("typing", chatId);
    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(() => {
      socket.emit("stop_typing", chatId);
    }, 2000);
  
    setTypingTimeout(timeout);
  };

  const handleSend = async () => {
    try {
      const messageInfo = { message, chatId };
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URI}message/send`, { messageInfo }, { withCredentials: true });
      const sentMessage = res.data.data;
      socket.emit("new_message", sentMessage);
      setMessage("");
      setDisable(true);
    } catch (error) {
      console.error(error);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short", 
      day: "numeric", 
      year: "numeric", 
      hour: "numeric", 
      minute: "2-digit", 
      hour12: true, 
    });
  };
  const handleVideoCall = () => {
  socket.emit("video_call_request", {
    fromUserId: props.chat.userId,
    toUserId: props.chat.chatterId,
  });
};


  return (
    <div className="border relative w-full">
      <div className="bg-amber-100 flex items-center justify-between p-2">
        <img
          src={props.chat.chatterProfilePhoto}
          alt="Chatter Profile Photo"
          className="rounded-full border w-16 h-16"
        />
        <button
  className="bg-blue-500 p-1 rounded-lg font-semibold text-lg"
  onClick={() => {
    socket.emit("video_call_request", {
      fromUserId: userId,
      toUserId: props.chat.chatterId, // Ensure this ID is provided in props
    });
  }}
>
  Video Call
</button>

        <h2 className="font-bold text-2xl italic text-black">{props.chat.chatterUsername}</h2>
      </div>

      <div
        ref={chatContainerRef}
        className="scroll-smooth overflow-y-scroll h-[80%] flex flex-col gap-2 p-10"
      >
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`relative flex w-full text-lg ${msg.sender === userId ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`relative border rounded-xl p-2 max-w-[70%] ${
                msg.sender === userId ? "bg-green-400 text-white" : "bg-blue-400 text-white"
              }`}
            >
              <h1>{msg.sender === userId
                    ?"You":props.chat.chatterUsername}</h1>
              {msg.message} <span className="text-xs">{formatTimestamp(msg.timestamp)}</span>
              <div
                className={`absolute w-0 h-0 border-t-8 border-b-8 ${
                  msg.sender === userId
                    ? "border-l-8 border-l-green-400 right-[-8px] top-2"
                    : "border-r-8 border-r-blue-400 left-[-8px] top-2"
                }`}
              ></div>
            </div>
          </div>
        ))}
              {isTyping && <p className="text-sm border bg-violet-500 rounded-full w-max p-1">{props.chat.chatterUsername} is Typing...</p>}
      </div>

      <div className="flex bottom-0 absolute w-full p-2">
        <input
          type="text"
          className="border flex-grow p-2 rounded-lg"
          placeholder="Type your message"
          onChange={handleMessage}
          value={message}
        />
        <img
          src={sendIcon}
          className={`px-4 py-1 text-white ${disable ? "invert-50 cursor-not-allowed" : ""}`}
          disabled={disable}
          onClick={handleSend}
          alt="Send"
        />
      </div>
    </div>
  );
}

export default ChatSection;