import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import TMDBApi from "../api/tmdb";
import ProviderCard from "../components/ProviderCard";
import GenreCard from "../components/GenreCard";
import LoadingSpinner from "../components/LoadingSpinner";
import supabase from "../api/supabase";
import useUserStore from "../stores/userStore";

const ConfigureSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [providers, setProviders] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHost, setIsHost] = useState(false);

  const { getUserId } = useUserStore();

  useEffect(() => {
    initializeSession();

    // Subscribe to real-time changes for collaborative editing
    const subscription = supabase
      .channel(`session_config_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new) {
            setSelectedProviders(payload.new.platform_ids || []);
            setSelectedGenres(payload.new.genre_ids || []);
          }
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [sessionId]);

  const initializeSession = async () => {
    try {
      await getUserId();
      await loadSession();
      await fetchData();
      checkIfHost();
    } catch (err) {
      setError("Failed to initialize session");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async () => {
    if (!sessionId) {
      navigate("/");
      return;
    }

    try {
      const { data, error } = await supabase.from("sessions").select("*").eq("id", sessionId).single();

      if (error || !data) {
        setError("Session not found");
        return;
      }

      setSession(data);
      setSelectedProviders(data.platform_ids || []);
      setSelectedGenres(data.genre_ids || []);
    } catch (err) {
      setError("Failed to load session");
    }
  };

  const checkIfHost = () => {
    const hostStatus = localStorage.getItem(`host_${sessionId}`);
    setIsHost(hostStatus === "true");
  };

  const fetchData = async () => {
    try {
      const [providersData, genresData] = await Promise.all([TMDBApi.getProviders(), TMDBApi.getGenres()]);

      setProviders(providersData.results);
      setGenres(genresData.genres);
    } catch (err) {
      setError("Failed to fetch data");
      console.error(err);
    }
  };

  // Collaborative provider toggling - any participant can add/remove
  const toggleProvider = async (providerId) => {
    // Update local state immediately for responsive UI
    const newProviders = selectedProviders.includes(providerId)
      ? selectedProviders.filter((id) => id !== providerId)
      : [...selectedProviders, providerId];

    setSelectedProviders(newProviders);

    // Update database - all participants can modify
    try {
      const { error } = await supabase.from("sessions").update({ platform_ids: newProviders }).eq("id", sessionId);

      if (error) throw error;
    } catch (err) {
      console.error("Error updating providers:", err);
      // Revert on error
      setSelectedProviders(selectedProviders);
      alert("Failed to update providers. Please try again.");
    }
  };

  // Collaborative genre toggling - any participant can add/remove
  const toggleGenre = async (genreId) => {
    // Update local state immediately for responsive UI
    const newGenres = selectedGenres.includes(genreId)
      ? selectedGenres.filter((id) => id !== genreId)
      : [...selectedGenres, genreId];

    setSelectedGenres(newGenres);

    // Update database - all participants can modify
    try {
      const { error } = await supabase.from("sessions").update({ genre_ids: newGenres }).eq("id", sessionId);

      if (error) throw error;
    } catch (err) {
      console.error("Error updating genres:", err);
      // Revert on error
      setSelectedGenres(selectedGenres);
      alert("Failed to update genres. Please try again.");
    }
  };

  const startMatching = async () => {
    // Only host can start matching
    if (!isHost) {
      alert("Only the host can start matching.");
      return;
    }

    if (selectedProviders.length === 0 || selectedGenres.length === 0) {
      alert("Please select at least one provider and one genre");
      return;
    }

    try {
      const { error } = await supabase.from("sessions").update({ status: "matching" }).eq("id", sessionId);

      if (error) throw error;

      navigate(`/session/${sessionId}`);
    } catch (err) {
      console.error("Failed to start matching:", err);
      alert("Failed to start matching. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl text-theme-primary font-bold">Configure Session</h2>
        <div className="text-sm text-gray-600">🤝 Everyone can add/remove options</div>
      </div>

      {/* Collaborative info banner */}
      <div className="mb-6 p-4 bg-theme-secondary border border-theme-link rounded-lg">
        <p className="text-theme-primary">
          <strong>Collaborative Configuration:</strong> Everyone in the session can add or remove streaming providers
          and genres.
          {isHost
            ? " As the host, you can start matching when ready."
            : " The host will start matching when everyone is ready."}
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-xl text-theme-primary font-semibold mb-4">Select Streaming Providers</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.provider_id}
              provider={provider}
              isSelected={selectedProviders.includes(provider.provider_id)}
              onToggle={toggleProvider}
              // No disabled prop - everyone can interact
            />
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-600">Selected: {selectedProviders.length} providers</p>
      </div>

      <div className="mb-8">
        <h3 className="text-xl text-theme-primary font-semibold mb-4">Select Genres</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {genres.map((genre) => (
            <GenreCard
              key={genre.id}
              genre={genre}
              isSelected={selectedGenres.includes(genre.id)}
              onToggle={toggleGenre}
              // No disabled prop - everyone can interact
            />
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-600">Selected: {selectedGenres.length} genres</p>
      </div>

      {/* Only show start button to host */}
      {isHost ? (
        <div className="flex justify-end mt-8">
          <button
            onClick={startMatching}
            disabled={selectedProviders.length === 0 || selectedGenres.length === 0}
            className={`
              px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 cursor-pointer
              ${
                selectedProviders.length === 0 || selectedGenres.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
              }
            `}
          >
            Start Matching
          </button>
        </div>
      ) : (
        <div className="flex justify-center mt-8">
          <div className="text-gray-500 text-center">
            <p>Waiting for the host to start matching...</p>
            <p className="text-sm mt-1">Keep adding providers and genres that you'd like!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigureSession;
