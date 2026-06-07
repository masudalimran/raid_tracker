import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type RSL_Account from "../../models/RSL_Account";
import { MdAdd, MdEdit, MdKeyboardArrowDown } from "react-icons/md";
import RslAccountModal from "../modals/RslAccountModal";

export default function RslAccountSelect() {
  const [accounts, setAccounts] = useState<RSL_Account[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<RSL_Account | undefined>();

  const fetchAccounts = async () => {
    setAccounts([]);

    const storedAccounts = localStorage.getItem("supabase_rsl_account_list");
    if (storedAccounts) {
      const parsed: RSL_Account[] = JSON.parse(storedAccounts);
      setAccounts(parsed);

      const active = parsed.find((acc) => acc.is_currently_active);
      if (active) setSelectedId(active.id);
      return;
    }

    const { data, error } = await supabase.from("rsl_accounts").select("*");
    if (error) {
      console.error("Error fetching RSL accounts:", error);
      return;
    }

    if (data && data.length > 0) {
      const updated: RSL_Account[] = data.map((acc, index) => ({
        ...acc,
        is_currently_active: index === 0,
      }));

      setAccounts(updated);
      setSelectedId(updated[0].id);
      localStorage.setItem(
        "supabase_rsl_account_list",
        JSON.stringify(updated)
      );
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const currentAccount = accounts.find((a) => a.id === selectedId);

  const handleSelectAccount = (id: string) => {
    setSelectedId(id);
    const updated = accounts.map((acc) => ({
      ...acc,
      is_currently_active: acc.id === id,
    }));
    localStorage.setItem("supabase_rsl_account_list", JSON.stringify(updated));
    setIsDropdownOpen(false);
    window.location.reload();
  };

  const handleModalClose = (shouldReload: boolean) => {
    setIsModalOpen(false);
    setEditingAccount(undefined);
    setIsDropdownOpen(false);
    if (shouldReload) {
      fetchAccounts();
    }
  };

  const handleAddAccount = () => {
    setEditingAccount(undefined);
    setIsModalOpen(true);
  };

  const handleEditAccount = (account: RSL_Account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-800 border border-amber-500/30 hover:border-amber-500/60 text-amber-400 hover:text-amber-300 transition text-sm font-medium whitespace-nowrap"
          title="Switch or manage accounts"
        >
          <span className="truncate max-w-[12ch]">{currentAccount?.name || "Account"}</span>
          <MdKeyboardArrowDown size={16} className={`transition ${isDropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-1 w-48 bg-gray-800 border border-amber-500/30 rounded-lg shadow-lg z-50 overflow-hidden">
            {accounts.map((acc) => (
              <div key={acc.id} className="border-b border-gray-700 last:border-0">
                <div className="flex items-center justify-between px-3 py-2 hover:bg-gray-700/50 group">
                  <button
                    type="button"
                    onClick={() => handleSelectAccount(acc.id)}
                    className="flex-1 text-left text-sm text-gray-300 hover:text-white transition"
                  >
                    {acc.name}
                    {acc.is_currently_active && (
                      <span className="ml-2 inline-block w-2 h-2 bg-amber-400 rounded-full" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditAccount(acc)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded transition"
                    title="Edit account"
                  >
                    <MdEdit size={14} />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddAccount}
              className="w-full px-3 py-2 text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border-t border-gray-700 flex items-center gap-2 transition font-medium"
            >
              <MdAdd size={16} />
              Add Account
            </button>
          </div>
        )}
      </div>

      <RslAccountModal
        isOpen={isModalOpen}
        account={editingAccount}
        onClose={handleModalClose}
      />
    </>
  );
}
