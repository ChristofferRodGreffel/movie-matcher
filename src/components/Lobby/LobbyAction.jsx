import React from "react";

const LobbyActions = ({ isHost, participantCount, onLeaveSession, onStartSession }) => {
  console.log("participantCount:", participantCount);
  return (
    <>
      <div className="flex justify-between items-center">
        <button
          onClick={onLeaveSession}
          className="px-4 py-2 bg-red-200 border-red-700 border text-red-700 rounded-md cursor-pointer font-medium"
        >
          {isHost ? "End Session" : "Leave Session"}
        </button>

        {isHost && (
          <button
            onClick={onStartSession}
            disabled={participantCount < 2}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer bg-theme-accent text-white ${
              participantCount < 2 ? "!bg-gray-300 cursor-not-allowed" : "hover:bg-theme-accent-dark"
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
