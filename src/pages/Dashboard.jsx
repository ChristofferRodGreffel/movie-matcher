import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../api/supabase";
import LoadingSpinner from "../components/LoadingSpinner";
import useUserStore from "../stores/userStore";
import ProfileAvatar from "../components/ProfileAvatar";

const Dashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const navigate = useNavigate();

  const { getUserId, user, userId, username } = useUserStore();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const userId = await getUserId();

      if (!userId) {
        navigate("/");
        return;
      }

      // Load sessions only
      await loadUserSessions(userId);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const loadUserSessions = async (userId) => {
    try {
      // Get all sessions where user is a participant
      const { data: participantSessions, error: participantError } = await supabase
        .from("session_users")
        .select(
          `
          sessions (*)
        `
        )
        .eq("user_id", userId);

      // Get all sessions where user is the owner
      const { data: ownedSessions, error: ownedError } = await supabase
        .from("sessions")
        .select("*")
        .eq("owner_id", userId);

      if (participantError || ownedError) {
        throw new Error("Failed to load sessions");
      }

      // Combine both arrays and remove duplicates
      const allSessions = [...(ownedSessions || []), ...(participantSessions?.map((ps) => ps.sessions) || [])];

      const uniqueSessions = allSessions.filter(
        (session, index, self) => session && index === self.findIndex((s) => s?.id === session.id)
      );

      // Sort by created_at
      uniqueSessions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setSessions(uniqueSessions);
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
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-theme-secondary min-h-screen">
      {/* User Profile Section */}
      <div className="bg-theme-primary rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center space-x-4">
          <ProfileAvatar id={userId} size="16" />
          <div>
            <h1 className="text-2xl font-bold text-theme-primary">Welcome back, {username || "User"}!</h1>
            <p className="text-theme-secondary">Manage your movie matching sessions</p>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-theme-primary rounded-lg shadow-sm p-6">
          <div className="text-2xl font-bold text-blue-600">{sessions.length}</div>
          <div className="text-sm text-theme-secondary">Total Sessions</div>
        </div>
        <div className="bg-theme-primary rounded-lg shadow-sm p-6">
          <div className="text-2xl font-bold text-green-600">
            {sessions.filter((s) => s.status === "completed").length}
          </div>
          <div className="text-sm text-theme-secondary">Completed Sessions</div>
        </div>
        <div className="bg-theme-primary rounded-lg shadow-sm p-6">
          <div className="text-2xl font-bold text-purple-600">
            {sessions.filter((s) => s.status === "matching").length}
          </div>
          <div className="text-sm text-theme-secondary">Active Sessions</div>
        </div>
      </div>

      {/* Sessions Section */}
      <div className="bg-theme-primary rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-theme-primary">Your Sessions</h2>
          <div className="flex gap-3">
            <Link
              to="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Create Session
            </Link>
            <Link
              to="/join"
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Join Session
            </Link>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No sessions found</div>
            <p className="text-gray-400 mb-6">Get started by creating your first session or joining an existing one.</p>
            <div className="flex justify-center gap-4">
              <Link
                to="/"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Session
              </Link>
              <Link
                to="/join"
                className="inline-block px-6 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Join an Existing Session
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
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
    </div>
  );
};

export default Dashboard;
