import type IChampion from "../models/IChampion";
import type ITeam from "../models/ITeam";
import { fromSlug } from "./fromSlug";

// Mirrors Priority Queue's max level — a champion under this with 1+ team
// still has leveling left to do.
const MAX_LEVEL = 60;

function buildTeamCountMap(teams: ITeam[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const team of teams) {
    for (const id of team.champion_ids) {
      map.set(id, (map.get(id) ?? 0) + 1);
    }
  }
  return map;
}

/**
 * Builds a plain-text snapshot of the account — full roster, every team's
 * composition, and Priority Queue status — meant to be pasted as context
 * into an AI chat assistant. Uses Priority Queue's three filter rules
 * (not its detailed ranking) so the buckets match what that page tracks.
 */
export function buildAiChatContext(champions: IChampion[], teams: ITeam[]): string {
  const teamCounts = buildTeamCountMap(teams);
  const nameById = new Map(champions.map((c) => [String(c.id), c.name]));

  const lines: string[] = [];
  lines.push("RAID: Shadow Legends — Account Context");
  lines.push(`Generated: ${new Date().toISOString().split("T")[0]}`);
  lines.push("");

  lines.push(`CHAMPIONS (${champions.length} total)`);
  lines.push(champions.map((c) => c.name).join(", ") || "(none)");
  lines.push("");

  lines.push(`TEAMS (${teams.length} total)`);
  if (teams.length === 0) {
    lines.push("(none)");
  } else {
    for (const team of teams) {
      const championNames = team.champion_ids
        .map((id) => nameById.get(id))
        .filter((name): name is string => !!name);
      const stage = team.clearing_stage ? ` — ${team.clearing_stage}` : "";
      lines.push(`- ${fromSlug(team.team_name)}${stage}: ${championNames.join(", ") || "(empty)"}`);
    }
  }
  lines.push("");

  const needsBooks = champions.filter(
    (c) => c.is_book_needed && !c.is_booked && (teamCounts.get(String(c.id)) ?? 0) > 0,
  );
  const needsMasteries = champions.filter(
    (c) => c.is_mastery_needed && !c.has_mastery && (teamCounts.get(String(c.id)) ?? 0) > 0,
  );
  const needsLevel = champions.filter(
    (c) => (teamCounts.get(String(c.id)) ?? 0) > 0 && c.level < MAX_LEVEL,
  );

  lines.push("PRIORITY QUEUE");
  lines.push(`Needs Books (${needsBooks.length}): ${needsBooks.map((c) => c.name).join(", ") || "(none)"}`);
  lines.push(`Needs Masteries (${needsMasteries.length}): ${needsMasteries.map((c) => c.name).join(", ") || "(none)"}`);
  lines.push(`Needs Level (${needsLevel.length}): ${needsLevel.map((c) => c.name).join(", ") || "(none)"}`);

  return lines.join("\n");
}
