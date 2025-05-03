import React, { useEffect, useState } from "react";
import socket from "./socket";

const IncomingCall = ({ userId, onCallAccepted }) => {
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    socket.on("incoming_video_call", ({ from }) => {
      setIncomingCall(from);
    });

    return () => {
      socket.off("incoming_video_call");
    };
  }, []);

  const acceptCall = () => {
    socket.emit("video_call_accepted", { to: incomingCall, from: userId });
    onCallAccepted(incomingCall);
    setIncomingCall(null);
  };

  const rejectCall = () => {
    socket.emit("video_call_rejected", { to: incomingCall, from: userId });
    setIncomingCall(null);
  };

  if (!incomingCall) return null;

  return (
    <div className="fixed top-4 right-4 bg-white border p-4 shadow-lg rounded">
      <p>Incoming video call from {incomingCall}</p>
      <div className="mt-2 flex gap-2">
        <button className="bg-green-500 text-white px-3 py-1 rounded" onClick={acceptCall}>
          Accept
        </button>
        <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={rejectCall}>
          Reject
        </button>
      </div>
    </div>
  );
};

export default IncomingCall;
