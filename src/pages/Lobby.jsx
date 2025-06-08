import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import supabase from "../api/supabase";
import LoadingSpinner from "../components/LoadingSpinner";
import ParticipantsList from "../components/Lobby/ParticipantList";
import LobbyActions from "../components/Lobby/LobbyAction";
import QRCode from "react-qr-code";
import useUserStore from "../stores/userStore";

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

  const { getUserId, userId } = useUserStore();

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
    if (!userId) {
      console.log("No userId, redirecting to home");
      navigate("/");
      return;
    }

    try {
      setJoining(true);

      // Check if user is already in the session with better error handling
      const { data: existingParticipant, error: checkError } = await supabase
        .from("session_users")
        .select("id")
        .eq("session_id", sessionId)
        .eq("user_id", userId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking participant:", checkError);
        return;
      }

      if (existingParticipant) {
        console.log("User already in session, skipping insert");
        return;
      }

      // Use upsert instead of insert to handle conflicts gracefully
      const { error: insertError } = await supabase.from("session_users").upsert(
        {
          id: uuidv4(),
          session_id: sessionId,
          user_id: userId,
        },
        {
          onConflict: "session_id,user_id",
          ignoreDuplicates: true,
        }
      );

      if (insertError) {
        console.error("Error joining session:", insertError);
        if (!insertError.message.includes("duplicate") && insertError.code !== "23505") {
          setError("Failed to join session");
        }
      } else {
        console.log("Successfully joined session");
      }
    } catch (err) {
      console.error("Unexpected error in joinSessionIfNeeded:", err);
    } finally {
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
        users (id, username)
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
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(session.join_code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = session.join_code;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand("copy");
          setCopiedCode(true);
          setTimeout(() => setCopiedCode(false), 2000);
        } catch (err) {
          console.error("Fallback copy failed:", err);
          // Show the code in an alert as last resort
          alert(`Join code: ${session.join_code}`);
        }

        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
      // Show the code in an alert as last resort
      alert(`Join code: ${session.join_code}`);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-theme-secondary">
        <LoadingSpinner />
        {joining && <span className="ml-2 text-theme-primary">Joining session...</span>}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center bg-theme-secondary min-h-screen">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <button onClick={() => navigate("/")} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen">
      <div className="bg-theme-secondary rounded-lg shadow-lg p-8 border border-theme-primary">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-theme-primary mb-6">
            {isHost ? "Your Movie Session" : "Movie Session Lobby"}
          </h1>

          {/* Join Methods Section */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* QR Code Section */}
            <div className="bg-theme-primary rounded-lg p-6 border border-theme-primary">
              <h3 className="text-lg font-semibold text-theme-primary mb-4">Scan to Join</h3>
              {session?.join_code && (
                <div className="flex justify-center">
                  <div className="rounded-lg shadow-sm">
                    <QRCode
                      value={`http://192.168.86.55:5173/join?code=${session.join_code}`}
                      size={160}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      viewBox="0 0 256 256"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Join Code Section */}
            <div className="bg-theme-primary rounded-lg p-6 border border-theme-primary">
              <h3 className="text-lg font-semibold text-theme-primary mb-4">Use Join Code</h3>
              <div className="flex flex-col items-center gap-4">
                <div
                  onClick={copyJoinCode}
                  className="px-6 py-4 border-2 border-dashed border-theme-primary select-none rounded-lg cursor-pointer transition-colors w-full max-w-xs touch-manipulation"
                >
                  <div className="font-mono font-bold text-2xl text-theme-primary tracking-wider text-center">
                    {session?.join_code}
                  </div>
                  <div className="text-sm text-theme-primary mt-2 text-center">
                    {copiedCode ? "Copied!" : "Tap to copy"}
                  </div>
                </div>
                <p className="text-sm text-theme-secondary text-center">
                  Share this code with others or visit the join page
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Host Message */}
        {isHost && (
          <div className="mb-8">
            <div className="bg-theme-primary text-theme-primary border border-theme-primary rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">You're the Host!</h2>
              <p className=" mb-4">
                Share the QR code or join code <strong>{session?.join_code}</strong> with others to let them join your
                session.
              </p>
              <p className="text-sm">Once everyone has joined, you can start configuring the session.</p>
            </div>
          </div>
        )}

        <div className="flex flex-col">
          {/* Participants Section */}
          <div className="lg:col-span-2">
            <ParticipantsList participants={participants} session={session} userId={userId} />
          </div>

          {/* Actions Section */}
          <div className="lg:col-span-1">
            <LobbyActions
              isHost={isHost}
              participantCount={participants.length}
              onLeaveSession={leaveSession}
              onStartSession={startSession}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
