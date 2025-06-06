import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import TMDBApi from "../api/tmdb";
import ProviderCard from "../components/ProviderCard";
import GenreCard from "../components/GenreCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { getNavigate } from "../utils/navigation";

const ConfigureSession = () => {
  const [providers, setProviders] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingSession, setCreatingSession] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    ensureUserIdExists();
    fetchData();
  }, []);

  const ensureUserIdExists = () => {
    let userId = localStorage.getItem('user_id');
    if (!userId) {
      userId = uuidv4();
      localStorage.setItem('user_id', userId);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [providersData, genresData] = await Promise.all([
        TMDBApi.getProviders(),
        TMDBApi.getGenres(),
      ]);

      setProviders(providersData.results);
      setGenres(genresData.genres);
    } catch (err) {
      setError("Failed to fetch data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleProvider = (providerId) => {
    setSelectedProviders((prev) =>
      prev.includes(providerId)
        ? prev.filter((id) => id !== providerId)
        : [...prev, providerId]
    );
  };

  const toggleGenre = (genreId) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  };

  const handleCreateSession = async () => {
    if (selectedProviders.length === 0 || selectedGenres.length === 0) {
      alert("Please select at least one provider and one genre");
      return;
    }

    try {
      setCreatingSession(true);
      
      const sessionId = uuidv4();
      const userId = localStorage.getItem('user_id');
      
      const sessionConfig = {
        providers: selectedProviders,
        genres: selectedGenres,
        createdBy: userId,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionConfig));
      localStorage.setItem(`host_${sessionId}`, 'true');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      getNavigate()(`/lobby/${sessionId}`);
      
    } catch (err) {
      console.error("Failed to create session:", err);
      alert("Failed to create session. Please try again.");
    } finally {
      setCreatingSession(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">Error: {error}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Configure Session</h2>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Select Streaming Providers</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.provider_id}
              provider={provider}
              isSelected={selectedProviders.includes(provider.provider_id)}
              onToggle={toggleProvider}
            />
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Selected: {selectedProviders.length} providers
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Select Genres</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {genres.map((genre) => (
            <GenreCard
              key={genre.id}
              genre={genre}
              isSelected={selectedGenres.includes(genre.id)}
              onToggle={toggleGenre}
            />
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Selected: {selectedGenres.length} genres
        </p>
      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={handleCreateSession}
          disabled={creatingSession || selectedProviders.length === 0 || selectedGenres.length === 0}
          className={`
            px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 flex items-center gap-2
            ${
              creatingSession || selectedProviders.length === 0 || selectedGenres.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
            }
          `}
        >
          {creatingSession && <LoadingSpinner />}
          {creatingSession ? "Creating Session..." : "Create Session"}
        </button>
      </div>
    </div>
  );
};

export default ConfigureSession;
