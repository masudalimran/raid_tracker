import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RslAccountForm from "../components/forms/RslAccountCreationForm";

export default function Onboarding() {
  const navigate = useNavigate();
  const [accountCreated, setAccountCreated] = useState(false);

  const handleClose = (shouldReload: boolean) => {
    if (shouldReload) {
      setAccountCreated(true);
      setTimeout(() => {
        localStorage.removeItem("supabase_rsl_account_list");
        navigate("/champions");
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1c1917_0%,#111827_100%)]" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <img
            className="h-12 object-contain"
            src="https://preview.redd.it/whats-the-font-used-in-the-raid-shadow-legends-logo-v0-z3i9f5g5ray81.png?width=640&crop=smart&auto=webp&s=277b1eb73daeb7ae735ddf4b30124200a7d925d5"
            alt="Raid Tracker"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gray-900 px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-bold text-white">Welcome to Raid Tracker</h2>
            <p className="text-xs text-gray-400 mt-0.5">Create your first RSL account</p>
          </div>

          <div className="px-6 py-5">
            {accountCreated ? (
              <div className="text-center py-8">
                <p className="text-green-600 font-medium">Account created! Redirecting…</p>
              </div>
            ) : (
              <>
                <p className="text-gray-600 text-sm mb-6">
                  Enter your Raid: Shadow Legends account details to get started.
                </p>
                <RslAccountForm onClose={handleClose} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
