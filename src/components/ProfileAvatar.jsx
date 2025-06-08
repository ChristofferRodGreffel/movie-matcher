import React from "react";

const ProfileAvatar = ({ id, size }) => {
  return (
    <div
      className={`min-w-${size} min-h-${size} w-${size} h-${size} aspect-square bg-gray-100 rounded-full overflow-hidden flex items-center justify-center`}
    >
      <img
        src={`https://api.dicebear.com/9.x/identicon/svg?seed=${id}`}
        alt="Profile"
        className={`min-w-${size} min-h-${size} w-${size} h-${size}`}
      />
    </div>
  );
};

export default ProfileAvatar;
