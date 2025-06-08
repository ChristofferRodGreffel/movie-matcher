import ProfileAvatar from "../../components/ProfileAvatar";
import { IoIosCheckmark } from "react-icons/io";

const SelectionCard = ({ item, type, isSelected, onToggle, selectedBy, currentUserId }) => {
  const handleClick = () => {
    const id = type === "provider" ? item.provider_id : item.id;
    onToggle(id);
  };

  const isSelectedByCurrentUser = selectedBy === currentUserId;

  const renderContent = () => {
    if (type === "provider") {
      return (
        <>
          <img
            src={`https://image.tmdb.org/t/p/w92${item.logo_path}`}
            alt={item.provider_name}
            className="w-10 h-10 rounded mx-auto mb-2"
          />
          <div className={`text-xs ${isSelected ? "font-semibold text-theme-primary" : "text-theme-primary"}`}>
            {item.provider_name}
          </div>
        </>
      );
    } else {
      return (
        <div className={`text-sm font-medium ${isSelected ? "text-theme-primary" : "text-theme-primary"}`}>
          {item.name}
        </div>
      );
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative border-2 rounded-lg p-3 text-center cursor-pointer transition-all duration-200 hover:border-theme-link
        ${
          isSelected
            ? "bg-theme-surface border-theme-link"
            : "border-theme-primary bg-theme-secondary hover:border-theme-primary"
        }
      `}
    >
      {renderContent()}

      {isSelected && selectedBy && (
        <>
          {/* User indicator */}
          <div className="absolute -top-2 -right-2 flex items-center">
            <div
              className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
                border-theme-link border-2
              `}
            >
              <ProfileAvatar id={selectedBy} size="5" />
            </div>
          </div>

          {/* Selection checkmark */}
          <div className="absolute top-2 left-2">
            <div
              className={`
                w-4 h-4 rounded-full flex items-center justify-center bg-green-500
              `}
            >
              <IoIosCheckmark className="text-white" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SelectionCard;
