import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router'
import { useLocation } from 'react-router'
function EmailVerification() {
  const [otp, setOtp] = useState({ otp: "" })
  const navigate = useNavigate()
  const locate = useLocation()
  const email = locate.state?.email
  const [error,setError]=useState("")
  const handleOtpInput = (e) => {
    setOtp({ ...otp, [e.target.name]: e.target.value })
  }
  useEffect(() => {
    if (!email) {
      navigate('/forgotpassword')
    }
  }, [email, navigate])
  const [loading, setLoading] = useState(false)
  const confirmOtp = async (e) => {
    e.preventDefault();
    setLoading(true)
    try {
      await axios.post("http://localhost:8000/api/v1/users/emailverification", {
        otp: otp.otp,  // 👈 flatten here
        email: email
      })
      navigate("/forgotpassword/changepassword", { state: { email: email } })
    } catch (error) {
      console.log(error.status)
      if (error.status === 500) {
        setError("Wrong OTP, Please enter a correct OTP")
        setTimeout(() => {
          setError("")
        }, 4000);
      }
      else {
        setError("Something went Wrong!")
        setTimeout(() => {
          setError("")
        }, 4000);
      }

    }
    finally {
      setLoading(false)
    }
  }
  return (
    <div className='h-screen w-screen bg-gradient-to-b from-blue-950 flex items-center justify-center'>
      <form action="" onSubmit={confirmOtp} className='relative border flex flex-col bg-white/30  items-center md:w-[60%] rounded-xl p-5 gap-2 font-semibold text-lg'>
        <label htmlFor="" className='flex gap-5'>Email<input type="text" value={email} readOnly className="border-2 rounded-lg border-dashed text-sm h-8 p-2 md:w-80" /></label>
        <label htmlFor="" className='flex gap-8'>OTP
          <input type="number" name="otp" value={otp.otp} onChange={handleOtpInput} id="" pattern="\d*" className="border-2 rounded-lg border-dashed text-sm h-8 p-2 md:w-80 " placeholder='Enter your OTP' required/>
        </label>
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
          {loading ? "Confirming..." : "Confirm OTP"}</button>
          {error && (
          <h3 className="text-sm rounded-xl text-red-700  px-3 py-1 absolute -bottom-4 bg-red-100 border-2 border-red-400">{error}</h3>
        )}
      </form>
    </div>
  )
}

export default EmailVerification