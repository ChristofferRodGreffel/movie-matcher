import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import supabase from "../api/supabase";
import LoadingSpinner from "../components/LoadingSpinner";
import useUserStore from "../stores/userStore";

const generateJoinCode = () => {
  const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const Home = () => {
  const [creatingSession, setCreatingSession] = useState(false);
  const [userSessions, setUserSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { initializeUser, getUserId, userId } = useUserStore();

  useEffect(() => {
    initializeUserAndSessions();
  }, []);

  const initializeUserAndSessions = async () => {
    try {
      const userId = await initializeUser();

      // Check if userId is valid before making queries
      if (!userId) {
        console.warn("No user ID available, skipping session loading");
        setUserSessions([]);
        return;
      }

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
        console.error("Error loading sessions:", participantError || ownedError);
      } else {
        // Combine both arrays and remove duplicates
        const allSessions = [...(ownedSessions || []), ...(participantSessions?.map((ps) => ps.sessions) || [])];

        const uniqueSessions = allSessions.filter(
          (session, index, self) => session && index === self.findIndex((s) => s?.id === session.id)
        );

        setUserSessions(uniqueSessions);
      }
    } catch (error) {
      console.error("Error initializing user:", error);
      setUserSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!userId) {
      console.error("Cannot create session: No user ID");
      setError("User not properly initialized. Please refresh the page.");
      return;
    }

    try {
      setCreatingSession(true);

      const sessionId = uuidv4();
      const userId = await getUserId();

      // Generate unique join code
      let joinCode;
      let isUnique = false;

      while (!isUnique) {
        joinCode = generateJoinCode();
        const { data, error } = await supabase.from("sessions").select("id").eq("join_code", joinCode).maybeSingle();

        if (error) {
          console.error("Error checking join code:", error);
          break;
        }

        if (!data) isUnique = true;
      }

      // Create session with join code
      const { error } = await supabase.from("sessions").insert({
        id: sessionId,
        owner_id: userId,
        status: "waiting",
        genre_ids: [],
        platform_ids: [],
        join_code: joinCode,
      });

      if (error) throw error;

      localStorage.setItem(`host_${sessionId}`, "true");
      navigate(`/lobby/${sessionId}`);
    } catch (error) {
      console.error("Failed to create session:", error);
      alert("Failed to create session. Please try again.");
    } finally {
      setCreatingSession(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-primary flex items-center justify-center pt-16">
        <div className="bg-theme-surface backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-theme-primary">
          <LoadingSpinner />
          <p className="text-theme-secondary mt-4 text-center">Loading your sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-primary relative">
      <div className="relative flex flex-col items-center justify-center min-h-screen p-6 pt-24">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-theme-primary">Movie Matcher</h1>
            </div>
            <p className="text-theme-secondary text-lg">Find movies everyone wants to watch</p>
          </div>

          {/* Main Actions */}
          <div className="space-y-4">
            <button
              onClick={handleCreateSession}
              disabled={creatingSession}
              className={`
                w-full p-4 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg border cursor-pointer
                ${
                  creatingSession
                    ? "bg-[rgb(var(--color-text-tertiary))] border-[rgb(var(--color-text-tertiary))] opacity-60 cursor-not-allowed text-white"
                    : "bg-[rgb(var(--color-bg-accent))] hover:bg-[rgb(var(--color-bg-accent-hover))] border-[rgb(var(--color-bg-accent))] hover:border-[rgb(var(--color-bg-accent-hover))] text-[rgb(var(--color-text-accent))]"
                }
              `}
            >
              {creatingSession ? (
                <>
                  <LoadingSpinner />
                  <span>Creating Session...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Create New Session</span>
                </>
              )}
            </button>

            <Link
              to="/join"
              className="w-full p-4 rounded-2xl font-semibold bg-theme-surface border border-theme-primary text-theme-primary hover:bg-[rgb(var(--color-surface-hover))] transition-all duration-300 flex items-center justify-center gap-3 shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              <span>Join Session</span>
            </Link>

            {/* My Sessions - Show only if user has sessions */}
            {userSessions.length > 0 && (
              <Link
                to="/dashboard"
                className="w-full p-4 rounded-2xl font-semibold bg-theme-surface border border-theme-primary text-theme-secondary hover:bg-[rgb(var(--color-surface-hover))] transition-all duration-300 flex items-center justify-center gap-3 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <span>My Sessions</span>
                <span className="ml-auto bg-[rgb(var(--color-bg-tertiary))] text-theme-secondary px-2 py-1 rounded-full text-sm font-medium">
                  {userSessions.length}
                </span>
              </Link>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-[rgb(var(--color-text-tertiary))] text-sm">
              Create or join a session to start matching movies with friends
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
