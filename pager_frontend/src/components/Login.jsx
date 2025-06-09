import axios from 'axios'
import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { useDispatch } from 'react-redux'
import { setUser } from '../redux/userSlice'
function Login() {
  const [formdata, setFormdata] = useState({
    username: "",
    password: "",
  })
  const dispatch=useDispatch();
  const handleChange = (e) => {
    setFormdata({ ...formdata, [e.target.name]: e.target.value })
  }
  const navigate = useNavigate()
  const [error, setError] = useState("")
  const [loading,setLoading]=useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true)
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URI}users/login`, formdata, { withCredentials: true })
      const userData=response.data.data.user
      localStorage.setItem("impUser", JSON.stringify(userData));

      dispatch(setUser(userData))
      navigate("/chat")
    } catch (error) {
      console.log("Error in Logging in the user", error)
      if (error.status === 401) {
        setError("Password is Incorrect")
        setTimeout(() => {
          setError("")
        }, 4000);

      } else if(error.status === 404){
        setError(" Username is Incorrect")
        setTimeout(() => {
          setError("")
        }, 4000);
      } 
      else {
        setError("Something Went Wrong!")
        setTimeout(() => {
          setError("")
        }, 4000);

      }

    }
    finally{
      setLoading(false)
    }
  }
  return (
    <div className=" h-[90vh] md:h-screen w-screen bg-gradient-to-b from-blue-950 flex flex-col items-center justify-center">
      <form action="" onSubmit={handleSubmit} className="flex flex-col border-4 border-double border-black p-5 items-center m-5 rounded-xl md:w-[60%]  bg-white/30 font-semibold text-lg gap-5 relative">
        <label className="flex items-center gap-5">Username
          <input type="text" value={formdata.username} name='username' onChange={handleChange} required className="border-2 rounded-lg border-dashed text-sm h-8 p-2" placeholder='Enter your username' /></label>
        <label className="flex items-center gap-6 ">Password
          <input type="password" value={formdata.password} name='password' onChange={handleChange} required className="border-2 rounded-lg border-dashed text-sm h-8 p-2" placeholder='Enter your password' /></label>
  <div className='flex w-full justify-around'>
        <button className={`flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold py-1 px-3 rounded-xl transition-all ${
    loading ? "opacity-60 cursor-not-allowed" : ""
  }`}> {loading &&(
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
        {loading ? "Logging..." : "Login"}</button>
        <button onClick={()=>navigate("/forgotpassword")} className='bg-slate-700 hover:bg-slate-800 text-white font-semibold py-1 px-3 rounded-xl transition-all'>Forgot Password</button>
</div>

        {error && (
          <h3 className="text-sm rounded-xl text-red-700  px-3 py-1 absolute -bottom-4 bg-red-100 border-2 border-red-400">{error}</h3>
        )}
      </form>
    </div>
  )
}

export default Login