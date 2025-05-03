import React, { useRef, useEffect } from "react";
import socket from "./socket";

const VideoChat = ({ userId, remoteUserId, onCallEnd, isInitiator }) => {
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerConnection = useRef(null);
  const localStream = useRef(null);

  const setupPeerConnection = () => {
    peerConnection.current = new RTCPeerConnection();

    peerConnection.current.ontrack = (event) => {
      remoteVideo.current.srcObject = event.streams[0];
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice_candidate", {
          to: remoteUserId,
          candidate: event.candidate,
        });
      }
    };
  };

  const getMediaStream = async () => {
    if (!localStream.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStream.current = stream;
        if (localVideo.current) localVideo.current.srcObject = stream;
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    }
  };

  const startCall = async () => {
    await getMediaStream();
    setupPeerConnection();

    localStream.current.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, localStream.current);
    });

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit("offer", {
      from: userId,
      to: remoteUserId,
      offer,
    });
  };

  useEffect(() => {
    getMediaStream();

    if (isInitiator) {
      startCall();
    }

    socket.on("offer", async ({ offer, from }) => {
      await getMediaStream();
      setupPeerConnection();

      localStream.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream.current);
      });

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit("answer", { to: from, answer });
    });

    socket.on("answer", async ({ answer }) => {
      if (!peerConnection.current) {
        setupPeerConnection();
        localStream.current.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, localStream.current);
        });
      }

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    socket.on("ice_candidate", ({ candidate }) => {
      if (peerConnection.current) {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("call_ended", endCall);

    return () => {
      endCall();
      socket.off("offer");
      socket.off("answer");
      socket.off("ice_candidate");
      socket.off("call_ended");
    };
  }, []);

  const endCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }
    socket.emit("end_call", { to: remoteUserId });
    onCallEnd();
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <div className="flex gap-4">
        <video
          ref={localVideo}
          autoPlay
          muted
          playsInline
          className="w-1/2 rounded"
        />
        <video
          ref={remoteVideo}
          autoPlay
          playsInline
          className="w-1/2 rounded"
        />
      </div>
      <button
        onClick={endCall}
        className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
      >
        End Call
      </button>
    </div>
  );
};

export default VideoChat;