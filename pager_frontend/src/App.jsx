import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router";
import githubIcon from './assets/github.png'
import mailIcon from './assets/mail.png'
import chatIcon from './assets/meetme.png'
import videoIcon from './assets/video-calling.png'
import HeroSection from './components/HeroSection.jsx'
function App() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate()
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get("http://localhost:8000/api/v1/users/me", {
                    withCredentials: true, // ✅ Send cookies
                });
                setUser(response.data?.data?.user)
                navigate("/chat")
                console.log("persist login Successful") // ✅ Store user data
            } catch (error) {
                console.log("User not logged in", error);
                if (error.response?.status === 401) {
                    try {
                        await axios.get("http://localhost:8000/api/v1/users/refreshcreds", { withCredentials: true });
                        const retryPersistLogin = await axios.get("http://localhost:8000/api/v1/users/me", { withCredentials: true });
                        checkAuth();
                    } catch (error) {
                        console.log("Invalid refresh token")
                    }
                }
                else {
                    console.log("User not logged in", error);
                }
            }
        };

        checkAuth();
    }, []);

    return (
        <div className="bg-gradient-to-b from-blue-950  md:h-screen h-[93vh] relative  ">

<main className="flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-blue-950  text-white min-h-screen">
  <section className="text-center max-w-4xl mx-auto p-8 flex flex-col items-center gap-6">
    <img src={chatIcon} alt="Chat Icon" className="h-20 animate-bounce" />
    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight animate-fade-in">
      Welcome to <span className="text-blue-400">imPager</span>
    </h1>
    <p className="text-lg md:text-xl font-medium animate-slide-up">
      Your ultimate chat buddy for endless conversations!
    </p>
    <a
      href="/register"
      className="mt-6 inline-block px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-full shadow-lg transition-all duration-300 text-lg animate-pulse"
    >
      Get Started
    </a>
  </section>
</main>

<footer className="bg-black w-full border-t  rounded-t-xl   p-4 text-white absolute bottom-0">
  <div className="flex  md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
    
    {/* About Section */}
    <div className="flex flex-col max-w-sm">
      <h2 className="text-lg font-semibold mb-1">About</h2>
      <p className="text-xs font-light text-gray-300">
        imPager is a new real-time instant messaging web application that enables fast and secure communication.
      </p>
    </div>

    {/* Social Section */}
    <div className="flex flex-col items-start">
      <h2 className="text-lg font-semibold mb-1">Socials</h2>
      <div className="flex gap-4">
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
          <img src={githubIcon} alt="GitHub" className="h-5 " />
        </a>
        <a href="mailto:rohitsinghpanwar108@gmail.com" className="hover:scale-110 transition-transform">
          <img src={mailIcon} alt="Email" className="h-6 " />
        </a>
      </div>
    </div>
  </div>

  {/* Copyright */}
  <div className="mt-4 border-t border-gray-700 pt-2 text-center text-xs text-gray-400">
    &copy; imPager {new Date().getFullYear()}. All rights reserved.
  </div>
</footer>

        </div>
    );
}

export default App;
