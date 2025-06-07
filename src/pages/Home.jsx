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

  const { initializeUser, getUserId } = useUserStore();

  useEffect(() => {
    initializeUserAndSessions();
  }, []);

  const initializeUserAndSessions = async () => {
    try {
      const userId = await initializeUser();

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
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
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
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="text-center space-y-8">
        <h1 className="text-4xl font-bold text-theme-primary">Movie Matcher</h1>
        <p className="text-lg text-theme-secondary">Find movies everyone wants to watch</p>

        <div className="flex items-center justify-center flex-col gap-2">
          <button
            onClick={handleCreateSession}
            disabled={creatingSession}
            className={`
              w-64 py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer
              ${creatingSession ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"}
            `}
          >
            {creatingSession && <LoadingSpinner />}
            {creatingSession ? "Creating Session..." : "Create Session"}
          </button>

          <Link
            to="/join"
            className="block w-64 py-3 px-6 rounded-lg font-semibold text-blue-600 border-2 border-blue-600 hover:bg-blue-50 transition-all duration-200 text-center"
          >
            Join Session
          </Link>

          {/* Show sessions link only if user has sessions */}
          {userSessions.length > 0 && (
            <Link
              to="/dashboard"
              className="block w-64 py-3 px-6 rounded-lg font-semibold text-gray-600 border-2 border-gray-300 hover:bg-gray-50 transition-all duration-200 text-center"
            >
              My Sessions ({userSessions.length})
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
