import React from "react";

const MovieCard = ({ movie, onVote }) => {
  const imageBaseUrl = "https://image.tmdb.org/t/p/w500";

  const handleVote = (voteType) => {
    onVote(movie.id, voteType);
  };

  const formatRating = (rating) => {
    return Math.round(rating * 10) / 10;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg max-w-sm mx-auto overflow-hidden">
      <div className="relative h-96 overflow-hidden">
        <img
          src={`${imageBaseUrl}${movie.poster_path}`}
          alt={movie.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = "/placeholder-movie.png";
          }}
        />
        <div className="absolute top-3 right-3 bg-black/80 text-yellow-400 px-3 py-1.5 rounded-full flex items-center gap-1 text-sm font-semibold">
          <span className="text-base">★</span>
          <span>{formatRating(movie.vote_average)}</span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{movie.title}</h3>
        <p className="text-gray-600 font-medium mb-4">{new Date(movie.release_date).getFullYear()}</p>
        <p className="text-gray-700 text-sm line-clamp-4 leading-relaxed mb-6">{movie.overview}</p>

        <div className="flex gap-3">
          <button
            className="flex-1 bg-green-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2"
            onClick={() => handleVote("up")}
            title="I like this movie"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Like
          </button>

          <button
            className="flex-1 bg-red-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2"
            onClick={() => handleVote("down")}
            title="I don't like this movie"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 15l-1.41-1.41L13 18.17V2h-2v16.17l-4.59-4.58L5 15l7 7 7-7z" />
            </svg>
            Pass
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
