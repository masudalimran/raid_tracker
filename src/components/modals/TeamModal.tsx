import { useState } from "react";
import Modal from "./Modal";
import TeamForm from "../forms/TeamForm";
import type IChampion from "../../models/IChampion";
import type ITeam from "../../models/ITeam";

interface TeamModalProps {
  teamName: string;
  team?: ITeam;
  championList: IChampion[];
  maxChampions?: number;
  onClose: (should_reload: boolean) => void;
}

export default function TeamModal({
  teamName,
  team,
  championList,
  maxChampions,
  onClose,
}: TeamModalProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleOnClose = (should_reload: boolean) => {
    onClose(should_reload);
    setIsOpen(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      title={`${team ? "Edit" : "Add"} ${teamName} Team`}
      onClose={() => handleOnClose(false)}
    >
      <TeamForm
        maxChampions={maxChampions}
        onCancel={() => handleOnClose(false)}
        onSave={() => handleOnClose(true)}
        teamName={teamName}
        team={team}
        championList={championList}
      />
    </Modal>
  );
}
