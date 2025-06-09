
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import socket from "./socket";
import sendIcon from "../assets/paper-plane.png";
import writeVideo from "../assets/write.mp4";
import backIcon from "../assets/back.png";
import typingIcon from "../assets/typing.mp4"

function ChatSection({ chat, onBack,}) {

  if (!chat?.chatId) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 bg-gradient-to-bl from-orange-100 to-yellow-200">
        <video src={writeVideo} loop autoPlay muted className="w-50 h-50 " />
        <h1 className=" text-xl font-semibold">No Chat Selected!</h1>
      </div>
    );
  }

  // 🔑 meta
  const { chatId, chatterUsername, chatterProfilePhoto, userId ,chatType} = chat;
  // 📜 message state
  const [message, setMessage] = useState("");
  const [disableSend, setDisableSend] = useState(true);
  const [messages, setMessages] = useState([]);
  const chatRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URI}message/show/${chatId}`, {
        withCredentials: true,
      });
      const sorted = res.data.messages.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
      setMessages(sorted);
    };

    fetchMessages();
    socket.emit("join_chat", chatId);
    return () => socket.emit("leave_chat", chatId);
  }, [chatId]);

  // 🔄 receive messages in real‑time
  useEffect(() => {
    const handleReceive = (m) => setMessages((prev) => [...prev, m]);
    socket.on("receive_message", handleReceive);
    return () => socket.off("receive_message", handleReceive);
  }, []);

  // 🔃 autoscroll
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  // ✍🏻 typing events
  useEffect(() => {
    const handleTyping = (id) => id === chatId && setIsTyping(true);
    const handleStop = (id) => id === chatId && setIsTyping(false);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStop);
    return () => {
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStop);
    };
  }, [chatId]);

  const handleInput = (e) => {
    const val = e.target.value;
    setMessage(val);
    setDisableSend(!val.trim());
    socket.emit("typing", chatId);
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(
      setTimeout(() => {
        socket.emit("stop_typing", chatId);
      }, 1500)
    );
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    const body = { message, chatId };
    const { data } = await axios.post(
      `${import.meta.env.VITE_BACKEND_URI}message/send`,
      { messageInfo: body },
      { withCredentials: true }
    );
    socket.emit("new_message", data.data);
    setMessage("");
    setDisableSend(true);
    
  };

  const formatTime = (t) =>
    new Date(t).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  // 🖼️ UI
  return (
    <div className="flex flex-col flex-1 h-full bg-gradient-to-br from-white to-amber-50">
      {/* 🟠 Header */}
      <header className="flex items-center gap-4 lg:p-3 p-1 bg-gradient-to-l to-blue-300 shadow-md sticky top-0 justify-between">
        <img
          src={backIcon}
          alt="Back"
          className="w-6 h-6 cursor-pointer sm:hidden"
          onClick={onBack}
        />
        <img
          src={chatterProfilePhoto}
          className="w-12 h-12 rounded-full object-cover border-2 border-white"
        />
        <h2 className="font-bold text-xl flex-1 truncate">{chatterUsername}</h2>
      </header>

      {/* 🟡 Messages */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto px-4 py-2 space-y-3"
      >
        {messages.map((msg) => {
          const mine = msg.sender === userId;
          return (
            <div key={msg._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`relative max-w-xs md:max-w-md px-4 py-2 rounded-2xl shadow ${
                  mine ? "bg-emerald-400 text-white" : "bg-blue-400 text-white"
                }`}
              >
                {chatType==="group" &&(
                  <p className="font-medium mb-0.5">
                  {mine ? "You" : chatterUsername}
                </p>
                )
                }
                <p>{msg.message}</p>
                <span className="text-xs opacity-70 text-black">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <video src={typingIcon} muted loop autoPlay className="h-10 w-10"></video>
        )}
      </div>

      {/* 🟢 Composer */}
      <div className="p-3 flex items-center gap-2 bg-white shadow-inner sticky bottom-0">
        <input
          value={message}
          onChange={handleInput}
          onKeyDown={(e) => e.key === "Enter" && !disableSend && sendMessage()}
          placeholder="Type a message…"
          className="flex-1 border rounded-full px-4 py-2 outline-none focus:ring-2 "
        />
        <button
          disabled={disableSend}
          onClick={sendMessage}
          className="p-2 disabled:opacity-50"
        >
          <img src={sendIcon} alt="Send" className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}

export default ChatSection;
