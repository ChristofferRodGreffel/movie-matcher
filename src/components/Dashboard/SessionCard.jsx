import React from "react";
import { Link } from "react-router-dom";

const SessionCard = ({ session, formatDate, getStatusColor, copiedCode, copyJoinCode, deleteSession, sessionAge }) => {
  const sessionLink = {
    waiting: `/lobby/${session.id}`,
    configuring: `/configure/${session.id}`,
    matching: `/session/${session.id}`,
  };

  return (
    <div
      key={session.id}
      className="bg-theme-secondary text-theme-primary border border-theme-primary rounded-lg p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold mb-1">Session {session.id.slice(0, 8)}...</h3>
          <p className="text-sm">Created {formatDate(session.created_at)}</p>
          {/* Add session age display */}
          <p className={`text-xs mt-1 ${sessionAge.isExpiring ? "text-red-600 font-medium" : "text-theme-secondary"}`}>
            {sessionAge.age}
            {sessionAge.isExpiring && " • Expiring soon!"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(session.status)}`}>
            {session.status}
          </span>
          {/* Add expiring badge */}
          {sessionAge.isExpiring && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">Expiring</span>
          )}
        </div>
      </div>

      <div className="mb-4 text-sm">
        <div
          onClick={() => copyJoinCode(session.join_code)}
          className="relative mb-3 p-3 border-2 border-dashed border-theme-primary rounded-lg cursor-pointer transition-colors group"
        >
          <div className="font-mono font-bold text-lg text-theme-primary text-center tracking-wider">
            {session.join_code}
          </div>
          <div className="text-xs text-theme-primary text-center mt-1 transition-opacity">
            {copiedCode === session.join_code ? "Copied!" : "Click to copy"}
          </div>
        </div>
        <div>Platforms: {session.platform_ids?.length || 0}</div>
        <div>Genres: {session.genre_ids?.length || 0}</div>
      </div>

      <div className="flex gap-2">
        <Link
          to={`${sessionLink[session.status]}`}
          className="flex-1 px-3 py-2 bg-theme-accent text-white text-sm rounded hover:bg-theme-accent-hover transition-colors text-center"
        >
          Join
        </Link>
        <button
          onClick={() => deleteSession(session.id)}
          className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default SessionCard;
