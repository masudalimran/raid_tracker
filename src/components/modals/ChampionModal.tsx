import { useState } from "react";
import Modal from "./Modal";
import type IChampion from "../../models/IChampion";
import ChampionForm from "../forms/ChampionForm";

interface ChampionModalProps {
  champion?: IChampion;
  onClose: (should_reload: boolean) => void;
}

export default function ChampionModal({
  champion,
  onClose,
}: ChampionModalProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleOnClose = (should_reload: boolean) => {
    onClose(should_reload);
    setIsOpen(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      title={champion ? "Edit Champion" : "Add Champion"}
      onClose={() => handleOnClose(false)}
    >
      <ChampionForm champion={champion} onClose={handleOnClose} />
    </Modal>
  );
}
