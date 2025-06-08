import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TMDBApi from "../api/tmdb";
import LoadingSpinner from "../components/LoadingSpinner";
import supabase from "../api/supabase";
import useUserStore from "../stores/userStore";
import SelectionCard from "../components/Configuring/SelectionCard";

const ConfigureSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [providers, setProviders] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedProviders, setSelectedProviders] = useState([]); // Now array of objects
  const [selectedGenres, setSelectedGenres] = useState([]); // Change to array of objects
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHost, setIsHost] = useState(false);

  const { getUserId, userId, username } = useUserStore(); // Get username too

  useEffect(() => {
    initializeSession();

    // Subscribe to real-time changes for collaborative editing AND status changes
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
            // Update collaborative config with new format
            setSelectedProviders(
              payload.new.platform_selections ||
                payload.new.platform_ids?.map((id) => ({ provider_id: id, selected_by: null })) ||
                []
            );
            setSelectedGenres(
              payload.new.genre_selections ||
                payload.new.genre_ids?.map((id) => ({ genre_id: id, selected_by: null })) ||
                []
            );

            // Auto-navigate when status changes to matching
            if (payload.new.status === "matching") {
              console.log("Status changed to matching - navigating to session page");
              navigate(`/session/${sessionId}`);
            }
          }
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [sessionId, navigate]);

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
      // Handle new format or legacy format for providers
      setSelectedProviders(
        data.platform_selections || data.platform_ids?.map((id) => ({ provider_id: id, selected_by: null })) || []
      );

      // Handle new format or legacy format for genres
      setSelectedGenres(
        data.genre_selections || data.genre_ids?.map((id) => ({ genre_id: id, selected_by: null })) || []
      );
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
    // Check if this provider is already selected
    const existingSelection = selectedProviders.find((p) => p.provider_id === providerId);

    let newProviders;
    if (existingSelection) {
      // Remove if already selected
      newProviders = selectedProviders.filter((p) => p.provider_id !== providerId);
    } else {
      // Add new selection with user info
      newProviders = [
        ...selectedProviders,
        {
          provider_id: providerId,
          selected_by: userId,
          username: username,
          selected_at: new Date().toISOString(),
        },
      ];
    }

    setSelectedProviders(newProviders);

    // Update database with new format
    try {
      const { error } = await supabase
        .from("sessions")
        .update({
          platform_selections: newProviders,
          // Keep legacy format for backward compatibility
          platform_ids: newProviders.map((p) => p.provider_id),
        })
        .eq("id", sessionId);

      if (error) throw error;
    } catch (err) {
      console.error("Error updating providers:", err);
      setSelectedProviders(selectedProviders);
      alert("Failed to update providers. Please try again.");
    }
  };

  // Helper function to check if a provider is selected
  const isProviderSelected = (providerId) => {
    return selectedProviders.some((p) => p.provider_id === providerId);
  };

  // Helper function to get who selected a provider
  const getProviderSelection = (providerId) => {
    return selectedProviders.find((p) => p.provider_id === providerId);
  };

  // Collaborative genre toggling - any participant can add/remove
  const toggleGenre = async (genreId) => {
    const existingSelection = selectedGenres.find((g) => g.genre_id === genreId);

    let newGenres;
    if (existingSelection) {
      // Remove if already selected
      newGenres = selectedGenres.filter((g) => g.genre_id !== genreId);
    } else {
      // Add new selection with user info
      newGenres = [
        ...selectedGenres,
        {
          genre_id: genreId,
          selected_by: userId,
          username: username,
          selected_at: new Date().toISOString(),
        },
      ];
    }

    setSelectedGenres(newGenres);

    // Update database with new format
    try {
      const { error } = await supabase
        .from("sessions")
        .update({
          genre_selections: newGenres,
          // Keep legacy format for backward compatibility
          genre_ids: newGenres.map((g) => g.genre_id),
        })
        .eq("id", sessionId);

      if (error) throw error;
    } catch (err) {
      console.error("Error updating genres:", err);
      setSelectedGenres(selectedGenres);
      alert("Failed to update genres. Please try again.");
    }
  };

  // Add helper functions for genres
  const isGenreSelected = (genreId) => {
    return selectedGenres.some((g) => g.genre_id === genreId);
  };

  const getGenreSelection = (genreId) => {
    return selectedGenres.find((g) => g.genre_id === genreId);
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

      <div className="mb-8">
        <h3 className="text-xl text-theme-primary font-semibold mb-4">Select Streaming Providers</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {providers.map((provider) => {
            const selection = getProviderSelection(provider.provider_id);
            return (
              <SelectionCard
                key={provider.provider_id}
                item={provider}
                type="provider"
                isSelected={isProviderSelected(provider.provider_id)}
                onToggle={toggleProvider}
                selectedBy={selection?.selected_by}
                currentUserId={userId}
              />
            );
          })}
        </div>
        <p className="mt-3 text-sm text-gray-600">Selected: {selectedProviders.length} providers</p>
      </div>

      <div className="mb-8">
        <h3 className="text-xl text-theme-primary font-semibold mb-4">Select Genres</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {genres.map((genre) => {
            const selection = getGenreSelection(genre.id);
            return (
              <SelectionCard
                key={genre.id}
                item={genre}
                type="genre"
                isSelected={isGenreSelected(genre.id)}
                onToggle={toggleGenre}
                selectedBy={selection?.selected_by}
                currentUserId={userId}
              />
            );
          })}
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
          <div className="text-gray-500 text-center p-6 bg-gray-50 rounded-lg">
            <div className="mb-3">
              <div className="inline-flex gap-1.5 items-center">
                <LoadingSpinner />
                <span>Waiting for the host to start matching...</span>
              </div>
            </div>
            <p className="text-xs mt-2 text-gray-400">You'll be automatically redirected when matching begins</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigureSession;
