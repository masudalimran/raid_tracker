import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RslAccountForm from "../forms/RslAccountForm";
import { CiImageOff, CiImageOn } from "react-icons/ci";
import { getNsfwStatus } from "../../helpers/getNsfwStatus";
// import { getShowSkillsStatus } from "../../helpers/getShowSkillsStatus"; // skills hidden
// import { GiBroadsword, GiZeusSword } from "react-icons/gi"; // skills hidden
import { RxHamburgerMenu } from "react-icons/rx";
import { FaSearch } from "react-icons/fa";
import Tooltip from "../utility/Tooltip";

interface AppBarProps {
  onMenuToggle: () => void;
}

function AppBar({ onMenuToggle }: AppBarProps) {
  const navigate = useNavigate();

  const [user, setUser] = useState<string>("");
  const [nsfw, setNsfw] = useState<boolean>(false);
  // const [showSkills, setShowSkills] = useState<boolean>(false); // skills hidden
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

  // const handleShowSkills = (show: boolean) => { // skills hidden
  //   localStorage.setItem("show_skills", show.toString());
  //   window.location.reload();
  // };

  useEffect(() => {
    setNsfw(getNsfwStatus());
    // setShowSkills(getShowSkillsStatus()); // skills hidden
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
      <div className="flex items-center gap-3">
        {/* Utility cluster */}
        <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-1">
          <Tooltip content="Search champions or teams">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("open-global-search"))}
              className="hidden sm:flex items-center gap-1.5 text-xs text-gray-300 hover:text-white hover:bg-white/10 rounded-md px-2 py-1 transition cursor-pointer"
            >
              <FaSearch size={12} />
              <span>Search</span>
              <kbd className="text-[9px] font-semibold text-gray-500 border border-white/10 rounded px-1">⌘K</kbd>
            </button>
          </Tooltip>

          <Tooltip content={nsfw ? "Hide Images" : "Show Images"}>
            <button
              type="button"
              onClick={() => handleNsfw(!nsfw)}
              className="p-1.5 rounded-md hover:bg-white/10 transition text-gray-300 hover:text-white cursor-pointer"
            >
              {nsfw ? <CiImageOn size={20} /> : <CiImageOff size={20} />}
            </button>
          </Tooltip>
        </div>

        {/* Skills toggle — hidden; skills tracking removed from UI */}

        {/* Account */}
        <div className="flex items-center gap-3 pl-3 border-l border-white/10">
          {user ? <RslAccountForm /> : (
            <span className="text-sm font-bold uppercase tracking-widest text-amber-400">
              Raid Tracker
            </span>
          )}
          {user && (
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="truncate max-w-[14ch]">{user}</span>
              <span className="text-gray-600">·</span>
              <button
                type="button"
                onClick={logout}
                className="text-gray-400 hover:text-amber-400 transition cursor-pointer font-medium"
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
