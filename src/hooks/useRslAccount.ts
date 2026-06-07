import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { RslAccountFormData } from "../lib/zod/rslAccountSchema";

export const useRslAccount = () => {
  const [loading, setLoading] = useState(false);

  const createRslAccount = async (data: RslAccountFormData, userId: string) => {
    setLoading(true);
    const payload = {
      name: data.name,
      plarium_id: data.plarium_id,
      user_id: userId,
    };

    const { data: inserted, error } = await supabase
      .from("rsl_accounts")
      .insert([payload])
      .select()
      .single();

    setLoading(false);
    if (error) throw error;
    return inserted;
  };

  const updateRslAccount = async (id: string, data: RslAccountFormData) => {
    setLoading(true);
    const payload = {
      name: data.name,
      plarium_id: data.plarium_id,
    };

    const { data: updated, error } = await supabase
      .from("rsl_accounts")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    setLoading(false);
    if (error) throw error;
    return updated;
  };

  const deleteRslAccount = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from("rsl_accounts").delete().eq("id", id);

    setLoading(false);
    if (error) throw error;
  };

  return { loading, createRslAccount, updateRslAccount, deleteRslAccount };
};
