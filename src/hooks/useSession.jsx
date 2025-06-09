import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import supabase from "../api/supabase";
import { fetchMoviesFromTMDB, filterVotedMovies, loadMoviesFromDatabase } from "../utils/movie_utilities";
import { checkForMatches } from "../utils/matching_utilities";

export const useSession = (sessionId, userId, isHost) => {
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState([]);
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [noMoviesAvailable, setNoMoviesAvailable] = useState(false);

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
        const { data: existingMovies, error: checkError } = await supabase
          .from("session_movies")
          .select("id")
          .eq("session_id", sessionId)
          .limit(1);

        if (checkError) {
          console.error("Error checking existing movies:", checkError);
          return;
        }

        if (existingMovies && existingMovies.length > 0) {
          console.log("Movies already exist for this session, loading from database...");
          const dbMovies = await loadMoviesFromDatabase(sessionId);
          const filteredMovies = await filterVotedMovies(dbMovies, sessionId, userId);
          
          if (filteredMovies.length === 0) {
            console.log("No movies available after filtering voted movies");
            setNoMoviesAvailable(true);
            setMovies([]);
            return;
          }
          
          setMovies(filteredMovies);
          setNoMoviesAvailable(false);

          if (!config.movies_fetched) {
            await supabase.from("sessions").update({ movies_fetched: true }).eq("id", sessionId);
          }
          return;
        }

        console.log("No movies found for session, fetching from TMDB...");
        const { allMovies, moviesToInsert } = await fetchMoviesFromTMDB(sessionId, config);

        if (allMovies.length === 0) {
          console.log("No movies found with the current filters");
          setNoMoviesAvailable(true);
          setMovies([]);
          await supabase.from("sessions").update({ movies_fetched: true }).eq("id", sessionId);
          return;
        }

        if (moviesToInsert.length > 0) {
          const { error: insertError } = await supabase.from("session_movies").insert(moviesToInsert);

          if (insertError) {
            console.error("Error inserting movies:", insertError);
            const dbMovies = await loadMoviesFromDatabase(sessionId);
            const filteredMovies = await filterVotedMovies(dbMovies, sessionId, userId);
            
            if (filteredMovies.length === 0) {
              console.log("No movies available after filtering");
              setNoMoviesAvailable(true);
              setMovies([]);
              return;
            }
            
            setMovies(filteredMovies);
            setNoMoviesAvailable(false);
            return;
          }
        }

        const filteredMovies = await filterVotedMovies(allMovies, sessionId, userId);
        
        if (filteredMovies.length === 0) {
          console.log("No movies available after filtering voted movies");
          setNoMoviesAvailable(true);
          setMovies([]);
        } else {
          setMovies(filteredMovies);
          setNoMoviesAvailable(false);
        }
        
        await supabase.from("sessions").update({ movies_fetched: true }).eq("id", sessionId);
      } else {
        await waitForMoviesAndLoad();
      }
    } catch (err) {
      console.error("Error initializing session:", err);
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

    const dbMovies = await loadMoviesFromDatabase(sessionId);
    const filteredMovies = await filterVotedMovies(dbMovies, sessionId, userId);
    
    if (filteredMovies.length === 0) {
      console.log("No movies available for this user");
      setNoMoviesAvailable(true);
      setMovies([]);
    } else {
      setMovies(filteredMovies);
      setNoMoviesAvailable(false);
    }
  };

  const handleVote = async (movieId, voteType) => {
    if (!userId) return;

    try {
      const currentMovie = movies[currentMovieIndex];

      const { data: existingVote } = await supabase
        .from("responses")
        .select("id")
        .eq("session_id", sessionId)
        .eq("user_id", userId)
        .eq("tmdb_id", currentMovie.id)
        .maybeSingle();

      if (existingVote) {
        console.log("User already voted on this movie, skipping...");
        if (currentMovieIndex < movies.length - 1) {
          setCurrentMovieIndex(currentMovieIndex + 1);
        }
        return;
      }

      const { error } = await supabase.from("responses").insert({
        id: uuidv4(),
        session_id: sessionId,
        user_id: userId,
        tmdb_id: currentMovie.id,
        liked: voteType === "like",
      });

      if (error) {
        console.error("Error storing vote:", error);
        return;
      }

      if (voteType === "like") {
        await checkForMatches(sessionId, currentMovie.id);
      }

      if (currentMovieIndex < movies.length - 1) {
        setCurrentMovieIndex(currentMovieIndex + 1);
      } else {
        console.log("Voting completed!");
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

  return {
    loading,
    movies,
    currentMovieIndex,
    handleVote,
    currentMovie: movies[currentMovieIndex],
    noMoviesAvailable,
  };
};
