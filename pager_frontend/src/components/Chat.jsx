import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import socket from "./socket";
import SearchUser from "./SearchUser";
import ChatSection from "./ChatSection";
import Profile from "./Profile";
import GroupChat from "./GroupChat";
import { useDispatch } from "react-redux";
import { clearUser } from "../redux/userSlice";
import NotFound from "../assets/notfound.mp4";

function Chat() {
  // ⛳ hooks & meta
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { profilePhoto, _id } = JSON.parse(localStorage.getItem("impUser"));

  // ⛳ state
  const [requests, setRequests] = useState([]);
  const [chatters, setChatters] = useState([]);
  const [loadingChatters, setLoadingChatters] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null); // ← drives responsive layout

    const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Notification permission granted")
    } else {
      console.log('Notification permission denied')
    }
  }


  const showNotification = (text) => {
    if ("serviceWorker" in navigator && "Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification("Welcome", {
              body: text,
              icon: "/icon.png",
              badge: "/badge.png"
            });
          });
        } else {
          console.log("Notification permission denied");
        }
      });
    }
  };
  // 🔎 fetch chatters once
  const fetchChatters = async () => {
    try {
      setLoadingChatters(true);
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URI}chatrequest/chatters`,
        { withCredentials: true }
      );
      setChatters(data.chatters);
    } finally {
      setLoadingChatters(false);
    }
  };

  // 🔎 fetch requests (chat + group) – simplified (no dedupe needed here)
  const fetchRequests = useCallback(async () => {
    const [chatRes, groupRes] = await Promise.allSettled([
      axios.get(`${import.meta.env.VITE_BACKEND_URI}chatrequest/show`, {
        withCredentials: true,
      }),
      axios.get(`${import.meta.env.VITE_BACKEND_URI}grouprequest/show`, {
        withCredentials: true,
      }),
    ]);
    console.log(chatRes,groupRes)
    let merged = [];
    if (chatRes.status === "fulfilled") merged.push(...chatRes.value.data.requestReceiver);
    if (groupRes.status === "fulfilled") merged.push(...groupRes.value.data.requestReceiver);
    setRequests(merged);
  }, []);

  // 📡 sockets + initial data
  useEffect(() => {
    if (_id) socket.emit("user_connected", _id);
    fetchChatters();
    fetchRequests();
        if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").then((registration) => {
        console.log("Service worker registered", registration)
      }).catch((error) => {
        console.log("service worker registration failed", error)
      })
    }
    requestNotificationPermission();
    showNotification("Hi, Let's start Paging !");
    socket.on("update_online_users", setOnlineUsers);
    return () => socket.off("update_online_users", setOnlineUsers);
  }, [_id, fetchRequests]);

  console.log(requests)
  // 🚦 accept / reject helper
  const changeRequestStatus = async (id, type, action) => {
    const base = type === "chat" ? "chatrequest" : "grouprequest";
    await axios.post(
      `${import.meta.env.VITE_BACKEND_URI}${base}/status/${action}`,
      { id },
      { withCredentials: true }
    );
    setRequests((prev) => prev.filter((r) => r._id !== id));
  };

  // 🔒 logout
  const handleLogout = () => {
    if (!confirm("Are you sure you want to logout?")) return;
    axios
      .post(`${import.meta.env.VITE_BACKEND_URI}users/logout`, {}, { withCredentials: true })
      .finally(() => {
        localStorage.removeItem("impUser");
        dispatch(clearUser());
        navigate("/login");
      });
  };
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  return (
    <div className="w-screen h-screen flex flex-col ">
      {/* 🌐 Navbar */}
      <nav className="flex items-center justify-between  from- px-4 py-2 shadow-sm bg-gradient-to-bl  to-blue-400 border">
        <h1 className="text-xl font-bold italic select-none">imPager</h1>

        <div className="flex items-center gap-4">
          <button
            className="relative font-semibold"
            onClick={() => setShowRequests(true)}
          >
            Requests
            {!!pendingCount && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full px-1">
                {pendingCount}
              </span>
            )}
          </button>
    <button onClick={handleLogout} className=" font-medium ">
            Logout
          </button>
          <img
            src={profilePhoto}
            alt="Me"
            className="h-10 w-10 rounded-full cursor-pointer border-2 border-white shadow-sm"
            onClick={() => setShowProfile(true)}
          />
          
        </div>
      </nav>

      {/* 🪟 Requests overlay */}
      {showRequests && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 space-y-3 overflow-y-auto">

          {requests.length === 0 && (
            <div className="flex flex-col items-center">
              <video
                src={NotFound}
                autoPlay
                loop
                muted
                className="w-48 h-48 rounded-full border-4 border-amber-300 object-cover"
              />
              <p className="text-white mt-4 text-lg font-semibold">No Requests Yet!</p>
            </div>
          )}

          {requests.map((req) => {
            const handled = req.status !== "pending";
            console.log(req)
            const badge = req.type === "chat" ? "CHAT" : `GROUP • ${req?.groupId?.groupName}`;
            console.log(req)
            return (
              <div
                key={req._id}
                className={`flex items-center gap-3 w-full max-w-md p-3 rounded-xl shadow-lg bg-white/20 backdrop-blur-lg text-white ${
                  handled ? "opacity-50" : ""
                }`}
              >
                <img
                  src={req.sender.profilePhoto}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white"
                />
                <div className="flex flex-col flex-1">
                  <span className="font-semibold">{req.sender.username}</span>
                  <span className="text-xs italic opacity-80">{badge}</span>
                </div>
                {!handled && (
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 bg-emerald-400/90 rounded-lg text-sm hover:bg-emerald-500"
                      onClick={() => changeRequestStatus(req._id, req.type, "accept")}
                    >
                      Accept
                    </button>
                    <button
                      className="px-3 py-1 bg-rose-500/90 rounded-lg text-sm hover:bg-rose-600"
                      onClick={() => changeRequestStatus(req._id, req.type, "reject")}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <button
            className=" text-white rounded-lg  bg-red-500 p-2 text-lg"
            onClick={() => setShowRequests(false)}
          >
          Close
          </button>
        </div>
      )}

      {/* 🖼️ Main layout */}
      <div className="flex-1 flex overflow-hidden bg-gradient-to-tl from-blue-500">
        {/* 📄 LEFT – Chat list & groups */}
        <aside
          className={`flex flex-col w-full sm:w-1/3 lg:w-1/4 border-r overflow-y-auto transition-transform duration-300 ${
            selectedChat ? "sm:block" : ""
          } ${selectedChat ? "hidden sm:flex" : "flex"}`}
        >
          {/* 🔍 Search + Chatters list */}
          <SearchUser userId={_id} />

          <section className="px-4 pt-2 space-y-2 h-65 overflow-y-scroll scroll-smooth">
            <h2 className="text-lg font-semibold mb-1 ">Chatters</h2>

            {loadingChatters ? (
              <p className="animate-pulse text-center">loading…</p>
            ) : chatters.length ? (
              chatters.map((user) => (
                <button
                  key={user._id}
                  onClick={() => {
                    axios
                      .post(
                        `${import.meta.env.VITE_BACKEND_URI}chat/chatid`,
                        { userId: _id, chatterId: user._id },
                        { withCredentials: true }
                      )
                      .then(({ data }) =>
                        setSelectedChat({
                          chatId: data.chatId,
                          chatterUsername: user.username,
                          chatterProfilePhoto: user.profilePhoto,
                          userId: _id,
                          chatterId: user._id,
                        })
                      );
                  }}
                  className={`flex  items-center gap-3 w-full p-3 rounded-xl text-left shadow-sm ${
                    selectedChat?.chatterId === user._id
                      ? "bg-white/60 "
                      : "hover:bg-white/40"
                  }`}
                >
                  <img
                    src={user.profilePhoto}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white"
                  />
                  <span className="flex-1 font-medium truncate">{user.username}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      onlineUsers.includes(user._id)
                        ? "text-green-600 font-semibold"
                        : "text-red-600 font-semibold"
                    }`}
                  >
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                  </span>
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center py-4">
                <video
                  src={NotFound}
                  autoPlay
                  loop
                  muted
                  className="w-40 h-40 rounded-full border-2 border-amber-300 object-cover"
                />
                <p className="font-medium mt-2 text-center">
                  No chatters yet. Send a request!
                </p>
              </div>
            )}
          </section>

          {/* 📚 Groups */}
          <GroupChat onSelectGroup={(g) => setSelectedChat(g)} />
        </aside>

        {/* 💬 RIGHT – Chat section */}
        <main className={`flex-1 ${
          selectedChat ? "flex" : "hidden sm:flex"
        }`}>
          <ChatSection
            chat={selectedChat}
            onBack={() => setSelectedChat(null)}
          />
        </main>
      </div>

      {showProfile && <Profile onCancel={() => setShowProfile(false)} />}
    </div>
  );
}
export default Chat