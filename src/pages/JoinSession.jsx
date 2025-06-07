import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import supabase from "../api/supabase";
import LoadingSpinner from "../components/LoadingSpinner";
import { BsArrowLeft } from "react-icons/bs";

const ensureUserIdExists = async () => {
  let userId = localStorage.getItem("user_id");
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem("user_id", userId);

    try {
      await supabase.from("users").insert({
        id: userId,
      });
    } catch (error) {
      console.error("Failed to create user:", error);
    }
  }
};

const JoinSession = () => {
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's a join code in the URL (from QR code)
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setJoinCode(codeFromUrl.toUpperCase());
      // Automatically attempt to join
      handleJoinSession(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const handleJoinSession = async (code = joinCode) => {
    if (!code.trim()) {
      setError("Please enter a join code");
      return;
    }

    try {
      setJoining(true);
      setError("");

      // Ensure user exists
      await ensureUserIdExists();
      const userId = localStorage.getItem("user_id");

      // Find session by join code
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .select("id, status, owner_id")
        .eq("join_code", code.trim().toUpperCase())
        .single();

      if (sessionError || !session) {
        setError("Session not found. Please check your join code.");
        return;
      }

      if (session.status !== "waiting") {
        setError("This session is no longer accepting new participants.");
        return;
      }

      // Check if user is already in the session
      const { data: existingParticipant } = await supabase
        .from("session_users")
        .select("id")
        .eq("session_id", session.id)
        .eq("user_id", userId)
        .maybeSingle();

      // Add user to session if not already joined
      if (!existingParticipant) {
        const { error: joinError } = await supabase.from("session_users").insert({
          id: uuidv4(),
          session_id: session.id,
          user_id: userId,
        });

        if (joinError && joinError.code !== "23505") {
          // Ignore duplicate key errors
          console.error("Error joining session:", joinError);
          setError("Failed to join session. Please try again.");
          return;
        }
      }

      // Navigate to lobby
      navigate(`/lobby/${session.id}`);
    } catch (error) {
      console.error("Failed to join session:", error);
      setError("Failed to join session. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleJoinSession();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Join Matching Session</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="joinCode" className="block text-sm font-medium text-gray-700 mb-2">
              Enter Join Code
            </label>
            <input
              type="text"
              id="joinCode"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-mono text-lg tracking-wider"
              maxLength={6}
              disabled={joining}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={joining || !joinCode.trim()}
            className={`
              w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2
              ${
                joining || !joinCode.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
              }
            `}
          >
            {joining && <LoadingSpinner />}
            {joining ? "Joining..." : "Join Session"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="flex justify-center gap-2 cursor-pointer p-3 bg-gray-100 rounded-md text-gray-600 hover:text-blue-700 font-medium"
          >
            <BsArrowLeft className="text-2xl" /> Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinSession;
