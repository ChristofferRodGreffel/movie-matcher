import React, { useState, useEffect } from "react";
import { AiFillDislike, AiFillLike } from "react-icons/ai";
import { BiInfoCircle } from "react-icons/bi";
import { IoStar } from "react-icons/io5";
import { motion, useMotionValue, useTransform } from "motion/react";
import TMDBApi from "../../api/tmdb";

const MovieCard = ({ movie, onVote, onButtonVote, index = 0, totalCards = 1 }) => {
  const [exitX, setExitX] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [movieDetails, setMovieDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const x = useMotionValue(0);
  const scale = useTransform(x, [-150, 0, 150], [0.9, 1, 0.9]);
  const rotate = useTransform(x, [-150, 0, 150], [-20, 0, 20]);

  // Add overlay opacity transforms
  const likeOpacity = useTransform(x, [0, 50, 150], [0, 0.3, 0.8]);
  const dislikeOpacity = useTransform(x, [-150, -50, 0], [0.8, 0.3, 0]);

  // Calculate stacking properties
  const isTopCard = index === 0;
  const stackScale = 1 - index * 0.02; // Much smaller scale difference

  // Reset state when new movie arrives
  useEffect(() => {
    setIsExiting(false);
    setExitX(0);
    setIsFlipped(false);
    x.set(0);
  }, [movie.id, x]);

  const handleDragEnd = (event, info) => {
    if (!isTopCard) return; // Only allow dragging the top card

    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Higher thresholds for more intentional swiping
    if (offset < -120 || velocity < -800) {
      handleVote("dislike");
      return;
    }
    if (offset > 120 || velocity > 800) {
      handleVote("like");
      return;
    }
  };

  const handleVote = (voteType) => {
    if (!isTopCard) return; // Only allow voting on the top card

    setIsExiting(true);
    setExitX(voteType === "like" ? 300 : -300);

    // Call onVote with a shorter delay
    setTimeout(() => {
      onVote(movie.id, voteType);
    }, 150);
  };

  const handleButtonVote = (voteType) => {
    if (!isTopCard) return; // Only allow voting on the top card
    handleVote(voteType);
  };

  const handleFlip = async () => {
    if (!isTopCard) return;

    setIsFlipped(!isFlipped);

    if (!isFlipped && !movieDetails) {
      setIsLoadingDetails(true);
      try {
        const details = await TMDBApi.getMovieDetails(movie.id);
        setMovieDetails(details);
      } catch (error) {
        console.error("Failed to fetch movie details:", error);
      }
      setIsLoadingDetails(false);
    }
  };

  // Expose button vote function to parent only when it changes
  useEffect(() => {
    if (isTopCard && onButtonVote) {
      onButtonVote(handleButtonVote); // Pass the function directly
    }
  }, [isTopCard, movie.id]); // Only update when card becomes top or movie changes

  const formatRating = (rating) => {
    return Math.round(rating * 10) / 10;
  };

  return (
    <motion.div
      key={movie.id}
      className="absolute bg-theme-secondary rounded-lg shadow-xl overflow-hidden w-80 sm:w-96 h-[28rem] sm:h-[30rem] flex flex-col"
      style={{
        x: isTopCard ? x : 0,
        scale: isTopCard ? scale : stackScale,
        rotate: isTopCard ? rotate : 0,
        zIndex: totalCards - index,
        cursor: isTopCard ? "grab" : "default",
      }}
      drag={isTopCard && !isFlipped ? "x" : false}
      dragConstraints={{ left: -150, right: 150 }}
      dragSnapToOrigin={true}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      animate={isExiting && isTopCard ? { x: exitX, opacity: 0, scale: 0.8 } : { scale: stackScale }}
      initial={{ scale: stackScale, x: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
    >
      {!isFlipped ? (
        // Front Side
        <>
          {/* Like Overlay */}
          {isTopCard && (
            <motion.div
              className="absolute inset-0 bg-green-500 flex items-center justify-center pointer-events-none z-10"
              style={{ opacity: likeOpacity }}
            >
              <div className="text-white text-6xl font-bold transform rotate-12">
                <AiFillLike />
              </div>
            </motion.div>
          )}

          {/* Dislike Overlay */}
          {isTopCard && (
            <motion.div
              className="absolute inset-0 bg-red-500 flex items-center justify-center pointer-events-none z-10"
              style={{ opacity: dislikeOpacity }}
            >
              <div className="text-white text-6xl font-bold transform -rotate-12">
                <AiFillDislike />
              </div>
            </motion.div>
          )}

          {/* Flip Button */}
          <button
            disabled={!isTopCard}
            onClick={handleFlip}
            className="absolute cursor-pointer top-4 right-4 z-20 bg-black/50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
          >
            <BiInfoCircle size={20} />
          </button>

          {/* Rating overlay on poster */}
          {movie.vote_average > 0 && (
            <div className="absolute top-4 left-4 z-20 bg-black/50 text-white px-2 py-1 rounded-full flex items-center">
              <IoStar className="text-yellow-400 mr-1" />
              <span className="text-sm font-medium">{formatRating(movie.vote_average)}</span>
            </div>
          )}

          {/* Image container - flex-shrink-0 to maintain size */}
          <div className="flex-shrink-0 h-60 sm:h-60 w-full overflow-hidden">
            {movie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-theme-primary">No Image</div>
            )}
          </div>

          <div className="flex-1 p-5 flex flex-col">
            <h2 className="text-2xl font-bold mb-2 text-theme-primary line-clamp-2">{movie.title}</h2>
            {movie.release_date && (
              <p className="text-theme-primary mb-2">{new Date(movie.release_date).getFullYear()}</p>
            )}
            {movie.overview ? (
              <p className="text-theme-primary text-sm leading-relaxed line-clamp-1 flex-1">{movie.overview}</p>
            ) : (
              <p className="text-theme-primary">Beskrivelse ikke tilgængelig</p>
            )}
          </div>
        </>
      ) : (
        // Back Side
        <>
          {/* Flip Button */}
          <button
            disabled={!isTopCard}
            onClick={handleFlip}
            className="absolute top-4 right-4 z-20 cursor-pointer bg-black/50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
          >
            <BiInfoCircle size={20} />
          </button>

          {/* Full height content area for back side */}
          <div className="p-6 flex-1 flex flex-col overflow-auto">
            <h2 className="text-xl font-bold mb-4 text-theme-primary">{movie.title}</h2>

            {isLoadingDetails ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent"></div>
                  <div className="text-theme-primary text-sm">Loading details...</div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-theme-primary flex-1 overflow-y-auto">
                {/* Key Info Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {movieDetails?.release_date && (
                    <div className="bg-theme-primary p-3 rounded-lg">
                      <div className="text-xs font-medium text-theme-primary/70 mb-1">ÅR</div>
                      <div className="font-bold text-lg">{new Date(movieDetails.release_date).getFullYear()}</div>
                    </div>
                  )}

                  {movieDetails?.vote_average && (
                    <div className="bg-theme-primary p-3 rounded-lg">
                      <div className="text-xs font-medium text-theme-primary/70 mb-1">RATING</div>
                      <div className="font-bold text-lg flex items-center">
                        <span className="text-yellow-500 mr-1">⭐</span>
                        {formatRating(movieDetails.vote_average)}
                      </div>
                    </div>
                  )}

                  {movieDetails?.runtime && (
                    <div className="bg-theme-primary p-3 rounded-lg">
                      <div className="text-xs font-medium text-theme-primary/70 mb-1">SPILLETID</div>
                      <div className="font-bold text-lg">
                        {Math.floor(movieDetails.runtime / 60)}h {movieDetails.runtime % 60}m
                      </div>
                    </div>
                  )}

                  {movieDetails?.budget && movieDetails.budget > 0 && (
                    <div className="bg-theme-primary p-3 rounded-lg">
                      <div className="text-xs font-medium text-theme-primary/70 mb-1">BUDGET</div>
                      <div className="font-bold text-lg">${(movieDetails.budget / 1000000).toFixed(0)}M</div>
                    </div>
                  )}
                </div>

                {/* Genres */}
                {movieDetails?.genres && movieDetails.genres.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-medium text-theme-primary/70 mb-2">GENRE</div>
                    <div className="flex flex-wrap gap-2">
                      {movieDetails.genres.map((genre) => (
                        <span
                          key={genre.id}
                          className="bg-theme-accent text-white px-3 py-1 rounded-full text-xs font-medium"
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Overview */}
                {movieDetails?.overview && (
                  <div className="flex-1">
                    <div className="text-xs font-medium text-theme-primary/70 mb-2">BESKRIVELSE</div>
                    <p className="text-sm leading-relaxed text-theme-primary/90">{movieDetails.overview}</p>
                  </div>
                )}

                {/* Additional Info - Collapsible or smaller */}
                {(movieDetails?.revenue > 0 || movieDetails?.production_companies?.length > 0) && (
                  <div className="border-t border-theme-primary/20 pt-3 mt-auto">
                    {movieDetails?.revenue > 0 && (
                      <div className="text-xs mb-1">
                        <span className="font-medium">Indtjening:</span>
                        <span className="ml-2">${(movieDetails.revenue / 1000000).toFixed(0)}M</span>
                      </div>
                    )}
                    {movieDetails?.production_companies?.length > 0 && (
                      <div className="text-xs">
                        <span className="font-medium">Filmstudie:</span>
                        <span className="ml-2">{movieDetails.production_companies[0].name}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default MovieCard;
