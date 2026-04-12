import { AiFillCloseSquare } from "react-icons/ai";

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gray-900 border-b border-white/10">
          <h2 className="font-bold text-white text-base">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition cursor-pointer p-0.5 rounded"
          >
            <AiFillCloseSquare
              size={26}
              title="Close"
              className="text-gray-400 hover:text-red-400 transition"
            />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
