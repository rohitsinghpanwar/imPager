import React, { useEffect, useRef, useState } from "react";

const VideoCall = ({ socket, localUserId, remoteUserId, isCaller, callId, onEnd }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const [callStarted, setCallStarted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!localUserId || !remoteUserId || !callId) {
      console.error("Invalid parameters:", { localUserId, remoteUserId, callId });
      setError("Invalid user IDs or call ID");
      return;
    }

    const servers = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        // Add TURN server if available
        // {
        //   urls: "turn:your.turn.server:3478",
        //   username: "username",
        //   credential: "password",
        // },
      ],
    };

    console.log("VideoCall mounted. LocalUserId:", localUserId, "RemoteUserId:", remoteUserId, "IsCaller:", isCaller, "CallId:", callId);

    // Create a new peer connection
    peerConnection.current = new RTCPeerConnection(servers);
    console.log("Peer connection created");

    // Get media stream and set up local and remote video
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        console.log("Local media stream obtained:", stream.getTracks());
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          console.log("Local stream set to localVideoRef");
        } else {
          console.warn("localVideoRef is not available");
        }

        // Add local stream tracks to the peer connection
        stream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, stream);
          console.log("Local track added to peer connection:", track.kind);
        });

        // When a remote stream is added, set it to the remote video
        peerConnection.current.ontrack = (event) => {
          console.log("Remote track received:", event);
          if (remoteVideoRef.current && event.streams && event.streams.length > 0) {
            const remoteStream = event.streams[0];
            console.log("Remote stream tracks:", remoteStream.getTracks());
            remoteVideoRef.current.srcObject = remoteStream;
            console.log("Remote stream set to remoteVideoRef");
            if (!remoteStream.getVideoTracks().length) {
              console.warn("Remote stream has no video tracks");
            }
          } else {
            console.warn("No remote stream or remoteVideoRef is null");
          }
        };

        // When ICE candidates are available, send them to the remote user
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            console.log("Local ICE candidate generated:", event.candidate);
            socket.emit("ice_candidate", {
              to: remoteUserId,
              candidate: event.candidate,
              callId,
            });
            console.log("Local ICE candidate sent to:", remoteUserId);
          }
        };

        // Handle ICE connection state changes
        peerConnection.current.oniceconnectionstatechange = () => {
          const state = peerConnection.current.iceConnectionState;
          console.log("ICE connection state:", state);
          if (state === "failed") {
            console.error("ICE connection failed");
            setError("Failed to establish connection with the remote user");
            handleEndCall();
          } else if (state === "disconnected" || state === "closed") {
            console.log("ICE connection disconnected or closed");
            handleEndCall();
          }
        };

        // Handle connection state changes
        peerConnection.current.onconnectionstatechange = () => {
          const state = peerConnection.current.connectionState;
          console.log("Connection state:", state);
          if (state === "failed") {
            console.error("WebRTC connection failed");
            setError("WebRTC connection failed");
            handleEndCall();
          }
        };

        // Listen for ICE candidates from remote user
        socket.on("ice_candidate", ({ candidate, from, callId: receivedCallId }) => {
          console.log("Received remote ICE candidate from:", from, "Candidate:", candidate, "CallId:", receivedCallId);
          if (candidate && from === remoteUserId && receivedCallId === callId) {
            peerConnection.current
              .addIceCandidate(new RTCIceCandidate(candidate))
              .then(() => console.log("Remote ICE candidate added successfully"))
              .catch((error) => console.error("Error adding remote ICE candidate:", error));
          } else {
            console.warn("Ignoring ICE candidate from unexpected user or call:", { from, receivedCallId, expectedCallId: callId });
          }
        });

        // Listen for incoming offer
        socket.on("offer", async ({ offer, from, callId: receivedCallId }) => {
          console.log("Received offer from:", from, "CallId:", receivedCallId);
          if (from === remoteUserId && receivedCallId === callId) {
            try {
              if (!peerConnection.current.remoteDescription) {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
                console.log("Remote description set from offer");
                const answer = await peerConnection.current.createAnswer();
                await peerConnection.current.setLocalDescription(answer);
                console.log("Local description set with answer:", answer);
                socket.emit("answer", { to: remoteUserId, answer, callId });
                console.log("Answer sent to:", remoteUserId);
                setCallStarted(true);
              } else {
                console.warn("Offer ignored; remote description already set");
              }
            } catch (error) {
              console.error("Error handling offer:", error);
              setError("Failed to process offer from remote user");
            }
          } else {
            console.warn("Ignoring offer from unexpected user or call:", { from, receivedCallId, expectedCallId: callId });
          }
        });

        // Listen for answer from remote user
        socket.on("answer", async ({ answer, from, callId: receivedCallId }) => {
          console.log("Received answer from:", from, "CallId:", receivedCallId);
          if (from === remoteUserId && receivedCallId === callId) {
            try {
              if (!peerConnection.current.remoteDescription) {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
                console.log("Remote description set from answer");
                setCallStarted(true);
              } else {
                console.warn("Answer ignored; remote description already set");
              }
            } catch (error) {
              console.error("Error handling answer:", error);
              setError("Failed to process answer from remote user");
            }
          } else {
            console.warn("Ignoring answer from unexpected user or call:", { from, receivedCallId, expectedCallId: callId });
          }
        });

        // Delay call initiation to ensure socket connection stability
        const initiateCall = async () => {
          if (isCaller) {
            console.log("Initiating call as caller after delay");
            try {
              const offer = await peerConnection.current.createOffer();
              await peerConnection.current.setLocalDescription(offer);
              console.log("Local description set with offer:", offer);
              socket.emit("offer", { to: remoteUserId, offer, callId });
              console.log("Offer sent to:", remoteUserId);
            } catch (error) {
              console.error("Error creating or sending offer:", error);
              setError("Failed to initiate call");
              handleEndCall();
            }
          }
        };

        // Wait 1 second before initiating the call to ensure socket stability
        const timer = setTimeout(() => {
          initiateCall();
        }, 1000);

        return () => {
          clearTimeout(timer);
        };
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);
        setError("Failed to access camera or microphone. Please check permissions.");
        // Only end the call if it's not already started
        if (!callStarted) {
          handleEndCall();
        }
      });

    // Cleanup on unmount
    return () => {
      console.log("VideoCall unmounted. Closing peer connection and removing listeners.");
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
      socket.off("ice_candidate");
      socket.off("offer");
      socket.off("answer");
      socket.off("call_ended");
    };
  }, [remoteUserId, isCaller, socket, localUserId, callId]);

  const handleEndCall = () => {
    if (!callId) {
      console.warn("handleEndCall called with no callId, ignoring");
      return;
    }
    console.log("handleEndCall triggered. Emitting 'call_ended' event.", {
      fromUserId: localUserId,
      toUserId: remoteUserId,
      callId,
    });
    socket.emit("call_ended", { fromUserId: localUserId, toUserId: remoteUserId, callId });
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

  useEffect(() => {
    socket.on("call_ended", ({ fromUserId, callId: receivedCallId }) => {
      console.log("Received 'call_ended' event from:", fromUserId, "CallId:", receivedCallId, "Expected CallId:", callId);
      if (fromUserId === remoteUserId && receivedCallId === callId) {
        console.log("Valid call_ended event. Ending call.");
        handleEndCall();
      } else {
        console.warn("Ignoring call_ended from unexpected user or call:", { fromUserId, receivedCallId, expectedCallId: callId });
      }
    });

    return () => {
      socket.off("call_ended");
    };
  }, [socket, remoteUserId, callId]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center text-white">
      <h2 className="mb-4 text-lg font-bold">Video Call With {remoteUserId}</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="flex gap-4">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-1/2 border" />
        <video ref={localVideoRef} autoPlay muted playsInline className="w-1/2 border" />
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