import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type RSL_Account from "../../models/RSL_Account";

export default function RslAccountSelect() {
  const [accounts, setAccounts] = useState<RSL_Account[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  const fetchAccounts = async () => {
    setAccounts([]); // optional: reset while loading

    // Check localStorage first
    const storedAccounts = localStorage.getItem("supabase_rsl_account_list");
    if (storedAccounts) {
      const parsed: RSL_Account[] = JSON.parse(storedAccounts);
      setAccounts(parsed);

      const active = parsed.find((acc) => acc.is_currently_active);
      if (active) setSelectedId(active.id);
      return;
    }

    // If not in localStorage, fetch from Supabase
    const { data, error } = await supabase.from("rsl_accounts").select("*");
    if (error) {
      console.error("Error fetching RSL accounts:", error);
      return;
    }

    if (data && data.length > 0) {
      // Inject is_currently_active: true for the first entry, false for the rest
      const updated: RSL_Account[] = data.map((acc, index) => ({
        ...acc,
        is_currently_active: index === 0,
      }));

      setAccounts(updated);
      setSelectedId(updated[0].id); // set first as selected
      localStorage.setItem(
        "supabase_rsl_account_list",
        JSON.stringify(updated)
      );
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAccounts();
  }, []);

  const handleChange = (id: string) => {
    setSelectedId(id);

    // Update "is_currently_active" in localStorage
    const updated = accounts.map((acc) => ({
      ...acc,
      is_currently_active: acc.id === id,
    }));
    localStorage.setItem("supabase_rsl_account_list", JSON.stringify(updated));

    window.location.reload();
  };

  return (
    <select
      value={selectedId}
      onChange={(e) => handleChange(e.target.value)}
      className="w-full border px-1 py-[.5] mt-1 rounded text-sm cursor-pointer"
    >
      {accounts.map((acc) => (
        <option key={acc.id} value={acc.id}>
          {acc.name}
        </option>
      ))}
    </select>
  );
}
