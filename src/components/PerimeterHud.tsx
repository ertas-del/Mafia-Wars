import React from 'react';
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
  hasOfflineReport: boolean;
  nearPrompt: { type: 'racket' | 'contact' | 'npc'; label: string; sublabel: string; id: string } | null;
  recentToast: string | null;
  onSelectBorough: (boroughId: BoroughId) => void;
  onEquipOrBuyWeapon: (weaponId: WeaponId) => void;
  onOpenDrawer: (tab: DrawerTab, focusId?: string) => void;
  onCollectAllEnvelopes: () => void;
  onBribePolice: () => void;
  onToggleMute: () => void;
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
  hasOfflineReport,
  nearPrompt,
  recentToast,
  onSelectBorough,
  onEquipOrBuyWeapon,
  onOpenDrawer,
  onCollectAllEnvelopes,
  onBribePolice,
  onToggleMute,
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
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-3.5 md:p-5">
      {/* TOP PERIMETER ROW */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Top-Left Cluster: Boss Vital Signs, Heat & Borough Subway Fast-Travel */}
        <div className="pointer-events-auto bg-[#12100E] border border-[#3A322B] rounded-lg p-3 shadow-lg max-w-md">
          <div className="flex items-center justify-between gap-4">
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
          <div className="mt-2.5 grid grid-cols-2 gap-3 font-mono tabular-nums text-[11px]">
            <div>
              <div className="flex items-center justify-between text-[#D6CFC2] mb-1">
                <span>HP: {Math.round(hp)}/{maxHp}</span>
                <span className={hpPct > 35 ? 'text-[#10B981]' : 'text-[#EF4444]'}>{hpStateLabel}</span>
              </div>
              <div className="w-full h-2 bg-[#26211D] rounded overflow-hidden">
                <div
                  className={`h-full ${hpPct > 35 ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}
                  style={{ width: `${hpPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[#D6CFC2] mb-1">
                <span>HEAT: {heatRounded}%</span>
                <span className={heatRounded < 55 ? 'text-[#F59E0B]' : 'text-[#EF4444]'}>{heatLabel}</span>
              </div>
              <div className="w-full h-2 bg-[#26211D] rounded overflow-hidden">
                <div
                  className={`h-full ${heatRounded < 55 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'}`}
                  style={{ width: `${Math.min(100, heatRounded)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Current Borough Risk-Reward & Fast Travel */}
          <div className="mt-2.5 pt-2 border-t border-[#2C2520] flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] text-[#D6CFC2] font-mono">
              <span className="text-[#F59E0B] font-semibold">{borough.name.split('&')[0].trim()}</span>
              <span className="mx-1" aria-hidden="true">·</span>
              <span>Tier {borough.riskTier} ({borough.rewardMultiplier}x)</span>
            </div>

            <div className="flex items-center gap-1">
              {NYC_BOROUGHS.map((b, idx) => (
                <button
                  key={b.id}
                  type="button"
                  title={`Travel to ${b.name} (${b.riskLabel})`}
                  onClick={() => {
                    soundEngine.playUiClick();
                    onSelectBorough(b.id);
                  }}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
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
                  className="ml-1 px-2 py-0.5 bg-[#1E293B] hover:bg-[#334155] text-[#38BDF8] border border-[#38BDF8]/40 rounded text-[10px] font-mono whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Bribe NYPD ($1.5k)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Top-Right Cluster: Economy Telemetry, Offline Vault Alert & System Controls */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <div className="bg-[#12100E] border border-[#3A322B] rounded-lg px-3.5 py-2.5 shadow-lg flex flex-wrap items-center gap-4 font-mono tabular-nums text-xs">
            {/* Custom SVG Cash Icon + Readout */}
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#10B981] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <div>
                <div className="text-[#10B981] font-bold">${Math.floor(cash).toLocaleString()}</div>
                <div className="text-[10px] text-[#A89F91]">+${hourlyCashIncome.toLocaleString()}/hr</div>
              </div>
            </div>

            <span className="text-[#3A322B]" aria-hidden="true">|</span>

            {/* Contraband Crates */}
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#F59E0B] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              </svg>
              <div>
                <div className="text-[#F59E0B] font-bold">{contraband} Crates</div>
                <div className="text-[10px] text-[#A89F91]">Turf {controlledRacketsCount}/15</div>
              </div>
            </div>

            <span className="text-[#3A322B]" aria-hidden="true">|</span>

            {/* Favors & Skill Points */}
            <div>
              <div className="text-[#F5F0E6] font-bold">
                {favorTokens} Favors · {skillPoints} SP
              </div>
              <div className="text-[10px] text-[#A89F91]">{chapter.title.split(':')[0]}</div>
            </div>

            {/* Audio Mute & Pause Controls */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-[#2C2520]">
              <button
                type="button"
                onClick={onToggleMute}
                aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                className="px-2.5 py-1.5 bg-[#181512] hover:bg-[#26211D] text-[#D6CFC2] border border-[#2C2520] rounded text-[11px] font-sans whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isMuted ? 'Sound Off' : 'Sound On'}
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  onPause();
                }}
                className="px-2.5 py-1.5 bg-[#181512] hover:bg-[#26211D] text-[#D6CFC2] border border-[#2C2520] rounded text-[11px] font-sans whitespace-nowrap shrink-0 cursor-pointer"
              >
                Pause
              </button>
            </div>
          </div>

          {/* Uncollected Envelopes or Offline Vault Notification Banner */}
          <div className="flex items-center gap-2">
            {hasOfflineReport && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playCashCollect();
                  onOpenDrawer('vault');
                }}
                className="px-3 py-1.5 bg-[#D97706] hover:bg-[#F59E0B] text-[#090807] font-bold text-xs rounded shadow-lg whitespace-nowrap shrink-0 cursor-pointer"
              >
                Collect Offline Idle Tribute Chest →
              </button>
            )}
            {uncollectedTotal >= 100 && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playCashCollect();
                  onCollectAllEnvelopes();
                }}
                className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-[#052E16] font-mono tabular-nums font-bold text-xs rounded shadow-lg whitespace-nowrap shrink-0 cursor-pointer"
              >
                Collect Street Envelopes (+${uncollectedTotal.toLocaleString()})
              </button>
            )}
          </div>

          {recentToast && (
            <div className="px-3 py-1.5 bg-[#181512] border border-[#D97706] rounded text-xs text-[#FDE68A] font-mono shadow">
              {recentToast}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM PERIMETER ROW */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        {/* Bottom-Left: Weapon Arsenal Hotbar (Keys 1 - 4) */}
        <div className="pointer-events-auto bg-[#12100E] border border-[#3A322B] rounded-lg p-2 shadow-lg flex items-center gap-1.5">
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
                className={`px-2.5 py-1.5 rounded border text-left transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isEquipped
                    ? 'bg-[#B91C1C] border-[#EF4444] text-white'
                    : isUnlocked
                    ? 'bg-[#181512] border-[#2C2520] text-[#D6CFC2] hover:border-[#4A3F36]'
                    : 'bg-[#141210] border-[#26211D] text-[#A89F91] hover:border-[#D97706]'
                }`}
              >
                <div className="text-[11px] font-bold">
                  [{w.slotKey}] {w.name.split(' ')[0]}
                </div>
                <div className="text-[10px] font-mono tabular-nums">
                  {isUnlocked ? `DMG ${w.damage}` : `Buy $${w.unlockCostCash.toLocaleString()}`}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom-Center: Interactive Street Context Prompt (Racket / Social Sit-Down) */}
        {nearPrompt && (
          <div className="pointer-events-auto">
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
              className="px-4 py-2 bg-[#12100E] hover:bg-[#1C1917] border-2 border-[#F59E0B] rounded-lg shadow-xl text-center cursor-pointer"
            >
              <div className="text-xs font-bold text-[#FDE68A] whitespace-nowrap">{nearPrompt.label}</div>
              <div className="text-[11px] text-[#A89F91] font-mono whitespace-nowrap">{nearPrompt.sublabel}</div>
            </button>
          </div>
        )}

        {/* Bottom-Right: Syndicate Dossier & Management Navigation Dock */}
        <div className="pointer-events-auto bg-[#12100E] border border-[#3A322B] rounded-lg p-2 shadow-lg flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onOpenDrawer('turf');
            }}
            className="px-3 py-1.5 bg-[#B91C1C] hover:bg-[#DC2626] text-white text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Turf & Rackets ({controlledRacketsCount}/15)
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onOpenDrawer('social');
            }}
            className="px-3 py-1.5 bg-[#181512] hover:bg-[#26211D] text-[#F5F0E6] border border-[#2C2520] text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Inner Circle ({favorTokens} Favors)
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onOpenDrawer('skills');
            }}
            className="px-3 py-1.5 bg-[#181512] hover:bg-[#26211D] text-[#F5F0E6] border border-[#2C2520] text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Skill Tree ({skillPoints} SP)
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onOpenDrawer('vault');
            }}
            className="px-3 py-1.5 bg-[#181512] hover:bg-[#26211D] text-[#F5F0E6] border border-[#2C2520] text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Offline Vault
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onOpenDrawer('leaderboard');
            }}
            className="px-3 py-1.5 bg-[#181512] hover:bg-[#26211D] text-[#F5F0E6] border border-[#2C2520] text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
};
