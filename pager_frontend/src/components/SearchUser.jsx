import React from 'react'
import { useState } from 'react';
import axios from 'axios';
import cancelIcon from '../assets/cancel.png'

function SearchUser({userId}) {
const [searchUser,setSearchUser]=useState("");
const [user,setUser]=useState(null);
const [error,setError]=useState("")
const [show,setShow]=useState(false);
const [status,setStatus]=useState(null)
const sendChatRequest = async () => {
  try {
    const response = await axios.post(
      "http://localhost:8000/api/v1/chatrequest/send",
      { userId: userId, receiverId: user.receiverId },
      { withCredentials: true }
    );
    console.log(response);
    setStatus("pending");
  } catch (e) {
    console.log(e);
  }
};
const handleCancel=()=>{
  setShow(false)
}
const handleSearch = async () => {
  setUser(null);

  if (searchUser) {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/v1/users/search",
        { username: searchUser },
        { withCredentials: true }
      );
      const deets = response.data.data;
      if (userId === deets._id) {
        setError("Sorry!,You cannot chat with yourself😜");
        setShow(false);
        setTimeout(() => setError(""), 3000);
        return;
      }
      setUser({
        username: deets.username,
        profilePhoto: deets.profilePhoto,
        receiverId: deets._id
      });
      const res=await axios.post("http://localhost:8000/api/v1/chatrequest/status",{userId,searchUserId:deets._id})
      console.log(res)
      setStatus(res?.data?.status)
      setShow(true)
    } catch (e) {
      console.log(e);
      setUser(null);
      setShow(false)
      if (e?.response?.status === 404) {
        setError("Username not found");
      } else {
        setError("Something went wrong, try later!");
      }
      setTimeout(() => setError(""), 3000);
    }
  } else {
    setUser(null); 
    setError("Username is required to search");
    setTimeout(() => setError(""), 3000);
  }
};

  return (
    <div className='border rounded-xl m-2 flex h-35 flex-col items-center justify-evenly bg-gradient-to-b from-blue-300 to to-gray-500 '>
        <h1 className='border-2 p-1 rounded border-dotted text-lg font-semibold'>Search By Username</h1>
        <div className='w-full flex items-center justify-center gap-2 '>
        <input type="search" placeholder='Enter the username' className='border h-8 rounded w-[70%] ' onChange={(e)=>setSearchUser(e.target.value)} required />   
        <button type='button' onClick={handleSearch} className='border p-1 rounded bg-gradient-to-br from-blue-600 to-cyan-400 ' >Search</button>
        </div>
        {show && (
                  <div className='h-10 flex items-center justify-between border w-85 p-6 rounded-xl font-semibold relative'>
          {user &&(<h1 className=''>{user?.username || user}</h1>)}
          {user?.username &&(
            <>
            <img src={user.profilePhoto} alt="" className='h-10 w-10 rounded-full  border-2' />
            <button
  className='p-1 border rounded bg-gradient-to-br from-cyan-500 to-white'
  onClick={sendChatRequest}
  disabled={status === "pending" || status === "accepted"} 
>
  {status === "accepted" ? "Friends" :
   status === "pending" ? "Pending..." :
   "Chat Request"}
</button>


            <img src={cancelIcon} alt="" className='invert h-8 absolute -top-3 -right-3' onClick={handleCancel} />
            </>
          )

          }
          
        </div>
        )}

        {
          error &&(
            <h3 className=" rounded-xl text-red-700  px-3 py-1 bg-red-100 border-2 border-red-400">{error}</h3>
          )
        }
</div>
  )
}

export default SearchUser