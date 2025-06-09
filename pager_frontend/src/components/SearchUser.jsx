import React, { useState } from 'react';
import axios from 'axios';


function SearchUser({ userId }) {
  const [searchUser, setSearchUser] = useState("");
  const [user, setUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState(null);
  const [groupStatus, setGroupStatus] = useState(null);

  const handleCancel = () => {
    setShow(false);
    setUser(null);
    setGroup(null);
  };

  const handleSearch = async () => {
    setUser(null);
    setGroup(null);
    setShow(false);

    if (!searchUser.trim()) {
      setError("Username or Group Name is required ");
      setTimeout(() => setError(""), 3000);
      return;
    }
      let foundSomething = false;
    try {
      // Search user
      const userRes = await axios.post(
        `${import.meta.env.VITE_BACKEND_URI}users/search`,
        { username: searchUser },
        { withCredentials: true }
      );

      const userDeets = userRes.data.data;
      if (userDeets._id === userId) {
        console.log("You can't search your username")
      } else {
        setUser({
          username: userDeets.username,
          profilePhoto: userDeets.profilePhoto,
          receiverId: userDeets._id,
        });

        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URI}chatrequest/status`,
          { userId, searchUserId: userDeets._id }
        );
        setStatus(res?.data?.status);
        foundSomething = true; 
      }

    } catch (err) {
      console.log('something went wrong in user search',err)
    }

    try {
      // Search group
      const groupRes = await axios.post(
        `${import.meta.env.VITE_BACKEND_URI}groups/search`,
        { group: searchUser },
        { withCredentials: true }
      );

      const groupDeets = groupRes.data.data;
      if (groupDeets.groupAdmin === userId) {
        console.log("You are owner of this group")
      } else {
        setGroup({
          groupName: groupDeets.groupName,
          groupAvatar: groupDeets.groupAvatar,
          groupId: groupDeets._id,
          groupAdmin:groupDeets.groupAdmin
        });

        const gStatus = await axios.post(
          `${import.meta.env.VITE_BACKEND_URI}grouprequest/status`,
          { userId, groupId: groupDeets._id },{withCredentials:true}
        );
        console.log(gStatus)
        setGroupStatus(gStatus?.data?.status);
        foundSomething = true; 
      }
    } catch (err) {
      console.log("Something went wrong in group search",err)
    }
    if (!foundSomething) {
    setError("No user or group found with this name");
    setTimeout(() => setError(""), 3000);
  } else {
    setShow(true);

  }
  };

  const sendChatRequest = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URI}chatrequest/send`,
        { userId, receiverId: user.receiverId },
        { withCredentials: true }
      );
      console.log(response);
      setStatus("pending");
    } catch (e) {
      console.log(e);
    }
  };

  const sendJoinRequest = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URI}grouprequest/join`,
        { sender:userId, groupId: group.groupId,groupOwner:group.groupAdmin },
        { withCredentials: true }
      );
      console.log(response);
      setGroupStatus("pending");
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className='mt-2 flex flex-col items-center relative p-2 '>
      <div className='w-full flex items-center justify-center gap-2 '>
        <input
          type="search"
          placeholder='Enter username or group name'
          className='border h-8 rounded w-100'
          onChange={(e) => setSearchUser(e.target.value)}
          required
        />
        <button
          type='button'
          onClick={handleSearch}
          className='border p-1 rounded bg-gradient-to-br from-blue-600 to-cyan-400'
        >
          Search
        </button>
      </div>

      {show && (
        <div className='p-2 space-y-3 absolute z-1 border  top-11 w-full  backdrop-blur-2xl bg-white/30 items-center '>
          {user && (
            <div className='flex items-center justify-between border p-2 rounded-xl font-semibold relative'>
              <h1>{user.username}</h1>
              <img src={user.profilePhoto} alt="" className='h-10 w-10 rounded-full border-2' />
              <button
                className='p-1 border rounded bg-gradient-to-br from-cyan-500 to-white'
                onClick={sendChatRequest}
                disabled={status === "pending" || status === "accepted"}
              >
                {status === "accepted" ? "Friends" :
                  status === "pending" ? "Pending..." :
                  "Chat Request"}
              </button>
            </div>
          )}

          {group && (
            <div className='flex items-center justify-between border p-2 rounded-xl font-semibold relative'>
              <h1>{group.groupName}</h1>
              <img src={group.groupAvatar} alt="" className='h-10 w-10 rounded-full border-2' />
              <button
                className='p-1 border rounded bg-gradient-to-br from-green-400 to-white'
                onClick={sendJoinRequest}
                disabled={groupStatus === "pending" || groupStatus === "member"}
              >
                {groupStatus === "accepted" ? "Joined" :
                  groupStatus === "pending" ? "Request Sent" :
                  "Join Group"}
              </button>
            </div>
          )}
          <button className='bg-red-500 p-2 rounded-lg relative  left-[40%]' onClick={handleCancel}>Close</button>
        </div>
      )}

      {error && (
        <h3 className="rounded text-red-700 text-center bg-red-100 border-2 border-red-400 absolute top-9 m-1 p-1">
          {error}
        </h3>
      )}
    </div>
  );
}

export default SearchUser;
