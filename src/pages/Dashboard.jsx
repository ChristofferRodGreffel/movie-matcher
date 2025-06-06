import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../api/supabase";
import LoadingSpinner from "../components/LoadingSpinner";

const Dashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserSessions();
  }, []);

  const loadUserSessions = async () => {
    try {
      const userId = localStorage.getItem("user_id");

      if (!userId) {
        navigate("/");
        return;
      }

      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error("Error loading sessions:", err);
      setError("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const copyJoinCode = async (joinCode) => {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopiedCode(joinCode);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const deleteSession = async (sessionId) => {
    if (!confirm("Are you sure you want to delete this session?")) return;

    try {
      const { error } = await supabase.from("sessions").delete().eq("id", sessionId);

      if (error) throw error;

      // Remove from local state
      setSessions(sessions.filter((session) => session.id !== sessionId));

      // Clear local storage for this session
      localStorage.removeItem(`host_${sessionId}`);
    } catch (err) {
      console.error("Error deleting session:", err);
      alert("Failed to delete session");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "waiting":
        return "bg-yellow-100 text-yellow-800";
      case "configuring":
        return "bg-blue-100 text-blue-800";
      case "matching":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Sessions</h1>
        <Link to="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Create New Session
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">No sessions found</div>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Session
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
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
                  to={`/lobby/${session.id}`}
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
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
