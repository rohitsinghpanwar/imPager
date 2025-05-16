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

    console.log("VideoCall mounted. LocalUserId:", localUserId, "RemoteUserId:", remoteUserId, "IsCaller:", isCaller);

    // Create a new peer connection
    peerConnection.current = new RTCPeerConnection(servers);
    console.log("Peer connection created");

    // Get media stream and set up local and remote video
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        console.log("Local media stream obtained:", stream);

        // Set the local video stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          console.log("Local stream set to localVideoRef");
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
            remoteVideoRef.current.srcObject = event.streams[0];
            console.log("Remote stream set to remoteVideoRef:", event.streams[0].getTracks());
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
            });
            console.log("Local ICE candidate sent to:", remoteUserId);
          }
        };

        // Handle ICE connection state changes
        peerConnection.current.oniceconnectionstatechange = () => {
          console.log("ICE connection state:", peerConnection.current.iceConnectionState);
          if (peerConnection.current.iceConnectionState === "failed") {
            console.error("ICE connection failed");
            handleEndCall();
          }
        };

        // Listen for ICE candidates from remote user
        socket.on("ice_candidate", ({ candidate, from }) => {
          console.log("Received remote ICE candidate from:", from, "Candidate:", candidate);
          if (candidate && from === remoteUserId) {
            peerConnection.current
              .addIceCandidate(new RTCIceCandidate(candidate))
              .then(() => console.log("Remote ICE candidate added successfully"))
              .catch((error) => console.error("Error adding remote ICE candidate:", error));
          } else {
            console.warn("Ignoring ICE candidate from unexpected user:", from);
          }
        });

        // Listen for incoming offer
        socket.on("offer", async ({ offer, from }) => {
          console.log("Received offer from:", from, "Offer:", offer);
          if (from === remoteUserId) {
            try {
              await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
              console.log("Remote description set from offer");
              const answer = await peerConnection.current.createAnswer();
              await peerConnection.current.setLocalDescription(answer);
              console.log("Local description set with answer:", answer);
              socket.emit("answer", { to: remoteUserId, answer });
              console.log("Answer sent to:", remoteUserId);
              setCallStarted(true);
            } catch (error) {
              console.error("Error handling offer:", error);
            }
          } else {
            console.warn("Ignoring offer from unexpected user:", from);
          }
        });

        // Listen for answer from remote user
        socket.on("answer", async ({ answer, from }) => {
          console.log("Received answer from:", from, "Answer:", answer);
          if (from === remoteUserId) {
            try {
              await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
              console.log("Remote description set from answer");
              setCallStarted(true);
            } catch (error) {
              console.error("Error handling answer:", error);
            }
          } else {
            console.warn("Ignoring answer from unexpected user:", from);
          }
        });

        // If the user is the caller, initiate the call
        if (isCaller) {
          const startCall = async () => {
            console.log("Initiating call as caller");
            try {
              const offer = await peerConnection.current.createOffer();
              await peerConnection.current.setLocalDescription(offer);
              console.log("Local description set with offer:", offer);
              socket.emit("offer", { to: remoteUserId, offer });
              console.log("Offer sent to:", remoteUserId);
            } catch (error) {
              console.error("Error creating or sending offer:", error);
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
  }, [remoteUserId, isCaller, socket]);

  const handleEndCall = () => {
    console.log("Ending call. Emitting 'call_ended' event.");
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

  useEffect(() => {
    socket.on("call_ended", ({ fromUserId }) => {
      console.log("Received 'call_ended' event from:", fromUserId);
      if (fromUserId === remoteUserId) {
        handleEndCall();
      }
    });

    return () => {
      socket.off("call_ended");
    };
  }, [socket, remoteUserId]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center text-white">
      <h2 className="mb-4 text-lg font-bold">Video Call With {remoteUserId}</h2>
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