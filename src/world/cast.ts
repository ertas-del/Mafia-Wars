/**
 * The 50-character street cast, ported from the Mafia-game character bible
 * (`src/data/noirPresets.ts` at b4c8784). Only id, number, name, role, bio,
 * family and the nine traits are copied. Five surnames are replaced with
 * invented ones (spec D3). Pure module: no DOM access, Node-runnable.
 */

// ---- Trait unions, copied exactly from Mafia-game noirPresets.ts ----

export const HEADGEAR_STYLES = [
  'fedora-band', 'white-fedora', 'bald', 'flatcap', 'blow-dried', 'buzz-cut', 'feathered', 'comb-over',
  'slicked-grey', 'permed-hair', 'dock-cap', 'captain-cap', 'grey-bun', 'curly-hair', 'bouffant',
  'short-crop', 'police-cap', 'red-crop',
] as const;
export type HeadgearStyle = (typeof HEADGEAR_STYLES)[number];

export const EYEWEAR_STYLES = [
  'none', 'round-glasses', 'reading-chain', 'wire-glasses', 'dark-shades', 'amber-shades',
  'oversized-glasses', 'green-aviators', 'thick-black-glasses', 'half-moon-glasses', 'loupe',
] as const;
export type EyewearStyle = (typeof EYEWEAR_STYLES)[number];

export const OUTFIT_STYLES = [
  'chalk-overcoat', 'double-coats', 'apron-waistcoat', 'chalk-jacket', 'cardigan-tie', 'tight-jacket',
  'satin-bomber', 'tan-raincoat', 'white-linen', 'turtleneck-overcoat', 'camel-overcoat',
  'white-club-jacket', 'rumpled-suit', 'leather-trench', 'amber-silk-shirt', 'canvas-work-jacket',
  'amber-blazer-skirt', 'emerald-windbreaker', 'houndstooth-scarf', 'racing-jacket', 'emerald-tracksuit',
  'hoodie-vest', 'customs-uniform', 'emerald-skirt-suit', 'riveted-peacoat', 'mechanic-coveralls',
  'diner-apron', 'disco-leather', 'velour-cardigan', 'velour-jacket', 'pizza-apron', 'velour-smoking',
  'velour-overcoat', 'velour-vest', 'velour-matriarch', 'nypd-uniform', 'leopard-blazer', 'black-peacoat',
] as const;
export type OutfitStyle = (typeof OUTFIT_STYLES)[number];

export const HELD_ITEM_STYLES = [
  'empty', 'brass-knuckles', 'briefcase', 'blueprints', 'court-papers', 'ledger-case', 'clipboard',
  'rubber-stamp', 'wrench', 'cargo-hook', 'pipe', 'cigar', 'two-cigars', 'walking-cane', 'coffee-badge',
  'headphones-badge', 'nightstick-envelope', 'betting-slips',
] as const;
export type HeldItemStyle = (typeof HELD_ITEM_STYLES)[number];

export const BUILD_STYLES = ['stocky', 'lean', 'heavy', 'tall', 'frail', 'female'] as const;
export type BuildStyle = (typeof BUILD_STYLES)[number];

export const FACIAL_STYLES = ['none', 'scar', 'moustache', 'beard', 'red-beard', 'stubble', 'lipstick'] as const;
export type FacialHairOrScar = (typeof FACIAL_STYLES)[number];

export type CastFamily = 'corvini' | 'bellini' | 'valenti' | 'moretti' | 'rastelli' | 'outside';
export const CAST_FAMILIES: readonly CastFamily[] = ['corvini', 'bellini', 'valenti', 'moretti', 'rastelli', 'outside'];

/** Family accent colours from Mafia-game `COMMISSION_FAMILIES[].accentHex`. */
export const FAMILY_ACCENT: Readonly<Record<CastFamily, string>> = Object.freeze({
  corvini: '#E03131',
  bellini: '#F59F00',
  valenti: '#10B981',
  moretti: '#3B82F6',
  rastelli: '#A855F7',
  outside: '#94A3B8',
});

export interface CharacterTraits {
  headgear: HeadgearStyle;
  eyewear: EyewearStyle;
  outfit: OutfitStyle;
  heldItem: HeldItemStyle;
  build: BuildStyle;
  facialHairOrScar: FacialHairOrScar;
  hairColorHex: string;
  primaryGarmentHex: string;
  secondaryGarmentHex: string;
}

export interface CastMember {
  id: string;
  num: number;
  name: string;
  role: string;
  bio: string;
  familyId: CastFamily;
  traits: CharacterTraits;
}

type TraitRow = [HeadgearStyle, EyewearStyle, OutfitStyle, HeldItemStyle, BuildStyle, FacialHairOrScar, string, string, string];

function m(num: number, id: string, name: string, role: string, bio: string, familyId: CastFamily, t: TraitRow): CastMember {
  const traits: CharacterTraits = Object.freeze({
    headgear: t[0], eyewear: t[1], outfit: t[2], heldItem: t[3], build: t[4], facialHairOrScar: t[5],
    hairColorHex: t[6], primaryGarmentHex: t[7], secondaryGarmentHex: t[8],
  });
  return Object.freeze({ id, num, name, role, bio, familyId, traits });
}

/** The 50 characters, in bible order. Renamed (D3): Ravasi, Cardella, Lomarco, Fiorella, Castagna. */
export const CAST: readonly CastMember[] = Object.freeze([
  // corvini
  m(1, 'corvini-01-aldo-ferraro', 'Aldo "The Undertaker" Ferraro', 'Underboss · Mulberry Street', 'Never smiles, attends every funeral, remembers every debt.', 'corvini',
    ['fedora-band', 'none', 'chalk-overcoat', 'empty', 'tall', 'none', '#CBD5E1', '#1E293B', '#0F172A']),
  m(2, 'corvini-02-nicky-marchese', 'Nicky "Two Coats" Marchese', 'Capo · Garment Center Trucking', 'Always cold, always wearing two coats, always counting.', 'corvini',
    ['bald', 'round-glasses', 'double-coats', 'empty', 'stocky', 'none', '#94A3B8', '#B4834E', '#27272A']),
  m(3, 'corvini-03-frankie-lupo', 'Frankie "Fishbones" Lupo', 'Capo · Fulton Fish Market', 'Runs the 4 a.m. unloading crews and smells like it.', 'corvini',
    ['flatcap', 'none', 'apron-waistcoat', 'empty', 'stocky', 'scar', '#475569', '#334155', '#1E293B']),
  m(4, 'corvini-04-tommy-grasso', 'Tommy "Signature" Grasso', 'Soldato & Numbers Runner', 'Signs every slip with a flourish; the cops have a folder of them.', 'corvini',
    ['blow-dried', 'none', 'chalk-jacket', 'empty', 'lean', 'none', '#1E1B18', '#1E293B', '#090A0F']),
  m(5, 'corvini-05-rocco-pagano', 'Rocco "The Mixer" Pagano', 'Soldato · Concrete Pours', 'Every truck that doesn\'t pay gets a flat tyre.', 'corvini',
    ['short-crop', 'none', 'apron-waistcoat', 'empty', 'heavy', 'moustache', '#27272A', '#272E3B', '#CBD5E1']),
  m(6, 'corvini-06-benny-calabrese', 'Benny "Espresso" Calabrese', 'Associate · Social Club Keeper', 'Hears everything over the espresso machine.', 'corvini',
    ['flatcap', 'reading-chain', 'cardigan-tie', 'empty', 'frail', 'none', '#D4D4D8', '#5C4033', '#F1F5F9']),
  m(7, 'corvini-07-gino-fiorella', 'Gino "Velvet" Fiorella', 'Enforcer · Mulberry Crew', 'Soft-spoken, enormous, wears a jacket two sizes too small.', 'corvini',
    ['buzz-cut', 'none', 'tight-jacket', 'brass-knuckles', 'heavy', 'scar', '#18181B', '#1E293B', '#334155']),
  m(8, 'corvini-08-joey-abruzzo', 'Joey "Dimes" Abruzzo', 'Courier · Nineteen', 'Fast feet, faster mouth.', 'corvini',
    ['feathered', 'none', 'satin-bomber', 'briefcase', 'lean', 'none', '#27272A', '#111827', '#1D4ED8']),
  m(9, 'corvini-09-lorenzo-ravasi', 'Lorenzo "The Ledger" Ravasi', 'Bagman · Monday Envelopes', 'Collects Monday envelopes and never writes anything down.', 'corvini',
    ['comb-over', 'wire-glasses', 'tan-raincoat', 'empty', 'lean', 'none', '#3F3F46', '#A68A64', '#1E293B']),
  m(10, 'corvini-10-sal-dinapoli', 'Sal "The Saint" DiNapoli', 'Capo · September Feast & Gambling', 'Runs the feast every September and the gambling behind it.', 'corvini',
    ['white-fedora', 'none', 'white-linen', 'empty', 'tall', 'none', '#52525B', '#E2E8F0', '#F8FAFC']),
  // bellini
  m(11, 'bellini-11-vito-caruso', 'Vito "The Whisper" Caruso', 'Underboss · Midtown', 'Has not spoken above a whisper, or into a phone, since 1971.', 'bellini',
    ['fedora-band', 'dark-shades', 'turtleneck-overcoat', 'empty', 'frail', 'none', '#94A3B8', '#18181B', '#52525B']),
  m(12, 'bellini-12-augie-rinaldi', 'Augie "Blueprint" Rinaldi', 'Capo · Skyscraper Pour Sites', 'Reads a construction plan for which floors haven\'t paid yet.', 'bellini',
    ['slicked-grey', 'dark-shades', 'camel-overcoat', 'blueprints', 'tall', 'none', '#475569', '#B4834E', '#27272A']),
  m(13, 'bellini-13-dom-ferrante', 'Dom "Penthouse" Ferrante', 'Capo · Midtown Nightlife', 'Owns three clubs on paper and none on record.', 'bellini',
    ['blow-dried', 'amber-shades', 'white-club-jacket', 'empty', 'lean', 'none', '#18181B', '#F1F5F9', '#09090B']),
  m(14, 'bellini-14-charlie-esposito', 'Charlie "Front Door" Esposito', 'Front Man · Leases & Subpoenas', 'His name is on every lease, every licence and every subpoena.', 'bellini',
    ['comb-over', 'none', 'rumpled-suit', 'court-papers', 'stocky', 'none', '#52525B', '#5C4033', '#D97706']),
  m(15, 'bellini-15-mikey-castagna', 'Mikey "Nine Lives" Castagna', 'Soldato · Westside Block', 'Shot nine times over twenty years; still walks the block every night.', 'bellini',
    ['short-crop', 'dark-shades', 'leather-trench', 'empty', 'stocky', 'scar', '#27272A', '#18181B', '#27272A']),
  m(16, 'bellini-16-ray-morello', 'Ray "Silk" Morello', 'Soldato & Loan Shark', 'The interest is a point a week; the shirts are real silk.', 'bellini',
    ['blow-dried', 'dark-shades', 'amber-silk-shirt', 'cigar', 'lean', 'moustache', '#18181B', '#D97706', '#E5E0D8']),
  m(17, 'bellini-17-lou-gentile', 'Lou "Rebar" Gentile', 'Enforcer · Construction Sites', 'Settles union disputes personally.', 'bellini',
    ['bald', 'dark-shades', 'canvas-work-jacket', 'brass-knuckles', 'heavy', 'beard', '#27272A', '#785A3C', '#3F3F46']),
  m(18, 'bellini-18-rosalie-conti', 'Rosalie "Pencil" Conti', 'Bookkeeper · Offshore Ledgers', 'Keeps the offshore books in a brass-latched case and in her head.', 'bellini',
    ['permed-hair', 'oversized-glasses', 'amber-blazer-skirt', 'ledger-case', 'female', 'lipstick', '#271E1A', '#D97706', '#27272A']),
  // valenti
  m(19, 'valenti-19-eddie-pellegrino', 'Eddie "Manifest" Pellegrino', 'Capo · JFK Hangar 7', 'Decides which crates fall off which trucks.', 'valenti',
    ['short-crop', 'green-aviators', 'emerald-windbreaker', 'clipboard', 'stocky', 'moustache', '#1F2937', '#A68A64', '#10B981']),
  m(20, 'valenti-20-johnny-lomarco', 'Johnny "Runway" Lomarco', 'Soldato & Cargo Handler', 'Knows every forklift shift and every blind spot.', 'valenti',
    ['short-crop', 'green-aviators', 'emerald-windbreaker', 'empty', 'lean', 'none', '#27272A', '#1E293B', '#F97316']),
  m(21, 'valenti-21-frankie-cardella', 'Frankie "Photo Finish" Cardella', 'Bookie · Aqueduct Wire', 'Never bets, always collects.', 'valenti',
    ['slicked-grey', 'green-aviators', 'houndstooth-scarf', 'betting-slips', 'lean', 'none', '#64748B', '#6B7280', '#10B981']),
  m(22, 'valenti-22-danny-bianchi', 'Danny "Tailwind" Bianchi', 'Getaway Driver · Queens Corridor', 'Has never been caught and never shuts up about it.', 'valenti',
    ['feathered', 'green-aviators', 'racing-jacket', 'empty', 'lean', 'none', '#3F2E21', '#18181B', '#10B981']),
  m(23, 'valenti-23-carlo-marino', 'Carlo "Sweatsuit" Marino', 'Soldato · Hijacked Apparel', 'Lives in a tracksuit, owns forty of them, all stolen off the same flight.', 'valenti',
    ['blow-dried', 'green-aviators', 'emerald-tracksuit', 'cigar', 'stocky', 'none', '#18181B', '#1E293B', '#10B981']),
  m(24, 'valenti-24-gus-parisi', 'Gus "Forklift" Parisi', 'Enforcer · JFK Warehouse', 'Lifts things nobody else can, including people.', 'valenti',
    ['bald', 'green-aviators', 'hoodie-vest', 'brass-knuckles', 'heavy', 'stubble', '#3F3F46', '#4B5563', '#10B981']),
  m(25, 'valenti-25-vinnie-lombardo', 'Vinnie "Customs" Lombardo', 'Associate · Customs Shed Inspector', 'Stamps whatever he\'s paid to stamp.', 'valenti',
    ['police-cap', 'green-aviators', 'customs-uniform', 'rubber-stamp', 'stocky', 'stubble', '#475569', '#7DD3FC', '#1E3A8A']),
  m(26, 'valenti-26-marie-sorrentino', 'Marie "Departures" Sorrentino', 'Associate · Rockaway Travel Agency', 'Books flights, cargo space, and alibis.', 'valenti',
    ['feathered', 'green-aviators', 'emerald-skirt-suit', 'empty', 'female', 'lipstick', '#5C3A21', '#10B981', '#F8FAFC']),
  // moretti
  m(27, 'moretti-27-butch-ferrigno', 'Butch "Anchor" Ferrigno', 'Capo · Red Hook Piers', 'Nothing comes off a ship without his nod.', 'moretti',
    ['dock-cap', 'none', 'riveted-peacoat', 'empty', 'heavy', 'stubble', '#64748B', '#1E293B', '#94A3B8']),
  m(28, 'moretti-28-tony-demarco', 'Tony "Bilge" DeMarco', 'Soldato · Ship Holds', 'Hides things in ship holds nobody else will climb into.', 'moretti',
    ['dock-cap', 'none', 'riveted-peacoat', 'empty', 'lean', 'stubble', '#27272A', '#172554', '#94A3B8']),
  m(29, 'moretti-29-petey-valli', 'Petey "Chop Shop" Valli', 'Associate · Gowanus Chop Shop', 'Can strip a Cadillac in forty minutes.', 'moretti',
    ['dock-cap', 'none', 'mechanic-coveralls', 'wrench', 'lean', 'stubble', '#1E293B', '#1D4ED8', '#F8FAFC']),
  m(30, 'moretti-30-connie-amendola', 'Connie "Galley" Amendola', 'Associate · Red Hook Pier Diner', 'Feeds the longshoremen and lends them money at a point a week.', 'moretti',
    ['grey-bun', 'none', 'diner-apron', 'empty', 'female', 'none', '#94A3B8', '#2563EB', '#475569']),
  m(31, 'moretti-31-bruno-castellucci', 'Bruno "The Crane" Castellucci', 'Enforcer · Gantry Crane Operator', 'A crane operator who sometimes forgets what\'s on the hook.', 'moretti',
    ['dock-cap', 'none', 'riveted-peacoat', 'cargo-hook', 'heavy', 'beard', '#18181B', '#0F172A', '#94A3B8']),
  m(32, 'moretti-32-richie-caputo', 'Richie "Disco" Caputo', 'Soldato · Bensonhurst & Docks', 'Out at the clubs every night, on the docks every morning.', 'moretti',
    ['blow-dried', 'none', 'disco-leather', 'empty', 'lean', 'none', '#18181B', '#18181B', '#3B82F6']),
  m(33, 'moretti-33-kevin-dunne', 'Kevin "Tugboat" Dunne', 'Associate · Harbour Tug Captain', 'An Irish tug captain who moves cargo the harbour police never see.', 'moretti',
    ['captain-cap', 'none', 'riveted-peacoat', 'pipe', 'stocky', 'red-beard', '#B45309', '#1E293B', '#2563EB']),
  m(34, 'moretti-34-patsy-romano', 'Patsy "Hooks" Romano', 'Enforcer & Dock Collector', 'Carries a longshoreman\'s hook and has never needed to use it twice.', 'moretti',
    ['dock-cap', 'none', 'riveted-peacoat', 'cargo-hook', 'stocky', 'scar', '#27272A', '#0F172A', '#3B82F6']),
  // rastelli
  m(35, 'rastelli-35-leo-fusco', 'Leo "The Baker" Fusco', 'Capo · Arthur Avenue Bakery', 'His bread is excellent; his ovens are hiding something.', 'rastelli',
    ['short-crop', 'none', 'velour-cardigan', 'cigar', 'heavy', 'moustache', '#475569', '#6B21A8', '#F8FAFC']),
  m(36, 'rastelli-36-ernie-pisano', 'Ernie "Route Nine" Pisano', 'Capo · Private Garbage Carting', 'Every restaurant\'s garbage pickup costs exactly what he says.', 'rastelli',
    ['short-crop', 'none', 'velour-jacket', 'cigar', 'heavy', 'stubble', '#3F3F46', '#581C87', '#334155']),
  m(37, 'rastelli-37-mimmo-greco', 'Mimmo "Mozzarella" Greco', 'Soldato · Pizza-Parlour Front', 'Makes a good pie and a better delivery.', 'rastelli',
    ['curly-hair', 'none', 'pizza-apron', 'cigar', 'stocky', 'none', '#27272A', '#F8FAFC', '#7E22CE']),
  m(38, 'rastelli-38-federico-rastelli', 'Federico "Fico" Rastelli', 'The Don\'s Nephew · Playboy Heir', 'Playboy, gambler, and the family\'s biggest liability.', 'rastelli',
    ['blow-dried', 'none', 'velour-smoking', 'cigar', 'lean', 'none', '#18181B', '#7E22CE', '#09090B']),
  m(39, 'rastelli-39-tullio-fiore', 'Tullio "Two Cigars" Fiore', 'Consigliere · The Bronx', 'Lights a second cigar when he has decided someone has to go.', 'rastelli',
    ['bald', 'thick-black-glasses', 'velour-overcoat', 'two-cigars', 'frail', 'none', '#CBD5E1', '#1E1B4B', '#7E22CE']),
  m(40, 'rastelli-40-ugo-mancuso', 'Ugo "The Oven" Mancuso', 'Enforcer · Night Bakery', 'Works nights at the bakery. Nobody asks what he bakes.', 'rastelli',
    ['bald', 'none', 'velour-vest', 'brass-knuckles', 'heavy', 'scar', '#18181B', '#6B21A8', '#E2E8F0']),
  m(41, 'rastelli-41-angelo-basile', 'Angelo "Produce" Basile', 'Associate · Hunts Point Produce Union', 'Tomatoes are cheap; unloading them isn\'t.', 'rastelli',
    ['flatcap', 'none', 'velour-cardigan', 'cigar', 'stocky', 'none', '#52525B', '#785A3C', '#7E22CE']),
  m(42, 'rastelli-42-dolores-rastelli', 'Dolores "Dee" Rastelli', 'The Don\'s Sister · Bronx Matriarch', 'Every favour in the Bronx goes through her kitchen table.', 'rastelli',
    ['bouffant', 'none', 'velour-matriarch', 'cigar', 'female', 'lipstick', '#94A3B8', '#6B21A8', '#F8FAFC']),
  // outside
  m(43, 'outside-43-ray-kowalski', 'Det. Sgt. Ray Kowalski', 'NYPD Organised-Crime Squad', 'Honest, underpaid, and very patient.', 'outside',
    ['short-crop', 'none', 'tan-raincoat', 'coffee-badge', 'stocky', 'stubble', '#475569', '#A68A64', '#475569']),
  m(44, 'outside-44-dana-whitfield', 'Special Agent Dana Whitfield', 'Federal Task Force · Wiretap Van', 'Has been listening to the social club for eleven months.', 'outside',
    ['short-crop', 'none', 'customs-uniform', 'headphones-badge', 'female', 'none', '#3F2E21', '#1E293B', '#F8FAFC']),
  m(45, 'outside-45-morty-klein', 'Morty "The Mouthpiece" Klein', 'Defence Lawyer · The Commission', 'Has kept half the Commission out of prison and wants it noted.', 'outside',
    ['slicked-grey', 'half-moon-glasses', 'chalk-jacket', 'briefcase', 'lean', 'none', '#CBD5E1', '#475569', '#F8FAFC']),
  m(46, 'outside-46-hector-alvarez', 'Hector "Pawn" Alvarez', 'Fence · Grand Concourse Pawnshop', 'His pawnshop on the Grand Concourse buys anything that fell off a truck.', 'outside',
    ['short-crop', 'loupe', 'amber-silk-shirt', 'empty', 'stocky', 'moustache', '#18181B', '#785A3C', '#EAB308']),
  m(47, 'outside-47-vince-sorbo', 'Vince "Canary" Sorbo', 'Informant · Payphone Wire', 'Talks to the feds, talks to the families, mostly talks.', 'outside',
    ['comb-over', 'none', 'rumpled-suit', 'empty', 'lean', 'stubble', '#52525B', '#5C4033', '#27272A']),
  m(48, 'outside-48-pat-mulroney', 'Officer Pat Mulroney', 'NYPD Beat Cop on the Pad', 'Walks past the card games every Friday and comes back with a heavier coat.', 'outside',
    ['police-cap', 'none', 'nypd-uniform', 'nightstick-envelope', 'heavy', 'none', '#64748B', '#172554', '#94A3B8']),
  m(49, 'outside-49-gloria-ortiz', 'Gloria "Lucky" Ortiz', 'Independent Uptown Numbers Bank', 'Pays her taxes to every family, on time.', 'outside',
    ['curly-hair', 'none', 'leopard-blazer', 'betting-slips', 'female', 'lipstick', '#18181B', '#18181B', '#D97706']),
  m(50, 'outside-50-shay-quinlan', 'Shay "Wildcard" Quinlan', 'West Side Docks Freelance Heavy', 'Works for whichever family paid last.', 'outside',
    ['red-crop', 'none', 'black-peacoat', 'empty', 'tall', 'scar', '#B45309', '#09090B', '#1E293B']),
]);

const BY_ID: ReadonlyMap<string, CastMember> = new Map(CAST.map((c) => [c.id, c]));

export function castById(id: string): CastMember | undefined {
  return BY_ID.get(id);
}

// ---- Pool ----

export interface CastPool {
  /** First member of `familyId` (bible order) not in use and passing `filter`; marks it in use. Null once none is left. */
  take(familyId: CastFamily, filter?: (m: CastMember) => boolean): CastMember | null;
  /** Frees a member taken earlier. Unknown or already-free ids are ignored. */
  release(id: string): void;
  inUse(): ReadonlySet<string>;
}

export function createCastPool(): CastPool {
  const used = new Set<string>();
  return {
    take(familyId, filter) {
      for (const c of CAST) {
        if (c.familyId !== familyId || used.has(c.id)) continue;
        if (filter && !filter(c)) continue;
        used.add(c.id);
        return c;
      }
      return null;
    },
    release(id) {
      used.delete(id);
    },
    inUse() {
      return used;
    },
  };
}

export interface CastAssignment {
  /** The cast member's id, or null for a generic (unnamed) figure. */
  castId: string | null;
  name: string | null;
  familyId: CastFamily;
  traits: CharacterTraits;
}

/**
 * The cast assignment step: a distinct, unused member of `familyId` while any is left,
 * then a generic figure from `genericTraits(fallback, seed, familyId)`.
 */
export function assignCast(
  pool: CastPool,
  familyId: CastFamily,
  seed: number,
  fallback: GenericKind = familyId === 'outside' ? 'officer' : 'ally',
  filter?: (m: CastMember) => boolean,
): CastAssignment {
  const member = pool.take(familyId, filter);
  if (member) return { castId: member.id, name: member.name, familyId, traits: member.traits };
  return { castId: null, name: null, familyId, traits: genericTraits(fallback, seed, familyId) };
}

// ---- Generic (unnamed) trait sets ----

export type GenericKind = 'civilian' | 'officer' | 'ally' | 'player';

function rng(seed: number): () => number {
  let a = (Number.isFinite(seed) ? Math.floor(seed) : 0) >>> 0;
  a = (a ^ 0x9e3779b9) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(r: () => number, list: readonly T[]): T {
  return list[Math.min(list.length - 1, Math.floor(r() * list.length))];
}

const HAIR = ['#18181B', '#27272A', '#3F2E21', '#5C3A21', '#52525B', '#94A3B8', '#B45309', '#D4D4D8'] as const;
const DARK_HAIR = ['#18181B', '#27272A', '#3F2E21', '#52525B'] as const;
const PLAIN_PRIMARY = ['#5C4033', '#A68A64', '#475569', '#334155', '#6B7280', '#785A3C', '#3F3F46', '#1F2937', '#7C2D12', '#3F4A2E'] as const;
const PLAIN_SECONDARY = ['#E2E8F0', '#F1F5F9', '#CBD5E1', '#D6C7A1', '#94A3B8', '#27272A'] as const;

const MALE_HAIRSTYLES: readonly HeadgearStyle[] = ['short-crop', 'blow-dried', 'comb-over', 'bald', 'flatcap', 'buzz-cut', 'curly-hair', 'feathered', 'slicked-grey'];
const FEMALE_HAIRSTYLES: readonly HeadgearStyle[] = ['permed-hair', 'bouffant', 'curly-hair', 'grey-bun', 'feathered'];
const CIVILIAN_OUTFITS_M: readonly OutfitStyle[] = ['rumpled-suit', 'tan-raincoat', 'cardigan-tie', 'canvas-work-jacket', 'black-peacoat', 'satin-bomber', 'hoodie-vest', 'mechanic-coveralls', 'turtleneck-overcoat', 'camel-overcoat'];
const CIVILIAN_OUTFITS_F: readonly OutfitStyle[] = ['diner-apron', 'tan-raincoat', 'satin-bomber', 'black-peacoat', 'camel-overcoat'];

interface FamilyLook {
  outfits: readonly OutfitStyle[];
  playerOutfit: OutfitStyle;
  headgear: readonly HeadgearStyle[];
  eyewear: readonly EyewearStyle[];
  primary: readonly string[];
  secondary: readonly string[];
}

const FAMILY_LOOK: Readonly<Record<CastFamily, FamilyLook>> = {
  corvini: {
    outfits: ['chalk-overcoat', 'chalk-jacket', 'tight-jacket', 'leather-trench'], playerOutfit: 'chalk-overcoat',
    headgear: ['fedora-band', 'slicked-grey', 'short-crop', 'blow-dried'], eyewear: ['none', 'none', 'dark-shades'],
    primary: ['#1E293B', '#0F172A', '#18181B', '#27272A'], secondary: ['#0F172A', '#CBD5E1', '#334155', '#F1F5F9'],
  },
  bellini: {
    outfits: ['camel-overcoat', 'turtleneck-overcoat', 'leather-trench', 'amber-silk-shirt'], playerOutfit: 'turtleneck-overcoat',
    headgear: ['fedora-band', 'slicked-grey', 'blow-dried', 'short-crop'], eyewear: ['dark-shades', 'dark-shades', 'amber-shades'],
    primary: ['#B4834E', '#18181B', '#27272A', '#1E293B'], secondary: ['#27272A', '#52525B', '#E5E0D8'],
  },
  valenti: {
    outfits: ['emerald-windbreaker', 'emerald-tracksuit', 'racing-jacket', 'hoodie-vest'], playerOutfit: 'leather-trench',
    headgear: ['short-crop', 'blow-dried', 'feathered', 'bald'], eyewear: ['green-aviators', 'green-aviators', 'none'],
    primary: ['#1E293B', '#18181B', '#A68A64', '#4B5563'], secondary: ['#10B981', '#10B981', '#F8FAFC'],
  },
  moretti: {
    outfits: ['riveted-peacoat', 'black-peacoat', 'disco-leather', 'riveted-peacoat'], playerOutfit: 'riveted-peacoat',
    headgear: ['dock-cap', 'dock-cap', 'short-crop', 'blow-dried'], eyewear: ['none'],
    primary: ['#0F172A', '#1E293B', '#172554'], secondary: ['#94A3B8', '#3B82F6', '#2563EB'],
  },
  rastelli: {
    outfits: ['velour-jacket', 'velour-overcoat', 'velour-vest', 'velour-smoking'], playerOutfit: 'velour-overcoat',
    headgear: ['short-crop', 'bald', 'blow-dried', 'flatcap'], eyewear: ['none', 'none', 'thick-black-glasses'],
    primary: ['#6B21A8', '#581C87', '#1E1B4B'], secondary: ['#F8FAFC', '#334155', '#7E22CE'],
  },
  outside: {
    outfits: ['leather-trench', 'black-peacoat', 'tan-raincoat', 'rumpled-suit'], playerOutfit: 'leather-trench',
    headgear: ['short-crop', 'fedora-band', 'slicked-grey', 'buzz-cut'], eyewear: ['none', 'dark-shades'],
    primary: ['#18181B', '#27272A', '#A68A64', '#334155'], secondary: ['#CBD5E1', '#27272A', '#F1F5F9'],
  },
};

function isFamily(f: unknown): f is CastFamily {
  return typeof f === 'string' && (CAST_FAMILIES as readonly string[]).includes(f);
}

/**
 * A seeded, unnamed trait set. Civilians wear plain clothes and hold nothing; officers wear
 * the NYPD uniform and police cap; allies and the player wear a made-man look of `familyId`
 * (draw them with that family's accent). The same arguments always give the same traits.
 */
export function genericTraits(kind: GenericKind, seed: number, familyId?: CastFamily): CharacterTraits {
  const r = rng(seed);
  if (kind === 'officer') {
    const build = pick(r, ['stocky', 'heavy', 'tall', 'lean', 'stocky', 'female'] as const);
    return {
      headgear: 'police-cap',
      eyewear: pick(r, ['none', 'none', 'none', 'dark-shades'] as const),
      outfit: 'nypd-uniform',
      heldItem: 'empty',
      build,
      facialHairOrScar: build === 'female' ? pick(r, ['none', 'lipstick'] as const) : pick(r, ['none', 'moustache', 'stubble', 'none'] as const),
      hairColorHex: pick(r, DARK_HAIR),
      primaryGarmentHex: '#172554',
      secondaryGarmentHex: '#94A3B8',
    };
  }
  if (kind === 'ally' || kind === 'player') {
    const fam = isFamily(familyId) ? familyId : 'corvini';
    const look = FAMILY_LOOK[fam];
    if (kind === 'player') {
      return {
        headgear: 'fedora-band',
        eyewear: 'none',
        outfit: look.playerOutfit,
        heldItem: 'empty',
        build: pick(r, ['tall', 'stocky', 'lean'] as const),
        facialHairOrScar: pick(r, ['none', 'stubble', 'scar'] as const),
        hairColorHex: pick(r, DARK_HAIR),
        primaryGarmentHex: '#15171E',
        secondaryGarmentHex: FAMILY_ACCENT[fam],
      };
    }
    return {
      headgear: pick(r, look.headgear),
      eyewear: pick(r, look.eyewear),
      outfit: pick(r, look.outfits),
      heldItem: pick(r, ['empty', 'empty', 'brass-knuckles', 'cigar'] as const),
      build: pick(r, ['stocky', 'lean', 'heavy', 'tall'] as const),
      facialHairOrScar: pick(r, ['none', 'stubble', 'scar', 'moustache', 'none'] as const),
      hairColorHex: pick(r, DARK_HAIR),
      primaryGarmentHex: pick(r, look.primary),
      secondaryGarmentHex: pick(r, look.secondary),
    };
  }
  // civilian (also the fallback for an unknown kind)
  const female = r() < 0.4;
  const build: BuildStyle = female ? 'female' : pick(r, ['stocky', 'lean', 'heavy', 'tall', 'frail'] as const);
  return {
    headgear: pick(r, female ? FEMALE_HAIRSTYLES : MALE_HAIRSTYLES),
    eyewear: pick(r, ['none', 'none', 'none', 'none', 'round-glasses', 'wire-glasses', 'thick-black-glasses', 'oversized-glasses'] as const),
    outfit: pick(r, female ? CIVILIAN_OUTFITS_F : CIVILIAN_OUTFITS_M),
    heldItem: 'empty',
    build,
    facialHairOrScar: female ? pick(r, ['none', 'lipstick'] as const) : pick(r, ['none', 'none', 'moustache', 'beard', 'stubble'] as const),
    hairColorHex: pick(r, HAIR),
    primaryGarmentHex: pick(r, PLAIN_PRIMARY),
    secondaryGarmentHex: pick(r, PLAIN_SECONDARY),
  };
}
