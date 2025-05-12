import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, } from 'react-router'
import axios from 'axios'
function ChangePassword() {
  const navigate = useNavigate()
  const locate = useLocation()
  const [loading, setLoading] = useState(false)
  const email = locate.state?.email
  const [password, setPassword] = useState({ newPassword: '' })
  const handlePasswordInput = (e) => {
    setPassword({ ...password, [e.target.name]: e.target.value })
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true)
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URI}users/changepassword`, { email, newPassword: password.newPassword })
      navigate("/login")
    } catch (error) {
      console.log(error.status)

    } finally {
      setLoading(false)
    }

  }
  useEffect(() => {
    if (!email) {
      navigate('/forgotpassword')
    }
  }, [email, navigate])
  return (
    <div className='h-screen w-screen bg-gradient-to-b from-blue-950 flex items-center justify-center'>
      <form action="" onSubmit={handleSubmit} className=' border bg-white/30 font-semibold p-3 rounded-xl items-center flex flex-col justify-center gap-2 text-lg md:w-[60%]'>
        <h1 className='underline underline-offset-2 '>Creating New Password for {email}</h1>
        <label className='flex items-center gap-5 '>New Password<input type="password" name='newPassword' value={password.newPassword} onChange={handlePasswordInput} className="border-2 rounded-lg border-dashed text-sm h-8 p-2 md:w-80 " placeholder='Enter your OTP' required/></label>
        <button type='submit' className={`flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold py-1 px-3 rounded-xl transition-all${loading ? "opacity-60 cursor-not-allowed" : ""}`}>{loading && (
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
          {loading ? "Changing creds..." : "Change Password"}</button>

      </form>
    </div>
  )
}

export default ChangePassword