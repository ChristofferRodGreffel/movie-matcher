const ProviderCard = ({ provider, isSelected, onToggle }) => {
  return (
    <div
      onClick={() => onToggle(provider.provider_id)}
      className={`
        border-2 rounded-lg p-3 text-center cursor-pointer transition-all duration-200 hover:shadow-lg
        ${
          isSelected
            ? "border-blue-500 bg-blue-50 shadow-md"
            : "border-gray-200 bg-white hover:border-gray-300"
        }
      `}
    >
      <img
        src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
        alt={provider.provider_name}
        className="w-10 h-10 rounded mx-auto mb-2"
      />
      <div
        className={`text-xs ${
          isSelected
            ? "font-semibold text-blue-800"
            : "text-gray-700"
        }`}
      >
        {provider.provider_name}
      </div>
    </div>
  );
};

export default ProviderCard;