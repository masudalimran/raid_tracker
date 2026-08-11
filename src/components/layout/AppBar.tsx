import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RslAccountForm from "../forms/RslAccountForm";
import { CiImageOff, CiImageOn } from "react-icons/ci";
import { getNsfwStatus } from "../../helpers/getNsfwStatus";
// import { getShowSkillsStatus } from "../../helpers/getShowSkillsStatus"; // skills hidden
// import { GiBroadsword, GiZeusSword } from "react-icons/gi"; // skills hidden
import { RxHamburgerMenu } from "react-icons/rx";
import { FaSearch } from "react-icons/fa";
import { FaQuestion } from "react-icons/fa6";
import { TbRefreshDot } from "react-icons/tb";
import { MdBrightnessAuto, MdDarkMode, MdLightMode, MdCompareArrows } from "react-icons/md";
import Tooltip from "../utility/Tooltip";
import HelpGuideModal from "../modals/HelpGuideModal";
import { useTheme, type ThemePreference } from "../../hooks/useTheme";
import { useCompareList } from "../../hooks/useCompareList";
import { clearRoleReqCache } from "../../helpers/teamRoleOverrides";
import { fetchRslAccounts } from "../../helpers/handleRslAccounts";

const THEME_CYCLE: ThemePreference[] = ["light", "dark", "system"];
const THEME_META: Record<ThemePreference, { icon: typeof MdLightMode; label: string }> = {
  light: { icon: MdLightMode, label: "Light" },
  dark: { icon: MdDarkMode, label: "Dark" },
  system: { icon: MdBrightnessAuto, label: "System" },
};

interface AppBarProps {
  onMenuToggle: () => void;
}

function AppBar({ onMenuToggle }: AppBarProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<string>("");
  const [nsfw, setNsfw] = useState<boolean>(false);
  // const [showSkills, setShowSkills] = useState<boolean>(false); // skills hidden
  const [showHelp, setShowHelp] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const supabase_auth = localStorage.getItem("supabase_auth");
  const { preference, setPreference } = useTheme();
  const compareList = useCompareList();

  const handleGlobalRefresh = async () => {
    setRefreshing(true);
    localStorage.removeItem("supabase_champion_list");
    localStorage.removeItem("supabase_team_list");
    clearRoleReqCache();
    await fetchRslAccounts();
    window.location.reload();
  };

  const cycleTheme = () => {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(preference) + 1) % THEME_CYCLE.length];
    setPreference(next);
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
          <Tooltip content="Search champions or teams" position="bottom">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("open-global-search"))}
              className="hidden sm:flex items-center gap-1.5 text-xs text-gray-300 hover:text-white hover:bg-white/10 rounded-md px-2 py-1 transition cursor-pointer"
            >
              <FaSearch size={12} />
              <span>Search</span>
              <kbd className="text-[9px] font-semibold text-gray-500 border border-white/10 rounded px-1">⌘/</kbd>
            </button>
          </Tooltip>

          <Tooltip content={compareList.length > 0 ? `Champion Comparison (${compareList.length})` : "Champion Comparison"} position="bottom">
            <button
              type="button"
              onClick={() => navigate("/champion-comparison")}
              className="relative p-1.5 rounded-md hover:bg-white/10 transition text-gray-300 hover:text-white cursor-pointer"
            >
              <MdCompareArrows size={19} />
              {compareList.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-3.75 h-3.75 px-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  {compareList.length}
                </span>
              )}
            </button>
          </Tooltip>

          <Tooltip content={nsfw ? "Hide Images" : "Show Images"} position="bottom">
            <button
              type="button"
              onClick={() => handleNsfw(!nsfw)}
              className="p-1.5 rounded-md hover:bg-white/10 transition text-gray-300 hover:text-white cursor-pointer"
            >
              {nsfw ? <CiImageOn size={20} /> : <CiImageOff size={20} />}
            </button>
          </Tooltip>

          <Tooltip content="How to use this app" position="bottom">
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="p-1.5 rounded-md hover:bg-white/10 transition text-gray-300 hover:text-white cursor-pointer"
            >
              <FaQuestion size={15} />
            </button>
          </Tooltip>

          <Tooltip content="Refresh roster & teams from the cloud" position="bottom">
            <button
              type="button"
              onClick={handleGlobalRefresh}
              disabled={refreshing}
              className="p-1.5 rounded-md hover:bg-white/10 transition text-gray-300 hover:text-white cursor-pointer disabled:opacity-50"
            >
              <TbRefreshDot size={19} className={refreshing ? "animate-spin" : ""} />
            </button>
          </Tooltip>

          <Tooltip content={`Theme: ${THEME_META[preference].label} (click to change)`} position="bottom">
            <button
              type="button"
              onClick={cycleTheme}
              className="p-1.5 rounded-md hover:bg-white/10 transition text-gray-300 hover:text-white cursor-pointer"
            >
              {(() => {
                const ThemeIcon = THEME_META[preference].icon;
                return <ThemeIcon size={17} />;
              })()}
            </button>
          </Tooltip>
        </div>

        {/* Skills toggle — hidden; skills tracking removed from UI */}

        {/* Account */}
        <div className="flex items-center pl-3 border-l border-white/10">
          {user ? <RslAccountForm /> : (
            <span className="text-sm font-bold uppercase tracking-widest text-amber-400">
              Raid Tracker
            </span>
          )}
        </div>
      </div>

      {showHelp && <HelpGuideModal onClose={() => setShowHelp(false)} />}
    </header>
  );
}

export default AppBar;
