import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BoroughId,
  FIVE_FAMILIES,
  FamilyId,
  INITIAL_GLOBAL_LEADERBOARD,
  INITIAL_RACKETS,
  INITIAL_SOCIAL_CONTACTS,
  LeaderboardEntry,
  NARRATIVE_CHAPTERS,
  RacketBuilding,
  SKILL_TREE_NODES,
  SocialContact,
  WEAPON_ARSENAL,
  WeaponId,
} from './data/nyc1984Data';
import { LiveSimulationBridge, NycWorldCanvas, WorldCallbacks } from './components/NycWorldCanvas';
import { PauseOrEndModal, TitleScreenOverlay } from './components/TitleAndEndModals';
import { DrawerTab, SyndicateDrawerModal } from './components/SyndicateDrawers';
import { PerimeterHud } from './components/PerimeterHud';
import { soundEngine } from './audio/soundEngine';
import { enterPhoneFullscreen, isFullscreen, isTouchModeAttr } from './input/fullscreen';
import { RotateCard } from './components/RotateCard';
import { getVibrationEnabled, isVibrationSupported, pulse, setVibrationEnabled } from './input/haptics';

type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAME_OVER';

const SAVE_STORAGE_KEY = 'commission_1984_empire_v1';

interface SavedEmpireState {
  donName: string;
  playerFamily: FamilyId;
  cash: number;
  contraband: number;
  favorTokens: number;
  skillPoints: number;
  respectXp: number;
  currentActIndex: number;
  unlockedWeapons: WeaponId[];
  equippedWeapon: WeaponId;
  unlockedSkills: string[];
  rackets: RacketBuilding[];
  contacts: SocialContact[];
  lastSaveTimestamp: number;
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [donName, setDonName] = useState<string>('Don Michael Corvini');
  const [playerFamily, setPlayerFamily] = useState<FamilyId>('corvini');

  // Core Syndicate Economy & Character State
  const [cash, setCash] = useState<number>(8500);
  const [contraband, setContraband] = useState<number>(16);
  const [favorTokens, setFavorTokens] = useState<number>(2);
  const [skillPoints, setSkillPoints] = useState<number>(2);
  const [respectXp, setRespectXp] = useState<number>(120);
  const [policeHeat, setPoliceHeat] = useState<number>(8);
  const [currentActIndex, setCurrentActIndex] = useState<number>(0);

  // Arsenal & Skills
  const [unlockedWeapons, setUnlockedWeapons] = useState<WeaponId[]>(['knuckles', 'revolver']);
  const [equippedWeapon, setEquippedWeapon] = useState<WeaponId>('revolver');
  const [unlockedSkills, setUnlockedSkills] = useState<string[]>([]);

  // World Rackets & Social Contacts
  const [rackets, setRackets] = useState<RacketBuilding[]>(INITIAL_RACKETS);
  const [contacts, setContacts] = useState<SocialContact[]>(INITIAL_SOCIAL_CONTACTS);
  const [currentBoroughId, setCurrentBoroughId] = useState<BoroughId>('manhattan_south');

  // Player Health
  const [playerHp, setPlayerHp] = useState<number>(140);

  // UI Overlays & Notifications
  const [openDrawerTab, setOpenDrawerTab] = useState<DrawerTab | null>(null);
  const [focusedRacketId, setFocusedRacketId] = useState<string | null>(null);
  const [focusedContactId, setFocusedContactId] = useState<string | null>(null);
  const [nearPrompt, setNearPrompt] = useState<{
    type: 'racket' | 'contact' | 'npc';
    label: string;
    sublabel: string;
    id: string;
  } | null>(null);
  const [recentToast, setRecentToast] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [vibrationOn, setVibrationOn] = useState<boolean>(() => getVibrationEnabled());
  const [hasSavedEmpire, setHasSavedEmpire] = useState<boolean>(false);
  const [offlineReport, setOfflineReport] = useState<{
    elapsedSeconds: number;
    cashEarned: number;
    contrabandEarned: number;
    racketsCount: number;
  } | null>(null);
  const [rivalBaseLeaderboard, setRivalBaseLeaderboard] = useState<LeaderboardEntry[]>(
    INITIAL_GLOBAL_LEADERBOARD
  );

  const bridgeRef = useRef<LiveSimulationBridge | null>(null);

  const showToast = useCallback((msg: string) => {
    setRecentToast(msg);
  }, []);

  useEffect(() => {
    if (!recentToast) return;
    const t = setTimeout(() => setRecentToast(null), 4000);
    return () => clearTimeout(t);
  }, [recentToast]);

  // Derived Family & Skill Tree Multipliers
  const activeFamilySpec = useMemo(
    () => FIVE_FAMILIES.find((f) => f.id === playerFamily) || FIVE_FAMILIES[0],
    [playerFamily]
  );

  const playerMaxHp = useMemo(() => {
    let base = 140;
    if (unlockedSkills.includes('enf_2')) base += 60;
    if (playerFamily === 'moretti') base += 25;
    return base;
  }, [unlockedSkills, playerFamily]);

  const damageMultiplier = useMemo(() => {
    let mult = activeFamilySpec.combatMultiplier;
    if (unlockedSkills.includes('enf_1')) mult += 0.3;
    if (unlockedSkills.includes('enf_5')) mult += 0.5;
    const salContact = contacts.find((c) => c.id === 'contact_gallo');
    if (salContact && salContact.respect >= 40) mult += 0.2;
    const carmineContact = contacts.find((c) => c.id === 'contact_persico');
    if (carmineContact && carmineContact.respect >= 80) mult += 0.3;
    return mult;
  }, [activeFamilySpec, unlockedSkills, contacts]);

  const fireRateMultiplier = useMemo(() => {
    let mult = 1.0;
    if (unlockedSkills.includes('enf_3')) mult += 0.35;
    return mult;
  }, [unlockedSkills]);

  const speedMultiplier = useMemo(() => {
    return playerFamily === 'valenti' ? 1.15 : 1.0;
  }, [playerFamily]);

  const cashIncomeMultiplier = useMemo(() => {
    let mult = activeFamilySpec.cashMultiplier;
    if (unlockedSkills.includes('earn_1')) mult += 0.3;
    const paulie = contacts.find((c) => c.id === 'contact_castellano');
    if (paulie && paulie.respect >= 40) mult += 0.15;
    if (unlockedSkills.includes('earn_5')) mult *= 2.0;
    return mult;
  }, [activeFamilySpec, unlockedSkills, contacts]);

  const contrabandIncomeMultiplier = useMemo(() => {
    let mult = activeFamilySpec.contrabandMultiplier;
    if (unlockedSkills.includes('earn_2')) mult += 0.25;
    const sal = contacts.find((c) => c.id === 'contact_gallo');
    if (sal && sal.respect >= 80) mult += 0.4;
    return mult;
  }, [activeFamilySpec, unlockedSkills, contacts]);

  const hourlyCashIncome = useMemo(() => {
    const rawRacketSum = rackets
      .filter((r) => r.ownerFamily === 'player')
      .reduce((sum, r) => sum + r.baseIncomePerHour * r.level, 0);
    const allianceBonus = unlockedSkills.includes('con_4')
      ? contacts.filter((c) => c.respect >= 40).length * 12000
      : 0;
    return Math.round((rawRacketSum + allianceBonus) * cashIncomeMultiplier);
  }, [rackets, contacts, unlockedSkills, cashIncomeMultiplier]);

  const hourlyContrabandIncome = useMemo(() => {
    const rawCrates = rackets
      .filter((r) => r.ownerFamily === 'player')
      .reduce((sum, r) => sum + r.baseContrabandPerHour * r.level, 0);
    return Math.round(rawCrates * contrabandIncomeMultiplier);
  }, [rackets, contrabandIncomeMultiplier]);

  const netWorth = useMemo(() => {
    const racketValuation = rackets
      .filter((r) => r.ownerFamily === 'player')
      .reduce((sum, r) => sum + r.baseIncomePerHour * r.level * 3.5, 0);
    const contrabandValuation = contraband * 950;
    let total = Math.round(cash + racketValuation + contrabandValuation);
    const paulie = contacts.find((c) => c.id === 'contact_castellano');
    if (paulie && paulie.respect >= 80) total = Math.round(total * 1.35);
    return total;
  }, [cash, rackets, contraband, contacts]);

  // Load saved empire and compute Returning Boss Offline Progression on initial mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_STORAGE_KEY);
      if (!raw) return;
      const parsed: SavedEmpireState = JSON.parse(raw);
      if (parsed && parsed.rackets) {
        setHasSavedEmpire(true);
        setDonName(parsed.donName || 'Don Michael Corvini');
        setPlayerFamily(parsed.playerFamily || 'corvini');
        setCash(parsed.cash ?? 8500);
        setContraband(parsed.contraband ?? 16);
        setFavorTokens(parsed.favorTokens ?? 2);
        setSkillPoints(parsed.skillPoints ?? 2);
        setRespectXp(parsed.respectXp ?? 120);
        setCurrentActIndex(parsed.currentActIndex ?? 0);
        setUnlockedWeapons(parsed.unlockedWeapons || ['knuckles', 'revolver']);
        setEquippedWeapon(parsed.equippedWeapon || 'revolver');
        setUnlockedSkills(parsed.unlockedSkills || []);
        setRackets(parsed.rackets);
        if (parsed.contacts && parsed.contacts.length > 0) {
          // Ensure latest portrait URLs stay synced
          const mergedContacts = INITIAL_SOCIAL_CONTACTS.map((initC) => {
            const savedC = parsed.contacts.find((sc) => sc.id === initC.id);
            return savedC ? { ...initC, respect: savedC.respect } : initC;
          });
          setContacts(mergedContacts);
        }

        // Calculate Offline Passive Progression since lastSaveTimestamp
        const now = Date.now();
        const elapsedSec = Math.max(0, Math.floor((now - (parsed.lastSaveTimestamp || now)) / 1000));
        if (elapsedSec >= 45) {
          const cappedSec = Math.min(elapsedSec, 24 * 3600);
          const owned = parsed.rackets.filter((r) => r.ownerFamily === 'player');
          const rawHourlyCash = owned.reduce((acc, r) => acc + r.baseIncomePerHour * r.level, 0);
          const rawHourlyCrates = owned.reduce((acc, r) => acc + r.baseContrabandPerHour * r.level, 0);
          const caymanBoost = (parsed.unlockedSkills || []).includes('earn_4') ? 1.6 : 1.0;

          const offlineCash = Math.max(
            450,
            Math.round((rawHourlyCash * (cappedSec / 3600)) * caymanBoost)
          );
          const offlineCrates = Math.max(
            2,
            Math.round((rawHourlyCrates * (cappedSec / 3600)) * caymanBoost)
          );

          setOfflineReport({
            elapsedSeconds: cappedSec,
            cashEarned: offlineCash,
            contrabandEarned: offlineCrates,
            racketsCount: owned.length,
          });
        }
      }
    } catch {
      // Ignore malformed storage
    }
  }, []);

  // Save empire state periodically & on changes
  useEffect(() => {
    if (gameState === 'TITLE_MENU') return;
    const payload: SavedEmpireState = {
      donName,
      playerFamily,
      cash,
      contraband,
      favorTokens,
      skillPoints,
      respectXp,
      currentActIndex,
      unlockedWeapons,
      equippedWeapon,
      unlockedSkills,
      rackets,
      contacts,
      lastSaveTimestamp: Date.now(),
    };
    try {
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));
      setHasSavedEmpire(true);
    } catch {
      // Ignore quota errors
    }
  }, [
    gameState,
    donName,
    playerFamily,
    cash,
    contraband,
    favorTokens,
    skillPoints,
    respectXp,
    currentActIndex,
    unlockedWeapons,
    equippedWeapon,
    unlockedSkills,
    rackets,
    contacts,
  ]);

  // Phone play: touch mode (pinned <html data-input="touch">), portrait orientation, fullscreen exit
  const [isTouchMode, setIsTouchMode] = useState<boolean>(() => isTouchModeAttr());
  const [isPortrait, setIsPortrait] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia('(orientation: portrait)').matches,
  );
  const gameStateRef = useRef<GameState>(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setIsTouchMode(isTouchModeAttr()));
    observer.observe(root, { attributes: true, attributeFilter: ['data-input'] });
    setIsTouchMode(isTouchModeAttr());
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const mql = window.matchMedia('(orientation: portrait)');
    const onChange = (e: MediaQueryListEvent) => setIsPortrait(e.matches);
    setIsPortrait(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!isFullscreen() && gameStateRef.current === 'PLAYING' && isTouchModeAttr()) {
        setGameState('PAUSED');
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Portrait on a touch device during play: rotate card covers everything and the whole simulation halts
  const isPortraitBlocked = isPortrait && isTouchMode && gameState === 'PLAYING';

  // Continuous 1-second Idle Territory Tick & Rival Leaderboard Tick
  useEffect(() => {
    if (gameState !== 'PLAYING' || isPortraitBlocked) return;

    const interval = setInterval(() => {
      const autoBagmenUnlocked = unlockedSkills.includes('earn_3');
      const belliniContact = contacts.find((c) => c.id === 'contact_bellini_consigliere');
      const halfAutoCollect = belliniContact && belliniContact.respect >= 40;

      // Speed up real-time gameplay tick so 1 game-hour happens every 3 minutes of real play
      const tickFractionOfHour = 1 / 180;

      setRackets((prevRackets) =>
        prevRackets.map((r) => {
          if (r.ownerFamily !== 'player') return r;
          const generated = r.baseIncomePerHour * r.level * cashIncomeMultiplier * tickFractionOfHour;
          if (autoBagmenUnlocked) {
            return r;
          }
          if (halfAutoCollect) {
            return { ...r, uncollectedCash: r.uncollectedCash + generated * 0.5 };
          }
          return { ...r, uncollectedCash: r.uncollectedCash + generated };
        })
      );

      if (autoBagmenUnlocked) {
        setCash((c) => c + Math.round(hourlyCashIncome * tickFractionOfHour));
      } else if (halfAutoCollect) {
        setCash((c) => c + Math.round(hourlyCashIncome * tickFractionOfHour * 0.5));
      }

      // Passive contraband accumulation every 12 seconds
      if (Math.random() < 0.15) {
        const crateGain = Math.max(1, Math.round(hourlyContrabandIncome / 35));
        setContraband((cr) => cr + crateGain);
      }

      // Passive Police Heat cooling
      const coolRate = unlockedSkills.includes('con_3') ? 1.5 : 0.45;
      setPoliceHeat((h) => Math.max(0, h - coolRate));

      // Live Rival Dons Leaderboard fluctuation
      setRivalBaseLeaderboard((prev) =>
        prev.map((entry) => ({
          ...entry,
          netWorth: entry.netWorth + Math.round((Math.random() - 0.35) * 4200),
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, isPortraitBlocked, unlockedSkills, contacts, cashIncomeMultiplier, hourlyCashIncome, hourlyContrabandIncome]);

  // Global keyboard shortcuts (Enter/Space on Title Screen, Tab for Dossier, Esc for Pause/Close)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (gameState === 'TITLE_MENU') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          soundEngine.playTurfCaptured();
          setGameState('PLAYING');
        }
        return;
      }

      if (e.code === 'Tab') {
        e.preventDefault();
        soundEngine.playUiClick();
        setOpenDrawerTab((prev) => (prev ? null : 'turf'));
      } else if (e.code === 'Escape') {
        e.preventDefault();
        soundEngine.playUiClick();
        if (openDrawerTab) {
          setOpenDrawerTab(null);
        } else if (gameState === 'PLAYING') {
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, openDrawerTab]);

  // World Canvas Callbacks
  const handleEarnResources = useCallback(
    (cashDelta: number, contrabandDelta: number, respectDelta: number, heatDelta: number, reason?: string) => {
      if (cashDelta > 0) setCash((c) => c + cashDelta);
      if (contrabandDelta > 0) setContraband((cr) => cr + contrabandDelta);
      if (respectDelta > 0) {
        setRespectXp((xp) => {
          const next = xp + respectDelta;
          if (Math.floor(next / 150) > Math.floor(xp / 150)) {
            setSkillPoints((sp) => sp + 1);
            showToast('OMERTÀ RANK UP: +1 Skill Point Earned!');
          }
          return next;
        });
      }
      if (heatDelta > 0) {
        const rossi = contacts.find((c) => c.id === 'contact_rossi');
        const rossiReduction = rossi && rossi.respect >= 40 ? 0.3 : 0;
        const skillReduction = unlockedSkills.includes('con_1') ? 0.35 : 0;
        const totalReduction = Math.min(0.8, activeFamilySpec.heatReduction + rossiReduction + skillReduction);
        setPoliceHeat((h) => Math.min(100, h + heatDelta * (1 - totalReduction)));
      }
      if (unlockedSkills.includes('enf_5') && cashDelta > 0) {
        setPlayerHp((hp) => Math.min(playerMaxHp, hp + 25));
      }
      if (reason) {
        showToast(`${reason}: +$${cashDelta.toLocaleString()}`);
      }
    },
    [contacts, unlockedSkills, activeFamilySpec, playerMaxHp, showToast]
  );

  const handleCollectRacketEnvelope = useCallback((racketId: string) => {
    setRackets((prev) =>
      prev.map((r) => {
        if (r.id !== racketId) return r;
        const amt = Math.floor(r.uncollectedCash);
        if (amt > 0) {
          setCash((c) => c + amt);
        }
        return { ...r, uncollectedCash: 0 };
      })
    );
  }, []);

  const handleCollectAllEnvelopes = useCallback(() => {
    let total = 0;
    setRackets((prev) =>
      prev.map((r) => {
        if (r.ownerFamily === 'player' && r.uncollectedCash >= 1) {
          total += Math.floor(r.uncollectedCash);
          return { ...r, uncollectedCash: 0 };
        }
        return r;
      })
    );
    if (total > 0) {
      setCash((c) => c + total);
      showToast(`Collected $${total.toLocaleString()} in Street Tribute Envelopes!`);
    }
  }, [showToast]);

  const handleTurfCapoDefeated = useCallback(
    (racketId: string) => {
      setRackets((prev) => {
        const updated = prev.map((r) =>
          r.id === racketId ? { ...r, ownerFamily: 'player' as const, uncollectedCash: 1500 } : r
        );
        const ownedCount = updated.filter((r) => r.ownerFamily === 'player').length;
        if (ownedCount >= 15) {
          setGameState('VICTORY');
        }
        return updated;
      });
      setSkillPoints((sp) => sp + 1);
      setFavorTokens((ft) => ft + 1);
      showToast('TURF SEIZED! Racket now kicks up tribute to your family (+1 SP, +1 Favor).');
    },
    [showToast]
  );

  const handlePlayerDamaged = useCallback(
    (dmg: number) => {
      pulse('damage');
      const armorMult = unlockedSkills.includes('enf_2') ? 0.75 : 1.0;
      const actual = Math.max(2, Math.round(dmg * armorMult));
      setPlayerHp((prev) => {
        const next = prev - actual;
        if (next <= 0) {
          setGameState('GAME_OVER');
          return playerMaxHp;
        }
        return next;
      });
    },
    [unlockedSkills, playerMaxHp]
  );

  const handleEquipOrBuyWeapon = useCallback(
    (weaponId: WeaponId) => {
      if (unlockedWeapons.includes(weaponId)) {
        setEquippedWeapon(weaponId);
        return;
      }
      const spec = WEAPON_ARSENAL.find((w) => w.id === weaponId);
      if (!spec) return;
      if (cash >= spec.unlockCostCash) {
        setCash((c) => c - spec.unlockCostCash);
        setUnlockedWeapons((prev) => [...prev, weaponId]);
        setEquippedWeapon(weaponId);
        soundEngine.playCashCollect();
        showToast(`Purchased & Equipped ${spec.name}!`);
      } else {
        setOpenDrawerTab('turf');
        showToast(`Need $${spec.unlockCostCash.toLocaleString()} to purchase ${spec.name}.`);
      }
    },
    [unlockedWeapons, cash, showToast]
  );

  const worldCallbacks: WorldCallbacks = useMemo(
    () => ({
      onEarnResources: handleEarnResources,
      onCollectRacketEnvelope: handleCollectRacketEnvelope,
      onOpenRacketModal: (racketId: string) => {
        setFocusedRacketId(racketId);
        setOpenDrawerTab('turf');
      },
      onOpenContactSitDown: (contactId: string) => {
        setFocusedContactId(contactId);
        setOpenDrawerTab('social');
      },
      onPlayerDamaged: handlePlayerDamaged,
      onBoroughChanged: (bId: BoroughId) => {
        setCurrentBoroughId(bId);
      },
      onSelectWeapon: handleEquipOrBuyWeapon,
      onNearInteractableChange: setNearPrompt,
      onTurfCapoDefeated: (racketId: string) => {
        pulse('capoTakedown');
        handleTurfCapoDefeated(racketId);
      },
    }),
    [
      handleEarnResources,
      handleCollectRacketEnvelope,
      handlePlayerDamaged,
      handleEquipOrBuyWeapon,
      handleTurfCapoDefeated,
    ]
  );

  // Syndicate Drawer Handlers
  const handleUpgradeRacket = (racketId: string) => {
    const discount = unlockedSkills.includes('earn_2') ? 0.75 : 1.0;
    setRackets((prev) =>
      prev.map((r) => {
        if (r.id !== racketId || r.level >= 5) return r;
        const cost = Math.round(r.baseIncomePerHour * 0.85 * r.level * discount);
        if (cash < cost) return r;
        setCash((c) => c - cost);
        showToast(`Upgraded ${r.name} to Level ${r.level + 1}!`);
        return { ...r, level: r.level + 1 };
      })
    );
  };

  const handleBuyoutRacket = (racketId: string) => {
    const discount = unlockedSkills.includes('con_3') ? 0.8 : 1.0;
    const target = rackets.find((r) => r.id === racketId);
    if (!target || target.ownerFamily === 'player') return;
    const cost = Math.round(target.takeoverCostCash * discount);
    if (cash < cost) return;

    setCash((c) => c - cost);
    handleTurfCapoDefeated(racketId);
  };

  const handleSendGiftToContact = (contactId: string) => {
    const target = contacts.find((c) => c.id === contactId);
    if (!target) return;
    if (cash < target.giftCostCash || contraband < target.giftCostContraband) return;

    setCash((c) => c - target.giftCostCash);
    setContraband((cr) => cr - target.giftCostContraband);

    const respectBoost = unlockedSkills.includes('con_2') ? 27 : 18;
    const tokenGain = unlockedSkills.includes('con_2') ? 2 : 1;

    setFavorTokens((ft) => ft + tokenGain);
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId ? { ...c, respect: Math.min(100, c.respect + respectBoost) } : c
      )
    );
    showToast(`Sent ${target.favoriteGiftName} to ${target.name} (+${respectBoost} Respect, +${tokenGain} Favor)!`);
  };

  const handleExecuteFavorTrade = (contactId: string) => {
    const target = contacts.find((c) => c.id === contactId);
    if (!target || favorTokens < target.favorCostTokens) return;

    setFavorTokens((ft) => ft - target.favorCostTokens);

    if (contactId === 'contact_castellano') {
      setCash((c) => c + 25000);
      setRackets((prev) =>
        prev.map((r) => ({ ...r, baseIncomePerHour: Math.round(r.baseIncomePerHour * 1.15) }))
      );
      showToast('Don Paulie sanctioned your Concrete Club charter (+$25,000 & +15% Racket Income)!');
    } else if (contactId === 'contact_gallo') {
      setContraband((cr) => cr + 45);
      bridgeRef.current?.spawnAlliedHitSquad();
      showToast('Underboss Sal delivered +45 Contraband Crates & dispatched a Cadillac Hit Squad!');
    } else if (contactId === 'contact_rossi') {
      setPoliceHeat(0);
      showToast('Captain Rossi destroyed the wiretap reels — Federal & NYPD Heat dropped to 0%!');
    } else if (contactId === 'contact_omalley') {
      setContraband((cr) => cr + 30);
      setCash((c) => c + 18000);
      setRackets((prev) =>
        prev.map((r) =>
          r.ownerFamily !== 'player'
            ? { ...r, takeoverCostCash: Math.round(r.takeoverCostCash * 0.65) }
            : r
        )
      );
      showToast('Ironhook O’Malley called a dock strike — Rival Buyout Costs cut by 35% + $18,000!');
    } else if (contactId === 'contact_bellini_consigliere') {
      setContraband((cr) => Math.max(0, cr - 25));
      setCash((c) => c + 32000);
      setSkillPoints((sp) => sp + 1);
      showToast('Consigliere Bellini laundered contraband through Zurich (+$32,000 & +1 SP)!');
    } else if (contactId === 'contact_persico') {
      setSkillPoints((sp) => sp + 2);
      setPlayerHp(playerMaxHp);
      showToast('Brokered Five Families Sit-Down Pact (+2 Omertà Skill Points & Full Health)!');
    }
  };

  const handleUnlockSkill = (skillId: string) => {
    const node = SKILL_TREE_NODES.find((n) => n.id === skillId);
    if (!node || unlockedSkills.includes(skillId) || skillPoints < node.costPoints) return;

    setSkillPoints((sp) => sp - node.costPoints);
    setUnlockedSkills((prev) => [...prev, skillId]);

    if (skillId === 'con_5') {
      setFavorTokens((ft) => ft + 3);
      setContacts((prev) => prev.map((c) => ({ ...c, respect: Math.min(100, c.respect + 25) })));
    }
    showToast(`UnlockedCosa Nostra Skill: ${node.name}!`);
  };

  const handleSimulateOfflineHours = (hours: number) => {
    const ownedCount = rackets.filter((r) => r.ownerFamily === 'player').length;
    const caymanBoost = unlockedSkills.includes('earn_4') ? 1.6 : 1.0;
    const earnedCash = Math.round(hourlyCashIncome * hours * caymanBoost);
    const earnedCrates = Math.round(hourlyContrabandIncome * hours * caymanBoost);

    setOfflineReport({
      elapsedSeconds: hours * 3600,
      cashEarned: earnedCash,
      contrabandEarned: earnedCrates,
      racketsCount: ownedCount,
    });
    showToast(`Simulated +${hours} Hours Offline Progression — Ready to Collect!`);
  };

  const handleClaimOfflineReport = () => {
    if (!offlineReport) return;
    setCash((c) => c + offlineReport.cashEarned);
    setContraband((cr) => cr + offlineReport.contrabandEarned);
    showToast(
      `Collected +$${offlineReport.cashEarned.toLocaleString()} & +${offlineReport.contrabandEarned} Crates from Offline Vault!`
    );
    setOfflineReport(null);
  };

  const handleLiquidateContraband = (cratesToSell: number) => {
    if (cratesToSell <= 0 || contraband < cratesToSell) return;
    const omalley = contacts.find((c) => c.id === 'contact_omalley');
    const pricePerCrate = omalley && omalley.respect >= 40 ? 1190 : 950;
    const payout = cratesToSell * pricePerCrate;
    setContraband((cr) => cr - cratesToSell);
    setCash((c) => c + payout);
    showToast(`Fenced ${cratesToSell} Contraband Crates at the piers for +$${payout.toLocaleString()}!`);
  };

  const handleClaimChapterReward = () => {
    const ch = NARRATIVE_CHAPTERS[Math.min(currentActIndex, NARRATIVE_CHAPTERS.length - 1)];
    setCash((c) => c + ch.rewardCash);
    setSkillPoints((sp) => sp + ch.rewardSkillPoints);
    setFavorTokens((ft) => ft + ch.rewardFavorTokens);
    if (currentActIndex + 1 >= NARRATIVE_CHAPTERS.length) {
      setGameState('VICTORY');
    } else {
      setCurrentActIndex((idx) => idx + 1);
      showToast(`Completed ${ch.title}! Awarded +$${ch.rewardCash.toLocaleString()} & +${ch.rewardSkillPoints} SP!`);
    }
  };

  // Combined Real-Time Global Leaderboard
  const computedLeaderboard: LeaderboardEntry[] = useMemo(() => {
    const ownedRackets = rackets.filter((r) => r.ownerFamily === 'player').length;
    const allianceSum = contacts.reduce((s, c) => s + c.respect, 0);
    const playerEntry: LeaderboardEntry = {
      rank: 0,
      donName,
      familyId: playerFamily,
      familyName: activeFamilySpec.name,
      netWorth,
      racketsControlled: ownedRackets,
      boroughsDominated: Math.max(1, Math.floor(ownedRackets / 3)),
      respectScore: respectXp + allianceSum,
      title: ownedRackets >= 15 ? 'Capo di Tutti Capi' : ownedRackets >= 8 ? 'Commission Boss' : 'Rising Street Boss',
      isPlayer: true,
      updatedAgo: 'Live · Your Syndicate',
    };

    const all = [...rivalBaseLeaderboard, playerEntry].sort((a, b) => b.netWorth - a.netWorth);
    return all.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [rivalBaseLeaderboard, rackets, contacts, donName, playerFamily, activeFamilySpec, netWorth, respectXp]);

  const uncollectedTotal = useMemo(
    () =>
      rackets
        .filter((r) => r.ownerFamily === 'player')
        .reduce((acc, r) => acc + Math.floor(r.uncollectedCash), 0),
    [rackets]
  );

  const controlledRacketsCount = useMemo(
    () => rackets.filter((r) => r.ownerFamily === 'player').length,
    [rackets]
  );

  const alliancesCount = useMemo(
    () => contacts.filter((c) => c.respect >= 40).length,
    [contacts]
  );

  const hasStreetCeasefire = useMemo(() => {
    const c = contacts.find((ct) => ct.id === 'contact_persico');
    return Boolean(c && c.respect >= 40);
  }, [contacts]);

  const handleResetEmpire = () => {
    localStorage.removeItem(SAVE_STORAGE_KEY);
    setHasSavedEmpire(false);
    setCash(8500);
    setContraband(16);
    setFavorTokens(2);
    setSkillPoints(2);
    setRespectXp(120);
    setPoliceHeat(8);
    setCurrentActIndex(0);
    setUnlockedWeapons(['knuckles', 'revolver']);
    setEquippedWeapon('revolver');
    setUnlockedSkills([]);
    setRackets(INITIAL_RACKETS);
    setContacts(INITIAL_SOCIAL_CONTACTS);
    setOfflineReport(null);
    showToast('Started fresh 1984 New York Syndicate ledger.');
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#09090B] select-none">
      {/* Isolated 60fps 2D NYC Open-World Simulation Canvas */}
      <NycWorldCanvas
        isTitleScreen={gameState === 'TITLE_MENU'}
        isPaused={(gameState !== 'PLAYING' && gameState !== 'TITLE_MENU') || isPortraitBlocked}
        playerFamily={playerFamily}
        equippedWeapon={equippedWeapon}
        unlockedWeapons={unlockedWeapons}
        rackets={rackets}
        contacts={contacts}
        playerHp={playerHp}
        playerMaxHp={playerMaxHp}
        damageMultiplier={damageMultiplier}
        speedMultiplier={speedMultiplier}
        fireRateMultiplier={fireRateMultiplier}
        hasAlliedBodyguards={unlockedSkills.includes('enf_4')}
        hasStreetCeasefire={hasStreetCeasefire}
        policeHeat={policeHeat}
        callbacks={worldCallbacks}
        bridgeRef={bridgeRef}
      />

      {/* STATE 1: TITLE SCREEN OVERLAY */}
      {gameState === 'TITLE_MENU' && (
        <TitleScreenOverlay
          donName={donName}
          setDonName={setDonName}
          selectedFamily={playerFamily}
          setSelectedFamily={setPlayerFamily}
          onStartGame={() => {
            // Not awaited: the game starts even if fullscreen or the landscape lock is refused
            if (isTouchModeAttr()) void enterPhoneFullscreen();
            setGameState('PLAYING');
          }}
          hasSavedEmpire={hasSavedEmpire}
          onResetEmpire={handleResetEmpire}
        />
      )}

      {/* STATE 2: ACTIVE PLAY PERIMETER HUD (85%+ Unobstructed Playfield) */}
      {gameState !== 'TITLE_MENU' && (
        <PerimeterHud
          donName={donName}
          playerFamily={playerFamily}
          currentBoroughId={currentBoroughId}
          hp={playerHp}
          maxHp={playerMaxHp}
          cash={cash}
          hourlyCashIncome={hourlyCashIncome}
          contraband={contraband}
          favorTokens={favorTokens}
          skillPoints={skillPoints}
          policeHeat={policeHeat}
          netWorth={netWorth}
          controlledRacketsCount={controlledRacketsCount}
          uncollectedTotal={uncollectedTotal}
          equippedWeapon={equippedWeapon}
          unlockedWeapons={unlockedWeapons}
          currentActIndex={currentActIndex}
          isMuted={isMuted}
          vibrationSupported={isVibrationSupported()}
          vibrationOn={vibrationOn}
          hasOfflineReport={Boolean(offlineReport)}
          nearPrompt={nearPrompt}
          recentToast={recentToast}
          onSelectBorough={(bId) => {
            setCurrentBoroughId(bId);
            bridgeRef.current?.teleportToBorough(bId);
          }}
          onEquipOrBuyWeapon={handleEquipOrBuyWeapon}
          onOpenDrawer={(tab, focusId) => {
            if (tab === 'turf' && focusId) setFocusedRacketId(focusId);
            if (tab === 'social' && focusId) setFocusedContactId(focusId);
            setOpenDrawerTab(tab);
          }}
          onCollectAllEnvelopes={handleCollectAllEnvelopes}
          onBribePolice={() => {
            if (cash >= 1500) {
              setCash((c) => c - 1500);
              setPoliceHeat(0);
              showToast('Paid $1,500 precinct envelope — NYPD Heat cleared!');
            } else {
              showToast('Need $1,500 cash to pay off the precinct captain.');
            }
          }}
          onToggleMute={() => {
            const muted = soundEngine.toggleMute();
            setIsMuted(muted);
          }}
          onToggleVibration={() => {
            const next = !vibrationOn;
            setVibrationEnabled(next);
            setVibrationOn(next);
          }}
          onPause={() => setGameState('PAUSED')}
        />
      )}

      {/* SYNDICATE DOSSIER & MANAGEMENT DRAWER MODAL */}
      {gameState === 'PLAYING' && openDrawerTab && (
        <SyndicateDrawerModal
          activeTab={openDrawerTab}
          setActiveTab={setOpenDrawerTab}
          onClose={() => setOpenDrawerTab(null)}
          focusedRacketId={focusedRacketId}
          focusedContactId={focusedContactId}
          cash={cash}
          contraband={contraband}
          favorTokens={favorTokens}
          skillPoints={skillPoints}
          policeHeat={policeHeat}
          netWorth={netWorth}
          hourlyCashIncome={hourlyCashIncome}
          hourlyContrabandIncome={hourlyContrabandIncome}
          rackets={rackets}
          contacts={contacts}
          unlockedSkills={unlockedSkills}
          currentActIndex={currentActIndex}
          offlineReport={offlineReport}
          leaderboard={computedLeaderboard}
          onTravelToBorough={(bId) => {
            setCurrentBoroughId(bId);
            bridgeRef.current?.teleportToBorough(bId);
          }}
          onUpgradeRacket={handleUpgradeRacket}
          onBuyoutRacket={handleBuyoutRacket}
          onRaidRacketInWorld={(racket) => {
            bridgeRef.current?.spawnTurfDefenseWave(racket);
            showToast(`TURF RAID: Defeat the Capo outside ${racket.name} to seize the deed!`);
          }}
          onCollectAllEnvelopes={handleCollectAllEnvelopes}
          onLiquidateContraband={handleLiquidateContraband}
          onSendGiftToContact={handleSendGiftToContact}
          onExecuteFavorTrade={handleExecuteFavorTrade}
          onUnlockSkill={handleUnlockSkill}
          onClaimOfflineReport={handleClaimOfflineReport}
          onSimulateOfflineHours={handleSimulateOfflineHours}
          onClaimChapterReward={handleClaimChapterReward}
          onSyncLeaderboard={() => {
            showToast(`Synced ${donName} ($${netWorth.toLocaleString()}) to 1984 Commission Global Wire!`);
          }}
        />
      )}

      {/* STATE 3: PAUSE / VICTORY / HOSPITAL RECOVERY MODAL */}
      {(gameState === 'PAUSED' || gameState === 'GAME_OVER' || gameState === 'VICTORY') && (
        <PauseOrEndModal
          mode={gameState}
          donName={donName}
          netWorth={netWorth}
          controlledRacketsCount={controlledRacketsCount}
          alliancesCount={alliancesCount}
          onResume={() => {
            if (isTouchModeAttr()) void enterPhoneFullscreen();
            setGameState('PLAYING');
          }}
          onRestartOrRecover={() => {
            if (gameState === 'GAME_OVER') {
              setCash((c) => Math.max(500, Math.round(c * 0.9)));
              setPlayerHp(playerMaxHp);
              setPoliceHeat(0);
              bridgeRef.current?.triggerHealEffect('PATCHED UP AT MULBERRY ST.');
            }
            setGameState('PLAYING');
          }}
          onReturnToTitle={() => {
            setOpenDrawerTab(null);
            setGameState('TITLE_MENU');
          }}
        />
      )}

      {/* PHONE PORTRAIT GUARD: covers everything while the simulation is halted */}
      {isPortraitBlocked && <RotateCard />}
    </main>
  );
}
