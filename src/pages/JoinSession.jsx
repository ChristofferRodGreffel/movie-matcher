import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import supabase from "../api/supabase";
import LoadingSpinner from "../components/LoadingSpinner";
import QRScanner from "../components/QRScanner";
import { FaLongArrowAltLeft } from "react-icons/fa";
import useUserStore from "../stores/userStore";

const JoinSession = () => {
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { getUserId } = useUserStore();

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

      const userId = await getUserId();

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

  const handleQRCodeDetected = (qrData) => {
    const joinCodeMatch = qrData.match(/code=([A-Z0-9]{6})/);
    if (joinCodeMatch) {
      setJoinCode(joinCodeMatch[1]);
      handleJoinSession(joinCodeMatch[1]);
    } else {
      setError("QR code found but no valid join code detected. Please try again or enter the code manually.");
    }
  };

  const handleQRError = (errorMessage) => {
    setError(errorMessage);
  };

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] p-6">
      <div className="bg-theme-secondary rounded-lg shadow-lg p-8 w-full max-w-md border border-theme-primary">
        <h1 className="text-2xl font-bold text-theme-primary mb-6 text-center">Join Session</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="joinCode" className="block text-sm font-medium text-theme-primary mb-2">
              Enter Join Code
            </label>
            <div className="relative">
              <input
                type="text"
                id="joinCode"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                className="w-full px-4 py-3 border border-theme-primary rounded-lg text-center font-mono font-bold text-lg tracking-wider pr-12 bg-theme-secondary text-theme-primary"
                maxLength={6}
                disabled={joining}
                autoFocus
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 md:hidden">
                <QRScanner onCodeDetected={handleQRCodeDetected} onError={handleQRError} disabled={joining} />
              </div>
            </div>
            <p className="text-xs text-theme-secondary mt-1">
              Tap the camera icon to scan a QR code with your device's camera
            </p>
          </div>

          <button
            type="submit"
            disabled={joining || !joinCode.trim()}
            className={`
              cursor-pointer w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2
              ${joining || !joinCode.trim() ? "bg-gray-400 cursor-not-allowed" : "bg-theme-accent hover:shadow-lg"}
            `}
          >
            {joining && <LoadingSpinner />}
            {joining ? "Joining..." : "Join Session"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinSession;
