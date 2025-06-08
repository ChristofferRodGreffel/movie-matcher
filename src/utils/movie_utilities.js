import supabase from "../api/supabase";
import TMDBApi from "../api/tmdb";

export const fetchMoviesFromTMDB = async (sessionId, config) => {
  const providers = config.platform_ids || [];
  const genres = config.genre_ids || [];
  const allMovies = [];
  let position = 0;
  const moviesToInsert = [];

  for (let i = 0; i <= 3; i++) {
    console.log(`Host fetching movies: page ${i + 1}`);

    const params = {
      with_watch_providers: providers.join(","),
      with_genres: genres.join(","),
      with_watch_monetization_types: "flatrate, free, ads",
      page: i + 1,
      language: "da-DK",
      region: "DK",
      sort_by: "popularity.desc",
      include_adult: false,
      include_video: false,
    };

    const queryString = new URLSearchParams(params).toString();
    console.log("Query string:", queryString);
    const moviesResponse = await TMDBApi.discoverMovies(queryString);

    console.log(moviesResponse);

    for (const tmdbMovie of moviesResponse.results) {
      moviesToInsert.push({
        session_id: sessionId,
        movie_id: tmdbMovie.id,
        title: tmdbMovie.title || "Unknown Title",
        poster_path: tmdbMovie.poster_path || null,
        overview: tmdbMovie.overview || null,
        release_date: tmdbMovie.release_date && tmdbMovie.release_date.trim() !== "" ? tmdbMovie.release_date : null,
        genres: tmdbMovie.genre_ids || [],
        rating: tmdbMovie.vote_average || 0,
        position: position++,
      });

      allMovies.push(tmdbMovie);
    }
  }

  return { allMovies, moviesToInsert };
};

export const loadMoviesFromDatabase = async (sessionId) => {
  console.log("Loading movies from database...");

  const { data: sessionMovies, error } = await supabase
    .from("session_movies")
    .select("movie_id, title, poster_path, overview, release_date, genres, rating")
    .eq("session_id", sessionId)
    .order("position");

  if (error) {
    console.error("Error loading movies:", error);
    return [];
  }

  if (sessionMovies && sessionMovies.length > 0) {
    console.log(`Found ${sessionMovies.length} movies in database`);

    return sessionMovies.map((sm) => ({
      id: sm.movie_id,
      title: sm.title,
      poster_path: sm.poster_path,
      overview: sm.overview,
      release_date: sm.release_date,
      genre_ids: sm.genres || [],
      vote_average: sm.rating,
    }));
  }

  return [];
};

export const filterVotedMovies = async (movieList, sessionId, userId) => {
  try {
    const { data: votedMovies, error } = await supabase
      .from("responses")
      .select("tmdb_id")
      .eq("session_id", sessionId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user votes:", error);
      return movieList;
    }

    const votedMovieIds = new Set(votedMovies.map((vote) => vote.tmdb_id));
    const filteredMovies = movieList.filter((movie) => !votedMovieIds.has(movie.id));

    console.log(`Filtered ${movieList.length - filteredMovies.length} already voted movies`);
    return filteredMovies;
  } catch (err) {
    console.error("Error filtering voted movies:", err);
    return movieList;
  }
};
