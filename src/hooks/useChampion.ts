import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { ChampionFormData } from "../lib/zod/championSchema";

type ChampionApiPayload = Omit<ChampionFormData, "skills" | "aura"> & {
  parsed_skills: string;
  parsed_aura: string | null;
};

export const useChampion = () => {
  const [loading, setLoading] = useState(false);

  const addChampion = async (data: ChampionFormData) => {
    setLoading(true);

    const { skills, aura, ...rest } = data;

    const payload: ChampionApiPayload = {
      ...rest,
      parsed_skills: JSON.stringify(skills ?? []),
      parsed_aura: aura ? JSON.stringify(aura) : null,
    };

    const { data: inserted, error } = await supabase
      .from("champions")
      .insert([payload])
      .select()
      .single();

    setLoading(false);

    if (error) throw error;

    return inserted;
  };

  const updateChampion = async (id: string, data: ChampionFormData) => {
    setLoading(true);

    const { skills, aura, ...rest } = data;

    const payload: ChampionApiPayload = {
      ...rest,
      parsed_skills: JSON.stringify(skills ?? []),
      parsed_aura: aura ? JSON.stringify(aura) : null,
    };

    const { data: updated, error } = await supabase
      .from("champions")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    setLoading(false);

    if (error) throw error;

    return updated;
  };

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
