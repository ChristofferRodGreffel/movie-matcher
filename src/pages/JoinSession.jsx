import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../api/supabase";
import LoadingSpinner from "../components/LoadingSpinner";

const JoinSession = () => {
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleJoinSession = async (e) => {
    e.preventDefault();

    if (!joinCode.trim()) {
      setError("Please enter a join code");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Find session by join code
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .select("*")
        .eq("join_code", joinCode.toUpperCase())
        .single();

      if (sessionError || !session) {
        setError("Session not found. Please check your join code.");
        return;
      }

      // Check if session is still joinable
      if (session.status === "completed") {
        setError("This session has already ended.");
        return;
      }

      // Navigate to lobby
      navigate(`/lobby/${session.id}`);
    } catch (err) {
      console.error("Error joining session:", err);
      setError("Failed to join session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Join Session</h1>
          <p className="text-gray-600">Enter the 6-character join code</p>
        </div>

        <form onSubmit={handleJoinSession} className="space-y-6">
          <div>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none uppercase"
              disabled={loading}
            />
          </div>

          {error && <div className="text-red-500 text-center text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading || !joinCode.trim()}
            className={`
              w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2
              ${
                loading || !joinCode.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
              }
            `}
          >
            {loading && <LoadingSpinner />}
            {loading ? "Joining..." : "Join Session"}
          </button>
        </form>

        <div className="text-center mt-6">
          <button onClick={() => navigate("/")} className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinSession;
