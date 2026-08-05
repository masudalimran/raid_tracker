import { useState } from "react";
import type { IconType } from "react-icons";
import { FaHome, FaUsers, FaChartBar, FaSearch, FaUserCog, FaTimes } from "react-icons/fa";
import { MdOutlineAutoAwesome, MdCasino } from "react-icons/md";
import { GiCrossedSwords } from "react-icons/gi";

interface GuideFeature {
  title: string;
  description: string;
}

interface GuideCategory {
  id: string;
  label: string;
  icon: IconType;
  emoji: string;
  tagline: string;
  accent: string;
  chip: string;
  tabActive: string;
  features: GuideFeature[];
}

const CATEGORIES: GuideCategory[] = [
  {
    id: "home",
    label: "Home",
    icon: FaHome,
    emoji: "🏠",
    tagline: "Your account's mission control — see where you are and what's next.",
    accent: "text-amber-600",
    chip: "bg-amber-100 text-amber-600",
    tabActive: "bg-amber-500/15 text-amber-400 border-amber-400",
    features: [
      { title: "Account Progression", description: "Tracks your stage (Beginning → End Game) and shows exactly which milestones are done vs. still needed." },
      { title: "Needs Attention", description: "Flags every saved team that's missing a required role, grouped by area, so you always know what to fix first." },
    ],
  },
  {
    id: "champions",
    label: "Champions",
    icon: FaUsers,
    emoji: "🧙",
    tagline: "Your full roster — add, tune, and keep it organized.",
    accent: "text-blue-600",
    chip: "bg-blue-100 text-blue-600",
    tabActive: "bg-blue-500/15 text-blue-400 border-blue-400",
    features: [
      { title: "Add / Edit", description: "Full stat entry with roster autofill — type a name that matches your roster and identity fields fill in instantly." },
      { title: "Smart Role Tagging", description: "Checking Stun, Freeze, Provoke, etc. auto-tags CC; Continuous Heal auto-tags Healer." },
      { title: "Search & Filter", description: "Instant search with a one-click clear (✕), plus sort by Rarity, stats, Book/Mastery priority and more." },
      { title: "Bulk Edit", description: "Multi-select champions to flip Booked/Mastery flags in one batch." },
      { title: "Import / Export", description: "The ⇅ icon next to search lets you bulk-import from JSON or export your whole roster." },
      { title: "Duplicate Cleanup", description: "Flags and merges accidental duplicate \"Other\" champions created from the Shard Log." },
    ],
  },
  {
    id: "teams",
    label: "Teams & Areas",
    icon: GiCrossedSwords,
    emoji: "⚔️",
    tagline: "Build the right team for every fight, and know if it's actually ready.",
    accent: "text-purple-600",
    chip: "bg-purple-100 text-purple-600",
    tabActive: "bg-purple-500/15 text-purple-400 border-purple-400",
    features: [
      { title: "Role Coverage", description: "Each area shows which required roles your team covers — fully customizable per area." },
      { title: "Suggested Team", description: "One click auto-picks the strongest available team that covers the most required roles." },
      { title: "Turn Order", description: "See your team's speed-sorted turn order at a glance, with tied speeds flagged." },
      { title: "Sidebar Badges", description: "A ✓ or a fraction badge next to every area tells you its coverage status without opening it." },
      { title: "Preview or Edit From the List", description: "Tap the pencil icon on any champion in the team builder for a quick card preview, or hold it to jump straight into editing." },
      { title: "Role Match at a Glance", description: "Each champion row shows whether it covers one of the area's required roles, right next to its name." },
    ],
  },
  {
    id: "priority",
    label: "Priority Queue",
    icon: MdOutlineAutoAwesome,
    emoji: "📘",
    tagline: "Stop guessing who needs books and masteries next.",
    accent: "text-orange-600",
    chip: "bg-orange-100 text-orange-600",
    tabActive: "bg-orange-500/15 text-orange-400 border-orange-400",
    features: [
      { title: "Smart Ranking", description: "Combines team usage, rarity, and role value into one priority score." },
      { title: "Grouped by Rarity", description: "Both the Books and Masteries panels are sectioned by rarity tier for fast scanning." },
    ],
  },
  {
    id: "shardlog",
    label: "Shard Log",
    icon: MdCasino,
    emoji: "🎰",
    tagline: "Track every pull, your pity counter, and celebrate the big ones.",
    accent: "text-red-600",
    chip: "bg-red-100 text-red-600",
    tabActive: "bg-red-500/15 text-red-400 border-red-400",
    features: [
      { title: "Pull Logging", description: "Log champion, rarity, and notes per shard type, with autofill from your roster." },
      { title: "Pity Tracking", description: "A live bar shows exactly how close you are to your guaranteed pull." },
      { title: "Pulls Per Week", description: "A trend chart shows your pull volume over the last 10 weeks." },
      { title: "Legendary Reveal 🎉", description: "Log a Legendary or Mythical pull and watch the celebration animation play." },
      { title: "Cloud Sync & Export", description: "Save/fetch your log to the cloud, or export the whole thing as a CSV." },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: FaChartBar,
    emoji: "📊",
    tagline: "Your roster, by the numbers.",
    accent: "text-green-600",
    chip: "bg-green-100 text-green-600",
    tabActive: "bg-green-500/15 text-green-400 border-green-400",
    features: [
      { title: "Roster Overview", description: "Total, built, in-team, and untouched champion counts at a glance." },
      { title: "Rarity & Role Charts", description: "Bar or pie breakdowns of your roster by rarity and by role." },
      { title: "Team Role Gaps", description: "See which required roles are missing most often across all your saved teams." },
    ],
  },
  {
    id: "search",
    label: "Quick Search",
    icon: FaSearch,
    emoji: "⚡",
    tagline: "Jump anywhere without touching the sidebar.",
    accent: "text-cyan-600",
    chip: "bg-cyan-100 text-cyan-600",
    tabActive: "bg-cyan-500/15 text-cyan-400 border-cyan-400",
    features: [
      { title: "⌘/ / Ctrl+/", description: "Open the command palette from anywhere in the app — or click Search in the top bar." },
      { title: "Search Everything", description: "Type a champion's name to jump to it, or an area's name to open its team page directly." },
    ],
  },
  {
    id: "account",
    label: "Account & Settings",
    icon: FaUserCog,
    emoji: "⚙️",
    tagline: "Manage who's playing and how things look.",
    accent: "text-gray-600",
    chip: "bg-gray-200 text-gray-600",
    tabActive: "bg-white/15 text-white border-white/40",
    features: [
      { title: "Multiple RSL Accounts", description: "Switch between tracked accounts from the top bar — each keeps its own roster and teams." },
      { title: "Image Visibility", description: "Toggle champion images on/off app-wide, handy in public or NSFW-sensitive spots." },
      { title: "Logout", description: "Lives at the bottom of the sidebar now, right next to your account email." },
    ],
  },
];

interface HelpGuideModalProps {
  onClose: () => void;
}

export default function HelpGuideModal({ onClose }: HelpGuideModalProps) {
  const [activeId, setActiveId] = useState(CATEGORIES[0].id);
  const active = CATEGORIES.find((c) => c.id === activeId) ?? CATEGORIES[0];

  return (
    <div
      className="fixed inset-0 z-70 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="reveal-pop-in bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-gray-900 to-gray-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl shrink-0">🧭</span>
            <div className="min-w-0">
              <h2 className="font-bold text-white text-lg truncate">How to Use Raid Tracker</h2>
              <p className="text-xs text-gray-400 truncate">A quick tour of every feature — pick a topic to explore</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 flex-col md:flex-row">
          {/* Category tabs */}
          <div className="shrink-0 bg-gray-900 md:w-56 md:border-r border-white/10">
            <div className="flex md:flex-col gap-1 p-2 overflow-x-auto md:overflow-x-visible">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = cat.id === activeId;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveId(cat.id)}
                    className={`flex items-center gap-2 shrink-0 text-left text-xs font-semibold px-3 py-2 rounded-lg border transition cursor-pointer whitespace-nowrap
                      ${isActive ? cat.tabActive : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5"}`}
                  >
                    <Icon size={14} className="shrink-0" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content pane */}
          <div className="flex-1 min-h-0 overflow-y-auto p-5 bg-gray-50 dark:bg-gray-950">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{active.emoji}</span>
              <h3 className={`text-lg font-bold ${active.accent}`}>{active.label}</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{active.tagline}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {active.features.map((f) => (
                <div
                  key={f.title}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3.5 hover:shadow-md hover:-translate-y-0.5 transition"
                >
                  <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${active.accent}`}>{f.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
