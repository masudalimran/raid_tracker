import { useState } from "react";
import Modal from "./Modal";
import RslAccountForm from "../forms/RslAccountCreationForm";
import type RSL_Account from "../../models/RSL_Account";
import { useRslAccount } from "../../hooks/useRslAccount";

interface RslAccountModalProps {
  isOpen: boolean;
  account?: RSL_Account;
  onClose: (shouldReload: boolean) => void;
}

export default function RslAccountModal({ isOpen, account, onClose }: RslAccountModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { deleteRslAccount } = useRslAccount();

  const handleDelete = async () => {
    if (!account?.id) return;
    setDeleting(true);
    try {
      await deleteRslAccount(account.id);
      localStorage.removeItem("supabase_rsl_account_list");
      onClose(true);
    } catch (error) {
      console.error("Error deleting account:", error);
      setDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen && !showDeleteConfirm}
      title={account ? "Edit RSL Account" : "Create RSL Account"}
      onClose={() => onClose(false)}
    >
      <div className="relative">
        <RslAccountForm account={account} onClose={onClose} />

        {account && (
          <div className="border-t border-gray-200 px-6 py-3">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              Delete Account
            </button>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <Modal isOpen={true} title="Delete Account?" onClose={() => setShowDeleteConfirm(false)}>
          <div className="px-6 py-5 space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete "{account?.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
