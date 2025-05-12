import React, { useEffect, useRef, useState } from "react";

const VideoCall = ({ socket, localUserId, remoteUserId, isCaller, onEnd }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const [callStarted, setCallStarted] = useState(false);

  useEffect(() => {
    const servers = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        // Add TURN servers here if needed
      ],
    };

    peerConnection.current = new RTCPeerConnection(servers);

    // Track ICE connection state
    peerConnection.current.oniceconnectionstatechange = () => {
      console.log("ICE Connection State:", peerConnection.current.iceConnectionState);
    };

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;

        // Add tracks to peer connection
        stream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, stream);
        });

        // Handle remote track additions
        peerConnection.current.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // ICE Candidate handling
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice_candidate", {
              to: remoteUserId,
              candidate: event.candidate,
            });
          }
        };

        // Socket listeners
        const handleIceCandidate = ({ candidate }) => {
          if (candidate) {
            peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate))
              .catch(e => console.error("Error adding ICE candidate:", e));
          }
        };

        const handleOffer = async ({ offer }) => {
          try {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            socket.emit("answer", { to: remoteUserId, answer });
            setCallStarted(true);
          } catch (e) {
            console.error("Error handling offer:", e);
          }
        };

        const handleAnswer = async ({ answer }) => {
          try {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
            setCallStarted(true);
          } catch (e) {
            console.error("Error handling answer:", e);
          }
        };

        socket.on("ice_candidate", handleIceCandidate);
        socket.on("offer", handleOffer);
        socket.on("answer", handleAnswer);

        // Initiate call if caller
        if (isCaller) {
          const createOffer = async () => {
            try {
              const offer = await peerConnection.current.createOffer();
              await peerConnection.current.setLocalDescription(offer);
              socket.emit("offer", { to: remoteUserId, offer });
            } catch (e) {
              console.error("Error creating offer:", e);
            }
          };
          createOffer();
        }
      })
      .catch((error) => {
        console.error("Error accessing media:", error);
      });

    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      socket.off("ice_candidate");
      socket.off("offer");
      socket.off("answer");
    };
  }, [remoteUserId, isCaller, socket]);

  const handleEndCall = () => {
    socket.emit("call_ended", { toUserId: remoteUserId });
    onEnd();
  };

  useEffect(() => {
    socket.on("call_ended", onEnd);
    return () => socket.off("call_ended");
  }, [onEnd, socket]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center text-white">
      <h2 className="mb-4 text-lg font-bold">
        Video Call with {remoteUserId}
      </h2>
      <div className="flex gap-4 w-full max-w-4xl">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-1/2 border rounded-lg bg-gray-800"
        />
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-1/2 border rounded-lg bg-gray-800"
        />
      </div>
      <button
        onClick={handleEndCall}
        className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
      >
        End Call
      </button>
    </div>
  );
};

export default VideoCall;