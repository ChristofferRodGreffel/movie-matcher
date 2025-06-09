import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import MovieCard from "../components/Session/MovieCard";
import useUserStore from "../stores/userStore";
import { useSession } from "../hooks/useSession";
import supabase from "../api/supabase";
import LoadingSpinner from "../components/LoadingSpinner";
import { AiFillDislike, AiFillLike } from "react-icons/ai";
import TMDBApi from "../api/tmdb";
import toast from "react-hot-toast";

const Session = () => {
  const [isHost, setIsHost] = useState(false);
  const [matches, setMatches] = useState([]);
  const [matchProviders, setMatchProviders] = useState({}); // Add this state
  const [newMatch, setNewMatch] = useState(null);
  const [showAllMatches, setShowAllMatches] = useState(false);
  const buttonVoteRef = useRef(null);

  const { sessionId } = useParams();
  const { userId } = useUserStore();

  const { loading, movies, currentMovieIndex, handleVote, currentMovie } = useSession(sessionId, userId, isHost);

  useEffect(() => {
    const hostStatus = localStorage.getItem(`host_${sessionId}`);
    setIsHost(hostStatus === "true");
  }, [sessionId]);

  // Add function to fetch providers for matches
  const fetchProvidersForMatches = async (movieMatches) => {
    const providerPromises = movieMatches.map(async (match) => {
      try {
        const providers = await TMDBApi.getMovieProviders(match.id);

        // Get DK providers, fallback to US if DK not available
        const regionData = providers?.results?.DK || providers?.results?.US || {};

        return {
          movieId: match.id,
          providers: {
            flatrate: regionData.flatrate || [],
            rent: regionData.rent || [],
            buy: regionData.buy || [],
          },
        };
      } catch (error) {
        console.error(`Error fetching providers for movie ${match.id}:`, error);
        return {
          movieId: match.id,
          providers: {
            flatrate: [],
            rent: [],
            buy: [],
          },
        };
      }
    });

    const results = await Promise.all(providerPromises);
    const providersMap = {};
    results.forEach(({ movieId, providers }) => {
      providersMap[movieId] = providers;
    });

    setMatchProviders(providersMap);
  };

  // Fetch session matches
  const fetchMatches = async (isInitialFetch = false) => {
    try {
      const { data: session, error } = await supabase.from("sessions").select("matches").eq("id", sessionId).single();

      if (error) {
        console.error("Error fetching matches:", error);
        return;
      }

      const matchIds = session.matches || [];

      if (matchIds.length > matches.length) {
        // Get movie details from session_movies table
        const { data: sessionMovies, error: moviesError } = await supabase
          .from("session_movies")
          .select("*")
          .eq("session_id", sessionId)
          .in("movie_id", matchIds);

        if (moviesError) {
          console.error("Error fetching session movies:", moviesError);
          return;
        }

        // Map the movie details
        const movieDetails = matchIds.map((movieId) => {
          const sessionMovie = sessionMovies.find((sm) => sm.movie_id === movieId);
          return {
            id: movieId,
            title: sessionMovie?.title || `Movie ${movieId}`,
            poster_path: sessionMovie?.poster_path,
            overview: sessionMovie?.overview,
            release_date: sessionMovie?.release_date,
            vote_average: sessionMovie?.vote_average,
            genre_ids: sessionMovie?.genre_ids,
          };
        });

        // Show notification for the newest match (only for real-time updates, not initial fetch)
        if (matchIds.length > matches.length && !isInitialFetch) {
          const newestMatchId = matchIds[matchIds.length - 1];
          const newestMatch = movieDetails.find((m) => m.id === newestMatchId);

          toast.success(`Nyt match: ${newestMatch.title}`);
        }

        setMatches(movieDetails);
        // Fetch providers for the matches
        fetchProvidersForMatches(movieDetails);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    }
  };

  // Listen for match updates
  useEffect(() => {
    // Initial fetch
    fetchMatches(true);

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
          fetchMatches(false);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId, matches.length, movies]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-theme-primary to-theme-secondary">
      <div className="container mx-auto px-4 py-6">
        {matches.length > 0 && (
          <div className="text-center mb-8">
            <div className="">
              {/* Matches Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => setShowAllMatches(true)}
                  className="cursor-pointer bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
                >
                  <span>View Matches ({matches.length})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* All Matches Modal */}
        {showAllMatches && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-theme-secondary rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="sticky top-0 bg-theme-secondary rounded-t-2xl border-b p-6 flex justify-between items-center flex-shrink-0">
                <h2 className="text-2xl font-bold text-theme-primary flex items-center">
                  🎬 All matches ({matches.length})
                </h2>
                <button
                  onClick={() => setShowAllMatches(false)}
                  className="cursor-pointer text-theme-primary text-2xl font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                {matches.length > 0 ? (
                  <div className="grid gap-4">
                    {matches.map((match) => (
                      <div
                        key={match.id}
                        className="bg-theme-primary border-theme-primary border rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-5">
                          {match.poster_path && (
                            <img
                              src={`https://image.tmdb.org/t/p/w154${match.poster_path}`}
                              alt={match.title}
                              className="w-16 h-24 object-cover rounded-lg shadow-sm"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-theme-primary mb-1">{match.title}</h3>
                            <div className="flex flex-wrap gap-1">
                              {matchProviders[match.id] ? (
                                <div className="flex flex-wrap gap-2">
                                  {/* Show flatrate (subscription) providers */}
                                  {matchProviders[match.id].flatrate?.map((provider) => (
                                    <div
                                      key={`flatrate-${provider.provider_id}`}
                                      className="flex items-center rounded-full text-xs font-medium"
                                    >
                                      {provider.logo_path && (
                                        <img
                                          src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                                          alt={provider.provider_name}
                                          className="w-8 h-8 rounded-md"
                                        />
                                      )}
                                    </div>
                                  ))}

                                  {/* {matchProviders[match.id].rent?.map((provider) => (
                                    <div
                                      key={`rent-${provider.provider_id}`}
                                      className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium"
                                    >
                                      {provider.logo_path && (
                                        <img
                                          src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                                          alt={provider.provider_name}
                                          className="w-4 h-4 rounded mr-1"
                                        />
                                      )}
                                      <span>{provider.provider_name}</span>
                                    </div>
                                  ))}

                                  {matchProviders[match.id].buy?.map((provider) => (
                                    <div
                                      key={`buy-${provider.provider_id}`}
                                      className="flex items-center bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium"
                                    >
                                      {provider.logo_path && (
                                        <img
                                          src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                                          alt={provider.provider_name}
                                          className="w-4 h-4 rounded mr-1"
                                        />
                                      )}
                                      <span>{provider.provider_name}</span>
                                    </div>
                                  ))} */}

                                  {/* If no providers in any category */}
                                  {!matchProviders[match.id].flatrate &&
                                    !matchProviders[match.id].rent &&
                                    !matchProviders[match.id].buy && (
                                      <span className="text-gray-500 text-xs">No streaming providers available</span>
                                    )}
                                </div>
                              ) : (
                                <span className="text-gray-500 text-xs">Loading providers...</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎭</div>
                    <p className="text-gray-600 text-lg">No matches yet. Keep swiping!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center">
            <div className="flex justify-center">
              {isHost ? (
                <div className="flex flex-col items-center justify-center text-theme-primary bg-theme-secondary backdrop-blur-sm rounded-2xl p-8 shadow-lg max-w-md">
                  <LoadingSpinner size="w-8 h-8" />
                  <p className="mt-4 font-medium">Fetching movies...</p>
                  <p className="text-sm mt-2">Finding the perfect selection for you</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-theme-primary bg-theme-secondary backdrop-blur-sm rounded-2xl p-8 shadow-lg max-w-md">
                  <LoadingSpinner size="w-8 h-8" />
                  <p className="mt-4 font-medium">Waiting for host...</p>
                  <p className="text-sm mt-2">The host is preparing your movie selection</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Show movie cards when there are movies to vote on
          <div className="flex flex-col items-center min-h-[600px] relative">
            {/* Cards Container with Enhanced Background */}
            <div className="relative">
              {/* Decorative Background Elements */}
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-theme-accent/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-green-500/10 rounded-full blur-3xl"></div>

              {/* Cards Stack */}
              <div className="flex justify-center relative mb-8">
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
            </div>

            {/* Enhanced Action Buttons Container */}
            <div className="fixed bottom-10 z-10 bg-theme-secondary/90 backdrop-blur-sm rounded-full drop-shadow-2xl shadow-xl p-3 flex space-x-3">
              <button
                className="cursor-pointer bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-4 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
                onClick={() => buttonVoteRef.current?.("dislike")}
              >
                <AiFillDislike className="text-xl" />
                <span className="text-sm font-bold">Pass</span>
              </button>
              <button
                className="cursor-pointer bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-4 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
                onClick={() => buttonVoteRef.current?.("like")}
              >
                <AiFillLike className="text-xl" />
                <span className="text-sm font-bold">Watch</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Session;
