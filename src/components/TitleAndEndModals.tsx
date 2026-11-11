import React from 'react';
import { FIVE_FAMILIES, FamilyId } from '../data/nyc1984Data';
import { soundEngine } from '../audio/soundEngine';

interface TitleScreenOverlayProps {
  donName: string;
  setDonName: (name: string) => void;
  selectedFamily: FamilyId;
  setSelectedFamily: (family: FamilyId) => void;
  onStartGame: () => void;
  hasSavedEmpire: boolean;
  onResetEmpire: () => void;
}

export const TitleScreenOverlay: React.FC<TitleScreenOverlayProps> = ({
  donName,
  setDonName,
  selectedFamily,
  setSelectedFamily,
  onStartGame,
  hasSavedEmpire,
  onResetEmpire,
}) => {
  const activeFam = FIVE_FAMILIES.find((f) => f.id === selectedFamily) || FIVE_FAMILIES[0];

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-between p-8 md:p-12 pointer-events-none bg-gradient-to-t from-[#090807] via-[#090807]/60 to-transparent max-h-[100dvh] overflow-y-auto overflow-x-hidden short:pointer-events-auto short:justify-start short:gap-2 short:p-3 short:pl-[max(0.75rem,env(safe-area-inset-left))] short:pr-[max(0.75rem,env(safe-area-inset-right))]">
      {/* Top 35% Negative Space & Bespoke Inline SVG Title Lockup */}
      <div className="max-w-4xl mx-auto w-full pt-4 text-center pointer-events-auto short:pt-0">
        <div className="inline-flex flex-wrap justify-center items-center gap-x-3 gap-y-0.5 text-xs tracking-widest text-[#D97706] font-mono mb-3 short:mb-1 short:text-[10px]">
          <span>SOUTHERN DISTRICT OF NEW YORK</span>
          <span aria-hidden="true">·</span>
          <span>CASE FILE #84-CR-102</span>
          <span aria-hidden="true">·</span>
          <span>FIVE BOROUGHS</span>
        </div>

        {/* Bespoke Inline SVG Title Lockup */}
        <svg
          viewBox="0 0 760 115"
          className="w-full max-w-2xl mx-auto h-auto drop-shadow-[0_8px_24px_rgba(0,0,0,0.9)] short:max-w-sm"
          role="img"
          aria-label="The Commission: New York 1984"
        >
          <defs>
            <linearGradient id="brassGold" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
            <linearGradient id="crimsonSeal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7F1D1D" />
              <stop offset="50%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#7F1D1D" />
            </linearGradient>
          </defs>
          {/* Decorative Marionette Crossbar & Strings */}
          <line x1="160" y1="14" x2="600" y2="14" stroke="url(#brassGold)" strokeWidth="2" />
          <circle cx="380" cy="14" r="5" fill="#DC2626" stroke="#F59E0B" strokeWidth="1.5" />
          <line x1="250" y1="14" x2="250" y2="34" stroke="#78716C" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="380" y1="14" x2="380" y2="32" stroke="#78716C" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="510" y1="14" x2="510" y2="34" stroke="#78716C" strokeWidth="1" strokeDasharray="3 3" />

          {/* Main Engraved Display Title */}
          <text
            x="380"
            y="72"
            textAnchor="middle"
            fill="url(#brassGold)"
            fontFamily="Cinzel, Georgia, serif"
            fontWeight="800"
            fontSize="50"
            letterSpacing="6"
          >
            THE COMMISSION
          </text>

          {/* Bottom Ribbon Rule */}
          <rect x="230" y="86" width="300" height="22" rx="2" fill="url(#crimsonSeal)" />
          <text
            x="380"
            y="101"
            textAnchor="middle"
            fill="#F5F0E6"
            fontFamily="JetBrains Mono, monospace"
            fontWeight="700"
            fontSize="12"
            letterSpacing="4"
          >
            NEW YORK · FIVE FAMILIES · 1984
          </text>
        </svg>
      </div>

      {/* Bottom Allegiance Setup & Primary CTA */}
      <div className="max-w-4xl mx-auto w-full pointer-events-auto">
        <div className="bg-[#12100E] border border-[#3A322B] rounded-lg p-6 shadow-2xl short:p-3">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch short:grid-cols-12 short:gap-3">
            {/* Left Column: Don Name & Five Families Selection */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4 min-w-0 short:col-span-7 short:space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 short:gap-1">
                <div className="min-w-0">
                  <label htmlFor="don-name-input" className="block text-xs text-[#A89F91] mb-1">
                    Street Boss / Underboss Alias
                  </label>
                  <input
                    id="don-name-input"
                    type="text"
                    value={donName}
                    onChange={(e) => setDonName(e.target.value)}
                    maxLength={28}
                    className="w-full sm:w-64 bg-[#1C1917] border border-[#3A322B] focus:border-[#D97706] rounded px-3 py-1.5 text-sm font-medium text-[#F5F0E6] outline-none touch:min-h-11 pointer-coarse:min-h-11"
                    placeholder='Don Michael "The Architect"'
                  />
                </div>
                <div className="text-xs text-[#A89F91] font-mono tabular-nums short:hidden">
                  <span>5 Boroughs</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span>15 Rackets</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span>Offline Idle Tribute</span>
                </div>
              </div>

              <div>
                <div className="text-xs text-[#A89F91] mb-2 short:mb-1">
                  Swear Omertà Allegiance to One of the Five Families
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 short:gap-1.5">
                  {FIVE_FAMILIES.map((fam) => {
                    const isSelected = fam.id === selectedFamily;
                    return (
                      <button
                        key={fam.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playUiClick();
                          setSelectedFamily(fam.id);
                        }}
                        className={`px-3 py-2 rounded text-left transition-colors border whitespace-nowrap shrink-0 truncate min-w-0 cursor-pointer short:px-2 short:py-1 touch:min-h-11 pointer-coarse:min-h-11 ${
                          isSelected
                            ? 'bg-[#26211D] border-[#D97706] text-[#F5F0E6]'
                            : 'bg-[#181512] border-[#2C2520] text-[#A89F91] hover:text-[#F5F0E6] hover:border-[#4A3F36]'
                        }`}
                      >
                        <div className="text-xs font-semibold truncate">
                          <span style={{ color: fam.accentHex }}>{fam.traitSymbol}</span> {fam.name.split(' ')[0]}
                        </div>
                        <div className="text-[11px] text-[#A89F91] truncate">{fam.homeBorough.split('_')[0]}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Selected Family Dossier & Start Game CTA */}
            <div className="lg:col-span-5 bg-[#181512] border border-[#2C2520] rounded p-4 flex flex-col justify-between min-w-0 short:col-span-5 short:p-2.5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-[#F5F0E6]">
                    <span style={{ color: activeFam.accentHex }}>{activeFam.traitSymbol}</span> {activeFam.name}
                  </div>
                </div>
                <div className="text-xs text-[#A89F91] mt-0.5">{activeFam.historicalBasis}</div>
                <p className="text-xs italic text-[#D6CFC2] mt-1.5">“{activeFam.motto}”</p>
                <div className="mt-2 text-xs text-[#F59E0B] font-mono">
                  {activeFam.passiveBonusLabel}
                </div>
                <div className="mt-2 pt-2 border-t border-[#26211D] text-[11px]">
                  <span className="text-[#A89F91]">Street NPC Trait: </span>
                  <strong className="text-[#FDE68A]">{activeFam.traitName}</strong>
                  <div className="text-[10px] text-[#A89F91] mt-0.5">{activeFam.traitVisualIndicator}</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 short:mt-2 short:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playTurfCaptured();
                    onStartGame();
                  }}
                  className="flex-1 py-2.5 px-5 bg-[#B91C1C] hover:bg-[#DC2626] text-white font-semibold text-sm rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer short:px-3 touch:min-h-11 pointer-coarse:min-h-11"
                >
                  {hasSavedEmpire ? 'Resume 1984 Empire' : 'Enter New York 1984'}
                  <span className="touch:hidden pointer-coarse:hidden"> (Enter)</span>
                </button>
                {hasSavedEmpire && (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playUiClick();
                      onResetEmpire();
                    }}
                    className="py-2.5 px-3 bg-[#26211D] hover:bg-[#3A322B] text-xs text-[#D6CFC2] rounded border border-[#3A322B] transition-colors whitespace-nowrap shrink-0 cursor-pointer touch:min-h-11 pointer-coarse:min-h-11"
                  >
                    New Save
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Single flat control-hint line per Game Shell guidelines */}
          <div className="mt-4 pt-3 border-t border-[#2C2520] text-center text-xs text-[#A89F91] font-mono pointer-coarse:hidden touch:hidden short:mt-2 short:pt-2">
            WASD Move · Space / Click Attack · 1–4 Switch Weapons · E Interact / Extort · Tab Syndicate Ledger · Esc Pause
          </div>
          {/* Touch control hint, shown on coarse pointers before the first tap and in touch mode after it */}
          <div className="hidden pointer-coarse:block touch:block mt-4 pt-3 border-t border-[#2C2520] text-center text-xs text-[#A89F91] font-mono short:mt-2 short:pt-2">
            Left thumb moves (push to the edge to sprint) · Right thumb aims and fires · Tap buttons for weapons, prompts and the dossier
          </div>
        </div>
      </div>
    </div>
  );
};

/** What a betrayal at a sit-down cost: the amounts already taken, and the contract's new price. */
export interface BetrayalReport {
  family: FamilyId;
  cashLost: number;
  respectLost: number;
  skillPointsLost: number;
  newPrice: number;
}

interface PauseOrEndModalProps {
  mode: 'PAUSED' | 'GAME_OVER' | 'VICTORY';
  donName: string;
  netWorth: number;
  controlledRacketsCount: number;
  alliancesCount: number;
  /** Set on GAME_OVER when a family whacked the player at a sit-down: the betrayal Recovery variant. */
  betrayal?: BetrayalReport | null;
  onResume: () => void;
  onRestartOrRecover: () => void;
  onReturnToTitle: () => void;
}

export const PauseOrEndModal: React.FC<PauseOrEndModalProps> = ({
  mode,
  donName,
  netWorth,
  controlledRacketsCount,
  alliancesCount,
  betrayal,
  onResume,
  onRestartOrRecover,
  onReturnToTitle,
}) => {
  const betrayedBy = mode === 'GAME_OVER' && betrayal ? FIVE_FAMILIES.find((f) => f.id === betrayal.family) ?? null : null;
  if (betrayal && betrayedBy) {
    const shortName = betrayedBy.name.split(' ')[0];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 max-h-[100dvh] overflow-y-auto overflow-x-hidden short:items-start short:p-3">
        <div
          data-recovery="betrayal"
          className="max-w-lg w-full bg-[#12100E] border border-[#7F1D1D] rounded-lg p-6 shadow-2xl short:my-auto short:p-4"
        >
          <div className="text-xs font-mono text-[#EF4444] mb-1">BETRAYED AT THE SIT-DOWN</div>
          <h2 className="text-2xl font-bold text-[#F5F0E6] short:text-xl">
            Whacked at the <span style={{ color: betrayedBy.accentHex }}>{shortName}</span> Table
          </h2>
          <p className="text-sm text-[#A89F91] mt-2 short:mt-1 short:text-xs">
            You came alone to make peace, and the {shortName} family whacked you at the table instead. You wake at your
            home station at full health. Your learned skills are untouched, but the contract stands.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3 bg-[#181512] border border-[#2C2520] rounded p-3 text-center font-mono tabular-nums short:mt-3 short:p-2">
            <div>
              <div className="text-[11px] text-[#A89F91]">Cash Lost</div>
              <div className="text-sm font-bold text-[#EF4444]">−${betrayal.cashLost.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[11px] text-[#A89F91]">Respect XP Lost</div>
              <div className="text-sm font-bold text-[#EF4444]">−{betrayal.respectLost.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[11px] text-[#A89F91]">Skill Points Lost</div>
              <div className="text-sm font-bold text-[#EF4444]">−{betrayal.skillPointsLost}</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums text-[#D6CFC2]">
            <span>
              {betrayedBy.traitSymbol} {shortName} contract still open
            </span>
            <span>
              New price <strong className="text-[#F59E0B]">${betrayal.newPrice.toLocaleString()}</strong>
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3 short:mt-3">
            <button
              type="button"
              onClick={onRestartOrRecover}
              className="px-4 py-2 bg-[#B91C1C] hover:bg-[#DC2626] text-white text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer touch:min-h-11 pointer-coarse:min-h-11"
            >
              Wake Up at the Station
            </button>
            <button
              type="button"
              onClick={onReturnToTitle}
              className="px-4 py-2 bg-[#26211D] hover:bg-[#3A322B] text-[#D6CFC2] text-xs font-medium rounded border border-[#3A322B] transition-colors whitespace-nowrap shrink-0 cursor-pointer touch:min-h-11 pointer-coarse:min-h-11"
            >
              Title Screen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 max-h-[100dvh] overflow-y-auto overflow-x-hidden short:items-start short:p-3">
      <div className="max-w-lg w-full bg-[#12100E] border border-[#3A322B] rounded-lg p-6 shadow-2xl short:my-auto short:p-4">
        <div className="text-xs font-mono text-[#D97706] mb-1">
          {mode === 'PAUSED'
            ? 'COMMISSION SIT-DOWN · SIMULATION PAUSED'
            : mode === 'VICTORY'
            ? 'FEBRUARY 1985 · CAPO DI TUTTI CAPI'
            : 'EMERGENCY ROOM · MULBERRY STREET'}
        </div>
        <h2 className="text-2xl font-bold text-[#F5F0E6] short:text-xl">
          {mode === 'PAUSED'
            ? 'Syndicate Operations Paused'
            : mode === 'VICTORY'
            ? 'Boss of Bosses — You Own New York'
            : 'Ambushed on the Pavement'}
        </h2>
        <p className="text-sm text-[#A89F91] mt-2 short:mt-1 short:text-xs">
          {mode === 'PAUSED'
            ? 'Your bagmen and rackets continue to hold the line across all five boroughs.'
            : mode === 'VICTORY'
            ? `${donName} has united all 15 rackets across the Five Boroughs, beat the 1985 Commission Indictment, and claimed the seat of Capo di Tutti Capi.`
            : 'Rival button men caught you in the crossfire. Your street doctor patched you up at the Ravenite backroom for a small hospital cut.'}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3 bg-[#181512] border border-[#2C2520] rounded p-3 text-center font-mono tabular-nums short:mt-3 short:p-2">
          <div>
            <div className="text-[11px] text-[#A89F91]">Net Worth</div>
            <div className="text-sm font-bold text-[#10B981]">${netWorth.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[11px] text-[#A89F91]">Rackets Held</div>
            <div className="text-sm font-bold text-[#F59E0B]">{controlledRacketsCount} / 15</div>
          </div>
          <div>
            <div className="text-[11px] text-[#A89F91]">Alliances</div>
            <div className="text-sm font-bold text-[#F5F0E6]">{alliancesCount} / 6</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 short:mt-3">
          {mode === 'PAUSED' && (
            <button
              type="button"
              onClick={onResume}
              className="px-4 py-2 bg-[#B91C1C] hover:bg-[#DC2626] text-white text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer touch:min-h-11 pointer-coarse:min-h-11"
            >
              Resume Game<span className="touch:hidden pointer-coarse:hidden"> (Esc)</span>
            </button>
          )}
          {mode !== 'PAUSED' && (
            <button
              type="button"
              onClick={onRestartOrRecover}
              className="px-4 py-2 bg-[#B91C1C] hover:bg-[#DC2626] text-white text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer touch:min-h-11 pointer-coarse:min-h-11"
            >
              {mode === 'VICTORY' ? 'Keep Ruling NYC (Freeplay)' : 'Back on the Street (Recover)'}
            </button>
          )}
          <button
            type="button"
            onClick={onReturnToTitle}
            className="px-4 py-2 bg-[#26211D] hover:bg-[#3A322B] text-[#D6CFC2] text-xs font-medium rounded border border-[#3A322B] transition-colors whitespace-nowrap shrink-0 cursor-pointer touch:min-h-11 pointer-coarse:min-h-11"
          >
            Title Screen
          </button>
        </div>
      </div>
    </div>
  );
};
