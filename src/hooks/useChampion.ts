import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type IChampion from "../models/IChampion";
import type { ChampionFormData } from "../lib/zod/championSchema";

export const useChampion = () => {
  const [loading, setLoading] = useState(false);

  // Add champion
  const addChampion = async (data: ChampionFormData) => {
    setLoading(true);
    const { data: inserted, error } = await supabase
      .from("champions")
      .insert([data])
      .select()
      .single();

    setLoading(false);

    if (error) throw error;

    return inserted;
  };

  // Update champion
  const updateChampion = async (id: string, updates: Partial<IChampion>) => {
    setLoading(true);
    const { data: updated, error } = await supabase
      .from("champions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    setLoading(false);
    if (error) throw error;
    return updated;
  };

  // Delete champion
  const deleteChampion = async (id: string) => {
    setLoading(true);
    const { data: deletedChampion, error } = await supabase
      .from("champions")
      .delete()
      .eq("id", id)
      .select()
      .single();
    setLoading(false);

    if (error) throw error;

    return deletedChampion;
  };

  return {
    loading,
    addChampion,
    updateChampion,
    deleteChampion,
  };
};
