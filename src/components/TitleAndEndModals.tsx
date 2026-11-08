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
    <div className="fixed inset-0 z-30 flex flex-col justify-between p-8 md:p-12 pointer-events-none bg-gradient-to-t from-[#090807] via-[#090807]/60 to-transparent">
      {/* Top 35% Negative Space & Bespoke Inline SVG Title Lockup */}
      <div className="max-w-4xl mx-auto w-full pt-4 text-center pointer-events-auto">
        <div className="inline-flex items-center gap-3 text-xs tracking-widest text-[#D97706] font-mono mb-3">
          <span>SOUTHERN DISTRICT OF NEW YORK</span>
          <span aria-hidden="true">·</span>
          <span>CASE FILE #84-CR-102</span>
          <span aria-hidden="true">·</span>
          <span>FIVE BOROUGHS</span>
        </div>

        {/* Bespoke Inline SVG Title Lockup */}
        <svg
          viewBox="0 0 760 115"
          className="w-full max-w-2xl mx-auto h-auto drop-shadow-[0_8px_24px_rgba(0,0,0,0.9)]"
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
        <div className="bg-[#12100E] border border-[#3A322B] rounded-lg p-6 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column: Don Name & Five Families Selection */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label htmlFor="don-name-input" className="block text-xs text-[#A89F91] mb-1">
                    Street Boss / Underboss Alias
                  </label>
                  <input
                    id="don-name-input"
                    type="text"
                    value={donName}
                    onChange={(e) => setDonName(e.target.value)}
                    maxLength={28}
                    className="w-full sm:w-64 bg-[#1C1917] border border-[#3A322B] focus:border-[#D97706] rounded px-3 py-1.5 text-sm font-medium text-[#F5F0E6] outline-none"
                    placeholder='Don Michael "The Architect"'
                  />
                </div>
                <div className="text-xs text-[#A89F91] font-mono tabular-nums">
                  <span>5 Boroughs</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span>15 Rackets</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span>Offline Idle Tribute</span>
                </div>
              </div>

              <div>
                <div className="text-xs text-[#A89F91] mb-2">
                  Swear Omertà Allegiance to One of the Five Families
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
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
                        className={`px-3 py-2 rounded text-left transition-colors border whitespace-nowrap shrink-0 truncate ${
                          isSelected
                            ? 'bg-[#26211D] border-[#D97706] text-[#F5F0E6]'
                            : 'bg-[#181512] border-[#2C2520] text-[#A89F91] hover:text-[#F5F0E6] hover:border-[#4A3F36]'
                        }`}
                      >
                        <div className="text-xs font-semibold truncate">{fam.name.split(' ')[0]}</div>
                        <div className="text-[11px] text-[#A89F91] truncate">{fam.homeBorough.split('_')[0]}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Selected Family Dossier & Start Game CTA */}
            <div className="lg:col-span-5 bg-[#181512] border border-[#2C2520] rounded p-4 flex flex-col justify-between">
              <div>
                <div className="text-sm font-semibold text-[#F5F0E6]">{activeFam.name}</div>
                <div className="text-xs text-[#A89F91] mt-0.5">{activeFam.historicalBasis}</div>
                <p className="text-xs italic text-[#D6CFC2] mt-2">“{activeFam.motto}”</p>
                <div className="mt-2.5 text-xs text-[#F59E0B] font-mono">
                  {activeFam.passiveBonusLabel}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playTurfCaptured();
                    onStartGame();
                  }}
                  className="flex-1 py-2.5 px-5 bg-[#B91C1C] hover:bg-[#DC2626] text-white font-semibold text-sm rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {hasSavedEmpire ? 'Resume 1984 Empire (Enter)' : 'Enter New York 1984 (Enter)'}
                </button>
                {hasSavedEmpire && (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playUiClick();
                      onResetEmpire();
                    }}
                    className="py-2.5 px-3 bg-[#26211D] hover:bg-[#3A322B] text-xs text-[#D6CFC2] rounded border border-[#3A322B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    New Save
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Single flat control-hint line per Game Shell guidelines */}
          <div className="mt-4 pt-3 border-t border-[#2C2520] text-center text-xs text-[#A89F91] font-mono">
            WASD Move · Space / Click Attack · 1–4 Switch Weapons · E Interact / Extort · Tab Syndicate Ledger · Esc Pause
          </div>
        </div>
      </div>
    </div>
  );
};

interface PauseOrEndModalProps {
  mode: 'PAUSED' | 'GAME_OVER' | 'VICTORY';
  donName: string;
  netWorth: number;
  controlledRacketsCount: number;
  alliancesCount: number;
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
  onResume,
  onRestartOrRecover,
  onReturnToTitle,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80">
      <div className="max-w-lg w-full bg-[#12100E] border border-[#3A322B] rounded-lg p-6 shadow-2xl">
        <div className="text-xs font-mono text-[#D97706] mb-1">
          {mode === 'PAUSED'
            ? 'COMMISSION SIT-DOWN · SIMULATION PAUSED'
            : mode === 'VICTORY'
            ? 'FEBRUARY 1985 · CAPO DI TUTTI CAPI'
            : 'EMERGENCY ROOM · MULBERRY STREET'}
        </div>
        <h2 className="text-2xl font-bold text-[#F5F0E6]">
          {mode === 'PAUSED'
            ? 'Syndicate Operations Paused'
            : mode === 'VICTORY'
            ? 'Boss of Bosses — You Own New York'
            : 'Ambushed on the Pavement'}
        </h2>
        <p className="text-sm text-[#A89F91] mt-2">
          {mode === 'PAUSED'
            ? 'Your bagmen and rackets continue to hold the line across all five boroughs.'
            : mode === 'VICTORY'
            ? `${donName} has united all 15 rackets across the Five Boroughs, beat the 1985 Commission Indictment, and claimed the seat of Capo di Tutti Capi.`
            : 'Rival button men caught you in the crossfire. Your street doctor patched you up at the Ravenite backroom for a small hospital cut.'}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3 bg-[#181512] border border-[#2C2520] rounded p-3 text-center font-mono tabular-nums">
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

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          {mode === 'PAUSED' && (
            <button
              type="button"
              onClick={onResume}
              className="px-4 py-2 bg-[#B91C1C] hover:bg-[#DC2626] text-white text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Resume Game (Esc)
            </button>
          )}
          {mode !== 'PAUSED' && (
            <button
              type="button"
              onClick={onRestartOrRecover}
              className="px-4 py-2 bg-[#B91C1C] hover:bg-[#DC2626] text-white text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {mode === 'VICTORY' ? 'Keep Ruling NYC (Freeplay)' : 'Back on the Street (Recover)'}
            </button>
          )}
          <button
            type="button"
            onClick={onReturnToTitle}
            className="px-4 py-2 bg-[#26211D] hover:bg-[#3A322B] text-[#D6CFC2] text-xs font-medium rounded border border-[#3A322B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Title Screen
          </button>
        </div>
      </div>
    </div>
  );
};
