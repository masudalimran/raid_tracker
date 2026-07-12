import { createPortal } from "react-dom";
import { AiFillCloseSquare } from "react-icons/ai";
import Tooltip from "../utility/Tooltip";

interface ModalProps {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({
  isOpen,
  title = "",
  onClose,
  children,
}: ModalProps) {
  if (!isOpen) return null;

  // Portaled to document.body — this modal (and anything it renders, like a
  // ChampionForm's own <form>) can otherwise end up nested inside a caller's
  // <form> element (e.g. the team builder's champion editor is invoked from
  // inside TeamForm's <form>), which is invalid HTML and makes the inner
  // form's submit button unreliable.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gray-900 border-b border-white/10">
          <h2 className="font-bold text-white text-base">{title}</h2>
          <Tooltip content="Close">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition cursor-pointer p-0.5 rounded"
            >
              <AiFillCloseSquare
                size={26}
                className="text-gray-400 hover:text-red-400 transition"
              />
            </button>
          </Tooltip>
        </div>

        {/* Content */}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
