import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import groupIcon from "../assets/group.png";
import NotFound from "../assets/notfound.mp4";
import settingIcon from "../assets/setting.png";

function GroupChat({ onSelectGroup }) {
  const { userId } = useSelector((state) => state.user);

  const [showGroup, setShowGroup] = useState(false);
  const [groups, setGroups] = useState([]);
  const [formdata, setFormdata] = useState({ groupName: "" });
  const [groupAvatar, setGroupAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [groupDetails, setGroupDetails] = useState({
    Name:"",
    GroupId:"",
    Admin: {},
    Members: [],
    Avatar:"",
    CreatedOn: "",
  });

  const handleSettings = async (groupId) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URI}groups/groupinfo`,
        { groupId },
        { withCredentials: true }
      );
      const data = response.data.data;
      setGroupDetails({
        Name:data.groupName,
        GroupId:data._id,
        Admin: data.groupAdmin,
        Members: data.groupMembers || [],
        Avatar:data.groupAvatar,
        CreatedOn: data.createdAt,
      });
      setShowGroupInfo(true);
    } catch (error) {
      console.log("Unable to fetch group Details", error);
    }
  };

const removeMember=async(memberId,groupId)=>{
  try {
    setLoading(true)
    const response=await axios.post(
        `${import.meta.env.VITE_BACKEND_URI}groups/removemember`,
        { memberId,groupId },
        { withCredentials: true }
      );
        setGroupDetails((prev) => {
      if (!prev) return prev;                          // safety
      return {
        ...prev,
        Members: prev.Members.filter(
          (m) => (m._id || m) !== memberId            
        ),
      };
    });
    console.log("Member Removed Successfully")
  } catch (error) {
    console.log("Error in removing the group Member",error)
  }finally{
    setLoading(false)
  }
}

  const fetchGroups = useCallback(async () => {
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URI}groups/list`,
        { userId },
        { withCredentials: true }
      );
      setGroups(Array.isArray(data) ? data : data.groups || []);
    } catch (err) {
      console.error("Error fetching groups:", err);
      setGroups([]);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchGroups();

  }, [fetchGroups, userId]);

  const handleCreate = async () => {
    if (!formdata.groupName.trim()) {
      setError("Group name is required");
      setTimeout(() => {
        setError("")
      }, 3000);
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("groupName", formdata.groupName.trim());
      fd.append("creatorId", userId);
      if (groupAvatar) fd.append("groupAvatar", groupAvatar);

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URI}groups/create`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      await fetchGroups();
      setFormdata({ groupName: "" });
      setGroupAvatar(null);
      setShowGroup(false);
    } catch (err) {
      if (err?.response?.status === 409) {
        setError("Group Name exists already!");
      } else {
        setError("Could not create group");
      }
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 p- relative">
      <div className="flex justify-between p-1">
        <h2 className="font-semibold text-lg">Your Groups</h2>
        <button
          onClick={() => setShowGroup(true)}
          className="border px-2 py-1 rounded bg-gradient-to-br from-blue-600 to-cyan-400"
        >
          New Group
        </button>
      </div>

      {showGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="border rounded-lg p-3 space-y-2 bg-gradient-to-b from-cyan-500 to-white backdrop-blur-2xl w-100 h-65 m-5 ">
          <label className="flex flex-col items-center group cursor-pointer">
            <div className=" w-20 h-20 ">
              <img
                src={
                  groupAvatar
                    ? URL.createObjectURL(groupAvatar)
                    : groupIcon
                }
                className="h-full w-full object-cover rounded-full border"
              />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => setGroupAvatar(e.target.files[0])}
              />
            </div>
            <span className="text-sm text-gray-600 font-bold">
              Pick avatar
            </span>
          </label>

          <input
            name="groupName"
            value={formdata.groupName}
            onChange={(e) =>
              setFormdata({ groupName: e.target.value })
            }
            placeholder="Enter Group Name"
            className="border rounded p-1 w-full"
          />

          <div className="flex gap-3 justify-center">
            <button
              disabled={loading}
              onClick={handleCreate}
              className={`px-3 py-1 rounded bg-lime-400 ${
                loading && "opacity-60 cursor-not-allowed"
              }`}
            >
              {loading ? "Creating…" : "Create"}
            </button>
            <button
              className="px-3 py-1 rounded bg-red-400"
              onClick={() => setShowGroup(false)}
            >
              Cancel
            </button>
          </div>

          {error && <p className="rounded text-red-700 text-center bg-red-100 border-2 border-red-400  m-1 p-1">{error}</p>}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center">
        {groups.length === 0 ? (
          <div>
            <video
              src={NotFound}
              autoPlay
              loop
              muted
              className="w-60 h-60 border rounded-full object-cover"
            ></video>
            <h1 className="text-center font-bold">
              No Groups yet. Send a request!
            </h1>
          </div>
        ) : (
          <div className="grid grid-cols-1  gap-4 mt-2 w-full h-65 overflow-y-scroll scroll-smooth p-2">
            {groups.map((g) => (
              <div
                key={g._id}
                onClick={() =>
                  onSelectGroup({
                    chatId: g._id,
                    chatterUsername: g.groupName,
                    chatterProfilePhoto: g.groupAvatar,
                    userId: userId,
                    chatType:"group"
                  })
                }
                className="cursor-pointer  rounded-lg p-2 flex items-center gap-2  shadow-sm hover:bg-white/40 relative"
              >
                <img
                  src={g.groupAvatar}
                  alt="Group"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium">{g.groupName}</p>
                  <p className="text-xs text-gray-500">
                    Members: {(g.members || g.groupMembers || []).length}
                  </p>
                </div>
                  <div
                    className="absolute right-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSettings(g._id);
                    }}
                  >
                    <img src={settingIcon} alt="" className="h-6 w-6"/>
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Group Info Modal */}
      {showGroupInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 ">
          <div className="bg-gradient-to-bl from-cyan-400 to-yellow-200 rounded-lg p-5 w-100 space-y-4 m-2 ">
            <div className="flex flex-col items-center">
              <img src={groupDetails.Avatar} alt="" className="border rounded-full object-fit-cover w-25 h-25" />
            <h2 className="text-2xl font-semibold">{groupDetails.Name} </h2>
            
            </div>
            <div>
              <p className="font-medium">Admin:</p>
              <div className="flex items-center gap-2">
                <img
                  src={groupDetails.Admin.profilePhoto}
                  className="w-10 h-10 rounded-full"
                  alt="Admin"
                />
                <span>{groupDetails.Admin.username}</span>
              </div>
            </div>
            {groupDetails.Admin._id===userId &&(
            <div>
              <p className="font-medium">Members: {groupDetails.Members.length}</p>
              <ul className="space-y-1  max-h-50 p-2 overflow-y-scroll ">
                {groupDetails.Members.map((m) => (
                  <li key={m._id} className="flex items-center gap-2 ">
                    <img
                      src={m.profilePhoto}
                      className="w-8 h-8 rounded-full"
                      alt="Member"
                    />
                    <span>{m.username}</span>
                    {groupDetails.Admin._id!==m._id &&(<button onClick={()=>removeMember(m._id,groupDetails.GroupId)} className="bg-red-500 p-1 rounded-lg font-semibold">{loading ? "Removing…" : "Remove"}</button>)}
                    
                  </li>
                ))}
              </ul>
            </div>
            )}
            <div>
              <p className="font-medium">Created On:</p>
              <p className="text-sm text-gray-600">
                {new Date(groupDetails.CreatedOn).toLocaleString()}
              </p>
            </div>
            <button className="bg-red-600 p-2 font-semibold rounded-lg relative lg:left-[50%] left-[40%]" onClick={()=>setShowGroupInfo(!showGroupInfo)}>Close</button>
          </div>
          
        </div>
      )}
    </div>
  );
}

export default GroupChat;
