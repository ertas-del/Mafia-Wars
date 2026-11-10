// Pure city data for the 6400 x 4240 world. No images, no DOM, nothing imported from the game data module.
// Shapes come from the design canvas turf map (1600 x 1060) multiplied by 4.
import { clipPolyY, ellipsePoly, pointInPoly } from './city/geom.ts';

export const WORLD_W = 6400, WORLD_H = 4240, CELL = 32;
export type Pt = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };
export type GameBoroughId = 'manhattan_south' | 'midtown_concrete' | 'bronx_terminal' | 'brooklyn_docks' | 'queens_cargo';
export type AreaId = GameBoroughId | 'uptown' | 'staten_island';
/** Index into this list is what City.areaAt stores (255 means no area). */
export const AREA_IDS: readonly AreaId[] = ['manhattan_south', 'midtown_concrete', 'bronx_terminal', 'brooklyn_docks', 'queens_cargo', 'uptown', 'staten_island'];

/** Turf-map points (map units) to world pixels. */
function sc(flat: number[], k = 4): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < flat.length; i += 2) out.push({ x: flat[i] * k, y: flat[i + 1] * k });
  return out;
}

export const LAND: Record<'manhattan' | 'bronx' | 'queens' | 'brooklyn' | 'staten_island' | 'new_jersey' | 'randalls', Pt[]> = {
  manhattan: sc([620, 60, 665, 85, 690, 150, 700, 240, 700, 330, 690, 420, 670, 510, 645, 600, 615, 690, 580, 770, 545, 840, 505, 895, 465, 925, 430, 915, 415, 880, 425, 820, 445, 740, 470, 650, 495, 560, 520, 470, 545, 380, 570, 290, 590, 200, 600, 120]),
  bronx: sc([732, 62, 820, 32, 950, 42, 1060, 56, 1150, 90, 1190, 160, 1170, 240, 1120, 300, 1060, 330, 1030, 375, 995, 380, 975, 350, 940, 352, 850, 342, 780, 322, 740, 285, 730, 200, 728, 120]),
  queens: sc([760, 470, 860, 430, 980, 415, 1120, 400, 1260, 410, 1400, 430, 1520, 470, 1580, 560, 1575, 680, 1550, 800, 1520, 870, 1500, 940, 1440, 965, 1340, 975, 1230, 962, 1150, 935, 1100, 880, 1040, 820, 960, 760, 880, 710, 800, 660, 728, 622, 736, 540]),
  brooklyn: sc([728, 622, 800, 660, 880, 710, 960, 760, 1040, 820, 1100, 880, 1150, 935, 1152, 968, 1080, 1010, 980, 1040, 850, 1052, 720, 1042, 640, 1022, 602, 992, 616, 930, 640, 860, 668, 790, 690, 720, 708, 660]),
  staten_island: sc([350, 880, 400, 915, 410, 975, 380, 1030, 310, 1058, 200, 1058, 120, 1030, 80, 970, 95, 915, 160, 880, 250, 865]),
  new_jersey: sc([0, 0, 230, 0, 285, 100, 330, 260, 360, 420, 368, 580, 352, 700, 320, 770, 270, 800, 200, 800, 150, 790, 80, 800, 0, 815]),
  randalls: ellipsePoly(2968, 1568, 64, 64, 12),
};

/** Manhattan is Uptown above y 1800, Midtown from 1800 to 2480, Lower Manhattan from 2480 down. */
export const MANHATTAN_SPLIT_Y: { uptownBelow: number; midtownBelow: number } = { uptownBelow: 1800, midtownBelow: 2480 };

const outlineCache: Partial<Record<GameBoroughId, Pt[]>> = {};
export function boroughOutline(id: GameBoroughId): Pt[] {
  let o = outlineCache[id];
  if (!o) {
    if (id === 'manhattan_south') o = clipPolyY(LAND.manhattan, MANHATTAN_SPLIT_Y.midtownBelow, Infinity);
    else if (id === 'midtown_concrete') o = clipPolyY(LAND.manhattan, MANHATTAN_SPLIT_Y.uptownBelow, MANHATTAN_SPLIT_Y.midtownBelow);
    else if (id === 'bronx_terminal') o = LAND.bronx;
    else if (id === 'brooklyn_docks') o = LAND.brooklyn;
    else o = LAND.queens;
    outlineCache[id] = o;
  }
  return o;
}

/** The area a world point belongs to (null on water, New Jersey, Randall's Island and bridges). */
export function areaForPoint(x: number, y: number): AreaId | null {
  if (pointInPoly(x, y, LAND.manhattan)) {
    return y < MANHATTAN_SPLIT_Y.uptownBelow ? 'uptown' : y < MANHATTAN_SPLIT_Y.midtownBelow ? 'midtown_concrete' : 'manhattan_south';
  }
  if (pointInPoly(x, y, LAND.bronx)) return 'bronx_terminal';
  if (pointInPoly(x, y, LAND.queens)) return 'queens_cargo';
  if (pointInPoly(x, y, LAND.brooklyn)) return 'brooklyn_docks';
  if (pointInPoly(x, y, LAND.staten_island)) return 'staten_island';
  return null;
}

/** Walkable and drivable crossings. Triborough is three arms meeting on Randall's Island. The George Washington Bridge is drawn but closed. */
export const BRIDGES: { id: string; name: string; points: Pt[]; open: boolean }[] = [
  { id: 'brooklyn', name: 'Brooklyn Bridge', points: sc([512, 866, 662, 826]), open: true },
  { id: 'williamsburg', name: 'Williamsburg Bridge', points: sc([572, 782, 672, 780]), open: true },
  { id: 'queensboro', name: 'Queensboro Bridge', points: sc([652, 572, 740, 556]), open: true },
  { id: 'triborough_manhattan', name: 'Triborough Bridge', points: sc([698, 318, 742, 392]), open: true },
  { id: 'triborough_bronx', name: 'Triborough Bridge', points: sc([742, 392, 750, 314]), open: true },
  { id: 'triborough_queens', name: 'Triborough Bridge', points: sc([742, 392, 766, 468]), open: true },
  { id: 'verrazzano', name: 'Verrazzano Bridge', points: sc([405, 975, 604, 992]), open: true },
  { id: 'gwb', name: 'George Washington Bridge', points: sc([596, 168, 300, 150]), open: false },
];

/** Staten Island Ferry terminals, on pier cells. */
export const FERRY_TERMINALS: { battery: Pt; stGeorge: Pt } = { battery: { x: 1776, y: 3696 }, stGeorge: { x: 1456, y: 3568 } };

export const PARKS: { name: string; points: Pt[] }[] = [
  { name: 'Central Park', points: sc([580, 458, 628, 452, 650, 342, 602, 348]) },
  { name: 'Prospect Park', points: ellipsePoly(3200, 3700, 136, 104) },
  { name: 'Flushing Meadows', points: ellipsePoly(4600, 2240, 184, 120) },
  { name: 'Van Cortlandt Park', points: ellipsePoly(3340, 380, 152, 96) },
  { name: 'Pelham Bay Park', points: ellipsePoly(4500, 560, 136, 120) },
  { name: 'Bronx Park', points: sc([1880, 190, 1980, 200, 1990, 380, 1890, 370], 2) },
  { name: 'Staten Island Greenbelt', points: ellipsePoly(1040, 3900, 192, 136) },
];

/** Piers jutting into the water from a coast: side W puts water on the left, E on the right. */
export const PIER_SPECS: { id: string; landmass: 'manhattan' | 'brooklyn'; side: 'W' | 'E'; yFrom: number; yTo: number; step: number; len: number; thick: number }[] = [
  { id: 'hudson_piers', landmass: 'manhattan', side: 'W', yFrom: 2620, yTo: 3560, step: 224, len: 4, thick: 2 },
  { id: 'seaport_piers', landmass: 'manhattan', side: 'E', yFrom: 3000, yTo: 3500, step: 192, len: 3, thick: 2 },
  { id: 'red_hook_piers', landmass: 'brooklyn', side: 'W', yFrom: 2900, yTo: 3900, step: 192, len: 4, thick: 2 },
];

/** Paved open ground: rail yards, Hunts Point produce market, the JFK apron. They become PLAZA cells where they meet land. */
export const RAIL_YARDS: { name: string; rect: Rect }[] = [
  { name: 'Mott Haven Rail Yard', rect: { x: 3200, y: 1100, w: 256, h: 96 } },
  { name: 'Hunts Point Rail Spur', rect: { x: 3560, y: 1300, w: 224, h: 64 } },
  { name: 'Sunnyside Rail Yard', rect: { x: 3120, y: 2360, w: 320, h: 96 } },
  { name: 'Sunset Park Rail Yard', rect: { x: 2528, y: 3872, w: 256, h: 128 } },
];
/** Waterfront promenades: the coast sidewalk ring is paved as PLAZA over these stretches (walkable, drawn as an esplanade). */
export const PROMENADES: { name: string; landmass: 'manhattan' | 'bronx' | 'queens' | 'brooklyn' | 'staten_island'; yFrom: number; yTo: number }[] = [
  { name: 'Hudson and East River Esplanade', landmass: 'manhattan', yFrom: 0, yTo: 4240 },
  { name: 'Harlem River and Hunts Point Waterfront', landmass: 'bronx', yFrom: 0, yTo: 4240 },
  { name: 'Brooklyn Heights Promenade', landmass: 'brooklyn', yFrom: 0, yTo: 4240 },
  { name: 'Staten Island Waterfront', landmass: 'staten_island', yFrom: 0, yTo: 4240 },
];

/** Pedestrian squares: they pave the sidewalk and alley cells they cover and leave the roads alone. */
export const SQUARES: { name: string; rect: Rect }[] = [
  { name: 'Times Square', rect: { x: 2060, y: 2304, w: 560, h: 30 } },
  { name: 'Herald Square', rect: { x: 2060, y: 1856, w: 560, h: 30 } },
];
export const HUNTS_POINT_MARKET: Rect = { x: 3904, y: 1424, w: 256, h: 72 };
export const JFK_CARGO: Rect = { x: 5552, y: 3408, w: 512, h: 320 };
export const JFK_APRON: Rect[] = [{ x: 5888, y: 3408, w: 176, h: 320 }];

export const START_POINT: Pt = { x: 2064, y: 3376 };
export const STATIONS: Record<GameBoroughId, Pt> = {
  manhattan_south: { x: 1968, y: 3184 },
  midtown_concrete: { x: 2448, y: 2000 },
  bronx_terminal: { x: 3600, y: 1104 },
  brooklyn_docks: { x: 3216, y: 3568 },
  queens_cargo: { x: 4752, y: 3408 },
};

export const RACKET_IDS = ['racket_ravenite', 'racket_fulton_fish', 'racket_garment_trucking', 'racket_redhook_pier14', 'racket_bensonhurst_numbers', 'racket_gowanus_chop', 'racket_jfk_hangar7', 'racket_ozone_lounge', 'racket_aqueduct_wire', 'racket_huntspoint_carting', 'racket_arthur_ave_imports', 'racket_bronx_meat_market', 'racket_concrete_club_hq', 'racket_hellskitchen_local282', 'racket_times_square_velvet'] as const;
export type RacketId = typeof RACKET_IDS[number];
export const CONTACT_IDS = ['contact_castellano', 'contact_gallo', 'contact_rossi', 'contact_omalley', 'contact_bellini_consigliere', 'contact_persico'] as const;
export type ContactId = typeof CONTACT_IDS[number];

/** Racket sign names and boroughs, copied by hand from the game data (a test reads the data file to keep the ids in step). */
export const RACKET_INFO: Record<RacketId, { name: string; boroughId: GameBoroughId }> = {
  racket_ravenite: { name: 'Mulberry St. Espresso & Social Club', boroughId: 'manhattan_south' },
  racket_fulton_fish: { name: 'Fulton Fish Market Unloading Stall', boroughId: 'manhattan_south' },
  racket_garment_trucking: { name: '7th Ave Garment Center Trucking', boroughId: 'manhattan_south' },
  racket_redhook_pier14: { name: 'Red Hook Container Pier 14', boroughId: 'brooklyn_docks' },
  racket_bensonhurst_numbers: { name: '18th Ave Sports Book & Numbers Bank', boroughId: 'brooklyn_docks' },
  racket_gowanus_chop: { name: 'Gowanus Canal Export Chop Shop', boroughId: 'brooklyn_docks' },
  racket_jfk_hangar7: { name: 'JFK International Air Cargo Hangar 7', boroughId: 'queens_cargo' },
  racket_ozone_lounge: { name: 'Rockaway Blvd Velvet Lounge', boroughId: 'queens_cargo' },
  racket_aqueduct_wire: { name: 'Aqueduct Turf Club Tele-Wire', boroughId: 'queens_cargo' },
  racket_huntspoint_carting: { name: 'Hunts Point Private Sanitation Depot', boroughId: 'bronx_terminal' },
  racket_arthur_ave_imports: { name: 'Arthur Ave Espresso & Olive Oil Imports', boroughId: 'bronx_terminal' },
  racket_bronx_meat_market: { name: 'Bronx Terminal Cold Storage & Provision', boroughId: 'bronx_terminal' },
  racket_concrete_club_hq: { name: 'Midtown Scavullo Ready-Mix Concrete Tower', boroughId: 'midtown_concrete' },
  racket_hellskitchen_local282: { name: "Hell's Kitchen Teamsters Hall Local 282", boroughId: 'midtown_concrete' },
  racket_times_square_velvet: { name: '42nd St. Neon Arcade & Syndicate Vault', boroughId: 'midtown_concrete' },
};
export const CONTACT_BOROUGH: Record<ContactId, GameBoroughId> = {
  contact_castellano: 'manhattan_south',
  contact_gallo: 'queens_cargo',
  contact_rossi: 'midtown_concrete',
  contact_omalley: 'brooklyn_docks',
  contact_bellini_consigliere: 'manhattan_south',
  contact_persico: 'bronx_terminal',
};

/** Racket lots in world pixels, aligned to the street grid laid out by GROUP_SEEDS in city/grid.ts (the generator carves exactly these lots, whatever the city seed). */
export const RACKET_PLACEMENT: Record<RacketId, { x: number; y: number; width: number; height: number }> = {
  racket_ravenite: { x: 1984, y: 3072, width: 160, height: 96 },
  racket_fulton_fish: { x: 1824, y: 3456, width: 160, height: 96 },
  racket_garment_trucking: { x: 2176, y: 2624, width: 160, height: 160 },
  racket_redhook_pier14: { x: 2528, y: 3616, width: 160, height: 160 },
  racket_bensonhurst_numbers: { x: 2944, y: 4000, width: 160, height: 96 },
  racket_gowanus_chop: { x: 2848, y: 3296, width: 160, height: 96 },
  racket_jfk_hangar7: { x: 5696, y: 3680, width: 160, height: 96 },
  racket_ozone_lounge: { x: 4672, y: 3296, width: 160, height: 96 },
  racket_aqueduct_wire: { x: 4800, y: 3616, width: 160, height: 160 },
  racket_huntspoint_carting: { x: 3968, y: 1216, width: 160, height: 96 },
  racket_arthur_ave_imports: { x: 3584, y: 672, width: 160, height: 96 },
  racket_bronx_meat_market: { x: 2976, y: 960, width: 160, height: 128 },
  racket_concrete_club_hq: { x: 2272, y: 2112, width: 160, height: 96 },
  racket_hellskitchen_local282: { x: 2112, y: 2112, width: 160, height: 96 },
  racket_times_square_velvet: { x: 2176, y: 2336, width: 160, height: 96 },
};

/** Where the designer wanted each racket (turf-map pins times 4); the placement search starts from these. */
export const RACKET_TARGETS: Record<RacketId, Pt> = {
  racket_ravenite: { x: 2060, y: 3200 },
  racket_fulton_fish: { x: 1992, y: 3536 },
  racket_garment_trucking: { x: 2300, y: 2520 },
  racket_concrete_club_hq: { x: 2500, y: 2080 },
  racket_hellskitchen_local282: { x: 2192, y: 2260 },
  racket_times_square_velvet: { x: 2440, y: 2312 },
  racket_redhook_pier14: { x: 2620, y: 3560 },
  racket_bensonhurst_numbers: { x: 3060, y: 3960 },
  racket_gowanus_chop: { x: 2880, y: 3440 },
  racket_jfk_hangar7: { x: 5720, y: 3620 },
  racket_ozone_lounge: { x: 4740, y: 3432 },
  racket_aqueduct_wire: { x: 4880, y: 3620 },
  racket_huntspoint_carting: { x: 4000, y: 1288 },
  racket_arthur_ave_imports: { x: 3672, y: 792 },
  racket_bronx_meat_market: { x: 3060, y: 1008 },
};

export const CONTACT_PLACEMENT: Record<ContactId, Pt> = {
  contact_castellano: { x: 2224, y: 3056 },
  contact_gallo: { x: 4560, y: 3568 },
  contact_rossi: { x: 2576, y: 2000 },
  contact_omalley: { x: 2928, y: 3408 },
  contact_bellini_consigliere: { x: 1904, y: 3568 },
  contact_persico: { x: 3504, y: 784 },
};

const LABELS: [string, number, number][] = [
  ['INWOOD', 632, 112], ['WASHINGTON HTS', 630, 182], ['HARLEM', 634, 268], ['UPPER W SIDE', 578, 420], ['UPPER E SIDE', 668, 378],
  ['MIDTOWN', 606, 510], ["HELL'S KITCHEN", 536, 548], ['GARMENT CTR', 565, 600], ['CHELSEA', 520, 680], ['GREENWICH VILL', 505, 728],
  ['LITTLE ITALY', 528, 782], ['FINANCIAL DIST', 474, 858], ['RIVERDALE', 795, 70], ['KINGSBRIDGE', 905, 78], ['FORDHAM', 880, 160],
  ['BELMONT', 945, 214], ['WAKEFIELD', 1040, 160], ['PELHAM BAY', 1120, 190], ['THROGS NECK', 1110, 268], ['MOTT HAVEN', 800, 300],
  ['HUNTS POINT', 1005, 342], ['ASTORIA', 808, 508], ['LONG IS. CITY', 780, 598], ['JACKSON HTS', 950, 520], ['FLUSHING', 1190, 468],
  ['BAYSIDE', 1355, 470], ['FOREST HILLS', 1110, 655], ['JAMAICA', 1310, 700], ['OZONE PARK', 1140, 820], ['HOWARD BEACH', 1265, 930],
  ['J.F.K. AIRPORT', 1462, 880], ['GREENPOINT', 790, 690], ['WILLIAMSBURG', 772, 744], ['BUSHWICK', 905, 800], ['RED HOOK', 668, 905],
  ['GOWANUS', 745, 878], ['PARK SLOPE', 800, 963], ['BAY RIDGE', 655, 975], ['BENSONHURST', 785, 1010], ['CONEY ISLAND', 845, 1040],
  ['CANARSIE', 1045, 955], ['ST. GEORGE', 330, 905], ['TOTTENVILLE', 180, 1040], ['GREAT KILLS', 330, 1022],
];
export const NEIGHBOURHOOD_LABELS: { name: string; x: number; y: number; area: AreaId | null }[] = LABELS.map(([name, x, y]) => ({ name, x: x * 4, y: y * 4, area: areaForPoint(x * 4, y * 4) }));
