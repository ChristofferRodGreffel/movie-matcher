const ParticipantCard = ({ participant, isOwner, isSelf }) => {
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <img
          src={`https://api.dicebear.com/9.x/identicon/svg?seed=${participant.user_id}`}
          alt="User Avatar"
          className={`w-8 h-8 rounded-full object-cover`}
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
        <div className="font-medium text-gray-800 flex flex-col leading-tight">
          <p>{participant.users.username}</p>
          {isSelf && <p className="text-xs text-primary">(You)</p>}
        </div>
      </div>
      <div className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Ready</div>
    </div>
  );
};

export default ParticipantCard;
