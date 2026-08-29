export interface EventDefinition {
  slug: string;
  label: string;
}

// Each entry gets its own tab + URL on the Events page (/events/:slug).
// Add new time-limited events here as they're released.
export const EVENT_DEFINITIONS: EventDefinition[] = [
  { slug: "summon-rush", label: "Summon Rush" },
];
