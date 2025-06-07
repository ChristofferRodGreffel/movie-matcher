import React from "react";
import { Link } from "react-router-dom";

const SessionCard = ({ session, formatDate, getStatusColor, copiedCode, copyJoinCode, deleteSession }) => {
  const sessionLink = {
    waiting: `/lobby/${session.id}`,
    configuring: `/configure/${session.id}`,
    matching: `/session/${session.id}`,
  };
  return (
    <div
      key={session.id}
      className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800 mb-1">Session {session.id.slice(0, 8)}...</h3>
          <p className="text-sm text-gray-500">Created {formatDate(session.created_at)}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(session.status)}`}>
          {session.status}
        </span>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        <div
          onClick={() => copyJoinCode(session.join_code)}
          className="relative mb-3 p-3 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors group"
        >
          <div className="font-mono font-bold text-lg text-blue-600 text-center tracking-wider">
            {session.join_code}
          </div>
          <div className="text-xs text-blue-500 text-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {copiedCode === session.join_code ? "Copied!" : "Click to copy"}
          </div>
        </div>
        <div>Platforms: {session.platform_ids?.length || 0}</div>
        <div>Genres: {session.genre_ids?.length || 0}</div>
      </div>

      <div className="flex gap-2">
        <Link
          to={`${sessionLink[session.status]}`}
          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors text-center"
        >
          Open
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
