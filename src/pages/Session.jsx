import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import MovieCard from "../components/Session/MovieCard";
import useUserStore from "../stores/userStore";
import { useSession } from "../hooks/useSession";
import supabase from "../api/supabase";
import LoadingSpinner from "../components/LoadingSpinner";
import { AiFillDislike, AiFillLike } from "react-icons/ai";

const Session = () => {
  const [isHost, setIsHost] = useState(false);
  const [matches, setMatches] = useState([]);
  const [showMatchNotification, setShowMatchNotification] = useState(false);
  const [newMatch, setNewMatch] = useState(null);
  const buttonVoteRef = useRef(null);

  const { sessionId } = useParams();
  const { userId } = useUserStore();

  const { loading, movies, currentMovieIndex, handleVote, currentMovie } = useSession(sessionId, userId, isHost);

  useEffect(() => {
    const hostStatus = localStorage.getItem(`host_${sessionId}`);
    setIsHost(hostStatus === "true");
  }, [sessionId]);

  // Fetch session matches
  const fetchMatches = async () => {
    try {
      const { data: session, error } = await supabase.from("sessions").select("matches").eq("id", sessionId).single();

      if (error) {
        console.error("Error fetching matches:", error);
        return;
      }

      const matchIds = session.matches || [];

      if (matchIds.length > matches.length) {
        // Get movie details for the new matches
        const movieDetails = await Promise.all(
          matchIds.map(async (movieId) => {
            // Fetch movie details from your movies data or TMDB
            const matchedMovie = movies.find((m) => m.id === movieId);
            return {
              id: movieId,
              title: matchedMovie?.title || `Movie ${movieId}`,
              poster_path: matchedMovie?.poster_path,
            };
          })
        );

        // Show notification for the newest match
        if (matchIds.length > matches.length) {
          const newestMatchId = matchIds[matchIds.length - 1];
          const newestMatch = movieDetails.find((m) => m.id === newestMatchId);

          setNewMatch(newestMatch);
          setShowMatchNotification(true);

          // Auto-hide notification after 5 seconds
          setTimeout(() => {
            setShowMatchNotification(false);
          }, 5000);
        }

        setMatches(movieDetails);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    }
  };

  // Listen for match updates
  useEffect(() => {
    // Initial fetch
    fetchMatches();

    // Set up real-time subscription for session updates
    const subscription = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log("Session updated:", payload);
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId, matches.length, movies]);

  const dismissNotification = () => {
    setShowMatchNotification(false);
  };

  return (
    <div className="min-h-screen bg-theme-primary py-8">
      <div className="container mx-auto px-4">
        {/* Match Notification */}
        {showMatchNotification && newMatch && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white p-4 rounded-lg shadow-lg max-w-sm animate-bounce">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg mb-2">🎉 It's a Match!</h3>
                <p className="text-sm mb-2">Everyone liked:</p>
                <p className="font-semibold">{newMatch.title}</p>
              </div>
              <button onClick={dismissNotification} className="ml-2 text-white hover:text-gray-200 text-lg">
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="text-center text-theme-primary mb-8">
          <h1 className="text-3xl font-bold mb-2">Now Matching</h1>

          {/* Match Counter */}
          {matches.length > 0 && (
            <div className="mt-4">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {matches.length} match{matches.length !== 1 ? "es" : ""} found ✨
              </span>
            </div>
          )}
        </div>

        {currentMovie ? (
          <div className="flex flex-col items-center min-h-[600px] relative">
            {/* Cards Stack */}
            <div className="flex justify-center relative">
              {/* Show up to 3 cards stacked */}
              {movies.slice(currentMovieIndex, currentMovieIndex + 3).map((movie, index) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onVote={index === 0 ? handleVote : () => {}} // Only allow voting on top card
                  onButtonVote={
                    index === 0
                      ? (fn) => {
                          buttonVoteRef.current = fn;
                        }
                      : undefined
                  }
                  index={index}
                  totalCards={Math.min(3, movies.length - currentMovieIndex)}
                />
              ))}
            </div>

            {/* Action Buttons Container - Pill shaped */}
            <div className="fixed bottom-10  z-10 bg-theme-secondary rounded-full drop-shadow-2xl shadow-lg p-2 flex space-x-4 mt-8">
              <button
                className="cursor-pointer bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg transition-colors flex items-center space-x-2"
                onClick={() => buttonVoteRef.current?.("dislike")}
              >
                <AiFillDislike className="text-xl" />
                <span className="text-sm font-medium">Pass</span>
              </button>
              <button
                className="cursor-pointer bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-colors flex items-center space-x-2"
                onClick={() => buttonVoteRef.current?.("like")}
              >
                <AiFillLike className="text-xl" />
                <span className="text-sm font-medium">Like</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            {movies.length === 0 ? (
              <div className="text-xl m-auto text-gray-600">
                {isHost ? (
                  <>
                    <LoadingSpinner />
                    <p>Fetching movies...</p>
                  </>
                ) : (
                  <>
                    <LoadingSpinner />
                    <p>Waiting for host to prepare movies...</p>
                  </>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xl text-gray-600 mb-4">No more movies to show!</p>
                {matches.length > 0 ? (
                  <div className="bg-white rounded-lg p-6 shadow-lg max-w-md mx-auto">
                    <h2 className="text-2xl font-bold text-green-600 mb-4">🎬 Your Matches</h2>
                    <div className="space-y-3">
                      {matches.map((match, index) => (
                        <div
                          key={match.id}
                          className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500 flex items-center"
                        >
                          {match.poster_path && (
                            <img
                              src={`https://image.tmdb.org/t/p/w92${match.poster_path}`}
                              alt={match.title}
                              className="w-12 h-18 object-cover rounded mr-3"
                            />
                          )}
                          <div>
                            <p className="font-semibold text-gray-800">{match.title}</p>
                            <p className="text-sm text-green-600">🎉 Perfect match!</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-lg p-6 max-w-md mx-auto">
                    <p className="text-gray-600">No matches found this time. Try again with different preferences!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Session;
