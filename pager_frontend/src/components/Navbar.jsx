import React from 'react'
import { useNavigate, NavLink } from "react-router";
function Navbar() {
  return (
<nav className="border-b text-white  flex items-center justify-between p-3 font-semibold z-1  absolute w-full">
  <NavLink to="/" className="text-2xl font-bold tracking-tight hover:text-blue-500 transition-colors duration-200">
    imPager
  </NavLink>
  <div className="flex ">
    <NavLink 
      to="/register" 
      className="p-1 rounded-md hover:bg-blue-500 hover:text-white transition-all duration-300"
    >
      Register
    </NavLink>
    <NavLink 
      to="/login" 
      className="p-1 rounded-md hover:bg-blue-500 hover:text-white transition-all duration-300"
    >
      Login
    </NavLink>
  </div>
</nav>
  )
}

export default Navbar