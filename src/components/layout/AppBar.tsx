import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RslAccountForm from "../forms/RslAccountForm";
import { CiImageOff, CiImageOn } from "react-icons/ci";
import { getNsfwStatus } from "../../helpers/getNsfwStatus";
import { getAccountCoverage } from "../../helpers/getChampionPowerScore";
import { getShowSkillsStatus } from "../../helpers/getShowSkillsStatus";
import { GiBroadsword, GiZeusSword } from "react-icons/gi";
import { RxHamburgerMenu } from "react-icons/rx";

interface AppBarProps {
  onMenuToggle: () => void;
}

function AppBar({ onMenuToggle }: AppBarProps) {
  const navigate = useNavigate();

  const [user, setUser] = useState<string>("");
  const [nsfw, setNsfw] = useState<boolean>(false);
  const [showSkills, setShowSkills] = useState<boolean>(false);
  const [accountCoverage, setAccountCoverage] = useState<number>(0);
  const supabase_auth = localStorage.getItem("supabase_auth");

  const logout = () => {
    localStorage.removeItem("supabase_auth");
    localStorage.removeItem("supabase_champion_list");
    setUser("");
    navigate("/login");
  };

  const handleNsfw = (isNsfw: boolean) => {
    setNsfw(isNsfw);
    localStorage.setItem("img_nsfw", isNsfw.toString());
    window.location.reload();
  };

  const handleShowSkills = (show: boolean) => {
    localStorage.setItem("show_skills", show.toString());
    window.location.reload();
  };

  useEffect(() => {
    setNsfw(getNsfwStatus());
    setShowSkills(getShowSkillsStatus());
    getAccountCoverage().then(setAccountCoverage);
  }, []);

  useEffect(() => {
    if (supabase_auth) {
      const { email } = JSON.parse(supabase_auth);
      setUser(email);
    }
  }, [supabase_auth]);

  return (
    <header className="flex justify-between items-center bg-gray-900 h-[5vh] min-h-11 px-3 text-white shrink-0">
      {/* Left: hamburger + logo */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMenuToggle}
          className="md:hidden p-1.5 rounded-md hover:bg-white/10 transition"
          aria-label="Toggle navigation"
        >
          <RxHamburgerMenu size={20} />
        </button>
        <img
          className="h-8 object-contain"
          src="https://preview.redd.it/whats-the-font-used-in-the-raid-shadow-legends-logo-v0-z3i9f5g5ray81.png?width=640&crop=smart&auto=webp&s=277b1eb73daeb7ae735ddf4b30124200a7d925d5"
          alt="raid-logo"
        />
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Coverage badge */}
        <div
          className="flex items-center overflow-hidden rounded-md text-xs border border-amber-500/40"
          title="% of weighted content areas covered by teams"
        >
          <span className="hidden sm:block px-2 py-1 bg-amber-500 text-white font-semibold uppercase tracking-wide text-[10px]">
            Coverage
          </span>
          <span className="px-2 py-1 text-amber-400 font-bold">
            {accountCoverage.toFixed(1)}%
          </span>
        </div>

        {/* Image toggle */}
        {nsfw ? (
          <button
            type="button"
            onClick={() => handleNsfw(false)}
            className="p-1.5 rounded-md hover:bg-white/10 transition text-gray-300 hover:text-white"
            title="Hide Images"
          >
            <CiImageOn size={22} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleNsfw(true)}
            className="p-1.5 rounded-md hover:bg-white/10 transition text-gray-300 hover:text-white"
            title="Show Images"
          >
            <CiImageOff size={22} />
          </button>
        )}

        {/* Skills toggle */}
        {showSkills ? (
          <button
            type="button"
            onClick={() => handleShowSkills(false)}
            className="p-1.5 rounded-md hover:bg-white/10 transition text-gray-300 hover:text-white"
            title="Hide Skills"
          >
            <GiBroadsword size={20} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleShowSkills(true)}
            className="p-1.5 rounded-md hover:bg-white/10 transition text-gray-300 hover:text-white"
            title="Show Skills"
          >
            <GiZeusSword size={20} />
          </button>
        )}

        {/* Account */}
        <div className="pl-2 pr-1 text-right border-l border-white/10 ml-1">
          {user ? (
            <RslAccountForm />
          ) : (
            <span className="text-sm font-bold uppercase tracking-widest text-amber-400">
              Raid Tracker
            </span>
          )}
          {user && (
            <div className="flex items-center justify-end gap-1.5 text-[11px] text-gray-400">
              <span className="hidden sm:block truncate max-w-[14ch]">{user}</span>
              <span className="hidden sm:block text-gray-600">·</span>
              <button
                type="button"
                onClick={logout}
                className="text-gray-400 hover:text-amber-400 transition cursor-pointer underline"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AppBar;
