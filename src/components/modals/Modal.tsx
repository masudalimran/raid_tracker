import { AiFillCloseSquare } from "react-icons/ai";
import { MdCancel } from "react-icons/md";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 bg-opacity-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-start gap-2">
          <h2 className="text-xl font-bold mb-4">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <AiFillCloseSquare
              size={32}
              title="Close"
              className="text-red-400 hover:text-red-500 transition cursor-pointer"
            />
          </button>
        </div>

        {/* Modal content */}
        {children}
      </div>
    </div>
  );
}
