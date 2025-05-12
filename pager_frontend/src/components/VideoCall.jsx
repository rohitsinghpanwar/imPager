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
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      // Set the local video stream
      localVideoRef.current.srcObject = stream;

      // Add local stream tracks to the peer connection
      stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream));

      // When a remote stream is added, set it to the remote video
      peerConnection.current.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      // When ICE candidates are available, send them to the remote user
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice_candidate", {
            to: remoteUserId,
            candidate: event.candidate,
          });
        }
      };

      // Listen for ICE candidates from remote user
      socket.on("ice_candidate", ({ candidate }) => {
        if (candidate) {
          peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      // Listen for incoming offer
      socket.on("offer", async ({ offer }) => {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit("answer", { to: remoteUserId, answer });
        setCallStarted(true);
      });

      // Listen for answer from remote user
      socket.on("answer", async ({ answer }) => {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStarted(true);
      });

      // If the user is the caller, initiate the call
      if (isCaller) {
        const startCall = async () => {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          socket.emit("offer", { to: remoteUserId, offer });
        };
        startCall();
      }
    }).catch(error => {
      console.error("Error accessing media devices:", error);
    });

    // Cleanup on unmount
    return () => {
      peerConnection.current.close();
      socket.off("ice_candidate");
      socket.off("offer");
      socket.off("answer");
      socket.off("call_ended");
    };
  }, [remoteUserId, isCaller, socket]);

  const handleEndCall = () => {
    // Emit 'call_ended' to notify the other user the call has ended
    socket.emit("call_ended", { fromUserId: localUserId, toUserId: remoteUserId });
    // Call the onEnd function provided by the parent to handle local cleanup
    onEnd();
  };

  useEffect(() => {
    // Listen for 'call_ended' event from the other side
    socket.on("call_ended", () => {
      onEnd(); // End the call when the event is received
    });

    return () => {
      socket.off("call_ended");
    };
  }, [onEnd, socket]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center text-white">
      <h2 className="mb-4 text-lg font-bold">Video Call From {remoteUserId}</h2>
      <div className="flex gap-4">
        <video ref={remoteVideoRef} autoPlay className="w-1/2 border " />
        <video ref={localVideoRef} autoPlay muted className="w-1/2 border" />
      </div>
      <button
        onClick={handleEndCall} // Trigger the end call logic when the button is clicked
        className="mt-6 px-4 py-2 bg-red-600 text-white rounded"
      >
        End Call
      </button>
    </div>
  );
};

export default VideoCall;
