import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { TeamFormData } from "../lib/zod/teamSchema";
import type ITeam from "../models/ITeam";

export const useTeam = () => {
  const [loading, setLoading] = useState(false);

  // Add Team
  const addTeam = async (data: TeamFormData) => {
    setLoading(true);
    const { data: inserted, error } = await supabase
      .from("teams")
      .insert([data])
      .select()
      .single();

    setLoading(false);

    if (error) throw error;

    return inserted;
  };

  // Update Team
  const updateTeam = async (id: string, updates: Partial<ITeam>) => {
    setLoading(true);
    const { data: updated, error } = await supabase
      .from("teams")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    setLoading(false);
    if (error) throw error;
    return updated;
  };

  return {
    loading,
    addTeam,
    updateTeam,
  };
};
