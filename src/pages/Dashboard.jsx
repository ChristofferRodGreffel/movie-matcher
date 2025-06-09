import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../api/supabase";
import LoadingSpinner from "../components/LoadingSpinner";
import useUserStore from "../stores/userStore";
import ProfileAvatar from "../components/ProfileAvatar";
import SessionCard from "../components/Dashboard/SessionCard";

const Dashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const navigate = useNavigate();

  const { getUserId, userId, username, clearUser } = useUserStore();

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

  const deleteUserAccount = async () => {
    const confirmMessage =
      "Are you sure you want to permanently delete your account? This action cannot be undone and will remove all your data including:\n\n• All your sessions\n• Your user profile\n• All session participations\n\nType 'DELETE' to confirm:";

    const confirmation = prompt(confirmMessage);
    if (confirmation !== "DELETE") return;

    try {
      setLoading(true);

      if (!userId) {
        throw new Error("User not found");
      }

      // Step 1: Delete all sessions owned by this user
      const { error: sessionsError } = await supabase.from("sessions").delete().eq("owner_id", userId);

      if (sessionsError) {
        console.error("Error deleting user sessions:", sessionsError);
        throw new Error("Failed to delete user sessions");
      }

      // Step 2: Remove user from any session_users relationships
      const { error: sessionUsersError } = await supabase.from("session_users").delete().eq("user_id", userId);

      if (sessionUsersError) {
        console.error("Error removing user from sessions:", sessionUsersError);
        throw new Error("Failed to remove user from sessions");
      }

      // Step 3: Delete any responses by this user
      const { error: responsesError } = await supabase.from("responses").delete().eq("user_id", userId);

      if (responsesError) {
        console.error("Error deleting user responses:", responsesError);
        throw new Error("Failed to delete user responses");
      }

      // Step 4: Finally delete the user profile
      const { error: userError } = await supabase.from("users").delete().eq("id", userId);

      if (userError) {
        console.error("Error deleting user:", userError);
        throw new Error("Failed to delete user account");
      }

      // Clear all localStorage data
      localStorage.clear();

      // Clear user store
      clearUser();

      alert("Your account has been successfully deleted.");
      navigate("/");
    } catch (err) {
      console.error("Error deleting account:", err);
      alert(`Failed to delete account: ${err.message}. Please try again or contact support.`);
    } finally {
      setLoading(false);
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

  // Add this helper function after formatDate
  const getSessionAge = (dateString) => {
    const sessionDate = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - sessionDate) / (1000 * 60 * 60));

    if (diffHours >= 1) {
      return { age: `${diffHours}h old`, isExpiring: true };
    } else {
      const diffMinutes = Math.floor((now - sessionDate) / (1000 * 60));
      return { age: `${diffMinutes}m old`, isExpiring: false };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-80px)] bg-theme-secondary">
        <LoadingSpinner size="w-10 h-10" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto bg-theme-secondary min-h-screen">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen">
      {/* User Profile Section */}
      <div className="bg-theme-secondary rounded-lg shadow-sm p-6 mb-8 border border-theme-primary">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <ProfileAvatar id={userId} size="16" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-theme-primary">Welcome back, {username || "User"}!</h1>
              <p className="text-theme-secondary">Manage your movie matching sessions</p>
            </div>
          </div>
          <button
            onClick={deleteUserAccount}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            disabled={loading}
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Sessions Section */}
      <div className="bg-theme-secondary rounded-lg shadow-sm p-6 border border-theme-primary mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-theme-primary">Your Sessions</h2>
          <div className="hidden md:flex gap-3">
            <Link
              to="/"
              className="px-4 py-2 bg-theme-accent text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Create Session
            </Link>
            <Link
              to="/join"
              className="px-4 py-2 bg-theme-surface text-theme-secondary rounded-lg hover:bg-theme-surface/70 transition-colors text-sm border border-theme-primary"
            >
              Join Session
            </Link>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-theme-secondary text-lg mb-4">No sessions found</div>
            <p className="text-theme-secondary mb-6">
              Get started by creating your first session or joining an existing one.
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <Link to="/" className="inline-block px-6 py-3 bg-theme-accent text-white rounded-lg transition-colors">
                Create Your First Session
              </Link>
              <Link
                to="/join"
                className="inline-block px-6 py-3 bg-theme-surface text-theme-secondary rounded-lg  transition-colors border border-theme-primary"
              >
                Join an Existing Session
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => {
              const sessionAge = getSessionAge(session.created_at);

              return (
                <SessionCard
                  key={session.id}
                  session={session}
                  formatDate={formatDate}
                  getStatusColor={getStatusColor}
                  copiedCode={copiedCode}
                  copyJoinCode={copyJoinCode}
                  deleteSession={deleteSession}
                  sessionAge={sessionAge}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-theme-secondary rounded-lg shadow-sm p-6 border border-theme-primary">
          <div className="text-2xl font-bold text-blue-600">{sessions.length}</div>
          <div className="text-sm text-theme-secondary">Total Sessions</div>
        </div>
        <div className="bg-theme-secondary rounded-lg shadow-sm p-6 border border-theme-primary">
          <div className="text-2xl font-bold text-green-600">
            {sessions.filter((s) => s.status === "completed").length}
          </div>
          <div className="text-sm text-theme-secondary">Completed Sessions</div>
        </div>
        <div className="bg-theme-secondary rounded-lg shadow-sm p-6 border border-theme-primary">
          <div className="text-2xl font-bold text-purple-600">
            {sessions.filter((s) => s.status === "matching").length}
          </div>
          <div className="text-sm text-theme-secondary">Active Sessions</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
