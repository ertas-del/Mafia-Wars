import donCastellanoPortrait from '../assets/images/don_castellano_portrait_1794180050986.jpg';
import consigliereGalloPortrait from '../assets/images/consigliere_gallo_portrait_1794180052203.jpg';
import detectiveRossiPortrait from '../assets/images/detective_rossi_portrait_1794180052934.jpg';
import unionBossOmalleyPortrait from '../assets/images/union_boss_omalley_portrait_1794180053732.jpg';

export type FamilyId = 'corvini' | 'bellini' | 'valenti' | 'moretti' | 'rastelli';
export type BoroughId = 'manhattan_south' | 'brooklyn_docks' | 'queens_cargo' | 'bronx_terminal' | 'midtown_concrete';
export type WeaponId = 'knuckles' | 'revolver' | 'shotgun' | 'tommy';
export type SkillBranch = 'enforcer' | 'earner' | 'consigliere';

export interface MafiaFamily {
  id: FamilyId;
  name: string;
  historicalBasis: string;
  motto: string;
  color: string;
  accentHex: string;
  homeBorough: BoroughId;
  passiveBonusLabel: string;
  cashMultiplier: number;
  combatMultiplier: number;
  heatReduction: number;
  contrabandMultiplier: number;
  traitName: string;
  traitSymbol: string;
  traitVisualIndicator: string;
  turfCornerMarker: string;
}

export interface BoroughZone {
  id: BoroughId;
  name: string;
  subtitle: string;
  riskTier: 1 | 2 | 3 | 4 | 5;
  riskLabel: string;
  rewardMultiplier: number;
  contrabandMultiplier: number;
  heatRate: number;
  bounds: { x: number; y: number; width: number; height: number };
  spawnPoint: { x: number; y: number };
  floorColor: string;
  borderColor: string;
  controllingFamilyDefault: FamilyId;
  historicalNote: string;
}

export interface RacketBuilding {
  id: string;
  name: string;
  category: 'Social Club' | 'Waterfront' | 'Air Cargo' | 'Carting & Union' | 'Concrete Club' | 'Numbers & Vice';
  boroughId: BoroughId;
  x: number;
  y: number;
  width: number;
  height: number;
  ownerFamily: FamilyId | 'player';
  level: number; // 1 to 5
  baseIncomePerHour: number; // $ per hour
  baseContrabandPerHour: number;
  takeoverCostCash: number;
  defenseDifficulty: number; // 1 to 5
  uncollectedCash: number;
  roofColor: string;
  neonSign: string;
  description: string;
}

export interface SocialContact {
  id: string;
  name: string;
  title: string;
  familyOrFaction: string;
  boroughId: BoroughId;
  worldX: number;
  worldY: number;
  portraitUrl: string;
  respect: number; // 0 to 100 (10 Hearts / 100 Omerta Respect)
  favoriteGiftName: string;
  giftCostCash: number;
  giftCostContraband: number;
  favorActionLabel: string;
  favorCostTokens: number;
  favorRewardDescription: string;
  alliancePerk40: string;
  alliancePerk80: string;
  bio: string;
  sitDownQuotes: string[];
}

export interface SkillNode {
  id: string;
  branch: SkillBranch;
  tier: 1 | 2 | 3 | 4 | 5;
  name: string;
  costPoints: number;
  effectSummary: string;
  historicalFlavor: string;
  prerequisiteId?: string;
}

export interface WeaponSpec {
  id: WeaponId;
  slotKey: '1' | '2' | '3' | '4';
  name: string;
  damage: number;
  range: number;
  cooldownMs: number;
  spreadAngle: number;
  pellets: number;
  unlockCostCash: number;
  heatPerShot: number;
  description: string;
}

export interface NarrativeArcChapter {
  act: number;
  year: string;
  title: string;
  historicalContext: string;
  objectiveText: string;
  requiredRackets: number;
  requiredNetWorth: number;
  requiredAlliances: number;
  rewardCash: number;
  rewardSkillPoints: number;
  rewardFavorTokens: number;
}

export const FIVE_FAMILIES: MafiaFamily[] = [
  {
    id: 'corvini',
    name: 'Corvini Crime Family',
    historicalBasis: 'Inspired by the 1984 Gambino Family (Mulberry St. & Todt Hill)',
    motto: 'Every bag of concrete poured in Manhattan pays the two-percent tribute.',
    color: 'crimson',
    accentHex: '#DC2626',
    homeBorough: 'manhattan_south',
    passiveBonusLabel: '+25% Racket Tribute · Unlocks Concrete Bid-Rigging Early',
    cashMultiplier: 1.25,
    combatMultiplier: 1.05,
    heatReduction: 0.05,
    contrabandMultiplier: 1.0,
    traitName: 'Mulberry Red Carnation & Pinstripes',
    traitSymbol: '♠',
    traitVisualIndicator: 'Blood-red lapel carnation, chalk-stripe suit & crimson crest ring',
    turfCornerMarker: 'MULBERRY ARCH LANTERNS · CORVINI PROTECTORATE',
  },
  {
    id: 'bellini',
    name: 'Bellini Westside Syndicate',
    historicalBasis: 'Inspired by the 1984 Genovese Family (Greenwich Village & Chin Era)',
    motto: 'Never speak on a telephone. Let the front men take the subpoenas.',
    color: 'amber',
    accentHex: '#D97706',
    homeBorough: 'midtown_concrete',
    passiveBonusLabel: '-30% FBI Wiretap Heat · +20% Offshore Vault Capacity',
    cashMultiplier: 1.15,
    combatMultiplier: 1.0,
    heatReduction: 0.3,
    contrabandMultiplier: 1.1,
    traitName: 'Brass Ledger Case & Gold Chevron',
    traitSymbol: '◆',
    traitVisualIndicator: 'Carries brass-latched Concrete Club briefcase, gold collar chevron & dark shades',
    turfCornerMarker: 'LOCAL 282 CONCRETE MONOPOLY · BELLINI TURF',
  },
  {
    id: 'valenti',
    name: 'Valenti Queens Crew',
    historicalBasis: 'Inspired by the 1984 Lucchese Family (Ozone Park & JFK Freight)',
    motto: 'Nothing lands at Idlewild Hangar 7 without our manifest stamp.',
    color: 'emerald',
    accentHex: '#10B981',
    homeBorough: 'queens_cargo',
    passiveBonusLabel: '+35% Contraband Yield · +15% Street Movement Speed',
    cashMultiplier: 1.1,
    combatMultiplier: 1.1,
    heatReduction: 0.1,
    contrabandMultiplier: 1.35,
    traitName: 'Emerald Aviators & Silk Racing Stripes',
    traitSymbol: '✦',
    traitVisualIndicator: 'Tinted green aviator glasses, twin emerald sleeve stripes & gold chain',
    turfCornerMarker: 'IDLEWILD FREIGHT CORRIDOR · VALENTI CREW',
  },
  {
    id: 'moretti',
    name: 'Moretti Waterfront Family',
    historicalBasis: 'Inspired by the 1984 Colombo Family (Red Hook & Bensonhurst)',
    motto: 'The streets belong to the crew willing to bleed on the cobblestones.',
    color: 'blue',
    accentHex: '#3B82F6',
    homeBorough: 'brooklyn_docks',
    passiveBonusLabel: '+25% Firearm & Melee Damage · +20% Enforcer Armor',
    cashMultiplier: 1.05,
    combatMultiplier: 1.25,
    heatReduction: 0.0,
    contrabandMultiplier: 1.15,
    traitName: 'Longshoreman Peacoat & Iron Hook Sash',
    traitSymbol: '⚓',
    traitVisualIndicator: 'Steel-riveted stevedore shoulder pads, silver cargo chain & dock cap',
    turfCornerMarker: 'RED HOOK PIER COALITION · MORETTI FAMILY',
  },
  {
    id: 'rastelli',
    name: 'Rastelli Knickerbocker Faction',
    historicalBasis: 'Inspired by the 1984 Bonanno Family (Bushwick & Pizza Parlors)',
    motto: 'Import the espresso machines, hide the bricks in the false floor.',
    color: 'purple',
    accentHex: '#A855F7',
    homeBorough: 'bronx_terminal',
    passiveBonusLabel: '+30% Social Favor Respect · +25% Contraband Value',
    cashMultiplier: 1.15,
    combatMultiplier: 1.1,
    heatReduction: 0.1,
    contrabandMultiplier: 1.25,
    traitName: 'Velour Shawl Collar & Lit Cuban Cigar',
    traitSymbol: '♛',
    traitVisualIndicator: 'Royal purple velour collar trim, glowing cigar ember & smoke trail',
    turfCornerMarker: 'KNICKERBOCKER IMPORTS · RASTELLI FACTION',
  },
];

export const NYC_BOROUGHS: BoroughZone[] = [
  {
    id: 'manhattan_south',
    name: 'Little Italy & Lower Manhattan',
    subtitle: 'Mulberry St. Social Clubs · Garment Center · Fulton Fish Market',
    riskTier: 1,
    riskLabel: 'Tier I · Low Heat / Safe Harbor',
    rewardMultiplier: 1.0,
    contrabandMultiplier: 1.0,
    heatRate: 0.7,
    bounds: { x: 100, y: 120, width: 920, height: 860 },
    spawnPoint: { x: 520, y: 540 },
    floorColor: '#161412',
    borderColor: '#B91C1C',
    controllingFamilyDefault: 'corvini',
    historicalNote: 'Brick walk-ups, espresso storefronts, and the Ravenite Club where capos deliver Monday morning tribute envelopes.',
  },
  {
    id: 'brooklyn_docks',
    name: 'Brooklyn Waterfront & Red Hook',
    subtitle: 'ILA Container Piers · Bensonhurst Parlors · Gowanus Chop Shops',
    riskTier: 2,
    riskLabel: 'Tier II · Waterfront Smuggling Zone',
    rewardMultiplier: 1.45,
    contrabandMultiplier: 1.5,
    heatRate: 1.0,
    bounds: { x: 1120, y: 1120, width: 980, height: 860 },
    spawnPoint: { x: 1580, y: 1520 },
    floorColor: '#12161A',
    borderColor: '#3B82F6',
    controllingFamilyDefault: 'moretti',
    historicalNote: 'Controlled via Local 181 longshoremen; every shipping container unloaded off Erie Basin pays union kickbacks.',
  },
  {
    id: 'queens_cargo',
    name: 'Queens & JFK Air Cargo Corridor',
    subtitle: 'Ozone Park Social Clubs · Hangar 7 Bullion Vaults · Aqueduct Wire',
    riskTier: 3,
    riskLabel: 'Tier III · High-Value Freight Heists',
    rewardMultiplier: 1.85,
    contrabandMultiplier: 1.9,
    heatRate: 1.25,
    bounds: { x: 2180, y: 1120, width: 900, height: 860 },
    spawnPoint: { x: 2620, y: 1540 },
    floorColor: '#131715',
    borderColor: '#10B981',
    controllingFamilyDefault: 'valenti',
    historicalNote: 'Untaxed Swiss currency shipments, air freight manifests, and off-track bookmaking parlors along Rockaway Blvd.',
  },
  {
    id: 'bronx_terminal',
    name: 'The Bronx & Hunts Point Terminal',
    subtitle: 'Arthur Ave Bakeries · Private Carting Hauling · Produce Unions',
    riskTier: 4,
    riskLabel: 'Tier IV · Heavy Turf War Zone',
    rewardMultiplier: 2.35,
    contrabandMultiplier: 2.2,
    heatRate: 1.5,
    bounds: { x: 2180, y: 120, width: 900, height: 880 },
    spawnPoint: { x: 2620, y: 540 },
    floorColor: '#191418',
    borderColor: '#A855F7',
    controllingFamilyDefault: 'rastelli',
    historicalNote: 'Private garbage carting routes and wholesale meat terminals fiercely contested by heavily armed street crews.',
  },
  {
    id: 'midtown_concrete',
    name: "Midtown & Hell's Kitchen Concrete Club",
    subtitle: 'Skyscraper Pour Sites · Teamsters Local 282 · Commission Penthouses',
    riskTier: 5,
    riskLabel: 'Tier V · Maximum Profit & FBI Wiretaps',
    rewardMultiplier: 3.25,
    contrabandMultiplier: 2.6,
    heatRate: 2.0,
    bounds: { x: 1120, y: 120, width: 980, height: 880 },
    spawnPoint: { x: 1610, y: 540 },
    floorColor: '#1A1610',
    borderColor: '#D97706',
    controllingFamilyDefault: 'bellini',
    historicalNote: 'Any construction contract over $2 million in Manhattan is rigged by the Commission Concrete Club for a mandatory 2% cut.',
  },
];

export const INITIAL_RACKETS: RacketBuilding[] = [
  // Borough 1: Little Italy & Lower Manhattan
  {
    id: 'racket_ravenite',
    name: 'Mulberry St. Espresso & Social Club',
    category: 'Social Club',
    boroughId: 'manhattan_south',
    x: 260,
    y: 260,
    width: 150,
    height: 105,
    ownerFamily: 'player',
    level: 1,
    baseIncomePerHour: 4800,
    baseContrabandPerHour: 4,
    takeoverCostCash: 0,
    defenseDifficulty: 1,
    uncollectedCash: 650,
    roofColor: '#451A1C',
    neonSign: 'CAFFÈ ROMA · MEMBERS ONLY',
    description: 'Your starting storefront headquarters on Mulberry Street. Serves espresso up front and settles loan-shark vig in the back.',
  },
  {
    id: 'racket_fulton_fish',
    name: 'Fulton Fish Market Unloading Stall',
    category: 'Waterfront',
    boroughId: 'manhattan_south',
    x: 680,
    y: 250,
    width: 165,
    height: 110,
    ownerFamily: 'corvini',
    level: 1,
    baseIncomePerHour: 7200,
    baseContrabandPerHour: 8,
    takeoverCostCash: 2500,
    defenseDifficulty: 1,
    uncollectedCash: 0,
    roofColor: '#1E293B',
    neonSign: 'SEAPORT ICE & COLD STORAGE',
    description: 'Controls every fish truck parking permit and ice delivery along the East River piers before dawn.',
  },
  {
    id: 'racket_garment_trucking',
    name: '7th Ave Garment Center Trucking',
    category: 'Carting & Union',
    boroughId: 'manhattan_south',
    x: 460,
    y: 720,
    width: 170,
    height: 105,
    ownerFamily: 'corvini',
    level: 1,
    baseIncomePerHour: 9500,
    baseContrabandPerHour: 6,
    takeoverCostCash: 4200,
    defenseDifficulty: 2,
    uncollectedCash: 0,
    roofColor: '#31251E',
    neonSign: 'CONSOLIDATED APPAREL FREIGHT',
    description: 'No dress rack moves from Chinatown to Macy’s without paying protection to your garment dispatchers.',
  },

  // Borough 2: Brooklyn Waterfront & Red Hook
  {
    id: 'racket_redhook_pier14',
    name: 'Red Hook Container Pier 14',
    category: 'Waterfront',
    boroughId: 'brooklyn_docks',
    x: 1260,
    y: 1260,
    width: 175,
    height: 115,
    ownerFamily: 'moretti',
    level: 1,
    baseIncomePerHour: 14500,
    baseContrabandPerHour: 18,
    takeoverCostCash: 7500,
    defenseDifficulty: 2,
    uncollectedCash: 0,
    roofColor: '#172554',
    neonSign: 'ATLANTIC BASIN STEVEDORES',
    description: 'Deep-water container cranes where untaxed liquor, silk, and Italian marble bypass customs inspection.',
  },
  {
    id: 'racket_bensonhurst_numbers',
    name: '18th Ave Sports Book & Numbers Bank',
    category: 'Numbers & Vice',
    boroughId: 'brooklyn_docks',
    x: 1740,
    y: 1300,
    width: 160,
    height: 105,
    ownerFamily: 'moretti',
    level: 1,
    baseIncomePerHour: 18200,
    baseContrabandPerHour: 10,
    takeoverCostCash: 9800,
    defenseDifficulty: 2,
    uncollectedCash: 0,
    roofColor: '#1E1B4B',
    neonSign: 'BENSONHURSTPASTRY & WIRE',
    description: 'High-volume policy numbers bank and college basketball point-shaving wire operation.',
  },
  {
    id: 'racket_gowanus_chop',
    name: 'Gowanus Canal Export Chop Shop',
    category: 'Waterfront',
    boroughId: 'brooklyn_docks',
    x: 1520,
    y: 1740,
    width: 170,
    height: 110,
    ownerFamily: 'moretti',
    level: 1,
    baseIncomePerHour: 22000,
    baseContrabandPerHour: 22,
    takeoverCostCash: 12500,
    defenseDifficulty: 3,
    uncollectedCash: 0,
    roofColor: '#27272A',
    neonSign: 'CANAL AUTO SALVAGE & MARINE',
    description: 'Strips luxury Cadillacs and Mercedes sedans in under 40 minutes for container shipment overseas.',
  },

  // Borough 3: Queens & JFK Air Cargo Corridor
  {
    id: 'racket_jfk_hangar7',
    name: 'JFK International Air Cargo Hangar 7',
    category: 'Air Cargo',
    boroughId: 'queens_cargo',
    x: 2320,
    y: 1280,
    width: 185,
    height: 115,
    ownerFamily: 'valenti',
    level: 1,
    baseIncomePerHour: 31000,
    baseContrabandPerHour: 34,
    takeoverCostCash: 18000,
    defenseDifficulty: 3,
    uncollectedCash: 0,
    roofColor: '#064E3B',
    neonSign: 'TRANS-ATLANTIC BONDED VAULT',
    description: 'The crown jewel of Queens: night-shift supervisors leave the high-value bullion cage unlocked for your crew.',
  },
  {
    id: 'racket_ozone_lounge',
    name: 'Rockaway Blvd Velvet Lounge',
    category: 'Social Club',
    boroughId: 'queens_cargo',
    x: 2760,
    y: 1320,
    width: 165,
    height: 105,
    ownerFamily: 'valenti',
    level: 1,
    baseIncomePerHour: 26500,
    baseContrabandPerHour: 20,
    takeoverCostCash: 15500,
    defenseDifficulty: 3,
    uncollectedCash: 0,
    roofColor: '#14532D',
    neonSign: 'THE PENTHOUSE SUPPER CLUB',
    description: 'After-hours baccarat tables, high-interest vig collection, and untouchable backroom sit-downs.',
  },
  {
    id: 'racket_aqueduct_wire',
    name: 'Aqueduct Turf Club Tele-Wire',
    category: 'Numbers & Vice',
    boroughId: 'queens_cargo',
    x: 2560,
    y: 1740,
    width: 175,
    height: 110,
    ownerFamily: 'valenti',
    level: 1,
    baseIncomePerHour: 35000,
    baseContrabandPerHour: 25,
    takeoverCostCash: 22000,
    defenseDifficulty: 3,
    uncollectedCash: 0,
    roofColor: '#115E59',
    neonSign: 'QUEENS THOROUGHBRED TICKER',
    description: 'Controls off-track laying-off bets across Long Island and fixes late-afternoon thoroughbred races.',
  },

  // Borough 4: The Bronx & Hunts Point Terminal
  {
    id: 'racket_huntspoint_carting',
    name: 'Hunts Point Private Sanitation Depot',
    category: 'Carting & Union',
    boroughId: 'bronx_terminal',
    x: 2320,
    y: 260,
    width: 180,
    height: 115,
    ownerFamily: 'rastelli',
    level: 1,
    baseIncomePerHour: 44000,
    baseContrabandPerHour: 30,
    takeoverCostCash: 29000,
    defenseDifficulty: 4,
    uncollectedCash: 0,
    roofColor: '#3B0764',
    neonSign: 'TRI-BORO WASTE HAULING CORP',
    description: 'Property owners either pay triple for your green garbage trucks or watch their trash pile to the second story.',
  },
  {
    id: 'racket_arthur_ave_imports',
    name: 'Arthur Ave Espresso & Olive Oil Imports',
    category: 'Social Club',
    boroughId: 'bronx_terminal',
    x: 2760,
    y: 300,
    width: 165,
    height: 105,
    ownerFamily: 'rastelli',
    level: 1,
    baseIncomePerHour: 39000,
    baseContrabandPerHour: 42,
    takeoverCostCash: 26000,
    defenseDifficulty: 4,
    uncollectedCash: 0,
    roofColor: '#4C1D95',
    neonSign: 'BELMONTE SPECIALTY IMPORTS',
    description: 'Imports authentic Sicilian olive oil tins—half filled with extra-virgin oil, half with high-grade contraband.',
  },
  {
    id: 'racket_bronx_meat_market',
    name: 'Bronx Terminal Cold Storage & Provision',
    category: 'Carting & Union',
    boroughId: 'bronx_terminal',
    x: 2540,
    y: 720,
    width: 175,
    height: 110,
    ownerFamily: 'rastelli',
    level: 1,
    baseIncomePerHour: 52000,
    baseContrabandPerHour: 36,
    takeoverCostCash: 35000,
    defenseDifficulty: 4,
    uncollectedCash: 0,
    roofColor: '#581C87',
    neonSign: 'METRO WHOLESALE BUTCHERS',
    description: 'Supplies every steakhouse in Manhattan at inflated syndicate prices while laundering street cash.',
  },

  // Borough 5: Midtown & Hell's Kitchen Concrete Club
  {
    id: 'racket_concrete_club_hq',
    name: 'Midtown Scavullo Ready-Mix Concrete Tower',
    category: 'Concrete Club',
    boroughId: 'midtown_concrete',
    x: 1280,
    y: 250,
    width: 185,
    height: 120,
    ownerFamily: 'bellini',
    level: 1,
    baseIncomePerHour: 78000,
    baseContrabandPerHour: 45,
    takeoverCostCash: 50000,
    defenseDifficulty: 5,
    uncollectedCash: 0,
    roofColor: '#78350F',
    neonSign: 'METRO READY-MIX · CONCRETE CLUB',
    description: 'The ultimate 1984 racket: levies the mandatory 2% Commission tax on every skyscraper poured in Manhattan.',
  },
  {
    id: 'racket_hellskitchen_local282',
    name: "Hell's Kitchen Teamsters Hall Local 282",
    category: 'Concrete Club',
    boroughId: 'midtown_concrete',
    x: 1740,
    y: 270,
    width: 175,
    height: 115,
    ownerFamily: 'bellini',
    level: 1,
    baseIncomePerHour: 65000,
    baseContrabandPerHour: 38,
    takeoverCostCash: 42000,
    defenseDifficulty: 5,
    uncollectedCash: 0,
    roofColor: '#713F12',
    neonSign: 'BROTHERHOOD PENSION FUND 282',
    description: 'Controls construction site gatekeepers, pension fund loans, and no-show concrete inspector payrolls.',
  },
  {
    id: 'racket_times_square_velvet',
    name: '42nd St. Neon Arcade & Syndicate Vault',
    category: 'Numbers & Vice',
    boroughId: 'midtown_concrete',
    x: 1520,
    y: 720,
    width: 180,
    height: 115,
    ownerFamily: 'bellini',
    level: 1,
    baseIncomePerHour: 92000,
    baseContrabandPerHour: 55,
    takeoverCostCash: 65000,
    defenseDifficulty: 5,
    uncollectedCash: 0,
    roofColor: '#92400E',
    neonSign: 'THE GILT CLUB · MIDTOWN WEST',
    description: 'Cash-only Times Square entertainment complex feeding suitcases of untraceable bills into Swiss accounts.',
  },
];

export const INITIAL_SOCIAL_CONTACTS: SocialContact[] = [
  {
    id: 'contact_castellano',
    name: 'Don Paulie "Big Paul" Corvini',
    title: 'Commission Chairman · Todt Hill White House',
    familyOrFaction: 'Corvini Family',
    boroughId: 'manhattan_south',
    worldX: 390,
    worldY: 430,
    portraitUrl: donCastellanoPortrait,
    respect: 25,
    favoriteGiftName: 'Case of 1978 Barolo & Bearer Bonds',
    giftCostCash: 3500,
    giftCostContraband: 12,
    favorActionLabel: 'Sanction Concrete Bid-Rigging Charter',
    favorCostTokens: 2,
    favorRewardDescription: 'Instantly grants +$25,000 Clean Tribute and boosts all Racket Income by +15% permanently.',
    alliancePerk40: 'White Collar Ledger: +15% Passive Racket Tribute',
    alliancePerk80: 'Commission Seat: +35% Global Empire Valuation & Concrete Immunity',
    bio: 'Rules from a hilltop mansion with white-shoe lawyers and construction conglomerates. Prefers briefcases of silent percentages over street shootouts.',
    sitDownQuotes: [
      'We are businessmen, not cowboys. When a developer pours forty floors of steel in Midtown, two percent comes upstairs before the cement dries.',
      'Bring me thick envelopes on Monday morning and keep your crew off the evening news, and the Commission will back your claim.',
      'The Feds have directional microphones pointed at Ravenite. Speak with numbers, never names.',
    ],
  },
  {
    id: 'contact_gallo',
    name: 'Sal "The Viper" Santangelo',
    title: 'Queens Street Underboss · The Penthouse',
    familyOrFaction: 'Valenti Crew',
    boroughId: 'queens_cargo',
    worldX: 2510,
    worldY: 1460,
    portraitUrl: consigliereGalloPortrait,
    respect: 20,
    favoriteGiftName: 'Brioni Silk Suit & Cuban Montecristos',
    giftCostCash: 2800,
    giftCostContraband: 15,
    favorActionLabel: 'Tip Off JFK Night-Shift Bullion Crate',
    favorCostTokens: 2,
    favorRewardDescription: 'Delivers +45 Contraband Crates & dispatches 2 Armed Hitmen to guard your active turf.',
    alliancePerk40: 'Ozone Park Muscle: +20% Firearm Critical Damage',
    alliancePerk80: 'Hangar 7 Master Key: +40% Contraband Smuggling Output',
    bio: 'A razor-sharp street general who rose through the Queens air freight crews. Commands fierce loyalty from the younger soldati who resent the old-guard Dons.',
    sitDownQuotes: [
      'The old men sit on Staten Island counting construction checks while we take the pinch on the pavement. Respect is earned at the end of a barrel.',
      'Hangar 7 has a Swiss pallet coming off the midnight Frankfurt flight. Cut my crew in and the night guard takes a long coffee break.',
      'You stood tall when the Moretti hitters rolled through Queens. My soldiers remember that.',
    ],
  },
  {
    id: 'contact_rossi',
    name: 'Captain Frank Rossi',
    title: 'NYPD 12th Precinct & Federal Task Force Leak',
    familyOrFaction: 'NYPD / Southern District Informant',
    boroughId: 'midtown_concrete',
    worldX: 1480,
    worldY: 480,
    portraitUrl: detectiveRossiPortrait,
    respect: 15,
    favoriteGiftName: 'Manila Envelope of Untraceable $100s',
    giftCostCash: 3000,
    giftCostContraband: 8,
    favorActionLabel: 'Quash Federal Wiretap & Clear Heat',
    favorCostTokens: 1,
    favorRewardDescription: 'Immediately drops Federal RICO & NYPD Heat to 0% and blocks police raids for 5 minutes.',
    alliancePerk40: 'Precinct Tip-Off: -30% Police Heat Accumulation',
    alliancePerk80: 'Lost Wiretap Reels: Prevents Federal Asset Seizures during Offline Hours',
    bio: 'Twenty-six years on the force with three kids in private college. Knows every bug planted by the FBI Organized Crime Task Force before the warrant is signed.',
    sitDownQuotes: [
      'Giuliani’s boys at the Southern District just requisitioned four Title III roving bugs for Mulberry Street. Keep your mouth shut inside sedans.',
      'My pension doesn’t cover Fordham tuition, friend. Leave the envelope in the rain barrel behind Precinct 12 and that subpoena disappears.',
      'You drop bodies in Midtown at noon, not even I can bury the ballistics report. Keep it quiet.',
    ],
  },
  {
    id: 'contact_omalley',
    name: 'Liam "Ironhook" O’Malley',
    title: 'Brooklyn ILA Local 181 Waterfront Boss',
    familyOrFaction: 'Westies / Waterfront Coalition',
    boroughId: 'brooklyn_docks',
    worldX: 1460,
    worldY: 1440,
    portraitUrl: unionBossOmalleyPortrait,
    respect: 20,
    favoriteGiftName: 'Crate of Aged Irish Whiskey & Dock Dues',
    giftCostCash: 2400,
    giftCostContraband: 10,
    favorActionLabel: 'Call Longshoremen Strike on Rival Turf',
    favorCostTokens: 2,
    favorRewardDescription: 'Weakens all Rival Racket Defenses by 35% and delivers +30 Contraband Crates + $18,000.',
    alliancePerk40: 'Stevedore Tariff: +25% Contraband Crate Value when Liquidated',
    alliancePerk80: 'Hell’s Kitchen Coalition: Summons Westie Enforcers in Turf Wars',
    bio: 'Controls the crane operators and stevedores from Red Hook to the West Side piers. Nothing leaves a freighter hull without Ironhook’s chalk mark.',
    sitDownQuotes: [
      'A ship sits idle in Erie Basin for forty-eight hours, the shipping line loses half a million. They pay our consulting fee with a smile.',
      'The Five Families need the Irish on the piers just like we need your trucks on the expressway. Fair split, zero rats.',
      'Any rival crew tries taxing Pier 14, they’ll find out how deep the Gowanus Canal really is.',
    ],
  },
  {
    id: 'contact_bellini_consigliere',
    name: 'Donato "The Tailor" Bellini',
    title: 'Garment Center Consigliere & Offshore Banker',
    familyOrFaction: 'Bellini Syndicate',
    boroughId: 'manhattan_south',
    worldX: 610,
    worldY: 610,
    portraitUrl: donCastellanoPortrait,
    respect: 30,
    favoriteGiftName: 'Vintage Patek Philippe & Ledger Key',
    giftCostCash: 4000,
    giftCostContraband: 14,
    favorActionLabel: 'Launder Contraband Stockpile at 150% Rate',
    favorCostTokens: 2,
    favorRewardDescription: 'Converts 25 Contraband Crates into +$32,000 Clean Syndicate Cash and +1 Skill Point.',
    alliancePerk40: 'Automated Bagmen: Automatically collects 50% of street envelopes',
    alliancePerk80: 'Swiss Numbered Vault: Doubles Offline Passive Accumulation Cap to 24 Hours',
    bio: 'Operates behind a bespoke tailoring shop on Mott Street. Whispers into the ears of judges, union trustees, and Wall Street arbitrage brokers.',
    sitDownQuotes: [
      'Dirty bills in a shoebox attract moths and Treasury agents. Filtered through three Delaware shell corporations, it becomes legitimate real estate.',
      'A wise Boss lets his rackets work while he sleeps. Upgrade your fronts and my bagmen will collect the tribute round the clock.',
      'Keep the peace when it pays; strike first when the Commission hesitates.',
    ],
  },
  {
    id: 'contact_persico',
    name: 'Carmine "The Kid" Moretti',
    title: 'Colombo-Style Street Boss · Bensonhurst',
    familyOrFaction: 'Moretti Family',
    boroughId: 'bronx_terminal',
    worldX: 2480,
    worldY: 480,
    portraitUrl: consigliereGalloPortrait,
    respect: 10,
    favoriteGiftName: 'Untraceable Crate of Mil-Spec Typewriters',
    giftCostCash: 3200,
    giftCostContraband: 18,
    favorActionLabel: 'Broker Borough Truce & Tribute Pact',
    favorCostTokens: 2,
    favorRewardDescription: 'Halts Rival Turf Raids for 10 minutes and awards +2 Omertà Skill Points.',
    alliancePerk40: 'Street Ceasefire: Rival patrols ignore you unless provoked',
    alliancePerk80: 'Blood Oath Pact: +30% Damage & +25% Turf Takeover Speed',
    bio: 'Fierce, unpredictable street tactician who survived three gang wars in Brooklyn and the Bronx. Respects sheer nerve above boardroom diplomacy.',
    sitDownQuotes: [
      'You walk into Hunts Point with your chin up—I gotta give you credit, most guys send a lawyer.',
      'Give my crew a fair taste of the carting routes and we point our shotguns at the Feds instead of each other.',
      'Cross me once, we go to the mattresses. Keep your word, we own this city.',
    ],
  },
];

export const SKILL_TREE_NODES: SkillNode[] = [
  // Branch 1: ENFORCER (Combat, Weapons, Crew Muscle)
  {
    id: 'enf_1',
    branch: 'enforcer',
    tier: 1,
    name: 'Lead-Lined Brass & .38 Loads',
    costPoints: 1,
    effectSummary: '+30% Melee & Firearm Damage against all street NPCs and Capos',
    historicalFlavor: 'Custom heavy-grain loads packed in a Bensonhurst basement.',
  },
  {
    id: 'enf_2',
    branch: 'enforcer',
    tier: 2,
    name: 'Tailored Kevlar Cashmere Overcoat',
    costPoints: 1,
    effectSummary: '+60 Max Health & -25% Incoming Bullet Damage',
    historicalFlavor: 'Looks like Savile Row wool; stops a .38 slug at ten paces.',
    prerequisiteId: 'enf_1',
  },
  {
    id: 'enf_3',
    branch: 'enforcer',
    tier: 3,
    name: 'Lupara Street Sweeper Mastery',
    costPoints: 2,
    effectSummary: '+35% Fire Rate & Knockback Hitstop on Shotgun & Tommy Gun',
    historicalFlavor: 'Sawed-off double barrel concealed beneath the trenchcoat lapel.',
    prerequisiteId: 'enf_2',
  },
  {
    id: 'enf_4',
    branch: 'enforcer',
    tier: 4,
    name: 'Black Cadillac Hit Squad',
    costPoints: 2,
    effectSummary: 'Spawns 2 permanent Allied Soldati Bodyguards who follow & fight alongside you in NYC',
    historicalFlavor: 'Two made men in a 1984 Fleetwood Brougham watching your back.',
    prerequisiteId: 'enf_3',
  },
  {
    id: 'enf_5',
    branch: 'enforcer',
    tier: 5,
    name: 'Capo di Tutti Capi Execution',
    costPoints: 3,
    effectSummary: '+50% Damage to Turf Bosses & heals +25 HP on every NPC takedown',
    historicalFlavor: 'When you sanction a hit, nobody walks out of the steakhouse.',
    prerequisiteId: 'enf_4',
  },

  // Branch 2: EARNER (Tycoon Rackets, Passive Idle Income, Offline Vault)
  {
    id: 'earn_1',
    branch: 'earner',
    tier: 1,
    name: 'Monday Morning Envelope Skim',
    costPoints: 1,
    effectSummary: '+30% Passive $/hr across all controlled Rackets',
    historicalFlavor: 'Every capo kicks up ten percent more before noon on Monday.',
  },
  {
    id: 'earn_2',
    branch: 'earner',
    tier: 2,
    name: 'No-Show Union Stewards',
    costPoints: 1,
    effectSummary: '-25% Racket Upgrade Costs & +25% Contraband Crate production',
    historicalFlavor: 'Six ghost employees on the timecard at every construction trailer.',
    prerequisiteId: 'earn_1',
  },
  {
    id: 'earn_3',
    branch: 'earner',
    tier: 3,
    name: 'Automated Bagmen & Couriers',
    costPoints: 2,
    effectSummary: 'Automatically transfers uncollected Racket Envelopes straight into your bank every 5s',
    historicalFlavor: 'Trusted runners on mopeds collecting tribute across all five boroughs.',
    prerequisiteId: 'earn_2',
  },
  {
    id: 'earn_4',
    branch: 'earner',
    tier: 4,
    name: 'Cayman Islands Numbered Accounts',
    costPoints: 2,
    effectSummary: '+60% Offline Progression Earnings & protects 100% of Vault from Federal RICO seizure',
    historicalFlavor: 'Telex transfers routed through Nassau and Zurich overnight.',
    prerequisiteId: 'earn_3',
  },
  {
    id: 'earn_5',
    branch: 'earner',
    tier: 5,
    name: 'The Concrete Club 2% Monopoly',
    costPoints: 3,
    effectSummary: 'Doubles (2.0x) all Racket Income & Empire Net Worth valuation globally',
    historicalFlavor: 'Total Commission stranglehold over every high-rise poured in New York.',
    prerequisiteId: 'earn_4',
  },

  // Branch 3: CONSIGLIERE (Stardew-Style Favors, Alliances, Heat & RICO Defense)
  {
    id: 'con_1',
    branch: 'consigliere',
    tier: 1,
    name: 'Omertà Code of Silence',
    costPoints: 1,
    effectSummary: '-35% NYPD & FBI Heat gain from street combat and turf takeovers',
    historicalFlavor: 'Nobody saw nothing; nobody heard nothing.',
  },
  {
    id: 'con_2',
    branch: 'consigliere',
    tier: 2,
    name: 'Table at Rao’s & Backroom Gifts',
    costPoints: 1,
    effectSummary: '+50% Respect gained from Gifts & Sit-Downs; +1 Bonus Favor Token per Gift',
    historicalFlavor: 'An impossible-to-get corner table in East Harlem opens every door.',
    prerequisiteId: 'con_1',
  },
  {
    id: 'con_3',
    branch: 'consigliere',
    tier: 3,
    name: 'RF Bug Sweepers & Payphone Code',
    costPoints: 2,
    effectSummary: 'Passively decays Police Heat 3x faster & grants +20% Takeover Negotiation discount',
    historicalFlavor: 'Switching payphones every four minutes along Queens Boulevard.',
    prerequisiteId: 'con_2',
  },
  {
    id: 'con_4',
    branch: 'consigliere',
    tier: 4,
    name: 'Five Families Sit-Down Diplomacy',
    costPoints: 2,
    effectSummary: 'Allied Contacts generate +$12,000/hr passive tribute per Alliance forged',
    historicalFlavor: 'Peace on the Commission means every family prints money together.',
    prerequisiteId: 'con_3',
  },
  {
    id: 'con_5',
    branch: 'consigliere',
    tier: 5,
    name: 'Foley Square Jury Tampering',
    costPoints: 3,
    effectSummary: 'Immunity to Federal Indictments + +50% Respect & +3 Favor Tokens immediately',
    historicalFlavor: 'One bought juror in Federal Courthouse Room 318 hangs the entire RICO case.',
    prerequisiteId: 'con_4',
  },
];

export const WEAPON_ARSENAL: WeaponSpec[] = [
  {
    id: 'knuckles',
    slotKey: '1',
    name: 'Brass Knuckles & Stiletto',
    damage: 28,
    range: 72,
    cooldownMs: 280,
    spreadAngle: 0.4,
    pellets: 1,
    unlockCostCash: 0,
    heatPerShot: 0.4,
    description: 'Silent Mulberry Street persuader. Zero gunshot heat, heavy close-quarters stagger.',
  },
  {
    id: 'revolver',
    slotKey: '2',
    name: 'Snub-Nose .38 Special',
    damage: 42,
    range: 340,
    cooldownMs: 340,
    spreadAngle: 0.05,
    pellets: 1,
    unlockCostCash: 0,
    heatPerShot: 1.2,
    description: 'Taped-grip detective special. Reliable mid-range stopping power.',
  },
  {
    id: 'shotgun',
    slotKey: '3',
    name: 'Lupara Sawed-Off 12-Gauge',
    damage: 24,
    range: 240,
    cooldownMs: 680,
    spreadAngle: 0.34,
    pellets: 5,
    unlockCostCash: 4500,
    heatPerShot: 2.5,
    description: 'Devastating 5-pellet close blast with heavy hitstop and knockback.',
  },
  {
    id: 'tommy',
    slotKey: '4',
    name: 'M1928 Chicago Typewriter .45',
    damage: 30,
    range: 390,
    cooldownMs: 125,
    spreadAngle: 0.12,
    pellets: 1,
    unlockCostCash: 12000,
    heatPerShot: 1.5,
    description: '50-round drum submachine gun for clearing entire rival turf blocks.',
  },
];

export const NARRATIVE_CHAPTERS: NarrativeArcChapter[] = [
  {
    act: 1,
    year: 'SPRING 1984',
    title: 'Act I: Mulberry Street Envelopes',
    historicalContext: 'The FBI plants a bug inside the Ravenite Social Club while rival crews test your hold on Lower Manhattan.',
    objectiveText: 'Control 3 Rackets in NYC and reach $50,000 Empire Net Worth.',
    requiredRackets: 3,
    requiredNetWorth: 50000,
    requiredAlliances: 0,
    rewardCash: 12000,
    rewardSkillPoints: 2,
    rewardFavorTokens: 2,
  },
  {
    act: 2,
    year: 'SUMMER 1984',
    title: 'Act II: The Red Hook Container Tax',
    historicalContext: 'ILA Local 181 threatens a wildcat strike on the Brooklyn docks unless the Five Families settle the waterfront split.',
    objectiveText: 'Control 6 Rackets, reach $160,000 Net Worth, and forge 1 Inner-Circle Alliance (40+ Respect).',
    requiredRackets: 6,
    requiredNetWorth: 160000,
    requiredAlliances: 1,
    rewardCash: 28000,
    rewardSkillPoints: 2,
    rewardFavorTokens: 3,
  },
  {
    act: 3,
    year: 'AUTUMN 1984',
    title: 'Act III: Night Flight at JFK Hangar 7',
    historicalContext: 'Untaxed European bullion lands at Idlewild Airport. Taking Queens puts your crew on the Commission table.',
    objectiveText: 'Control 9 Rackets, reach $400,000 Net Worth, and forge 2 Alliances.',
    requiredRackets: 9,
    requiredNetWorth: 400000,
    requiredAlliances: 2,
    rewardCash: 55000,
    rewardSkillPoints: 3,
    rewardFavorTokens: 3,
  },
  {
    act: 4,
    year: 'WINTER 1984',
    title: 'Act IV: The Concrete Club 2% Monopoly',
    historicalContext: 'Manhattan’s skyline boom is taxed by the Commission Concrete Club. Seize Hunts Point & Midtown pours.',
    objectiveText: 'Control 12 Rackets, reach $900,000 Net Worth, and forge 4 Alliances.',
    requiredRackets: 12,
    requiredNetWorth: 900000,
    requiredAlliances: 4,
    rewardCash: 110000,
    rewardSkillPoints: 3,
    rewardFavorTokens: 4,
  },
  {
    act: 5,
    year: 'FEBRUARY 1985',
    title: 'Act V: Case #85-CR-102 — Boss of Bosses',
    historicalContext: 'U.S. Attorney Rudolph Giuliani unseals the historic Mafia Commission Indictment. Unite all 15 Rackets to survive and reign supreme.',
    objectiveText: 'Control all 15 NYC Rackets, reach $2,000,000 Net Worth, and forge 5 Alliances.',
    requiredRackets: 15,
    requiredNetWorth: 2000000,
    requiredAlliances: 5,
    rewardCash: 350000,
    rewardSkillPoints: 5,
    rewardFavorTokens: 6,
  },
];

export interface LeaderboardEntry {
  rank: number;
  donName: string;
  familyId: FamilyId;
  familyName: string;
  netWorth: number;
  racketsControlled: number;
  boroughsDominated: number;
  respectScore: number;
  title: string;
  isPlayer?: boolean;
  updatedAgo: string;
}

export const INITIAL_GLOBAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    donName: 'Don Anthony "Tony Ducks" Corallo',
    familyId: 'valenti',
    familyName: 'Valenti Queens Crew',
    netWorth: 2480000,
    racketsControlled: 14,
    boroughsDominated: 4,
    respectScore: 960,
    title: 'Commission Chairman',
    updatedAgo: 'Live · East Harlem Wire',
  },
  {
    rank: 2,
    donName: 'Don Vincent "The Chin" Bellini',
    familyId: 'bellini',
    familyName: 'Bellini Westside Syndicate',
    netWorth: 1940000,
    racketsControlled: 12,
    boroughsDominated: 3,
    respectScore: 885,
    title: 'Boss of Sullivan St.',
    updatedAgo: '14s ago · Greenwich Village',
  },
  {
    rank: 3,
    donName: 'Don Paul "Big Paul" Corvini',
    familyId: 'corvini',
    familyName: 'Corvini Crime Family',
    netWorth: 1620000,
    racketsControlled: 11,
    boroughsDominated: 3,
    respectScore: 820,
    title: 'Todt Hill Patriarch',
    updatedAgo: '32s ago · Staten Island',
  },
  {
    rank: 4,
    donName: 'Underboss John "Teflon Don" Gotti',
    familyId: 'corvini',
    familyName: 'Corvini Crime Family',
    netWorth: 1180000,
    racketsControlled: 9,
    boroughsDominated: 2,
    respectScore: 790,
    title: 'Bergen Club Capo',
    updatedAgo: '48s ago · Ozone Park',
  },
  {
    rank: 5,
    donName: 'Don Philip "Rusty" Rastelli',
    familyId: 'rastelli',
    familyName: 'Rastelli Knickerbocker Faction',
    netWorth: 790000,
    racketsControlled: 7,
    boroughsDominated: 2,
    respectScore: 640,
    title: 'Bushwick Consigliere',
    updatedAgo: '1m ago · Knickerbocker Ave',
  },
  {
    rank: 6,
    donName: 'Capo Sammy "The Bull" Gravano',
    familyId: 'moretti',
    familyName: 'Moretti Waterfront Family',
    netWorth: 510000,
    racketsControlled: 5,
    boroughsDominated: 1,
    respectScore: 520,
    title: 'Bensonhurst Earner',
    updatedAgo: '2m ago · Stillwell Ave',
  },
  {
    rank: 7,
    donName: 'Capo Roy DeMeo',
    familyId: 'moretti',
    familyName: 'Moretti Waterfront Family',
    netWorth: 315000,
    racketsControlled: 4,
    boroughsDominated: 1,
    respectScore: 410,
    title: 'Gemini Lounge Enforcer',
    updatedAgo: '3m ago · Flatlands',
  },
];
