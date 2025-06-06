import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import supabase from "../api/supabase";
import LoadingSpinner from "../components/LoadingSpinner";

const generateJoinCode = () => {
  const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789"; // Exclude O, 0 for clarity
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

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      let userId = localStorage.getItem("user_id");

      if (!userId) {
        // Create new user
        userId = uuidv4();
        localStorage.setItem("user_id", userId);
        await supabase.from("users").insert({ id: userId });
      }

      // Load user's sessions (don't redirect automatically)
      const { data: sessions } = await supabase
        .from("sessions")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      setUserSessions(sessions || []);
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
      const userId = localStorage.getItem("user_id");

      // Generate unique join code
      let joinCode;
      let isUnique = false;

      while (!isUnique) {
        joinCode = generateJoinCode();
        const { data } = await supabase.from("sessions").select("id").eq("join_code", joinCode).single();

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

      // Mark user as host locally
      localStorage.setItem(`host_${sessionId}`, "true");

      // Navigate to lobby
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
        <h1 className="text-4xl font-bold text-gray-800">Movie Matcher</h1>
        <p className="text-lg text-gray-600">Find movies everyone wants to watch</p>

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
