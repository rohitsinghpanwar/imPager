import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router'
function ForgotPassword() {
  const [email, setEmail] = useState({ email: "" })
  const handleEmailInput = (e) => {
    setEmail({ ...email, [e.target.name]: e.target.value })
  }
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const sendEmail = async (e) => {
    e.preventDefault()
    console.log(email)
    setLoading(true)
    try {
      await axios.post("http://localhost:8000/api/v1/users/forgotpassword", { email: email }).then((res) => {
        navigate("/forgotpassword/emailverification", { state: { email: email?.email || email } })
        setOtpStatus(true)
        console.log(res)
      }).catch((e) => console.log(e))
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className='h-screen w-screen bg-gradient-to-b from-blue-950 flex items-center justify-center'>
      <form action="" onSubmit={sendEmail} className='border flex md:flex-col bg-white/30  items-center md:w-[60%] rounded-xl p-5 gap-2 font-semibold text-lg'>
        <label htmlFor="" className='flex flex-col md:flex-row md:gap-5'>Enter Registered Email <input type="text" required placeholder='eg. mail@mailtype.com' className="border-2 rounded-lg border-dashed text-sm h-8 p-2 md:w-100"  name='email' value={email.email} onChange={handleEmailInput}  /></label>
        <button type='submit' className={`flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold py-1 px-3 rounded-xl transition-all${loading ? "opacity-60 cursor-not-allowed" : ""}`}>
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
          {loading ? "Sending..." : "Send OTP"}</button>
      </form>
    </div>
  )
}

export default ForgotPassword