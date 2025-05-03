import { useState } from "react";
import userIcon from '../assets/hacker.png'
export default function ProfilePhotoInput() {
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="relative w-24 h-24">
      <label htmlFor="profilePhoto" className="cursor-pointer group">

        <img
          src={preview || userIcon}
          alt="Profile Preview"
          className="w-24 h-24 object-fit rounded-full border-2 border-gray-300 shadow-sm group-hover:brightness-75 transition duration-300 "
        />
        <div className="absolute inset-0 rounded-full bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <span className="text-white text-xs">Change</span>
        </div>
      </label>
      <input
        type="file"
        id="profilePhoto"
        name="profilePhoto"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
