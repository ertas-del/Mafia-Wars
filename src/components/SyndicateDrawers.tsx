import React, { useState } from 'react';
import {
  BoroughId,
  FIVE_FAMILIES,
  LeaderboardEntry,
  NARRATIVE_CHAPTERS,
  NYC_BOROUGHS,
  RacketBuilding,
  SKILL_TREE_NODES,
  SkillBranch,
  SocialContact,
} from '../data/nyc1984Data';
import { soundEngine } from '../audio/soundEngine';

export type DrawerTab = 'turf' | 'social' | 'skills' | 'vault' | 'leaderboard';

interface SyndicateDrawerModalProps {
  activeTab: DrawerTab;
  setActiveTab: (tab: DrawerTab) => void;
  onClose: () => void;
  focusedRacketId: string | null;
  focusedContactId: string | null;
  cash: number;
  contraband: number;
  favorTokens: number;
  skillPoints: number;
  policeHeat: number;
  netWorth: number;
  hourlyCashIncome: number;
  hourlyContrabandIncome: number;
  rackets: RacketBuilding[];
  contacts: SocialContact[];
  unlockedSkills: string[];
  currentActIndex: number;
  offlineReport: {
    elapsedSeconds: number;
    cashEarned: number;
    contrabandEarned: number;
    racketsCount: number;
  } | null;
  leaderboard: LeaderboardEntry[];
  onTravelToBorough: (boroughId: BoroughId) => void;
  onUpgradeRacket: (racketId: string) => void;
  onBuyoutRacket: (racketId: string) => void;
  onRaidRacketInWorld: (racket: RacketBuilding) => void;
  onCollectAllEnvelopes: () => void;
  onLiquidateContraband: (crates: number) => void;
  onSendGiftToContact: (contactId: string) => void;
  onExecuteFavorTrade: (contactId: string) => void;
  onUnlockSkill: (skillId: string) => void;
  onClaimOfflineReport: () => void;
  onSimulateOfflineHours: (hours: number) => void;
  onClaimChapterReward: () => void;
  onSyncLeaderboard: () => void;
}

export const SyndicateDrawerModal: React.FC<SyndicateDrawerModalProps> = ({
  activeTab,
  setActiveTab,
  onClose,
  focusedRacketId,
  focusedContactId,
  cash,
  contraband,
  favorTokens,
  skillPoints,
  policeHeat,
  netWorth,
  hourlyCashIncome,
  hourlyContrabandIncome,
  rackets,
  contacts,
  unlockedSkills,
  currentActIndex,
  offlineReport,
  leaderboard,
  onTravelToBorough,
  onUpgradeRacket,
  onBuyoutRacket,
  onRaidRacketInWorld,
  onCollectAllEnvelopes,
  onLiquidateContraband,
  onSendGiftToContact,
  onExecuteFavorTrade,
  onUnlockSkill,
  onClaimOfflineReport,
  onSimulateOfflineHours,
  onClaimChapterReward,
  onSyncLeaderboard,
}) => {
  const [selectedBoroughFilter, setSelectedBoroughFilter] = useState<BoroughId | 'all'>('all');
  const [activeContactId, setActiveContactId] = useState<string>(
    focusedContactId || contacts[0]?.id || 'contact_castellano'
  );
  const [quoteIdx, setQuoteIdx] = useState<number>(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const totalUncollected = rackets
    .filter((r) => r.ownerFamily === 'player')
    .reduce((acc, r) => acc + Math.floor(r.uncollectedCash), 0);

  const playerRacketsCount = rackets.filter((r) => r.ownerFamily === 'player').length;
  const alliancesCount = contacts.filter((c) => c.respect >= 40).length;
  const currentChapter = NARRATIVE_CHAPTERS[Math.min(currentActIndex, NARRATIVE_CHAPTERS.length - 1)];
  const isChapterComplete =
    playerRacketsCount >= currentChapter.requiredRackets &&
    netWorth >= currentChapter.requiredNetWorth &&
    alliancesCount >= currentChapter.requiredAlliances;

  const filteredRackets =
    selectedBoroughFilter === 'all'
      ? rackets
      : rackets.filter((r) => r.boroughId === selectedBoroughFilter);

  const selectedContact = contacts.find((c) => c.id === activeContactId) || contacts[0];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 md:p-8 bg-black/75 short:p-0">
      <div className="w-full max-w-6xl h-[86vh] max-h-[100dvh] bg-[#12100E] border border-[#3A322B] rounded-lg shadow-2xl flex flex-col overflow-hidden overflow-x-hidden short:h-[100dvh] short:max-w-none short:rounded-none short:border-0 short:block short:overflow-y-auto">
        {/* Modal Header Bar */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 bg-[#181512] border-b border-[#2C2520] short:sticky short:top-0 short:z-10 short:gap-2 short:px-[max(0.75rem,env(safe-area-inset-left))] short:py-1.5">
          <div className="flex items-center gap-6 overflow-x-auto min-w-0 short:gap-2">
            <h2 className="text-lg font-bold text-[#F5F0E6] whitespace-nowrap shrink-0 short:hidden">
              Commission Dossier · 1984
            </h2>

            {/* Segmented Tab Controls */}
            <div className="flex items-center gap-1 p-1 bg-[#12100E] border border-[#2C2520] rounded-md shrink-0">
              {(
                [
                  { id: 'turf', label: `Boroughs & Rackets (${playerRacketsCount}/15)` },
                  { id: 'social', label: `Inner Circle & Favors (${alliancesCount})` },
                  { id: 'skills', label: `Skill Tree (${skillPoints} SP)` },
                  { id: 'vault', label: 'Offline Vault & Ledger' },
                  { id: 'leaderboard', label: 'Global Standings' },
                ] as { id: DrawerTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    setActiveTab(tab.id);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer short:px-2 touch:min-h-11 ${
                    activeTab === tab.id
                      ? 'bg-[#B91C1C] text-white'
                      : 'text-[#A89F91] hover:text-[#F5F0E6]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="px-3.5 py-1.5 bg-[#26211D] hover:bg-[#3A322B] text-xs font-medium text-[#F5F0E6] rounded border border-[#3A322B] transition-colors whitespace-nowrap shrink-0 cursor-pointer short:px-2.5 touch:min-h-11"
          >
            <span className="short:hidden">Return to </span>Street<span className="touch:hidden"> (Esc)</span>
          </button>
        </div>

        {/* Sub-bar: Active 1984 Narrative Arc & Quick Telemetry */}
        <div className="px-6 py-3 bg-[#161310] border-b border-[#2C2520] flex flex-wrap items-center justify-between gap-4 short:px-3 short:py-2 short:gap-2">
          <div className="flex flex-wrap items-center gap-3 text-xs min-w-0 short:gap-x-2 short:gap-y-0.5">
            <span className="font-mono font-semibold text-[#F59E0B]">{currentChapter.year}</span>
            <span aria-hidden="true" className="text-[#574C41]">·</span>
            <span className="font-semibold text-[#F5F0E6]">{currentChapter.title}</span>
            <span aria-hidden="true" className="text-[#574C41]">·</span>
            <span className="text-[#A89F91]">{currentChapter.objectiveText}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 short:gap-2">
            {isChapterComplete && currentActIndex < NARRATIVE_CHAPTERS.length && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playTurfCaptured();
                  onClaimChapterReward();
                }}
                className="px-3 py-1 bg-[#10B981] hover:bg-[#059669] text-[#052E16] font-bold text-xs rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer font-mono tabular-nums touch:min-h-11"
              >
                Complete {currentChapter.title.split(':')[0]} (+${currentChapter.rewardCash.toLocaleString()} & +{currentChapter.rewardSkillPoints} SP)
              </button>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums text-[#D6CFC2] short:gap-x-2 short:gap-y-0.5">
              <span>Cash: <strong className="text-[#10B981]">${cash.toLocaleString()}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Contraband: <strong className="text-[#F59E0B]">{contraband} Crates</strong></span>
              <span aria-hidden="true">·</span>
              <span>Favors: <strong className="text-[#F5F0E6]">{favorTokens}</strong></span>
            </div>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-6 short:overflow-visible short:p-3 short:pl-[max(0.75rem,env(safe-area-inset-left))] short:pr-[max(0.75rem,env(safe-area-inset-right))]">
          {/* TAB 1: BOROUGHS & RACKETS */}
          {activeTab === 'turf' && (
            <div className="space-y-6">
              {/* 5 NYC Borough Risk-Reward Selector Cards */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-[#F5F0E6]">
                      01. New York City Five Boroughs — Dynamic Risk-Reward Zones
                    </h3>
                    <p className="text-xs text-[#A89F91]">
                      Select a borough to filter rackets or dispatch your Cadillac directly to its avenues.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBoroughFilter('all')}
                      className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer touch:min-h-11 ${
                        selectedBoroughFilter === 'all'
                          ? 'bg-[#26211D] border-[#D97706] text-[#F5F0E6]'
                          : 'bg-[#181512] border-[#2C2520] text-[#A89F91]'
                      }`}
                    >
                      All 5 Boroughs (15)
                    </button>
                    {totalUncollected > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playCashCollect();
                          onCollectAllEnvelopes();
                        }}
                        className="px-3.5 py-1.5 bg-[#10B981] hover:bg-[#059669] text-[#052E16] text-xs font-bold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer font-mono tabular-nums touch:min-h-11"
                      >
                        Collect All Street Envelopes (+${totalUncollected.toLocaleString()})
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 short:grid-cols-3 short:gap-2">
                  {NYC_BOROUGHS.map((b) => {
                    const boroughRackets = rackets.filter((r) => r.boroughId === b.id);
                    const ownedInBorough = boroughRackets.filter((r) => r.ownerFamily === 'player').length;
                    const isSelected = selectedBoroughFilter === b.id;
                    const bFam =
                      FIVE_FAMILIES.find((f) => f.id === b.controllingFamilyDefault) || FIVE_FAMILIES[0];

                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBoroughFilter(b.id)}
                        className={`p-3.5 rounded-lg border transition-colors cursor-pointer flex flex-col justify-between min-w-0 short:p-2.5 ${
                          isSelected
                            ? 'bg-[#211C18] border-[#D97706]'
                            : 'bg-[#181512] border-[#2C2520] hover:border-[#4A3F36]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-[#F59E0B]">
                              Tier {b.riskTier} · {b.rewardMultiplier.toFixed(2)}x
                            </span>
                            <span style={{ color: bFam.accentHex }} className="font-bold">
                              {bFam.traitSymbol} {bFam.name.split(' ')[0]}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-[#F5F0E6] mt-0.5">{b.name}</div>
                          <div className="text-xs text-[#A89F91] mt-1 font-mono tabular-nums">
                            Turf Controlled: {ownedInBorough} / {boroughRackets.length}
                          </div>
                          <div className="mt-2 pt-2 border-t border-[#26211D] text-[11px]">
                            <div className="text-[#FDE68A] font-medium">
                              Trait: {bFam.traitName}
                            </div>
                            <div className="text-[#A89F91] text-[10px] mt-0.5">
                              {bFam.traitVisualIndicator}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-[#2C2520] flex flex-wrap items-center justify-between gap-1">
                          <span className="text-[11px] text-[#A89F91] font-mono">
                            Contraband {b.contrabandMultiplier}x
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              soundEngine.playUiClick();
                              onTravelToBorough(b.id);
                              onClose();
                            }}
                            className="px-2.5 py-1 bg-[#26211D] hover:bg-[#B91C1C] text-[#F5F0E6] text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer touch:min-h-11"
                          >
                            Travel Here
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 15 Racket Tycoon Cards */}
              <div>
                <h3 className="text-base font-bold text-[#F5F0E6] mb-3">
                  02. Syndicate Rackets & Front Operations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 short:grid-cols-2 short:gap-2">
                  {filteredRackets.map((r) => {
                    const isOwned = r.ownerFamily === 'player';
                    const isFocused = r.id === focusedRacketId;
                    const upgradeCost = Math.round(r.baseIncomePerHour * 0.85 * r.level);
                    const hourlyNow = r.baseIncomePerHour * r.level;
                    const contrabandNow = r.baseContrabandPerHour * r.level;

                    return (
                      <div
                        key={r.id}
                        className={`p-4 rounded-lg border flex flex-col justify-between min-w-0 short:p-3 ${
                          isFocused
                            ? 'bg-[#231D18] border-[#F59E0B]'
                            : isOwned
                            ? 'bg-[#171A16] border-[#10B981]/50'
                            : 'bg-[#181512] border-[#2C2520]'
                        }`}
                      >
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-x-2 text-xs text-[#A89F91] font-mono tabular-nums">
                            <span>{r.category}</span>
                            <span>
                              {isOwned ? `YOUR TURF · LV.${r.level}/5` : `HELD BY ${r.ownerFamily.toUpperCase()}`}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-[#F5F0E6] mt-1">{r.name}</h4>
                          <p className="text-xs text-[#A89F91] mt-1">{r.description}</p>

                          <div className="mt-3 pt-3 border-t border-[#2C2520] grid grid-cols-2 gap-2 font-mono tabular-nums text-xs">
                            <div>
                              <span className="text-[#A89F91] block text-[11px]">Passive Tribute</span>
                              <span className="text-[#10B981] font-semibold">
                                +${hourlyNow.toLocaleString()}/hr
                              </span>
                            </div>
                            <div>
                              <span className="text-[#A89F91] block text-[11px]">Contraband Skim</span>
                              <span className="text-[#F59E0B] font-semibold">
                                +{contrabandNow} Crates/hr
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#2C2520] flex flex-wrap items-center gap-2">
                          {isOwned ? (
                            <>
                              <button
                                type="button"
                                disabled={r.level >= 5 || cash < upgradeCost}
                                onClick={() => {
                                  soundEngine.playCashCollect();
                                  onUpgradeRacket(r.id);
                                }}
                                className={`flex-1 py-2 px-3 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 font-mono tabular-nums touch:min-h-11 ${
                                  r.level >= 5
                                    ? 'bg-[#26211D] text-[#78716C] cursor-not-allowed'
                                    : cash >= upgradeCost
                                    ? 'bg-[#10B981] hover:bg-[#059669] text-[#052E16] cursor-pointer'
                                    : 'bg-[#26211D] text-[#A89F91] cursor-not-allowed'
                                }`}
                              >
                                {r.level >= 5
                                  ? 'Max Level 5 Front'
                                  : `Upgrade Lv.${r.level + 1} ($${upgradeCost.toLocaleString()})`}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  soundEngine.playUiClick();
                                  onRaidRacketInWorld(r);
                                  onClose();
                                }}
                                className="flex-1 py-2 px-3 bg-[#B91C1C] hover:bg-[#DC2626] text-white text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer touch:min-h-11"
                              >
                                Raid Turf in 2D World
                              </button>
                              <button
                                type="button"
                                disabled={cash < r.takeoverCostCash}
                                onClick={() => {
                                  soundEngine.playTurfCaptured();
                                  onBuyoutRacket(r.id);
                                }}
                                className={`py-2 px-3 rounded text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 font-mono tabular-nums touch:min-h-11 ${
                                  cash >= r.takeoverCostCash
                                    ? 'bg-[#26211D] hover:bg-[#3A322B] text-[#F59E0B] border-[#D97706] cursor-pointer'
                                    : 'bg-[#181512] text-[#78716C] border-[#2C2520] cursor-not-allowed'
                                }`}
                              >
                                Buyout (${r.takeoverCostCash.toLocaleString()})
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STARDEW VALLEY-STYLE SOCIAL & FAVOR TRADING */}
          {activeTab === 'social' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left List of 6 Syndicate & City Contacts */}
              <div className="lg:col-span-5 space-y-2.5">
                <div className="text-xs text-[#A89F91] mb-2">
                  Build Respect (0–100) via Contraband Gifts & Sit-Downs to unlock Permanent Family Alliances and trade Favors.
                </div>
                {contacts.map((c) => {
                  const isSelected = c.id === selectedContact.id;
                  const isAllied = c.respect >= 40;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playUiClick();
                        setActiveContactId(c.id);
                        setQuoteIdx(0);
                      }}
                      className={`w-full p-3 rounded-lg border text-left transition-colors flex items-center justify-between gap-3 cursor-pointer touch:min-h-11 short:p-2 ${
                        isSelected
                          ? 'bg-[#241E1A] border-[#D97706]'
                          : 'bg-[#181512] border-[#2C2520] hover:border-[#4A3F36]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#F5F0E6] truncate">{c.name}</div>
                        <div className="text-xs text-[#A89F91] truncate">{c.title}</div>
                      </div>
                      <div className="text-right font-mono tabular-nums shrink-0">
                        <div className={`text-xs font-bold ${isAllied ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
                          ★ {c.respect}/100
                        </div>
                        <div className="text-[11px] text-[#A89F91]">
                          {c.respect >= 80 ? 'Blood Oath' : isAllied ? 'Allied' : 'Neutral'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Detailed Sit-Down & Favor Trading Panel */}
              {selectedContact && (
                <div className="lg:col-span-7 bg-[#181512] border border-[#2C2520] rounded-lg p-6 flex flex-col justify-between min-w-0 short:p-3">
                  <div>
                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      {/* Character Portrait with Zero-Broken-Image Resilient Fallback */}
                      <div className="w-28 h-28 rounded-lg overflow-hidden border border-[#3A322B] bg-[#12100E] shrink-0 relative">
                        {!failedImages[selectedContact.id] ? (
                          <img
                            src={selectedContact.portraitUrl}
                            alt={selectedContact.name}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setFailedImages((prev) => ({ ...prev, [selectedContact.id]: true }))
                            }
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#292524] to-[#09090B] text-[#F59E0B] p-2 text-center">
                            <span className="text-lg font-display font-bold">
                              {selectedContact.name.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="text-[10px] text-[#A89F91]">1984 Dossier</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono text-[#D97706]">
                          {selectedContact.familyOrFaction} · {selectedContact.boroughId.replace('_', ' ').toUpperCase()}
                        </div>
                        <h3 className="text-xl font-bold text-[#F5F0E6] mt-0.5">{selectedContact.name}</h3>
                        <div className="text-xs text-[#A89F91]">{selectedContact.title}</div>
                        <p className="text-xs text-[#D6CFC2] mt-2 leading-relaxed">{selectedContact.bio}</p>
                      </div>
                    </div>

                    {/* Respect Meter & Alliance Thresholds */}
                    <div className="mt-5 p-4 bg-[#12100E] border border-[#2C2520] rounded">
                      <div className="flex flex-wrap items-center justify-between gap-x-2 text-xs font-mono tabular-nums mb-1.5">
                        <span className="text-[#D6CFC2]">Omertà Respect & Trust</span>
                        <span className="text-[#F59E0B] font-bold">
                          {selectedContact.respect} / 100 ({Math.floor(selectedContact.respect / 10)} / 10 Hearts)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-[#26211D] rounded overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#B91C1C] via-[#F59E0B] to-[#10B981]"
                          style={{ width: `${Math.min(100, selectedContact.respect)}%` }}
                        />
                      </div>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className={selectedContact.respect >= 40 ? 'text-[#10B981]' : 'text-[#78716C]'}>
                          ✓ 40 Respect Alliance: {selectedContact.alliancePerk40}
                        </div>
                        <div className={selectedContact.respect >= 80 ? 'text-[#10B981]' : 'text-[#78716C]'}>
                          ✓ 80 Blood Oath: {selectedContact.alliancePerk80}
                        </div>
                      </div>
                    </div>

                    {/* Backroom Sit-Down Quote Box */}
                    <div className="mt-4 p-4 bg-[#141210] border border-[#2C2520] rounded">
                      <div className="flex flex-wrap items-center justify-between gap-x-2 text-xs text-[#A89F91] mb-1">
                        <span> Ravenite Backroom Sit-Down Wire</span>
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playUiClick();
                            setQuoteIdx((q) => (q + 1) % selectedContact.sitDownQuotes.length);
                          }}
                          className="text-[#F59E0B] hover:underline cursor-pointer touch:min-h-11 touch:px-2"
                        >
                          Next Sit-Down Topic →
                        </button>
                      </div>
                      <p className="text-sm italic text-[#F5F0E6]">
                        “{selectedContact.sitDownQuotes[quoteIdx % selectedContact.sitDownQuotes.length]}”
                      </p>
                    </div>
                  </div>

                  {/* Gift & Favor Trade Actions */}
                  <div className="mt-5 pt-4 border-t border-[#2C2520] grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-[#12100E] border border-[#2C2520] rounded flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-semibold text-[#F5F0E6]">
                          Gift: {selectedContact.favoriteGiftName}
                        </div>
                        <div className="text-[11px] text-[#A89F91] mt-0.5 font-mono tabular-nums">
                          Cost: ${selectedContact.giftCostCash.toLocaleString()} + {selectedContact.giftCostContraband} Crates
                        </div>
                        <div className="text-[11px] text-[#10B981] mt-1">
                          Effect: +18 Respect & +1 Favor Token
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={
                          cash < selectedContact.giftCostCash ||
                          contraband < selectedContact.giftCostContraband
                        }
                        onClick={() => {
                          soundEngine.playFavorComplete();
                          onSendGiftToContact(selectedContact.id);
                        }}
                        className={`mt-3 w-full py-2 px-3 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 touch:min-h-11 ${
                          cash >= selectedContact.giftCostCash &&
                          contraband >= selectedContact.giftCostContraband
                            ? 'bg-[#D97706] hover:bg-[#F59E0B] text-[#090807] cursor-pointer'
                            : 'bg-[#26211D] text-[#78716C] cursor-not-allowed'
                        }`}
                      >
                        Send Tribute Gift
                      </button>
                    </div>

                    <div className="p-3 bg-[#12100E] border border-[#2C2520] rounded flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-semibold text-[#F5F0E6]">
                          Call Favor: {selectedContact.favorActionLabel}
                        </div>
                        <div className="text-[11px] text-[#A89F91] mt-0.5 font-mono tabular-nums">
                          Requires: {selectedContact.favorCostTokens} Favor Tokens (You have {favorTokens})
                        </div>
                        <div className="text-[11px] text-[#F59E0B] mt-1">
                          {selectedContact.favorRewardDescription}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={favorTokens < selectedContact.favorCostTokens}
                        onClick={() => {
                          soundEngine.playFavorComplete();
                          onExecuteFavorTrade(selectedContact.id);
                        }}
                        className={`mt-3 w-full py-2 px-3 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 touch:min-h-11 ${
                          favorTokens >= selectedContact.favorCostTokens
                            ? 'bg-[#B91C1C] hover:bg-[#DC2626] text-white cursor-pointer'
                            : 'bg-[#26211D] text-[#78716C] cursor-not-allowed'
                        }`}
                      >
                        Call In Favor ({selectedContact.favorCostTokens} Tokens)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DEEP SKILL-TREE CUSTOMIZATION */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-[#F5F0E6]">
                    The Three Pillars of Cosa Nostra — Skill Tree Customization
                  </h3>
                  <p className="text-xs text-[#A89F91]">
                    Earn Omertà Skill Points (SP) by seizing rackets, completing 1984 Narrative Chapters, and eliminating rival Capos.
                  </p>
                </div>
                <div className="px-4 py-2 bg-[#181512] border border-[#D97706] rounded font-mono tabular-nums text-xs text-[#F59E0B]">
                  Available Omertà Skill Points: <strong>{skillPoints} SP</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 short:gap-2">
                {(
                  [
                    {
                      branch: 'enforcer',
                      title: '01. Street Enforcer & Arsenal',
                      subtitle: 'Firepower, Kevlar Armor, Hitstop Crits & Cadillac Hit Squads',
                    },
                    {
                      branch: 'earner',
                      title: '02. Racket Earner & Tycoon',
                      subtitle: 'Passive Tribute $/hr, Automated Bagmen & Concrete Club Monopoly',
                    },
                    {
                      branch: 'consigliere',
                      title: '03. Consigliere & Politics',
                      subtitle: 'FBI Wiretap Defense, Courthouse Bribes & Sit-Down Diplomacy',
                    },
                  ] as { branch: SkillBranch; title: string; subtitle: string }[]
                ).map((col) => {
                  const nodes = SKILL_TREE_NODES.filter((n) => n.branch === col.branch);
                  return (
                    <div key={col.branch} className="bg-[#181512] border border-[#2C2520] rounded-lg p-4 space-y-3 min-w-0 short:p-2.5">
                      <div className="pb-3 border-b border-[#2C2520]">
                        <h4 className="text-sm font-bold text-[#F5F0E6]">{col.title}</h4>
                        <p className="text-xs text-[#A89F91] mt-0.5">{col.subtitle}</p>
                      </div>

                      {nodes.map((node) => {
                        const isUnlocked = unlockedSkills.includes(node.id);
                        const prereqMet = !node.prerequisiteId || unlockedSkills.includes(node.prerequisiteId);
                        const canAfford = skillPoints >= node.costPoints && prereqMet && !isUnlocked;

                        return (
                          <div
                            key={node.id}
                            className={`p-3.5 rounded border transition-colors ${
                              isUnlocked
                                ? 'bg-[#17231B] border-[#10B981]'
                                : prereqMet
                                ? 'bg-[#12100E] border-[#3A322B]'
                                : 'bg-[#12100E]/60 border-[#26211D] opacity-65'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-[#F59E0B]">Tier {node.tier}</span>
                              <span>{isUnlocked ? 'UNLOCKED' : `${node.costPoints} SP`}</span>
                            </div>
                            <div className="text-sm font-bold text-[#F5F0E6] mt-0.5">{node.name}</div>
                            <div className="text-xs text-[#10B981] mt-1">{node.effectSummary}</div>
                            <div className="text-[11px] italic text-[#A89F91] mt-1">“{node.historicalFlavor}”</div>

                            {!isUnlocked && (
                              <button
                                type="button"
                                disabled={!canAfford}
                                onClick={() => {
                                  soundEngine.playTurfCaptured();
                                  onUnlockSkill(node.id);
                                }}
                                className={`mt-3 w-full py-1.5 px-3 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 touch:min-h-11 ${
                                  canAfford
                                    ? 'bg-[#B91C1C] hover:bg-[#DC2626] text-white cursor-pointer'
                                    : 'bg-[#26211D] text-[#78716C] cursor-not-allowed'
                                }`}
                              >
                                {prereqMet ? `Unlock Upgrade (${node.costPoints} SP)` : 'Requires Previous Tier'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: OFFLINE PROGRESSION VAULT & CONTRABAND LIQUIDATION */}
          {activeTab === 'vault' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4 min-w-0">
                <div className="bg-[#181512] border border-[#2C2520] rounded-lg p-5 short:p-3">
                  <h3 className="text-base font-bold text-[#F5F0E6]">
                    01. Passive Offline Progression & Idle Tribute Engine
                  </h3>
                  <p className="text-xs text-[#A89F91] mt-1">
                    Your controlled rackets across the Five Boroughs automatically accumulate cash tribute and smuggled contraband while you are away—and in real time every second.
                  </p>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono tabular-nums">
                    <div className="p-3 bg-[#12100E] border border-[#2C2520] rounded">
                      <div className="text-[11px] text-[#A89F91]">Passive Cash Rate</div>
                      <div className="text-base font-bold text-[#10B981]">
                        +${hourlyCashIncome.toLocaleString()}/hr
                      </div>
                    </div>
                    <div className="p-3 bg-[#12100E] border border-[#2C2520] rounded">
                      <div className="text-[11px] text-[#A89F91]">Contraband Smuggling</div>
                      <div className="text-base font-bold text-[#F59E0B]">
                        +{hourlyContrabandIncome} Crates/hr
                      </div>
                    </div>
                    <div className="p-3 bg-[#12100E] border border-[#2C2520] rounded">
                      <div className="text-[11px] text-[#A89F91]">Street Envelopes Waiting</div>
                      <div className="text-base font-bold text-[#F5F0E6]">
                        ${totalUncollected.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Returning Boss Offline Tribute Box */}
                  {offlineReport ? (
                    <div className="mt-5 p-4 bg-[#17231B] border border-[#10B981] rounded-lg">
                      <div className="text-xs font-mono text-[#6EE7B7]">
                        WELCOME BACK, BOSS · OFFLINE TRIBUTE ENVELOPES READY
                      </div>
                      <div className="text-sm font-bold text-[#F5F0E6] mt-1">
                        Your {offlineReport.racketsCount} rackets operated for{' '}
                        {Math.max(1, Math.round(offlineReport.elapsedSeconds / 60))} minutes while you were away.
                      </div>
                      <div className="mt-2 text-xs font-mono tabular-nums text-[#10B981]">
                        Accumulated: +${offlineReport.cashEarned.toLocaleString()} Clean Cash · +{offlineReport.contrabandEarned} Contraband Crates
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playCashCollect();
                          onClaimOfflineReport();
                        }}
                        className="mt-3 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-[#052E16] text-xs font-bold rounded transition-colors cursor-pointer touch:min-h-11"
                      >
                        Collect Offline Tribute Into Vault
                      </button>
                    </div>
                  ) : (
                    <div className="mt-5 p-4 bg-[#12100E] border border-[#2C2520] rounded-lg flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-[#F5F0E6]">
                          Test Offline Time-Skip (Simulate Being Away)
                        </div>
                        <div className="text-xs text-[#A89F91]">
                          Fast-forward the 1984 Commission clock to immediately test returning boss passive tribute collection.
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playCashCollect();
                            onSimulateOfflineHours(4);
                          }}
                          className="px-3 py-1.5 bg-[#26211D] hover:bg-[#3A322B] text-xs font-mono tabular-nums text-[#F59E0B] border border-[#D97706] rounded cursor-pointer whitespace-nowrap shrink-0 touch:min-h-11"
                        >
                          Simulate +4h Away
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playCashCollect();
                            onSimulateOfflineHours(12);
                          }}
                          className="px-3 py-1.5 bg-[#B91C1C] hover:bg-[#DC2626] text-xs font-mono tabular-nums text-white rounded cursor-pointer whitespace-nowrap shrink-0 touch:min-h-11"
                        >
                          Simulate +12h Away
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Contraband Fence & Liquidation */}
              <div className="lg:col-span-5 bg-[#181512] border border-[#2C2520] rounded-lg p-5 flex flex-col justify-between min-w-0 short:p-3">
                <div>
                  <h3 className="text-base font-bold text-[#F5F0E6]">
                    02. Waterfront Fence & Contraband Liquidation
                  </h3>
                  <p className="text-xs text-[#A89F91] mt-1">
                    Smuggled Contraband Crates from Brooklyn piers and JFK Hangar 7 can be gifted to Inner-Circle contacts or fenced for untraceable cash ($950 per crate).
                  </p>

                  <div className="mt-4 p-4 bg-[#12100E] border border-[#2C2520] rounded font-mono tabular-nums">
                    <div className="text-xs text-[#A89F91]">Warehouse Stockpile</div>
                    <div className="text-2xl font-bold text-[#F59E0B] mt-0.5">{contraband} Crates</div>
                    <div className="text-xs text-[#10B981] mt-1">
                      Street Liquidation Value: ${(contraband * 950).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5">
                  <button
                    type="button"
                    disabled={contraband < 10}
                    onClick={() => {
                      soundEngine.playCashCollect();
                      onLiquidateContraband(10);
                    }}
                    className={`w-full py-2.5 px-4 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 font-mono tabular-nums touch:min-h-11 ${
                      contraband >= 10
                        ? 'bg-[#26211D] hover:bg-[#3A322B] text-[#F5F0E6] border border-[#3A322B] cursor-pointer'
                        : 'bg-[#12100E] text-[#78716C] border border-[#26211D] cursor-not-allowed'
                    }`}
                  >
                    Fence 10 Contraband Crates (+$9,500)
                  </button>
                  <button
                    type="button"
                    disabled={contraband <= 0}
                    onClick={() => {
                      soundEngine.playCashCollect();
                      onLiquidateContraband(contraband);
                    }}
                    className={`w-full py-2.5 px-4 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 font-mono tabular-nums touch:min-h-11 ${
                      contraband > 0
                        ? 'bg-[#10B981] hover:bg-[#059669] text-[#052E16] cursor-pointer'
                        : 'bg-[#12100E] text-[#78716C] border border-[#26211D] cursor-not-allowed'
                    }`}
                  >
                    Liquidate Entire Warehouse (+${(contraband * 950).toLocaleString()})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REAL-TIME GLOBAL COMMISSION LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-[#F5F0E6]">
                    1984 Commission Wire — Real-Time Global Syndicate Leaderboard
                  </h3>
                  <p className="text-xs text-[#A89F91]">
                    Ranked by Total Empire Valuation (Clean Cash + Capitalized Racket Value + Contraband Reserves).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playCashCollect();
                    onSyncLeaderboard();
                  }}
                  className="px-4 py-2 bg-[#B91C1C] hover:bg-[#DC2626] text-white text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer touch:min-h-11"
                >
                  Broadcast Empire Valuation to Global Wire
                </button>
              </div>

              <div className="bg-[#181512] border border-[#2C2520] rounded-lg overflow-hidden max-w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#2C2520] text-[11px] font-mono text-[#A89F91] bg-[#141210]">
                      <th className="py-3 px-4 short:py-2 short:px-2">Rank</th>
                      <th className="py-3 px-4 short:py-2 short:px-2">Crime Boss / Don</th>
                      <th className="py-3 px-4 short:py-2 short:px-2">Five Families Allegiance</th>
                      <th className="py-3 px-4 short:py-2 short:px-2">Rackets Held</th>
                      <th className="py-3 px-4 short:py-2 short:px-2">Omertà Respect</th>
                      <th className="py-3 px-4 short:py-2 short:px-2 text-right">Total Empire Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2C2520] text-xs font-mono tabular-nums">
                    {leaderboard.map((entry) => (
                      <tr
                        key={`${entry.donName}_${entry.rank}`}
                        className={
                          entry.isPlayer
                            ? 'bg-[#261916] text-[#F5F0E6]'
                            : 'hover:bg-[#1E1A17] text-[#D6CFC2]'
                        }
                      >
                        <td className="py-3 px-4 short:py-2 short:px-2 font-bold text-[#F59E0B]">#{entry.rank}</td>
                        <td className="py-3 px-4 short:py-2 short:px-2 font-sans">
                          <div className="font-bold text-[#F5F0E6]">
                            {entry.donName} {entry.isPlayer ? '(YOU)' : ''}
                          </div>
                          <div className="text-[11px] text-[#A89F91]">{entry.title} · {entry.updatedAgo}</div>
                        </td>
                        <td className="py-3 px-4 short:py-2 short:px-2 font-sans text-[#D6CFC2]">{entry.familyName}</td>
                        <td className="py-3 px-4 short:py-2 short:px-2">{entry.racketsControlled} / 15</td>
                        <td className="py-3 px-4 short:py-2 short:px-2 text-[#F59E0B]">{entry.respectScore}</td>
                        <td className="py-3 px-4 short:py-2 short:px-2 text-right font-bold text-[#10B981]">
                          ${entry.netWorth.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
