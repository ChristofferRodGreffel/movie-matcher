import React from "react";
import ParticipantCard from "./ParticipantCard";

const ParticipantsList = ({ participants, session, userId }) => {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-theme-primary mb-4">Participants ({participants.length})</h3>
      <div className="grid gap-4">
        {participants.map((participant, index) => (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            isOwner={participant.user_id === session?.owner_id}
            isSelf={participant.user_id === userId}
          />
        ))}
      </div>
    </div>
  );
};

export default ParticipantsList;
