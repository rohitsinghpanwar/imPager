import React, { useEffect, useRef, useState } from "react";

const VideoCall = ({ socket, localUserId, remoteUserId, isCaller, onEnd }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const [callStarted, setCallStarted] = useState(false);

  useEffect(() => {
    const servers = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    // Create a new peer connection
    peerConnection.current = new RTCPeerConnection(servers);

    // Get media stream and set up local and remote video
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        // Set the local video stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Add local stream tracks to the peer connection
        stream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, stream);
        });

        // When a remote stream is added, set it to the remote video
        peerConnection.current.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
            console.log("Remote stream received and set to remoteVideoRef");
          }
        };

        // When ICE candidates are available, send them to the remote user
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice_candidate", {
              to: remoteUserId,
              candidate: event.candidate,
            });
            console.log("Sent ICE candidate to", remoteUserId);
          }
        };

        // Handle ICE connection state changes
        peerConnection.current.oniceconnectionstatechange = () => {
          console.log("ICE connection state:", peerConnection.current.iceConnectionState);
          if (peerConnection.current.iceConnectionState === "failed") {
            console.error("ICE connection failed");
            onEnd();
          }
        };

        // Listen for ICE candidates from remote user
        socket.on("ice_candidate", async ({ candidate }) => {
          try {
            if (candidate) {
              await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
              console.log("Added ICE candidate from", remoteUserId);
            }
          } catch (error) {
            console.error("Error adding ICE candidate:", error);
          }
        });

        // Listen for incoming offer
        socket.on("offer", async ({ offer }) => {
          try {
            if (!peerConnection.current.remoteDescription) {
              await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
              const answer = await peerConnection.current.createAnswer();
              await peerConnection.current.setLocalDescription(answer);
              socket.emit("answer", { to: remoteUserId, answer });
              setCallStarted(true);
              console.log("Offer received and answer sent to", remoteUserId);
            }
          } catch (error) {
            console.error("Error handling offer:", error);
          }
        });

        // Listen for answer from remote user
        socket.on("answer", async ({ answer }) => {
          try {
            if (!peerConnection.current.remoteDescription) {
              await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
              setCallStarted(true);
              console.log("Answer received from", remoteUserId);
            }
          } catch (error) {
            console.error("Error handling answer:", error);
          }
        });

        // If the user is the caller, initiate the call
        if (isCaller) {
          const startCall = async () => {
            try {
              const offer = await peerConnection.current.createOffer();
              await peerConnection.current.setLocalDescription(offer);
              socket.emit("offer", { to: remoteUserId, offer });
              console.log("Offer created and sent to", remoteUserId);
            } catch (error) {
              console.error("Error starting call:", error);
            }
          };
          startCall();
        }
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);
      });

    // Cleanup on unmount
    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      socket.off("ice_candidate");
      socket.off("offer");
      socket.off("answer");
      socket.off("call_ended");
    };
  }, [remoteUserId, isCaller, socket, onEnd]);

  const handleEndCall = () => {
    socket.emit("call_ended", { fromUserId: localUserId, toUserId: remoteUserId });
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    onEnd();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center text-white">
      <h2 className="mb-4 text-lg font-bold">Video Call with {remoteUserId}</h2>
      <div className="flex gap-4">
        <video ref={remoteVideoRef} autoPlay className="w-1/2 border" />
        <video ref={localVideoRef} autoPlay muted className="w-1/2 border" />
      </div>
      <button
        onClick={handleEndCall}
        className="mt-6 px-4 py-2 bg-red-600 text-white rounded"
      >
        End Call
      </button>
    </div>
  );
};

export default VideoCall;