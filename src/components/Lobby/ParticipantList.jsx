import React from "react";
import ParticipantCard from "./ParticipantCard";

const ParticipantsList = ({ participants, session }) => {
  const getParticipantName = (participant, index) => {
    if (participant.user_id === session?.owner_id) {
      return "Host";
    }
    return `User ${index + 1}`;
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Participants ({participants.length})</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {participants.map((participant, index) => (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            name={getParticipantName(participant, index)}
            isOwner={participant.user_id === session?.owner_id}
          />
        ))}
      </div>
    </div>
  );
};

export default ParticipantsList;
