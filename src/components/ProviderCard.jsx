import ProfileAvatar from "./ProfileAvatar";

const ProviderCard = ({ provider, isSelected, onToggle, selectedBy, currentUserId }) => {
  const isSelectedByCurrentUser = selectedBy === currentUserId;

  return (
    <div
      onClick={() => onToggle(provider.provider_id)}
      className={`
        relative border-2 rounded-lg p-3 text-center cursor-pointer transition-all duration-200 hover:border-theme-link
        ${
          isSelected
            ? "border-theme-link bg-theme-surface shadow-md"
            : "border-theme-primary bg-theme-secondary hover:border-theme-primary"
        }
      `}
    >
      <img
        src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
        alt={provider.provider_name}
        className="w-10 h-10 rounded mx-auto mb-2"
      />
      <div className={`text-xs ${isSelected ? "font-semibold text-theme-primary" : "text-theme-primary"}`}>
        {provider.provider_name}
      </div>

      {/* User avatar */}
      {isSelected && selectedBy && (
        <div className="absolute top-2 left-2">
          <ProfileAvatar id={selectedBy} size="5" />
        </div>
      )}
    </div>
  );
};

export default ProviderCard;
