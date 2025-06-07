import React from "react";

const ProfileAvatar = ({ id, size }) => {
  return (
    <div
      className={`min-w-${size} min-h-${size} w-${size} h-${size} bg-gray-50 rounded-full overflow-hidden flex items-center justify-center`}
    >
      <img
        src={`https://api.dicebear.com/9.x/identicon/svg?seed=${id}`}
        alt="Profile"
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default ProfileAvatar;
