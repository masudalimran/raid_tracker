import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { rslAccountSchema, type RslAccountFormData } from "../../lib/zod/rslAccountSchema";
import type RSL_Account from "../../models/RSL_Account";
import { useState } from "react";
import { useRslAccount } from "../../hooks/useRslAccount";

interface RslAccountFormProps {
  account?: RSL_Account;
  onClose: (shouldReload: boolean) => void;
}

export default function RslAccountForm({ account, onClose }: RslAccountFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { createRslAccount, updateRslAccount } = useRslAccount();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RslAccountFormData>({
    resolver: zodResolver(rslAccountSchema),
    defaultValues: {
      name: account?.name || "",
      plarium_id: account?.plarium_id || "",
    },
  });

  const onSubmit = async (data: RslAccountFormData) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const auth = JSON.parse(localStorage.getItem("supabase_auth") || "{}");

      if (account?.id) {
        await updateRslAccount(account.id, data);
      } else {
        await createRslAccount(data, auth.id);
      }

      // Invalidate cache
      localStorage.removeItem("supabase_rsl_account_list");
      setLoading(false);
      onClose(true);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "An error occurred";
      setErrorMessage(errorMsg);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Account Name
        </label>
        <input
          type="text"
          {...register("name")}
          placeholder="My RSL Account"
          className="input w-full"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Plarium ID
        </label>
        <input
          type="text"
          {...register("plarium_id")}
          placeholder="Your Plarium ID"
          className="input w-full"
        />
        {errors.plarium_id && (
          <p className="text-red-500 text-xs mt-1">{errors.plarium_id.message}</p>
        )}
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p className="text-red-600 text-sm">{errorMessage}</p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 btn-primary py-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Saving…" : account ? "Update Account" : "Create Account"}
        </button>
        <button
          type="button"
          onClick={() => onClose(false)}
          disabled={loading}
          className="flex-1 btn-secondary py-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
