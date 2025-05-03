import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import userIcon from '../assets/hacker.png'
function Signup() {
  const [formdata, setFormdata] = useState({
    username: "",
    email: "",
    password: "",
  });
  const navigate=useNavigate()
  const [profilePhoto, setProfilePhoto] = useState(null);

  const handleChange = (e) => {
    setFormdata({ ...formdata, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setProfilePhoto(e.target.files[0]); // Store file separately
  };

  const [loading, setLoading] = useState(false);
  const [error,setError]=useState("")
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", formdata.username);
      formData.append("email", formdata.email);
      formData.append("password", formdata.password);
      if (profilePhoto) formData.append("profilePhoto", profilePhoto);

      const response = await axios.post("http://localhost:8000/api/v1/users/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("User registered successfully:", response);
      navigate("/login")

    } catch (error) {
      console.log("Error in registering the user:", error);
      if(error.status === 409){
        setError("User Exists Already, Please Login!")
        setTimeout(() => {
          setError("")
        }, 5000);
      }
      else{
        setError("Something went wrong!")
        setTimeout(() => {
          setError("")
        }, 5000);
      }
    }
    finally{
      setLoading(false);
    }
  };

  return (
    <div className=" h-[90vh] md:h-screen w-screen bg-gradient-to-b from-blue-950 flex flex-col items-center justify-center">
    <form onSubmit={handleSubmit} className="flex flex-col border-4 border-double border-black p-5 items-center m-5 rounded-xl md:w-[60%]  bg-white/30 font-semibold text-lg gap-2 w- ">
      <label className="flex flex-col items-center group ">
        Profile Photo
        <div className="relative w-24 h-24">
          <img src={profilePhoto ? URL.createObjectURL(profilePhoto) : userIcon} alt="Profile Preview" className="w-24 h-24 object-cover rounded-full border-2 border-black shadow-sm group-hover:brightness-75 transition duration-300"/>
          <div className="absolute inset-0 rounded-full bg-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <span className="text-white text-xs">Click to Change</span>
        </div>
        <input type="file" onChange={handleFileChange} name="profilePhoto" 
        accept="image/*" className="hidden"/>
        </div>
      </label>
      <label className="flex gap-5">
        Username
        <input type="text" onChange={handleChange} value={formdata.username} name="username" className="border-2 rounded-lg border-dashed text-sm h-8 p-2" placeholder="Enter your good name" required />
      </label>
      <label className="flex gap-14.5">
        Email
        <input type="email" onChange={handleChange} value={formdata.email} name="email" className="border-2 rounded-lg border-dashed text-sm h-8 p-2" placeholder="eg. mymail@mailtype.com" required/>
      </label>
      <label className="flex gap-6">
        Password
        <input type="password" onChange={handleChange} value={formdata.password} name="password" className="border-2 rounded-lg border-dashed text-sm h-8 p-2" placeholder="Enter a secure password" required />
      </label>
      <button
  type="submit"
  disabled={loading}
  className={`flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold py-1 px-3 rounded-xl transition-all ${
    loading ? "opacity-60 cursor-not-allowed" : ""
  }`}
>
  {loading && (
    <svg
      className="w-4 h-4 animate-spin text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      ></path>
    </svg>
  )}
  {loading ? "Registering..." : "Register"}
</button>
{error && (
          <h3 className="text-sm rounded-xl text-red-700  px-3 py-1 absolute -bottom-4 bg-red-100 border-2 border-red-400">{error}</h3>
        )}
    </form>
    </div>
  );
}

export default Signup;
