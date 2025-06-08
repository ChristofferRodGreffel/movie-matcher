import ProfileAvatar from "../ProfileAvatar";

const ParticipantCard = ({ participant, isOwner, isSelf }) => {
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-theme-primary rounded-lg">
      <div className="flex items-center gap-3">
        <ProfileAvatar size={8} id={participant.users.id} />
        <div className="font-medium text-theme-primary flex flex-col leading-tight">
          <p>{participant.users.username}</p>
          {isOwner && !isSelf && <p className="text-xs text-primary">(Host)</p>}
          {isSelf && <p className="text-xs text-primary">(You)</p>}
        </div>
      </div>
      <div className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Ready</div>
    </div>
  );
};

export default ParticipantCard;
