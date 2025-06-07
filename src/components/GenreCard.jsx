const GenreCard = ({ genre, isSelected, onToggle }) => {
  return (
    <div
      onClick={() => onToggle(genre.id)}
      className={`
        border-2 rounded-lg p-3 text-center cursor-pointer transition-all duration-200
        ${
          isSelected
            ? "border-theme-link bg-theme-surface shadow-md"
            : "border-theme-primary bg-theme-secondary hover:border-theme-primary"
        }
      `}
    >
      <div className={`text-sm font-medium ${isSelected ? "text-theme-primary" : "text-theme-primary"}`}>
        {genre.name}
      </div>
    </div>
  );
};

export default GenreCard;
