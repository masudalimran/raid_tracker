import { supabase } from "../lib/supabaseClient";
import type RSL_Account from "../models/RSL_Account";

// Fetches the RSL account list from Supabase, preserves the currently
// active account selection, and writes the result to localStorage.
export const fetchRslAccounts = async (): Promise<RSL_Account[]> => {
  const { data, error } = await supabase.from("rsl_accounts").select("*");
  if (error) {
    console.error("Error fetching RSL accounts:", error);
    return [];
  }

  if (!data || data.length === 0) return [];

  const storedAccounts = localStorage.getItem("supabase_rsl_account_list");
  let activeAccountId: string | null = null;

  if (storedAccounts) {
    const parsed: RSL_Account[] = JSON.parse(storedAccounts);
    const activeAccount = parsed.find((acc) => acc.is_currently_active);
    if (activeAccount) {
      activeAccountId = activeAccount.id;
    }
  }

  const updated: RSL_Account[] = data.map((acc) => ({
    ...acc,
    is_currently_active: activeAccountId ? acc.id === activeAccountId : data[0].id === acc.id,
  }));

  localStorage.setItem("supabase_rsl_account_list", JSON.stringify(updated));
  return updated;
};
