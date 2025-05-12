import React, { useState, useRef } from 'react';
import changeIcon from "../assets/camera.png";
import axios from 'axios';
function Profile({ onCancel }) {
  const { username, profilePhoto, _id, email, createdAt } = JSON.parse(localStorage.getItem("impUser"));
  const [loading, setLoading] = useState(false);
  const [dp, setDp] = useState(null);
  console.log(dp)
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showProfile, setShowProfile] = useState(true);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDp(URL.createObjectURL(file)); // For preview
      setSelectedFile(file); // For uploading
      setShowSaveButton(true);
    }
  };
  

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("dp",selectedFile);
      formData.append("_id", _id);
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URI}users/changedp`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log(res)
      if (res.data && res.data.data.profilePhoto) {
        const updatedUser = {
          ...JSON.parse(localStorage.getItem("impUser")),
          profilePhoto: res.data.data.profilePhoto,
        };
        localStorage.setItem("impUser", JSON.stringify(updatedUser));
        setDp(res.data.data.profilePhoto);
        setShowSaveButton(false);
      }
  
    } catch (error) {
      console.log("Upload Error:", error);
    } finally {
      setLoading(false);
    }
  };
  if (!showProfile) return null;

  return (
    <div>
      <div className="border absolute top-0 right-0 flex flex-col items-center z-1  p-2 rounded-lg shadow bg-gradient-to-bl from-cyan-400 to-yellow-200 ">
        <div className="relative">
          <img
            src={dp || profilePhoto}
            alt="Profile"
            className="h-20 w-20 rounded-full object-cover"
          />
          <img
            src={changeIcon}
            alt="Change"
            className="absolute bottom-0 right-0 bg-green-300 p-1.5 rounded-full cursor-pointer"
            onClick={triggerFileInput}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>
        <h1 className="mt-1 font-semibold">Username: {username}</h1>
        <h1 className=" font-semibold">Email: {email}</h1>
        <h1 className=" font-semibold">Created: {new Date(createdAt).toLocaleDateString()}</h1>

        <div className="flex gap-3 mt-3">
          <button onClick={onCancel} className="border px-3 py-1 rounded  flex text-red-600 items-center gap-1">
            Cancel
          </button>

          {showSaveButton && (
            <button
              type="button"
              disabled={loading}
              className={`flex items-center gap-2  text-green-600 font-semibold py-1 px-3 rounded border transition-all ${loading ? "opacity-60 cursor-not-allowed" : ""
                }`} onClick={handleSave}
            >
              {loading && (
                <svg
                  className="w-4 h-4 animate-spin text-gray-800"
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
              {loading ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
