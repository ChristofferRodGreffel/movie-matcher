import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import supabase from "../api/supabase";
import LoadingSpinner from "../components/LoadingSpinner";
import ParticipantsList from "../components/Lobby/ParticipantList";
import LobbyActions from "../components/Lobby/LobbyAction";
import QRCode from "react-qr-code";

const Lobby = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  useEffect(() => {
    initializeLobby();

    // Subscribe to real-time updates for session changes
    const sessionSubscription = supabase
      .channel(`session_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new) {
            setSession(payload.new);
            // If session status changed to configuring, redirect
            if (payload.new.status === "configuring") {
              navigate(`/configure/${sessionId}`);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to real-time updates for participants
    const participantsSubscription = supabase
      .channel(`participants_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_users",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          loadParticipants();
        }
      )
      .subscribe();

    return () => {
      sessionSubscription.unsubscribe();
      participantsSubscription.unsubscribe();
    };
  }, [sessionId]);

  const initializeLobby = async () => {
    try {
      await loadSession();
      await joinSessionIfNeeded();
      await loadParticipants();
      checkIfHost();
    } catch (err) {
      console.error("Error initializing lobby:", err);
      setError("Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async () => {
    const { data, error } = await supabase.from("sessions").select("*").eq("id", sessionId).single();

    if (error || !data) {
      throw new Error("Session not found");
    }

    setSession(data);
  };

  const joinSessionIfNeeded = async () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      navigate("/");
      return;
    }

    try {
      // Check if user is already in the session
      const { data: existingParticipant, error: checkError } = await supabase
        .from("session_users")
        .select("id")
        .eq("session_id", sessionId)
        .eq("user_id", userId)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when no record found

      if (checkError) {
        console.error("Error checking participant:", checkError);
        return;
      }

      if (!existingParticipant) {
        setJoining(true);
        // Add user to session
        const { error: insertError } = await supabase.from("session_users").insert({
          id: uuidv4(),
          session_id: sessionId,
          user_id: userId,
        });

        if (insertError) {
          // Only log if it's not a duplicate key error (which means user already joined)
          if (insertError.code !== "23505") {
            console.error("Error joining session:", insertError);
          }
        }
        setJoining(false);
      }
    } catch (err) {
      console.error("Unexpected error in joinSessionIfNeeded:", err);
      setJoining(false);
    }
  };

  const loadParticipants = async () => {
    const { data, error } = await supabase
      .from("session_users")
      .select(
        `
        id,
        user_id,
        joined_at,
        users (id)
      `
      )
      .eq("session_id", sessionId)
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Error loading participants:", error);
      return;
    }

    setParticipants(data || []);
  };

  const checkIfHost = () => {
    const hostStatus = localStorage.getItem(`host_${sessionId}`);
    setIsHost(hostStatus === "true");
  };

  const copyJoinCode = async () => {
    try {
      await navigator.clipboard.writeText(session.join_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const startSession = async () => {
    if (!isHost) return;

    try {
      const { error } = await supabase.from("sessions").update({ status: "configuring" }).eq("id", sessionId);

      if (error) throw error;

      navigate(`/configure/${sessionId}`);
    } catch (err) {
      console.error("Error starting session:", err);
      alert("Failed to start session");
    }
  };

  const leaveSession = async () => {
    const userId = localStorage.getItem("user_id");

    if (isHost) {
      if (confirm("Are you sure you want to end this session for everyone?")) {
        // Delete the entire session (CASCADE will handle session_users)
        const { error } = await supabase.from("sessions").delete().eq("id", sessionId);

        if (error) {
          console.error("Error deleting session:", error);
          alert("Failed to delete session");
          return;
        }

        localStorage.removeItem(`host_${sessionId}`);
        navigate("/dashboard");
      }
    } else {
      // Remove user from session
      const { error } = await supabase.from("session_users").delete().eq("session_id", sessionId).eq("user_id", userId);

      if (error) {
        console.error("Error leaving session:", error);
        alert("Failed to leave session");
        return;
      }

      navigate("/");
    }
  };

  const getParticipantName = (participant, index) => {
    if (participant.user_id === session?.owner_id) {
      return "Host";
    }
    return `User ${index + 1}`;
  };

  const showQRCode = () => {
    setShowQrCode(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
        {joining && <span className="ml-2">Joining session...</span>}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <button onClick={() => navigate("/")} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isHost ? "Your Movie Session" : "Movie Session Lobby"}
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div
              onClick={copyJoinCode}
              className="px-4 py-2 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
            >
              <span className="font-mono font-bold text-xl text-blue-600 tracking-wider">{session?.join_code}</span>
              <div className="text-xs text-blue-500 mt-1">{copiedCode ? "Copied!" : "Click to copy"}</div>
            </div>

            <button
              onClick={showQRCode}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Show QR
            </button>
          </div>
        </div>

        {/* Host Message */}
        {isHost && (
          <div className="mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-blue-800 mb-2">You're the Host!</h2>
              <p className="text-blue-600 mb-4">
                Share the join code <strong>{session?.join_code}</strong> with others to let them join your session.
              </p>
              <p className="text-sm text-blue-500">Once everyone has joined, you can start configuring the session.</p>
            </div>
          </div>
        )}

        <ParticipantsList participants={participants} session={session} />

        <LobbyActions
          isHost={isHost}
          participantCount={participants.length}
          onLeaveSession={leaveSession}
          onStartSession={startSession}
        />
      </div>
      {showQrCode && session?.join_code && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div classame="bg-white rounded-lg p-6 max-w-sm w-full text-center">
            <h3 className="text-lg font-bold mb-4">Scan to Join Session</h3>
            <div className="p-4 bg-white border border-gray-200 rounded-lg mb-4">
              <QRCode
                value={`http://192.168.86.55:5173/join?code=${session.join_code}`}
                size={180}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox="0 0 256 256"
              />
            </div>
            <button
              onClick={() => setShowQrCode(false)}
              className="w-full py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lobby;
