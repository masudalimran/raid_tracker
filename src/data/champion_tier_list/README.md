# Champion Tier List Data

Per-rarity, per-faction JSON files (`<rarity>/<faction_slug>.json`) giving each champion three
0-100 scores: `support`, `dpsPotential`, `tankiness`.

## Source & methodology

Champion rosters, roles, and affinities are cross-checked against HellHades and AyumiLove
(ayumilove.net's overall S/A/B/C/D community tier rankings, and champion guides). The three
scores are **not** official numbers — HellHades/AyumiLove rate champions with letter grades per
game mode (Arena, Clan Boss, Dungeons, etc.), not a single support/dps/tankiness triplet, so
these are a best-effort derivation: each champion's overall tier rank sets a baseline, and its
role (Attack/Support/Defense/HP) shapes how that baseline splits across the three axes, refined
with anything specific noted in that champion's guide (e.g. self-sustain, revives, taunts).

Treat these as a rough, at-a-glance summary for the champion card — not a precision ranking.

## Coverage

All 16 factions' `legendary/` and `epic/` files are done. `rare/` is still empty.
