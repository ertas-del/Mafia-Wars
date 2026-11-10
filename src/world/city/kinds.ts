import { CELL, WORLD_H, WORLD_W } from '../cityData.ts';

export const CellKind = { WATER: 0, OFFLIMITS: 1, ROAD: 2, SIDEWALK: 3, ALLEY: 4, PARK: 5, PIER: 6, PLAZA: 7, BRIDGE: 8, BUILDING: 9, BARRIER: 10 } as const;

export const COLS = WORLD_W / CELL;
export const ROWS = Math.ceil(WORLD_H / CELL);
