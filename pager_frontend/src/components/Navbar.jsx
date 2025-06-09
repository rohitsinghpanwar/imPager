import React from 'react'
import { useNavigate, NavLink } from "react-router";
function Navbar() {
  return (
<nav className="border-b text-white  flex items-center justify-between p-3 font-semibold z-1  absolute w-full bg-black">
  <NavLink to="/" className="text-2xl font-bold tracking-tight hover:text-blue-500 transition-colors duration-200">
    imPager
  </NavLink>
  <div className="flex ">
    <NavLink 
      to="/userguide" 
      className="p-1 rounded-md hover:text-blue-500  transition-all duration-300"
    >
      User_Guide
    </NavLink>
    <NavLink 
      to="/register" 
      className="p-1 rounded-md hover:text-blue-500 transition-all duration-300"
    >
      Register
    </NavLink>
    <NavLink 
      to="/login" 
      className="p-1 rounded-md hover:text-blue-500 transition-all duration-300"
    >
      Login
    </NavLink>
  </div>
</nav>
  )
}

export default Navbar