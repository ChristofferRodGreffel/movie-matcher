import React from "react";

const LobbyActions = ({ isHost, participantCount, onLeaveSession, onStartSession }) => {
  return (
    <>
      <div className="flex justify-between items-center">
        <button
          onClick={onLeaveSession}
          className="px-4 py-2 text-red-800 bg-red-100 rounded-md cursor-pointer hover:text-red-700 font-medium"
        >
          {isHost ? "End Session" : "Leave Session"}
        </button>

        {isHost && (
          <button
            onClick={onStartSession}
            disabled={participantCount < 1}
            className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
              participantCount < 1
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Start Configuring
          </button>
        )}
      </div>

      {!isHost && (
        <div className="mt-6 text-center">
          <div className="text-gray-500">Waiting for the host to start the session...</div>
        </div>
      )}
    </>
  );
};

export default LobbyActions;
