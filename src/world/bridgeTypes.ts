import type { ContractsState, FamilyKey } from './contracts.ts';

export type InteractPrompt = { type: 'racket' | 'contact' | 'npc' | 'ferry' | 'sitdown'; label: string; sublabel: string; id: string };

/** Contracts state the canvas reads (a prop). Contract times use `Date.now() + nowOffsetMs`. */
export type ContractsView = {
  state: ContractsState;
  heat: number;
  nowOffsetMs: number;
  respectXp: number;
  ceasefire: boolean;
  graceUntil: number;
};

export type ContractsCallbacks = {
  /** One call per family per finished attack (see `tallyAttack`). */
  onFamilyHarmed(family: FamilyKey, harm: { hits: number; kills: number }): void;
  onSitDownChosen(family: FamilyKey, alone: boolean): void;
  /** `?tour` only. */
  onContractsDebug(
    a: { type: 'heat'; value: number } | { type: 'grudge'; family: FamilyKey; points: number } | { type: 'clock'; ms: number }
  ): void;
};

export type ContractsBridge = {
  wakeAt(x: number, y: number): void;
  /** HUD tap: the engine decides the family and whether the player is alone. */
  chooseSitDown(): void;
};
