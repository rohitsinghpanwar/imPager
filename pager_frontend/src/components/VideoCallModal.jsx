import React from "react";
function VideoCallModal({ caller, onAccept, onReject }) {
  return (
    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
      <h2 className="text-white text-xl mb-4">{caller} is calling...</h2>
      <div className="flex gap-4">
        <button onClick={onAccept} className="bg-green-500 px-4 py-2 rounded">Accept</button>
        <button onClick={onReject} className="bg-red-500 px-4 py-2 rounded">Reject</button>
      </div>
    </div>
  );
}

export default VideoCallModal;
