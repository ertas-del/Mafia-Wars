import React from 'react';
import { Vibrate, VibrateOff } from 'lucide-react';
import {
  BoroughId,
  FIVE_FAMILIES,
  FamilyId,
  NARRATIVE_CHAPTERS,
  NYC_BOROUGHS,
  WEAPON_ARSENAL,
  WeaponId,
} from '../data/nyc1984Data';
import { DrawerTab } from './SyndicateDrawers';
import { soundEngine } from '../audio/soundEngine';

interface PerimeterHudProps {
  donName: string;
  playerFamily: FamilyId;
  currentBoroughId: BoroughId;
  hp: number;
  maxHp: number;
  cash: number;
  hourlyCashIncome: number;
  contraband: number;
  favorTokens: number;
  skillPoints: number;
  policeHeat: number;
  netWorth: number;
  controlledRacketsCount: number;
  uncollectedTotal: number;
  equippedWeapon: WeaponId;
  unlockedWeapons: WeaponId[];
  currentActIndex: number;
  isMuted: boolean;
  vibrationSupported: boolean;
  vibrationOn: boolean;
  hasOfflineReport: boolean;
  nearPrompt: { type: 'racket' | 'contact' | 'npc'; label: string; sublabel: string; id: string } | null;
  recentToast: string | null;
  onSelectBorough: (boroughId: BoroughId) => void;
  onEquipOrBuyWeapon: (weaponId: WeaponId) => void;
  onOpenDrawer: (tab: DrawerTab, focusId?: string) => void;
  onCollectAllEnvelopes: () => void;
  onBribePolice: () => void;
  onToggleMute: () => void;
  onToggleVibration: () => void;
  onPause: () => void;
}

export const PerimeterHud: React.FC<PerimeterHudProps> = ({
  donName,
  playerFamily,
  currentBoroughId,
  hp,
  maxHp,
  cash,
  hourlyCashIncome,
  contraband,
  favorTokens,
  skillPoints,
  policeHeat,
  netWorth,
  controlledRacketsCount,
  uncollectedTotal,
  equippedWeapon,
  unlockedWeapons,
  currentActIndex,
  isMuted,
  vibrationSupported,
  vibrationOn,
  hasOfflineReport,
  nearPrompt,
  recentToast,
  onSelectBorough,
  onEquipOrBuyWeapon,
  onOpenDrawer,
  onCollectAllEnvelopes,
  onBribePolice,
  onToggleMute,
  onToggleVibration,
  onPause,
}) => {
  const family = FIVE_FAMILIES.find((f) => f.id === playerFamily) || FIVE_FAMILIES[0];
  const borough = NYC_BOROUGHS.find((b) => b.id === currentBoroughId) || NYC_BOROUGHS[0];
  const chapter = NARRATIVE_CHAPTERS[Math.min(currentActIndex, NARRATIVE_CHAPTERS.length - 1)];

  const hpPct = Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100)));
  const hpStateLabel = hpPct > 65 ? 'STABLE' : hpPct > 30 ? 'WOUNDED' : 'CRITICAL';
  const heatRounded = Math.round(policeHeat);
  const heatLabel = heatRounded < 25 ? 'LOW WIRE' : heatRounded < 60 ? 'SURVEILLED' : 'RAID IMMINENT';

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-3.5 md:p-5 short:p-1.5 short:pl-[max(0.375rem,env(safe-area-inset-left))] short:pr-[max(0.375rem,env(safe-area-inset-right))] short:pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      {/* TOP PERIMETER ROW */}
      <div className="flex flex-wrap items-start justify-between gap-3 short:flex-nowrap short:gap-2">
        {/* Top-Left Cluster: Boss Vital Signs, Heat & Borough Subway Fast-Travel */}
        <div className="pointer-events-auto bg-[#12100E] border border-[#3A322B] rounded-lg p-3 shadow-lg max-w-md short:p-1.5 short:w-56 short:min-w-0 short:shrink">
          <div className="flex items-center justify-between gap-4 short:hidden">
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#F5F0E6] truncate">{donName}</div>
              <div className="text-[11px] text-[#D97706] truncate">
                {family.name} · {chapter.year}
              </div>
            </div>
            <div className="text-right font-mono tabular-nums text-xs shrink-0">
              <span className="text-[#A89F91]">Net Worth </span>
              <strong className="text-[#10B981]">${netWorth.toLocaleString()}</strong>
            </div>
          </div>

          {/* Non-Hue-Only Health & Police Heat Bars */}
          <div className="mt-2.5 grid grid-cols-2 gap-3 font-mono tabular-nums text-[11px] short:mt-0 short:gap-2 short:text-[10px] short:leading-tight">
            <div>
              <div className="flex items-center justify-between gap-1 text-[#D6CFC2] mb-1 short:mb-0.5">
                <span>HP: {Math.round(hp)}/{maxHp}</span>
                <span className={`short:hidden ${hpPct > 35 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{hpStateLabel}</span>
              </div>
              <div className="w-full h-2 short:h-1.5 bg-[#26211D] rounded overflow-hidden">
                <div
                  className={`h-full ${hpPct > 35 ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}
                  style={{ width: `${hpPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-1 text-[#D6CFC2] mb-1 short:mb-0.5">
                <span>HEAT: {heatRounded}%</span>
                <span className={`short:hidden ${heatRounded < 55 ? 'text-[#F59E0B]' : 'text-[#EF4444]'}`}>{heatLabel}</span>
              </div>
              <div className="w-full h-2 short:h-1.5 bg-[#26211D] rounded overflow-hidden">
                <div
                  className={`h-full ${heatRounded < 55 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'}`}
                  style={{ width: `${Math.min(100, heatRounded)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Current Borough Risk-Reward & Fast Travel */}
          <div className={`mt-2.5 pt-2 border-t border-[#2C2520] flex flex-wrap items-center justify-between gap-2 short:mt-1 short:pt-1 ${heatRounded >= 20 ? '' : 'short:hidden'}`}>
            <div className="text-[11px] text-[#D6CFC2] font-mono short:hidden">
              <span className="text-[#F59E0B] font-semibold">{borough.name.split('&')[0].trim()}</span>
              <span className="mx-1" aria-hidden="true">·</span>
              <span>Tier {borough.riskTier} ({borough.rewardMultiplier}x)</span>
            </div>

            <div className="flex items-center gap-1 short:w-full">
              {NYC_BOROUGHS.map((b, idx) => (
                <button
                  key={b.id}
                  type="button"
                  title={`Travel to ${b.name} (${b.riskLabel})`}
                  onClick={() => {
                    soundEngine.playUiClick();
                    onSelectBorough(b.id);
                  }}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer short:hidden touch:min-h-11 touch:min-w-11 ${
                    b.id === currentBoroughId
                      ? 'bg-[#B91C1C] border-[#EF4444] text-white font-bold'
                      : 'bg-[#181512] border-[#2C2520] text-[#A89F91] hover:text-[#F5F0E6]'
                  }`}
                >
                  B{idx + 1}
                </button>
              ))}
              {heatRounded >= 20 && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playCashCollect();
                    onBribePolice();
                  }}
                  className="ml-1 px-2 py-0.5 bg-[#1E293B] hover:bg-[#334155] text-[#38BDF8] border border-[#38BDF8]/40 rounded text-[10px] font-mono whitespace-nowrap shrink-0 cursor-pointer short:ml-0 short:w-full touch:min-h-11 touch:min-w-11"
                >
                  Bribe NYPD ($1.5k)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Top-Right Cluster: Economy Telemetry, Offline Vault Alert & System Controls */}
        <div className="pointer-events-auto flex flex-col items-end gap-2 short:gap-1 short:min-w-0 short:max-w-[60%]">
          <div className="bg-[#12100E] border border-[#3A322B] rounded-lg px-3.5 py-2.5 shadow-lg flex flex-wrap items-center gap-4 font-mono tabular-nums text-xs short:flex-nowrap short:px-1.5 short:py-1 short:gap-2 short:text-[11px]">
            {/* Custom SVG Cash Icon + Readout */}
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#10B981] shrink-0 short:w-3 short:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <div>
                <div className="text-[#10B981] font-bold">${Math.floor(cash).toLocaleString()}</div>
                <div className="text-[10px] text-[#A89F91] short:hidden">+${hourlyCashIncome.toLocaleString()}/hr</div>
              </div>
            </div>

            <span className="text-[#3A322B] short:hidden" aria-hidden="true">|</span>

            {/* Contraband Crates */}
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#F59E0B] shrink-0 short:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              </svg>
              <div>
                <div className="text-[#F59E0B] font-bold">{contraband} Crates</div>
                <div className="text-[10px] text-[#A89F91] short:hidden">Turf {controlledRacketsCount}/15</div>
              </div>
            </div>

            <span className="text-[#3A322B] short:hidden" aria-hidden="true">|</span>

            {/* Favors & Skill Points */}
            <div className="short:hidden">
              <div className="text-[#F5F0E6] font-bold">
                {favorTokens} Favors · {skillPoints} SP
              </div>
              <div className="text-[10px] text-[#A89F91]">{chapter.title.split(':')[0]}</div>
            </div>

            {/* Audio Mute & Pause Controls */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-[#2C2520] short:gap-1 short:pl-1.5">
              <button
                type="button"
                onClick={onToggleMute}
                aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                className="px-2.5 py-1.5 bg-[#181512] hover:bg-[#26211D] text-[#D6CFC2] border border-[#2C2520] rounded text-[11px] font-sans whitespace-nowrap shrink-0 cursor-pointer short:px-2 short:py-1 short:text-[10px] touch:min-h-11 touch:min-w-11"
              >
                {isMuted ? 'Sound Off' : 'Sound On'}
              </button>
              {vibrationSupported && (
                <button
                  type="button"
                  onClick={onToggleVibration}
                  aria-label={vibrationOn ? 'Vibration on' : 'Vibration off'}
                  aria-pressed={vibrationOn}
                  className="inline-flex items-center justify-center px-2.5 py-1.5 bg-[#181512] hover:bg-[#26211D] text-[#D6CFC2] border border-[#2C2520] rounded text-[11px] font-sans whitespace-nowrap shrink-0 cursor-pointer short:px-2 short:py-1 short:text-[10px] touch:min-h-11 touch:min-w-11"
                >
                  {vibrationOn ? (
                    <Vibrate className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <VibrateOff className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  onPause();
                }}
                className="px-2.5 py-1.5 bg-[#181512] hover:bg-[#26211D] text-[#D6CFC2] border border-[#2C2520] rounded text-[11px] font-sans whitespace-nowrap shrink-0 cursor-pointer short:px-2 short:py-1 short:text-[10px] touch:min-h-11 touch:min-w-11"
              >
                Pause
              </button>
            </div>
          </div>

          {/* Uncollected Envelopes or Offline Vault Notification Banner */}
          <div className="flex flex-wrap justify-end items-center gap-2 short:gap-1">
            {hasOfflineReport && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playCashCollect();
                  onOpenDrawer('vault');
                }}
                className="px-3 py-1.5 bg-[#D97706] hover:bg-[#F59E0B] text-[#090807] font-bold text-xs rounded shadow-lg whitespace-nowrap shrink-0 cursor-pointer short:px-2 short:py-1 short:text-[10px] touch:min-h-11 touch:min-w-11"
              >
                Collect <span className="short:hidden">Offline Idle </span>Tribute<span className="short:hidden"> Chest</span> →
              </button>
            )}
            {uncollectedTotal >= 100 && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playCashCollect();
                  onCollectAllEnvelopes();
                }}
                className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-[#052E16] font-mono tabular-nums font-bold text-xs rounded shadow-lg whitespace-nowrap shrink-0 cursor-pointer short:px-2 short:py-1 short:text-[10px] touch:min-h-11 touch:min-w-11"
              >
                Collect <span className="short:hidden">Street </span>Envelopes (+${uncollectedTotal.toLocaleString()})
              </button>
            )}
          </div>

          {recentToast && (
            <div className="px-3 py-1.5 bg-[#181512] border border-[#D97706] rounded text-xs text-[#FDE68A] font-mono shadow short:px-2 short:py-0.5 short:text-[10px] short:max-w-full short:truncate">
              {recentToast}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM PERIMETER ROW */}
      <div className="flex flex-wrap items-end justify-between gap-3 short:flex-nowrap short:gap-1.5">
        {/* Bottom-Left: Weapon Arsenal Hotbar (Keys 1 - 4) */}
        <div className="pointer-events-auto bg-[#12100E] border border-[#3A322B] rounded-lg p-2 shadow-lg flex items-center gap-1.5 short:p-1 short:gap-1 shrink-0">
          {WEAPON_ARSENAL.map((w) => {
            const isUnlocked = unlockedWeapons.includes(w.id);
            const isEquipped = equippedWeapon === w.id;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  onEquipOrBuyWeapon(w.id);
                }}
                className={`px-2.5 py-1.5 rounded border text-left transition-colors whitespace-nowrap shrink-0 cursor-pointer short:px-1.5 short:py-0.5 short:leading-tight touch:min-h-11 touch:min-w-11 ${
                  isEquipped
                    ? 'bg-[#B91C1C] border-[#EF4444] text-white'
                    : isUnlocked
                    ? 'bg-[#181512] border-[#2C2520] text-[#D6CFC2] hover:border-[#4A3F36]'
                    : 'bg-[#141210] border-[#26211D] text-[#A89F91] hover:border-[#D97706]'
                }`}
              >
                <div className="text-[11px] font-bold short:text-[10px]">
                  <span className="touch:hidden">[{w.slotKey}] </span>{w.name.split(' ')[0]}
                </div>
                <div className="text-[10px] font-mono tabular-nums short:text-[9px]">
                  {isUnlocked ? `DMG ${w.damage}` : `Buy $${w.unlockCostCash.toLocaleString()}`}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom-Center: Interactive Street Context Prompt (Racket / Social Sit-Down) */}
        {nearPrompt && (
          <div className="pointer-events-auto min-w-0 short:shrink">
            <button
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                if (nearPrompt.type === 'contact') {
                  onOpenDrawer('social', nearPrompt.id);
                } else {
                  onOpenDrawer('turf', nearPrompt.id);
                }
              }}
              className="px-4 py-2 bg-[#12100E] hover:bg-[#1C1917] border-2 border-[#F59E0B] rounded-lg shadow-xl text-center cursor-pointer max-w-full short:px-2 short:py-1 touch:min-h-11 touch:min-w-11"
            >
              <div className="text-xs font-bold text-[#FDE68A] whitespace-nowrap short:text-[11px] short:truncate">{nearPrompt.label}</div>
              <div className="text-[11px] text-[#A89F91] font-mono whitespace-nowrap short:text-[10px] short:truncate">{nearPrompt.sublabel}</div>
            </button>
          </div>
        )}

        {/* Bottom-Right: Syndicate Dossier & Management Navigation Dock */}
        <div className="pointer-events-auto bg-[#12100E] border border-[#3A322B] rounded-lg p-2 shadow-lg flex flex-wrap items-center gap-1.5 short:flex-nowrap short:p-1 short:gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onOpenDrawer('turf');
            }}
            className="px-3 py-1.5 bg-[#B91C1C] hover:bg-[#DC2626] text-white text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer short:px-2 short:py-1 short:text-[10px] touch:min-h-11 touch:min-w-11"
          >
            Turf<span className="short:hidden"> & Rackets</span> <span className="font-mono tabular-nums">({controlledRacketsCount}/15)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onOpenDrawer('social');
            }}
            className="px-3 py-1.5 bg-[#181512] hover:bg-[#26211D] text-[#F5F0E6] border border-[#2C2520] text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer short:px-2 short:py-1 short:text-[10px] touch:min-h-11 touch:min-w-11"
          >
            <span className="short:hidden">Inner </span>Circle <span className="font-mono tabular-nums">({favorTokens}<span className="short:hidden"> Favors</span>)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onOpenDrawer('skills');
            }}
            className="px-3 py-1.5 bg-[#181512] hover:bg-[#26211D] text-[#F5F0E6] border border-[#2C2520] text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer short:px-2 short:py-1 short:text-[10px] touch:min-h-11 touch:min-w-11"
          >
            Skill<span className="short:hidden"> Tree</span> <span className="font-mono tabular-nums">({skillPoints} SP)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onOpenDrawer('vault');
            }}
            className="px-3 py-1.5 bg-[#181512] hover:bg-[#26211D] text-[#F5F0E6] border border-[#2C2520] text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer short:px-2 short:py-1 short:text-[10px] touch:min-h-11 touch:min-w-11"
          >
            <span className="short:hidden">Offline </span>Vault
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onOpenDrawer('leaderboard');
            }}
            className="px-3 py-1.5 bg-[#181512] hover:bg-[#26211D] text-[#F5F0E6] border border-[#2C2520] text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer short:px-2 short:py-1 short:text-[10px] touch:min-h-11 touch:min-w-11"
          >
            <span className="short:hidden">Leaderboard</span>
            <span className="hidden short:inline">Ranks</span>
          </button>
        </div>
      </div>
    </div>
  );
};
