import React from "react";
import { Sparkles } from "lucide-react";
import chat from "../assets/chatsection.png";
import login from "../assets/login.png";
import register from "../assets/register.png";
import home from "../assets/home.png";
import request from "../assets/request.png";
import search from "../assets/searchuser.png";
import message from "../assets/message.png";
import group from "../assets/groupdetails.png";

/**
 * UserGuide component – an onboarding walkthrough for the ImPager app.
 * Uses Tailwind and Lucide icons for a clean aesthetic.
 */
export default function UserGuide() {
  // Re‑usable card data
  const sections = [
    {
      id: 1,
      title: "Home – Your First Destination",
      img: home,
      text: `The Home page greets you with a navigation bar, a <strong>Get Started</strong> button that leads straight to registration, and a footer where you can email the dev or browse the source code on GitHub.`,
    },
    {
      id: 2,
      title: "Register – Your First Stop",
      img: register,
      text: `Sign up with a real email so you can recover your account later. Tap the avatar to choose a profile picture – or keep the default if you’re camera‑shy.`,
    },
    {
      id: 3,
      title: "Login – Your Key",
      img: login,
      text: `Log in with your username and password. Forgot it? Click <strong>Forgot Password</strong> – we’ll email you an OTP so you can set a new one and get back to chatting in no time.`,
    },
    {
      id: 4,
      title: "Chat – The Main Stage",
      img: chat,
      text: `Here you’ll find your conversations and group requests. Tap your avatar for profile details or <strong>Log Out</strong> when you’re done.`,
    },
    {
      id: 5,
      title: "Search – Find Friends & Groups",
      img: search,
      text: `Type a username or group name to send a chat or join request. You’ll only see them once they accept.`,
    },
    {
      id: 6,
      title: "Requests – Where Connections Happen",
      img: request,
      text: `View incoming chat or group invites. Accept, decline, or ignore – the choice is yours.`,
    },
    {
      id: 7,
      title: "Messaging – Speak Your Mind",
      img: message,
      text: `Write, hit <strong>Send</strong>, and your words fly to your favourite people. In groups, tap the gear icon for group settings.`,
    },
    {
      id: 8,
      title: "Groups – Find Your Tribe",
      img: group,
      text: `Check group info at a glance – admin, members, and if you’re the admin, remove members with a tap.`,
    },
  ];

  return (
    <section className="min-h-screen w-[100vw] bg-blue-950 text-white overflow-y-auto p-4 md:p-8 flex flex-col items-center ">
      <div className="relative top-11">
      <header className="flex items-center gap-2 mb-6 animate-fade-in  ">
        <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
        <h1 className="text-2xl md:text-3xl font-semibold relative ">
          Welcome to the <span className="text-cyan-400">ImPager</span> User Guide
        </h1>
      </header>

      <p className="mb-10 leading-relaxed">
        This quick tour will help you get the most out of ImPager. Scroll down and
        explore each feature at your own pace.
      </p>

      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-1 ">
        {sections.map(({ id, title, img, text }) => (
          <div
            key={id}
            className="bg-white/5 border border-white/10 backdrop-blur-sm p-4 rounded-xl hover:shadow-lg transition-shadow duration-300 "
          >
            <h3 className="text-lg font-bold text-cyan-300 mb-2">
              {id}. {title}
            </h3>
            <img
              src={img}
              alt={title}
              className=" rounded-lg shadow-md mb-3 xl:h-100 xl:w-full"
            />
            <p
              className="text-sm  leading-relaxed text-gray-200"
              dangerouslySetInnerHTML={{ __html: text }}
            />
          </div>
        ))}
      </div>

      {/* Tech stack */}
      <div className="mt-16">
        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-cyan-400 flex items-center gap-2">
          <Sparkles className="h-5 w-5" /> Tech Stack
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 text-sm">
          <li className="bg-white/10 rounded-xl px-4 py-2">React (frontend)</li>
          <li className="bg-white/10 rounded-xl px-4 py-2">Tailwind CSS (styling)</li>
          <li className="bg-white/10 rounded-xl px-4 py-2">Cloudinary (image storage)</li>
          <li className="bg-white/10 rounded-xl px-4 py-2">Node.js & Express (backend)</li>
          <li className="bg-white/10 rounded-xl px-4 py-2">MongoDB (database)</li>
          <li className="bg-white/10 rounded-xl px-4 py-2">Axios (API calls)</li>
          <li className="bg-white/10 rounded-xl px-4 py-2">Redux Toolkit (state)</li>
          <li className="bg-white/10 rounded-xl px-4 py-2">Vercel & Render (deployment)</li>
        </ul>
      </div>

      {/* Footer message */}
      <footer className="mt-20 text-center text-sm text-gray-300">
        <p>
          Thanks for reading the whole guide – we hope it makes your ImPager
          journey smoother and more enjoyable! 
        </p>
      </footer>
      </div>
    </section>
  );
}