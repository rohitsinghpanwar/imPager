import React, { useEffect, useRef, useState } from "react";

const VideoCall = ({ socket, localUserId, remoteUserId, isCaller, onEnd }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const [callStarted, setCallStarted] = useState(false);
  const localStreamRef = useRef(null);

  useEffect(() => {
    if (!localUserId || !remoteUserId) {
      console.error("Invalid user IDs:", { localUserId, remoteUserId });
      onEnd();
      return;
    }

    const servers = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        // Add TURN servers here if needed
      ],
    };

    console.log("Initializing peer connection");
    peerConnection.current = new RTCPeerConnection(servers);

    const setupMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(err => console.error("Local video play error:", err));
        }

        // Add all tracks to connection
        stream.getTracks().forEach(track => {
          peerConnection.current.addTrack(track, stream);
        });
      } catch (error) {
        console.error("Media device error:", error);
        handleEndCall();
      }
    };

    const setupPeerEvents = () => {
      // ICE Candidate Handling
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice_candidate", {
            to: remoteUserId,
            candidate: event.candidate,
          });
        }
      };

      // Track Reception
      peerConnection.current.ontrack = (event) => {
        console.log("Received remote tracks:", event.streams);
        if (event.streams && event.streams.length > 0 && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current.play().catch(err => console.error("Remote video play error:", err));
        }
      };

      // ICE Connection State
      peerConnection.current.oniceconnectionstatechange = () => {
        const state = peerConnection.current.iceConnectionState;
        console.log("ICE state:", state);
        if (state === "failed" || state === "disconnected") {
          handleEndCall();
        }
      };
    };

    const initializeCall = async () => {
      await setupMedia();
      setupPeerEvents();

      if (isCaller) {
        try {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          socket.emit("offer", { to: remoteUserId, offer });
        } catch (error) {
          console.error("Offer creation error:", error);
          handleEndCall();
        }
      }
    };

    initializeCall();

    // Socket Handlers
    const handleOffer = async (offer) => {
      if (!peerConnection.current.remoteDescription) {
        await peerConnection.current.setRemoteDescription(offer);
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit("answer", { to: remoteUserId, answer });
      }
    };

    const handleAnswer = async (answer) => {
      if (!peerConnection.current.remoteDescription) {
        await peerConnection.current.setRemoteDescription(answer);
      }
    };

    const handleIceCandidate = (candidate) => {
      if (candidate) {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice_candidate", handleIceCandidate);

    return () => {
      console.log("Cleaning up peer connection");
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice_candidate", handleIceCandidate);
      
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleEndCall = () => {
    socket.emit("call_ended", { toUserId: remoteUserId });
    onEnd();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center text-white">
      <h2 className="mb-4 text-lg font-bold">Video Call With {remoteUserId}</h2>
      <div className="flex gap-4 w-full h-[80vh] p-4">
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
          className="flex-1 bg-gray-800 rounded-lg"
          muted={false}
        />
        <video 
          ref={localVideoRef} 
          autoPlay 
          muted 
          playsInline 
          className="w-1/4 bg-gray-800 rounded-lg shadow-lg"
        />
      </div>
      <button
        onClick={handleEndCall}
        className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
      >
        End Call
      </button>
    </div>
  );
};

export default VideoCall;