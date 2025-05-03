import React from 'react'

function VideoButton({ onVideoCall }) {
  return (
    <button
      onClick={onVideoCall}
      className="bg-blue-500 text-white px-4 py-2 rounded"
    >
      Video Call
    </button>
  )
}

export default VideoButton;