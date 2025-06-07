import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import supabase from "../api/supabase";
import TMDBApi from "../api/tmdb";
import MovieCard from "../components/Session/MovieCard";
import useUserStore from "../stores/userStore";

const Session = () => {
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState([]);
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [isHost, setIsHost] = useState(false);

  const { sessionId } = useParams();
  const { userId } = useUserStore();

  useEffect(() => {
    checkIfHost();
  }, [sessionId]);

  const checkIfHost = () => {
    const hostStatus = localStorage.getItem(`host_${sessionId}`);
    setIsHost(hostStatus === "true");
  };

  const fetchSessionConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("sessions").select("*").eq("id", sessionId).single();
      if (error) throw new Error("Failed to fetch session config");
      return data;
    } catch (err) {
      console.error("Failed to fetch session config:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const initializeSession = async () => {
    if (!sessionId || !userId) return;

    try {
      let config = await fetchSessionConfig();
      if (!config) return;

      if (isHost) {
        // First check if movies already exist for this session
        const { data: existingMovies, error: checkError } = await supabase
          .from("session_movies")
          .select("id")
          .eq("session_id", sessionId)
          .limit(1);

        if (checkError) {
          console.error("Error checking existing movies:", checkError);
          return;
        }

        // If movies already exist, just load them from database
        if (existingMovies && existingMovies.length > 0) {
          console.log("Movies already exist for this session, loading from database...");
          await loadMoviesFromDatabase();
          // Also update the session as movies_fetched if not already set
          if (!config.movies_fetched) {
            await supabase.from("sessions").update({ movies_fetched: true }).eq("id", sessionId);
          }
          return;
        }

        // No existing movies, fetch from TMDB API
        console.log("No movies found for session, fetching from TMDB...");
        let providers = config.platform_ids || [];
        let genres = config.genre_ids || [];
        const allMovies = [];
        let position = 0;

        for (let i = 0; i <= 3; i++) {
          console.log(`Host fetching movies: page ${i + 1}`);

          const params = new URLSearchParams({
            session_id: sessionId,
            providers: providers.join(","),
            genres: genres.join(","),
            page: i + 1,
          });

          const moviesResponse = await TMDBApi.discoverMovies(params);

          for (const tmdbMovie of moviesResponse.results) {
            // Store only TMDB ID
            const { error } = await supabase.from("session_movies").upsert(
              {
                session_id: sessionId,
                tmdb_id: tmdbMovie.id,
                position: position++,
              },
              {
                onConflict: "session_id,tmdb_id",
              }
            );

            if (error) {
              console.error("Error upserting movie:", error);
            }

            allMovies.push(tmdbMovie);
          }
        }

        setMovies(allMovies);
        await supabase.from("sessions").update({ movies_fetched: true }).eq("id", sessionId);
      } else {
        // Non-host waits for movies and loads them
        await waitForMoviesAndLoad();
      }
    } catch (err) {
      console.error("Error initializing session:", err);
    }
  };

  // Add this helper function
  const loadMoviesFromDatabase = async () => {
    try {
      console.log("Loading movies from database...");

      const { data: sessionMovies } = await supabase
        .from("session_movies")
        .select("tmdb_id")
        .eq("session_id", sessionId)
        .order("position");

      if (sessionMovies && sessionMovies.length > 0) {
        console.log(`Found ${sessionMovies.length} movies in database`);
        // Fetch movie details from TMDB
        const moviePromises = sessionMovies.map((sm) => TMDBApi.getMovieDetails(sm.tmdb_id));

        const movieDetails = await Promise.all(moviePromises);
        setMovies(movieDetails);
      } else {
        console.log("No movies found in database");
      }
    } catch (err) {
      console.error("Error loading movies from database:", err);
    }
  };

  const waitForMoviesAndLoad = async () => {
    let moviesReady = false;

    while (!moviesReady) {
      const { data: session } = await supabase.from("sessions").select("movies_fetched").eq("id", sessionId).single();

      moviesReady = session?.movies_fetched || false;

      if (!moviesReady) {
        console.log("Waiting for host to fetch movies...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Load TMDB IDs and fetch movie details
    const { data: sessionMovies } = await supabase
      .from("session_movies")
      .select("tmdb_id")
      .eq("session_id", sessionId)
      .order("position");

    if (sessionMovies && sessionMovies.length > 0) {
      // Fetch movie details from TMDB
      const moviePromises = sessionMovies.map((sm) => TMDBApi.getMovieDetails(sm.tmdb_id));

      const movieDetails = await Promise.all(moviePromises);
      setMovies(movieDetails);
    }
  };

  const handleVote = async (movieId, voteType) => {
    if (!userId) return;

    try {
      const currentMovie = movies[currentMovieIndex];

      const { error } = await supabase.from("responses").insert({
        session_id: sessionId,
        user_id: userId,
        tmdb_id: currentMovie.id, // Use TMDB ID directly
        liked: voteType === "like",
      });

      if (error) {
        console.error("Error storing vote:", error);
        return;
      }

      if (currentMovieIndex < movies.length - 1) {
        setCurrentMovieIndex(currentMovieIndex + 1);
      } else {
        console.log("No more movies!");
      }
    } catch (err) {
      console.error("Error handling vote:", err);
    }
  };

  useEffect(() => {
    if (userId !== null) {
      initializeSession();
    }
  }, [sessionId, userId, isHost]);

  const currentMovie = movies[currentMovieIndex];

  return (
    <div className="min-h-screen bg-theme-primary py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Movie Matcher</h1>
          {isHost && <p className="text-sm text-blue-600 mb-2">You are the host</p>}
          <p className="text-gray-600">
            Movie {currentMovieIndex + 1} of {movies.length}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4 max-w-md mx-auto">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentMovieIndex + 1) / movies.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {currentMovie ? (
          <MovieCard movie={currentMovie} onVote={handleVote} />
        ) : (
          <div className="text-center">
            {movies.length === 0 ? (
              <p className="text-xl text-gray-600">
                {isHost ? "Fetching movies..." : "Waiting for host to prepare movies..."}
              </p>
            ) : (
              <p className="text-xl text-gray-600">No more movies to show!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Session;
