const GenreCard = ({ genre, isSelected, onToggle }) => {
  return (
    <div
      onClick={() => onToggle(genre.id)}
      className={`
        border-2 rounded-lg p-3 text-center cursor-pointer transition-all duration-200 hover:shadow-lg
        ${
          isSelected
            ? "border-green-500 bg-green-50 shadow-md"
            : "border-gray-200 bg-white hover:border-gray-300"
        }
      `}
    >
      <div
        className={`text-sm font-medium ${
          isSelected
            ? "text-green-800"
            : "text-gray-700"
        }`}
      >
        {genre.name}
      </div>
    </div>
  );
};

export default GenreCard;