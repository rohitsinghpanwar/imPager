import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import socket from "./socket";
import SearchUser from "./SearchUser";
import ChatSection from "./ChatSection";
import Profile from "./Profile";

function Chat() {
  const navigate = useNavigate();
  const { profilePhoto, _id } = JSON.parse(localStorage.getItem("impUser"));
  const [requestee, setRequestee] = useState([]);
  const [showChatRequest, setShowChatRequest] = useState(false);
  const [chatters, setChatters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedChatterId, setSelectedChatterId] = useState('');

  const [chatterDetails, setChatterDetails] = useState({
    chatId: '',
    chatterUsername: '',
    chatterProfilePhoto: '',
    userId: '',
    chatterId: '',
  });

  // Fetch accepted chatters
  const fetchChatters = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/api/v1/chatrequest/chatters", { withCredentials: true });
      setChatters(res.data.chatters);
    } catch (error) {
      console.error("Failed to fetch chatters:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch chat requests
  const fetchRequestees = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/v1/chatrequest/show", { withCredentials: true });
      setRequestee(res.data.requestReceiver);
    } catch (error) {
      console.error("Failed to fetch chat requests:", error);
    }
  };

  const handleAcceptButton = async (requestId) => {
    try {
      const res = await axios.post("http://localhost:8000/api/v1/chatrequest/status/accept", { id: requestId }, { withCredentials: true });
      if (res.data.message) {
        console.log(res.data.message);
        setRequestee(prev =>
          prev.map(req =>
            req._id === requestId ? { ...req, status: 'accepted' } : req
          )
        );
        await fetchRequestees();
        await fetchChatters();
      }
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handleRejectButton = async (requestId) => {
    try {
      const res = await axios.post("http://localhost:8000/api/v1/chatrequest/status/reject", { id: requestId }, { withCredentials: true });
      if (res.data.message) {
        console.log(res.data.message);
        setRequestee(prev =>
          prev.map(req =>
            req._id === requestId ? { ...req, status: 'Rejected' } : req
          )
        );
        await fetchRequestees();
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const handleShowProfile = () => {
    setShowProfile(true);
  };

  const handleChat = async (deets) => {
    setSelectedChatterId(deets._id); // Set selected user

    const data = {
      userId: _id,
      chatterId: deets._id,
    };

    try {
      const res = await axios.post("http://localhost:8000/api/v1/chat/chatid", data, {
        withCredentials: true,
      });
      setChatterDetails({
        chatId: res.data.chatId,
        chatterUsername: deets.username,
        chatterProfilePhoto: deets.profilePhoto,
        userId: _id,
        chatterId: deets._id,
      });
    } catch (error) {
      console.log(error);
    }
  };


  const handleLogout = () => {
    const consent = confirm("Are you sure, you want to logout?");
    if (consent) {
      axios.post("http://localhost:8000/api/v1/users/logout", {}, { withCredentials: true })
        .then(() => {
          localStorage.removeItem("impUser");
          navigate("/login");
        })
        .catch((e) => console.error("Error logging out:", e));
    }
  };

  useEffect(() => {
    if (_id) {
      socket.emit("user_connected", _id);
    }
    fetchRequestees();
    fetchChatters();
  }, [_id]);

  useEffect(() => {
    socket.on("update_online_users", (onlineIds) => {
      setOnlineUsers(onlineIds);
    });

    return () => socket.off("update_online_users");
  }, []);

  return (
    <div className="w-[100vw] h-[100vh]">
      {/* Navbar */}
      <nav className="flex w-full bg-gradient-to-b from-blue-950 items-center justify-between p-1 h-15 text-lg font-semibold rounded-b-lg">
        <h1>imPager</h1>
        <div>
          <button onClick={() => setShowChatRequest(!showChatRequest)}>
            Chat Request {requestee.length}
          </button>
          {showChatRequest && (
            <div className="absolute border p-2 z-1 rounded bg-gradient-to-bl from-cyan-400 to-yellow-200">
              {requestee?.length > 0 ? (
                requestee.map((req) => {
                  const isHandled = req.status !== 'pending';
                  return (
                    <div key={req._id} className={`flex items-center gap-4 p-2 shadow rounded mb-2 bg-white/30 backdrop-blur-2xl ${isHandled ? 'opacity-50 pointer-events-none' : ''}`}>
                      <img src={req.sender.profilePhoto} alt={req.sender.username} className="w-12 h-12 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold">{req.sender.username}</p>
                        <p className="text-sm text-gray-500">Status: {req.status}</p>
                      </div>
                      {!isHandled && (
                        <div className="flex gap-2">
                          <button className="bg-gradient-to-br from-emerald-300 to-blue-300 rounded p-1 border font-bold text-sm" onClick={() => handleAcceptButton(req._id)}>Accept</button>
                          <button className="border bg-gradient-to-bl from-red-400 to-red-600 p-1 rounded font-bold text-sm" onClick={() => handleRejectButton(req._id)}>Reject</button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p>No chat requests found.</p>
              )}
            </div>
          )}
        </div>

        <button onClick={handleLogout}>Log-out</button>
        <div className="flex flex-col items-center">
          <img src={profilePhoto} alt="Profile" className="rounded-full h-12 w-12 border-white border" onClick={handleShowProfile} />
        </div>
      </nav>

      {/* Body */}
      <div className="flex h-[91vh] border">
        {/* Users Section */}
        <section className="bg-gradient-to-br from-emerald-300 to-blue-300 border w-[70%]">
          <SearchUser userId={_id} />
          <div className="flex flex-col items-center">
            <h1 className="font-bold text-xl border-2 p-1 rounded border-dotted">Chatters</h1>
            {loading ? (
              <p>Loading chatters...</p>
            ) : chatters.length > 0 ? (
              chatters.map((user) => (
                <div
                  key={user._id}
                  className={`flex items-center gap-4 p-4 shadow-xl rounded mb-2 w-full transition-all ease-in-out duration-500 ${selectedChatterId === user._id
      ? "bg-white/60 border-2 border-blue-900"
      : "hover:bg-white/40"} justify-around`}
                  onClick={() => handleChat(user)}
                >
                  <img src={user.profilePhoto} alt={user.username} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold">{user.username}</p>
                  </div>
                  <span
                    className={`border border-black rounded-full p-1 text-xs ${onlineUsers.includes(user._id)
                      ? "bg-gradient-to-br from-emerald-300 to-blue-300"
                      : "bg-gradient-to-bl from-red-400 to-red-600"
                      }`}
                  >
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                  </span>
                </div>
              ))
            ) : (
              <p>No Chatters Yet, Send Chat Request to start Chatting.</p>
            )}
          </div>
        </section>

        {/* Chat Section */}
        <ChatSection chat={chatterDetails} />
      </div>

      {/* Profile Popup */}
      {showProfile && <Profile onCancel={() => setShowProfile(false)} />}
    </div>
  );
}

export default Chat;
