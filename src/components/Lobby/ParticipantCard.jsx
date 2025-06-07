import React from "react";

const ParticipantCard = ({ participant, name, isOwner }) => {
  console.log(participant);
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <img
          src={`https://api.dicebear.com/9.x/identicon/svg?seed=${participant.id}`}
          alt="User Avatar"
          className={`w-8 h-8 rounded-full object-cover`}
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
        <span className="font-medium text-gray-800">
          {name}
          {isOwner && <span className="text-xs text-blue-500 ml-2">(Host)</span>}
        </span>
      </div>
      <div className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Ready</div>
    </div>
  );
};

export default ParticipantCard;
