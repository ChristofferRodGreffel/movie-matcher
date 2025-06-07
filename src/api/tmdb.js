const API_CONFIG = {
  BASE_URL: "https://api.themoviedb.org/3",
  HEADERS: {
    accept: "application/json",
    Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`,
  },
};

class TMDBApi {
  static async request(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const config = {
      headers: API_CONFIG.HEADERS,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  static async getProviders(region = "DK", language = "da-DK") {
    return this.request(`/watch/providers/movie?language=${language}&watch_region=${region}`);
  }

  static async getGenres(language = "da-DK") {
    return this.request(`/genre/movie/list?language=${language}`);
  }

  static async getMovieDetails(movieId, language = "da-DK") {
    return this.request(`/movie/${movieId}?language=${language}`);
  }

  static async discoverMovies(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/discover/movie?${queryParams}`);
  }
}

export default TMDBApi;
