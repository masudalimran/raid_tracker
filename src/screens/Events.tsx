import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MdEvent } from "react-icons/md";
import { EVENT_DEFINITIONS } from "../data/eventDefinitions";
import SummonRush from "./events/SummonRush";

const DEFAULT_EVENT_SLUG = EVENT_DEFINITIONS[0].slug;

export default function Events() {
  const navigate = useNavigate();
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const activeEvent = EVENT_DEFINITIONS.find((e) => e.slug === eventSlug);

  // An unknown/missing slug (e.g. bare /events) settles on the first event's
  // URL rather than silently rendering it, so the address bar always matches
  // what's on screen — same pattern as Shard Log's tab routing.
  useEffect(() => {
    if (!activeEvent) {
      navigate(`/events/${DEFAULT_EVENT_SLUG}`, { replace: true });
    }
  }, [activeEvent, navigate]);

  return (
    <div className="overflow-auto h-[92vh] p-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MdEvent className="text-amber-500" size={22} />
          Events
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Tools for time-limited events.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {EVENT_DEFINITIONS.map((event) => (
          <button
            key={event.slug}
            type="button"
            onClick={() => navigate(`/events/${event.slug}`)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer
              ${activeEvent?.slug === event.slug
                ? "bg-amber-500 text-white shadow"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
          >
            {event.label}
          </button>
        ))}
      </div>

      {activeEvent?.slug === "summon-rush" && <SummonRush />}
    </div>
  );
}
