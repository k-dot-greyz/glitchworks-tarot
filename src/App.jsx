import { useState, useEffect } from 'react';
import INITIAL_DECK from './dynamic_deck.json';
import {
  Sword,
  Eye,
  Layers,
  LayoutGrid,
  X,
  Shuffle,
  Hammer,
  Save,
  Settings,
  Upload,
  EyeOff,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  Edit3,
  Check,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

import { GlitchStyles } from './components/GlitchStyles.jsx';
import { NeonSlider } from './components/NeonSlider.jsx';
import { Card } from './components/Card.jsx';
import { usePersistedDeck } from './hooks/usePersistedDeck.js';
import { resolveBattleWithEngine, arenaModes } from './domain/battleEngine.js';
import { rulesets } from './domain/rulesets.js';
import { drawSpread } from './domain/deckState.js';
import { createLocalStorageDeckStorage } from './adapters/localStorageDeckStorage.js';
import { createConsoleTelemetry } from './adapters/consoleTelemetry.js';

// Default instances for cases where they are not injected (e.g., tests or standard rendering)
const defaultStorage = createLocalStorageDeckStorage();
const defaultTelemetry = createConsoleTelemetry();

export default function App({ storage = defaultStorage, telemetry = defaultTelemetry }) {
  const [view, setView] = useState('dex'); // 'dex', 'arena', 'oracle', 'forge'
  const {
    decks,
    activeDeckId,
    deck,
    deckBack,
    setDeckBack,
    switchDeck,
    createDeck,
    duplicateDeck,
    renameDeck,
    deleteDeck,
    compileForgeCard,
  } = usePersistedDeck(storage, telemetry, INITIAL_DECK);
  const [selectedCard, setSelectedCard] = useState(null);
  const [modalCardFlipped, setModalCardFlipped] = useState(true); // true = face-up, false = face-down

  // Settings / Aesthetics State
  const [showSettings, setShowSettings] = useState(false);
  const [aesthetics, setAesthetics] = useState({
    glitch: 50,
    crt: 40,
    noise: 15,
  });

  // Dex View States
  const [showDeckBacks, setShowDeckBacks] = useState(false);
  const [editingDeckId, setEditingDeckId] = useState(null);
  const [editingDeckName, setEditingDeckName] = useState('');
  const [newDeckName, setNewDeckName] = useState('');
  const [showCreateDeckInput, setShowCreateDeckInput] = useState(false);

  // Drag and Drop States
  const [dragOverSlot, setDragOverSlot] = useState(null); // zone ID or null
  const [oracleDragOverZone, setOracleDragOverZone] = useState(null); // zone index or null

  // Oracle Reveals State
  const [revealedCardIds, setRevealedCardIds] = useState([]);

  // Arena State
  const [arenaRuleset, setArenaRuleset] = useState('standard');
  const [arenaSlots, setArenaSlots] = useState({ p1: null, p2: null });
  const [battleLog, setBattleLog] = useState("[ WAITING FOR DATA INPUT ]");
  const [isClashing, setIsClashing] = useState(false);
  const [arenaMode, setArenaMode] = useState('standard');

  // Oracle State
  const [spread, setSpread] = useState([]);
  const [oracleLayout, setOracleLayout] = useState('threeCard');

  // Forge State
  const [forgeData, setForgeData] = useState({
    id: '999',
    name: 'New Entity',
    sub: 'Unknown Origin',
    type: 'void',
    stats: { atk: 50, def: 50, spd: 50 },
    desc: 'An anomaly in the system. Properties yet to be defined.',
    image: 'text-indigo-400',
    icon: 'Sparkles',
    customImage: null,
    hideStats: false,
    hideDesc: false,
    frame: 'standard',
    hat: 'none',
    rarity: 'common',
    ability: 'none'
  });

  // Sync CSS variables for Glitchworks aesthetic
  useEffect(() => {
    document.documentElement.style.setProperty('--glitch-int', aesthetics.glitch / 100);
    document.documentElement.style.setProperty('--crt-opacity', aesthetics.crt / 100);
    document.documentElement.style.setProperty('--noise-opacity', aesthetics.noise / 100);
  }, [aesthetics]);

  // Initialize and Sync Arena Slots based on Ruleset
  useEffect(() => {
    const activeRuleset = rulesets[arenaRuleset] || rulesets.standard;
    const initialSlots = {};
    activeRuleset.zones.forEach((zone) => {
      initialSlots[zone.id] = null;
    });
    setArenaSlots(initialSlots);
    setBattleLog(
      arenaMode === 'combatDisabled'
        ? '> SYSTEMS IN HARMONY. NO CLASH POSSIBLE.'
        : arenaRuleset === 'standard'
          ? '[ WAITING FOR DATA INPUT ]'
          : `[ ${activeRuleset.name.toUpperCase()} INITIALIZED ]`
    );
  }, [arenaRuleset]);

  // Capacitor Mobile Integrations
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#020617' }); // slate-950
    }
  }, []);

  // --- HANDLERS ---
  const handleArenaSelect = (card) => {
    if (isClashing) return;
    const activeRuleset = rulesets[arenaRuleset] || rulesets.standard;
    const clashSlots = activeRuleset.clashSlots;
    
    // Find the first empty clash slot
    const emptySlot = clashSlots.find(slotId => !arenaSlots[slotId]);
    if (emptySlot) {
      // Validate banlist at boundary
      if (activeRuleset.bannedCardIds.includes(card.id)) {
        setBattleLog(`[ ERR: CARD ${card.id} BANNED IN ${activeRuleset.name.toUpperCase()} ]`);
        if (telemetry) {
          telemetry.log('warn', 'CARD_BAN_VIOLATION', { cardId: card.id, rulesetId: activeRuleset.id });
        }
        return;
      }

      setArenaSlots(prev => ({ ...prev, [emptySlot]: card }));
      setBattleLog(`[ ${emptySlot.toUpperCase()} FILLED ]`);
    }
  };

  const handleResolveBattle = () => {
    const activeRuleset = rulesets[arenaRuleset] || rulesets.standard;
    const clashSlots = activeRuleset.clashSlots;
    const p1 = arenaSlots[clashSlots[0]];
    const p2 = arenaSlots[clashSlots[1]];

    if (
      !p1 ||
      !p2 ||
      isClashing ||
      arenaMode === 'combatDisabled'
    )
      return;

    setIsClashing(true);
    setBattleLog("[ ERR: DATA COLLISION DETECTED ]");

    setTimeout(() => {
      const result = resolveBattleWithEngine(
        p1,
        p2,
        arenaMode,
        arenaRuleset
      );
      setBattleLog(result.logLine);
      setIsClashing(false);
    }, 600);
  };

  const clearArena = () => {
    if (isClashing) return;
    const activeRuleset = rulesets[arenaRuleset] || rulesets.standard;
    const clearedSlots = {};
    activeRuleset.zones.forEach(z => {
      clearedSlots[z.id] = null;
    });
    setArenaSlots(clearedSlots);
    setBattleLog(
      arenaMode === 'combatDisabled'
        ? '> SYSTEMS IN HARMONY. NO CLASH POSSIBLE.'
        : '[ ARENA WIPED ]',
    );
  };

  const handleDrawSpread = () => {
    let cardCount = 3;
    if (oracleLayout === 'celticCross') {
      cardCount = 5;
    } else if (['mtg', 'yugioh', 'pokemon'].includes(oracleLayout)) {
      cardCount = 4;
    }
    setSpread(drawSpread(deck, cardCount));
    setRevealedCardIds([]); // Reset reveals on new draw
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForgeData(prev => ({ ...prev, customImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveForgeCard = () => {
    compileForgeCard(forgeData);
    setView('dex');
    setForgeData((prev) => ({
      ...prev,
      name: 'Next Entity',
      customImage: null,
      hideStats: false,
      hideDesc: false,
      frame: 'standard',
      hat: 'none',
      rarity: 'common',
      ability: 'none',
    }));
  };

  // --- VIEWS ---
  const renderDexView = () => (
    <div data-testid="aether-view-dex" className="p-4 space-y-6 pb-24">
      {/* Deck Management Bar */}
      <div className="bg-slate-900/80 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Layers className="text-indigo-400" size={20} />
          {editingDeckId === activeDeckId ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editingDeckName}
                onChange={(e) => setEditingDeckName(e.target.value)}
                className="bg-slate-950 border border-white/20 rounded px-2 py-1 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => {
                  renameDeck(activeDeckId, editingDeckName);
                  setEditingDeckId(null);
                }}
                className="p-1 bg-emerald-600/30 border border-emerald-500 text-emerald-400 rounded hover:bg-emerald-600 hover:text-white transition-colors"
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <select
                data-testid="aether-deck-select"
                value={activeDeckId}
                onChange={(e) => switchDeck(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name.toUpperCase()}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setEditingDeckId(activeDeckId);
                  setEditingDeckName(
                    decks.find((d) => d.id === activeDeckId).name,
                  );
                }}
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded transition-colors"
                title="Rename Deck"
              >
                <Edit3 size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {showCreateDeckInput ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="DECK NAME"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                className="bg-slate-950 border border-white/20 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => {
                  if (newDeckName.trim()) {
                    createDeck(newDeckName.trim());
                    setNewDeckName('');
                    setShowCreateDeckInput(false);
                  }
                }}
                className="p-1 bg-emerald-600/30 border border-emerald-500 text-emerald-400 rounded hover:bg-emerald-600 hover:text-white transition-colors"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => setShowCreateDeckInput(false)}
                className="p-1 bg-red-600/30 border border-red-500 text-red-400 rounded hover:bg-red-600 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateDeckInput(true)}
              className="flex items-center gap-1.5 bg-indigo-950/40 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white text-indigo-300 px-3 py-1.5 rounded font-mono text-xs tracking-wider transition-all"
            >
              <Plus size={14} /> NEW_DECK
            </button>
          )}

          <button
            onClick={() => duplicateDeck(activeDeckId)}
            className="flex items-center gap-1.5 bg-indigo-950/40 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white text-indigo-300 px-3 py-1.5 rounded font-mono text-xs tracking-wider transition-all"
          >
            <Copy size={14} /> CLONE_DECK
          </button>

          <button
            onClick={() => deleteDeck(activeDeckId)}
            disabled={decks.length <= 1}
            className="flex items-center gap-1.5 bg-red-950/40 border border-red-500/30 hover:bg-red-600 hover:text-white text-red-300 px-3 py-1.5 rounded font-mono text-xs tracking-wider transition-all disabled:opacity-35 disabled:pointer-events-none"
          >
            <Trash2 size={14} /> DELETE_DECK
          </button>

          <button
            onClick={() => setShowDeckBacks(!showDeckBacks)}
            className={`flex items-center gap-1.5 border px-3 py-1.5 rounded font-mono text-xs tracking-wider transition-all ${showDeckBacks ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-950 border-white/10 hover:bg-white/5 text-white/70'}`}
          >
            {showDeckBacks ? <EyeOff size={14} /> : <Eye size={14} />}{' '}
            CARD_BACKS
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {deck.map((card) => (
          <div
            key={card.id}
            className="flex justify-center transform hover:-translate-y-2 transition-transform duration-300"
          >
            <Card
              data={card}
              isFlipped={!showDeckBacks}
              onClick={() => {
                setSelectedCard(card);
                setModalCardFlipped(true);
              }}
              deckBack={deckBack}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderArenaZone = (zone) => {
    const card = arenaSlots[zone.id];
    const isOver = dragOverSlot === zone.id;
    const isFlipped = card ? (zone.isFaceDown ? revealedCardIds.includes(card.id) : true) : false;
    const activeRuleset = rulesets[arenaRuleset] || rulesets.standard;

    return (
      <div
        key={zone.id}
        className={`flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all ${isOver ? 'border-indigo-500 bg-indigo-500/10 scale-105 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'border-transparent'}`}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setDragOverSlot(zone.id)}
        onDragLeave={() => setDragOverSlot(null)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOverSlot(null);
          const cardId = e.dataTransfer.getData('text/plain');
          const foundCard = deck.find((c) => c.id === cardId);
          if (foundCard) {
            // Validate banlist at boundary
            if (activeRuleset.bannedCardIds.includes(foundCard.id)) {
              setBattleLog(`[ ERR: CARD ${foundCard.id} BANNED IN ${activeRuleset.name.toUpperCase()} ]`);
              if (telemetry) {
                telemetry.log('warn', 'CARD_BAN_VIOLATION', { cardId: foundCard.id, rulesetId: activeRuleset.id });
              }
              return;
            }

            setArenaSlots((prev) => ({ ...prev, [zone.id]: foundCard }));
            setBattleLog(`[ ${zone.label.toUpperCase()} FILLED ]`);
          }
        }}
      >
        <span className="text-[9px] font-mono text-white/40 tracking-widest uppercase border border-white/10 bg-black/50 px-2.5 py-0.5 rounded-full text-center">
          {zone.label}
        </span>
        {card ? (
          <Card
            data={card}
            isFlipped={isFlipped}
            size={zone.size || 'sm'}
            clashing={isClashing && (activeRuleset.clashSlots || []).includes(zone.id)}
            onClick={() => {
              if (zone.isFaceDown && !isFlipped) {
                setRevealedCardIds((prev) => [...prev, card.id]);
              } else {
                setArenaSlots((prev) => ({ ...prev, [zone.id]: null }));
              }
            }}
            deckBack={deckBack}
          />
        ) : (
          <div
            className={`rounded-xl border-2 border-dashed border-indigo-500/20 bg-indigo-900/5 flex items-center justify-center text-indigo-400/20 font-mono text-xs text-center ${zone.size === 'sm' ? 'w-24 h-40' : 'w-64 h-[28rem]'}`}
          >
            DROP_HERE
          </div>
        )}
      </div>
    );
  };

  const renderArenaView = () => {
    const activeRuleset = rulesets[arenaRuleset] || rulesets.standard;
    const p2Zones = activeRuleset.zones.filter((z) => z.player === 2);
    const p1Zones = activeRuleset.zones.filter((z) => z.player === 1);
    const globalZones = activeRuleset.zones.filter((z) => z.scope === 'global');
    const clashSlots = activeRuleset.clashSlots;
    const p1ClashCard = arenaSlots[clashSlots[0]];
    const p2ClashCard = arenaSlots[clashSlots[1]];

    return (
      <div
        data-testid="aether-view-arena"
        className="flex flex-col h-full p-4 max-w-6xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-light text-indigo-300 glitch-text tracking-widest">
            THE ARENA
          </h2>
          <p className="text-white/40 font-mono text-[10px]">
            {activeRuleset.name.toUpperCase()} ACTIVE
          </p>
        </div>

        {/* Playmat Grid */}
        <div className="flex-1 flex flex-col gap-6 bg-slate-950/40 p-6 rounded-2xl border border-white/5 shadow-inner">
          {/* Player 2 (Top) Zones */}
          {p2Zones.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-4 border-b border-white/5 pb-4">
              {p2Zones.map(renderArenaZone)}
            </div>
          )}

          {/* Middle Row: Global Zones + Console + Player 1/2 Standard Slots */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            {/* Global Zones */}
            {globalZones.length > 0 && (
              <div className="flex flex-col gap-4">
                {globalZones.map(renderArenaZone)}
              </div>
            )}

            {/* Standard Slots (when no player-specific zones exist, e.g. Standard ruleset) */}
            {p2Zones.length === 0 && p1Zones.length === 0 && (
              <div className="flex items-center gap-6">
                {renderArenaZone(activeRuleset.zones[0])}
                {renderArenaZone(activeRuleset.zones[1])}
              </div>
            )}

            {/* Console / Controls */}
            <div className="flex flex-col items-center gap-4 z-10 w-full md:w-auto bg-black/40 p-4 rounded-xl border border-white/5">
              <div
                className={`w-full md:min-w-[240px] bg-black/80 backdrop-blur p-4 rounded border ${isClashing ? 'border-red-500 text-red-500' : 'border-white/10 text-indigo-300'} text-center transition-colors`}
                data-testid="aether-arena-log"
              >
                <p
                  className={`text-xs font-mono uppercase tracking-wider ${isClashing ? 'glitch-hover animate-pulse' : ''}`}
                >
                  {battleLog}
                </p>
              </div>

              {/* Arena Ruleset Selector */}
              <div className="w-full md:min-w-[240px] flex flex-col gap-1">
                <label className="text-[9px] font-mono text-indigo-400/70 uppercase tracking-widest text-center">
                  Ruleset
                </label>
                <select
                  data-testid="aether-arena-ruleset-select"
                  value={arenaRuleset}
                  onChange={(e) => {
                    setArenaRuleset(e.target.value);
                  }}
                  className="w-full bg-slate-900/80 border border-white/10 rounded px-3 py-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-indigo-500 text-center appearance-none cursor-pointer"
                >
                  {Object.values(rulesets).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Arena Mode Selector */}
              <div className="w-full md:min-w-[240px] flex flex-col gap-1">
                <label className="text-[9px] font-mono text-indigo-400/70 uppercase tracking-widest text-center">
                  Arena Mode
                </label>
                <select
                  data-testid="aether-arena-mode-select"
                  value={arenaMode}
                  onChange={(e) => {
                    const selectedMode = e.target.value;
                    setArenaMode(selectedMode);
                    if (selectedMode === 'combatDisabled') {
                      setBattleLog('> SYSTEMS IN HARMONY. NO CLASH POSSIBLE.');
                    } else {
                      setBattleLog(
                        p1ClashCard && p2ClashCard
                          ? '[ READY FOR COLLISION ]'
                          : '[ WAITING FOR DATA INPUT ]',
                      );
                    }
                  }}
                  className="w-full bg-slate-900/80 border border-white/10 rounded px-3 py-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-indigo-500 text-center appearance-none cursor-pointer"
                >
                  {Object.values(arenaModes).map((mode) => (
                    <option key={mode.id} value={mode.id}>
                      {mode.name.toUpperCase()}
                    </option>
                  ))}
                </select>
                <p className="text-[8px] font-mono text-white/30 text-center max-w-[240px]">
                  {arenaModes[arenaMode]?.description}
                </p>
              </div>

              <button
                type="button"
                data-testid="aether-arena-clash"
                onClick={handleResolveBattle}
                disabled={
                  !p1ClashCard ||
                  !p2ClashCard ||
                  isClashing ||
                  arenaMode === 'combatDisabled'
                }
                className={`w-full md:w-auto px-6 py-2 rounded-none border border-transparent font-bold tracking-widest text-xs transition-all ${
                  isClashing
                    ? 'bg-white text-black animate-pulse'
                    : !p1ClashCard ||
                        !p2ClashCard ||
                        arenaMode === 'combatDisabled'
                      ? 'bg-slate-800 text-white/30 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:border-red-400'
                }`}
              >
                {isClashing
                  ? 'PROCESSING...'
                  : arenaMode === 'combatDisabled'
                    ? 'COMBAT DISABLED'
                    : 'INITIATE CLASH'}
              </button>

              <button
                type="button"
                data-testid="aether-arena-flush"
                onClick={clearArena}
                className="text-[9px] font-mono text-white/40 hover:text-white uppercase tracking-widest hover:bg-white/5 px-2 py-0.5 rounded"
              >
                Flush_Memory
              </button>
            </div>
          </div>

          {/* Player 1 (Bottom) Zones */}
          {p1Zones.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-4 border-t border-white/5 pt-4">
              {p1Zones.map(renderArenaZone)}
            </div>
          )}
        </div>

        {/* Bench / Deck Drawer */}
        <div className="mt-auto pt-4 border-t border-white/10 bg-black/20 rounded-xl p-4">
          <p className="text-[10px] text-white/30 font-mono text-center mb-2 uppercase tracking-widest">
            Local_Storage_Array (Drag Cards to Slots)
          </p>
          <div className="overflow-x-auto hide-scrollbar flex items-center gap-4 px-4 pb-4 [mask-image:linear-gradient(to_right,black_90%,transparent_100%)]">
            {deck.map((card) => {
              const isPlaced = Object.values(arenaSlots).some((slotCard) => slotCard?.id === card.id);
              return (
                <div
                  key={card.id}
                  draggable={!isPlaced}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', card.id);
                  }}
                  className={`shrink-0 scale-75 origin-bottom hover:scale-90 transition-transform cursor-grab active:cursor-grabbing ${isPlaced ? 'opacity-20 pointer-events-none' : ''}`}
                >
                  <Card
                    data={card}
                    isFlipped={true}
                    onClick={() => handleArenaSelect(card)}
                    size="sm"
                    deckBack={deckBack}
                  />
                </div>
              );
            })}
            <div className="w-12 shrink-0" /> {/* Spacer for scroll mask */}
          </div>
        </div>
      </div>
    );
  };

  const handleDropOnOracleZone = (cardId, zoneIndex) => {
    const foundCard = deck.find((c) => c.id === cardId);
    if (foundCard) {
      setSpread((prev) => {
        const next = [...prev];
        while (next.length <= zoneIndex) {
          next.push(null);
        }
        next[zoneIndex] = foundCard;
        return next;
      });
      // Automatically reveal dragged cards
      setRevealedCardIds((prev) => [...prev, foundCard.id]);
    }
  };

  const renderOracleZone = (
    card,
    label,
    index,
    size = 'md',
    extraClasses = '',
  ) => {
    const isOver = oracleDragOverZone === index;
    const isFlipped = card ? revealedCardIds.includes(card.id) : false;

    return (
      <div
        className={`flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all ${isOver ? 'border-indigo-500 bg-indigo-500/10 scale-105 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'border-transparent'} ${extraClasses}`}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setOracleDragOverZone(index)}
        onDragLeave={() => setOracleDragOverZone(null)}
        onDrop={(e) => {
          e.preventDefault();
          setOracleDragOverZone(null);
          const cardId = e.dataTransfer.getData('text/plain');
          handleDropOnOracleZone(cardId, index);
        }}
      >
        <span className="text-[9px] font-mono text-white/40 tracking-widest uppercase border border-white/10 bg-black/50 px-2.5 py-0.5 rounded-full text-center">
          {label}
        </span>
        {card ? (
          <Card
            data={card}
            isFlipped={isFlipped}
            size={size}
            deckBack={deckBack}
            onClick={() => {
              if (!isFlipped) {
                setRevealedCardIds((prev) => [...prev, card.id]);
              }
            }}
          />
        ) : (
          <div
            className={`rounded-xl border-2 border-dashed border-indigo-500/20 bg-indigo-900/5 flex items-center justify-center text-indigo-400/20 font-mono text-xs text-center ${size === 'sm' ? 'w-24 h-40' : 'w-64 h-[28rem]'}`}
          >
            DROP_HERE
          </div>
        )}
      </div>
    );
  };

  const renderOracleView = () => (
    <div
      data-testid="aether-view-oracle"
      className="flex flex-col items-center justify-center min-h-[80vh] gap-8 p-4"
    >
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-light text-indigo-300 glitch-text tracking-widest">
          THE ORACLE
        </h2>
        <p className="text-white/40 font-mono text-xs max-w-md mx-auto">
          Accessing probabilistic timelines...
        </p>
      </div>

      {/* Oracle Layout Selector */}
      <div className="w-full max-w-[240px] flex flex-col gap-1.5">
        <label className="text-[10px] font-mono text-indigo-400/70 uppercase tracking-widest text-center">
          Spread Layout
        </label>
        <select
          data-testid="aether-oracle-layout-select"
          value={oracleLayout}
          onChange={(e) => {
            setOracleLayout(e.target.value);
            setSpread([]);
            setRevealedCardIds([]);
          }}
          className="w-full bg-slate-900/80 border border-white/10 rounded px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500 text-center appearance-none cursor-pointer"
        >
          <option value="threeCard">PAST / PRESENT / FUTURE (3 CARDS)</option>
          <option value="celticCross">CELTIC CROSS (5 CARDS)</option>
          <option value="theClash">THE CLASH (3 CARDS)</option>
        </select>
      </div>

      {/* Dynamic Layout Rendering */}
      <div className="my-4">
        {spread.length > 0 ? (
          // Render Active Spread
          oracleLayout === 'threeCard' ? (
            <div className="flex flex-col md:flex-row gap-8 lg:gap-12 perspective-1000">
              {renderOracleZone(spread[0], 'T-Minus (Past)', 0, 'md')}
              {renderOracleZone(spread[1], 'T-Zero (Present)', 1, 'md')}
              {renderOracleZone(spread[2], 'T-Plus (Future)', 2, 'md')}
            </div>
          ) : oracleLayout === 'celticCross' ? (
            <div className="flex flex-col md:grid md:grid-cols-3 gap-8 items-center justify-items-center max-w-4xl">
              {/* Row 1: Goal */}
              <div></div>
              {renderOracleZone(spread[2], 'Goal', 2, 'sm')}
              <div></div>

              {/* Row 2: Past, Present/Obstacle, Future */}
              {renderOracleZone(spread[3], 'Past', 3, 'sm')}
              <div
                className={`relative w-24 h-40 flex items-center justify-center rounded-xl border-2 transition-all ${oracleDragOverZone === 0 || oracleDragOverZone === 1 ? 'border-indigo-500 bg-indigo-500/10 scale-105 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'border-transparent'}`}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => setOracleDragOverZone(0)}
                onDragLeave={() => setOracleDragOverZone(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setOracleDragOverZone(null);
                  const cardId = e.dataTransfer.getData('text/plain');
                  if (!spread[0]) {
                    handleDropOnOracleZone(cardId, 0);
                  } else {
                    handleDropOnOracleZone(cardId, 1);
                  }
                }}
              >
                {/* Under card (Present) */}
                <div className="absolute z-10">
                  {spread[0] ? (
                    <Card
                      data={spread[0]}
                      isFlipped={revealedCardIds.includes(spread[0].id)}
                      size="sm"
                      deckBack={deckBack}
                      onClick={() => {
                        if (!revealedCardIds.includes(spread[0].id)) {
                          setRevealedCardIds((prev) => [...prev, spread[0].id]);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-24 h-40 rounded-xl border-2 border-dashed border-indigo-500/20 bg-indigo-900/5 flex items-center justify-center text-indigo-400/20 font-mono text-[10px]">
                      PRESENT
                    </div>
                  )}
                </div>
                {/* Cross card (Obstacle) - rotated 90 degrees */}
                <div className="absolute z-20 rotate-90 opacity-90 scale-95">
                  {spread[1] ? (
                    <Card
                      data={spread[1]}
                      isFlipped={revealedCardIds.includes(spread[1].id)}
                      size="sm"
                      deckBack={deckBack}
                      onClick={() => {
                        if (!revealedCardIds.includes(spread[1].id)) {
                          setRevealedCardIds((prev) => [...prev, spread[1].id]);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-24 h-40 rounded-xl border-2 border-dashed border-indigo-500/20 bg-indigo-900/5 flex items-center justify-center text-indigo-400/20 font-mono text-[10px]">
                      OBSTACLE
                    </div>
                  )}
                </div>
              </div>
              {renderOracleZone(spread[4], 'Future', 4, 'sm')}

              {/* Row 3: Label */}
              <div></div>
              <div className="text-center text-[9px] font-mono text-indigo-400/60 uppercase tracking-widest">
                Present (Under) / Obstacle (Cross)
              </div>
              <div></div>
            </div>
          ) : (
            <div className="flex flex-col gap-8 items-center">
              <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
                {renderOracleZone(spread[0], 'Alpha (Thesis)', 0, 'md')}
                {renderOracleZone(spread[1], 'Omega (Antithesis)', 1, 'md')}
              </div>
              {renderOracleZone(spread[2], 'Synthesis (Outcome)', 2, 'md')}
            </div>
          )
        ) : // Render Placeholders
        oracleLayout === 'celticCross' ? (
          <div className="grid grid-cols-3 gap-8 items-center justify-items-center opacity-30 max-w-4xl">
            <div></div>
            <div className="w-24 h-40 rounded-xl bg-slate-800/50 border border-white/10 border-dashed"></div>
            <div></div>
            <div className="w-24 h-40 rounded-xl bg-slate-800/50 border border-white/10 border-dashed"></div>
            <div className="w-24 h-40 rounded-xl bg-slate-800/50 border border-white/10 border-dashed"></div>
            <div className="w-24 h-40 rounded-xl bg-slate-800/50 border border-white/10 border-dashed"></div>
          </div>
        ) : oracleLayout === 'theClash' ? (
          <div className="flex flex-col gap-8 items-center opacity-30">
            <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
              <div className="w-64 h-[28rem] rounded-xl bg-slate-800/50 border border-white/10 border-dashed"></div>
              <div className="w-64 h-[28rem] rounded-xl bg-slate-800/50 border border-white/10 border-dashed"></div>
            </div>
            <div className="w-64 h-[28rem] rounded-xl bg-slate-800/50 border border-white/10 border-dashed"></div>
          </div>
        ) : (
          <div className="flex gap-8 lg:gap-12 opacity-30">
            <div className="w-64 h-[28rem] rounded-xl bg-slate-800/50 border border-white/10 border-dashed"></div>
            <div className="w-64 h-[28rem] rounded-xl bg-slate-800/50 border border-white/10 border-dashed hidden md:block"></div>
            <div className="w-64 h-[28rem] rounded-xl bg-slate-800/50 border border-white/10 border-dashed hidden md:block"></div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        {spread.length > 0 &&
          revealedCardIds.length < spread.filter(Boolean).length && (
            <button
              type="button"
              onClick={() =>
                setRevealedCardIds(spread.filter(Boolean).map((c) => c.id))
              }
              className="flex items-center gap-2 bg-emerald-900/50 border border-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded font-mono text-sm tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95"
            >
              <Eye size={16} /> REVEAL ALL
            </button>
          )}
        <button
          type="button"
          data-testid="aether-oracle-draw"
          onClick={handleDrawSpread}
          className="flex items-center gap-2 bg-indigo-900/50 border border-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded font-mono text-sm tracking-widest shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all active:scale-95 group"
        >
          <Shuffle size={16} className="group-hover:animate-spin" />
          {spread.length > 0 ? 'RECALCULATE' : 'INITIALIZE SEQUENCE'}
        </button>
      </div>

      {/* Deck Drawer (Bench) */}
      <div className="w-full mt-8 pt-4 border-t border-white/10 bg-black/20 rounded-xl p-4">
        <p className="text-[10px] text-white/30 font-mono text-center mb-2 uppercase tracking-widest">
          Deck Drawer — Drag Cards onto Playmat Zones
        </p>
        <div className="overflow-x-auto hide-scrollbar flex items-center gap-4 px-4 pb-4 [mask-image:linear-gradient(to_right,black_90%,transparent_100%)]">
          {deck.map((card) => {
            const isPlaced = spread.some((c) => c && c.id === card.id);
            return (
              <div
                key={card.id}
                draggable={!isPlaced}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', card.id);
                }}
                className={`shrink-0 scale-75 origin-bottom hover:scale-90 transition-transform ${isPlaced ? 'opacity-20 pointer-events-none' : 'cursor-grab active:cursor-grabbing'}`}
              >
                <Card
                  data={card}
                  isFlipped={true}
                  size="sm"
                  deckBack={deckBack}
                />
              </div>
            );
          })}
          <div className="w-12 shrink-0" /> {/* Spacer for scroll mask */}
        </div>
      </div>
    </div>
  );

  const renderForgeView = () => (
    <div
      data-testid="aether-view-forge"
      className="flex flex-col lg:flex-row items-start justify-center gap-8 lg:gap-16 p-4 md:p-8 max-w-6xl mx-auto min-h-[80vh]"
    >
      <div className="flex flex-col items-center gap-6 lg:sticky lg:top-24 order-1 lg:order-2 w-full lg:w-auto">
        <div className="bg-emerald-900/20 border border-emerald-500/30 px-4 py-1 rounded text-emerald-400 font-mono text-[10px] tracking-widest uppercase flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Live Preview
        </div>
        <Card data={forgeData} isFlipped={true} deckBack={deckBack} />
        <button
          type="button"
          data-testid="aether-forge-compile"
          onClick={saveForgeCard}
          className="w-64 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded font-bold font-mono text-sm tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all active:scale-95 hover:border-emerald-300 border border-transparent"
        >
          <Save size={18} /> COMPILE ENTITY
        </button>
      </div>

      <div className="w-full max-w-md space-y-8 bg-black/60 backdrop-blur-md p-6 md:p-8 rounded-xl border border-white/10 order-2 lg:order-1 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <Hammer className="text-emerald-400" />
          <h2 className="text-xl font-light tracking-widest uppercase glitch-text">
            The Forge
          </h2>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-mono text-emerald-500/70 mb-2 uppercase tracking-widest">
              Entity Designation
            </label>
            <input
              type="text"
              value={forgeData.name}
              onChange={(e) =>
                setForgeData({ ...forgeData, name: e.target.value })
              }
              className="w-full bg-slate-900/50 border border-white/10 rounded px-3 py-3 text-white font-bold focus:outline-none focus:border-emerald-500 focus:bg-slate-800 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-emerald-500/70 mb-2 uppercase tracking-widest">
              Archetype Class
            </label>
            <input
              type="text"
              value={forgeData.sub}
              onChange={(e) =>
                setForgeData({ ...forgeData, sub: e.target.value })
              }
              className="w-full bg-slate-900/50 border border-white/10 rounded px-3 py-3 text-white focus:outline-none focus:border-emerald-500 focus:bg-slate-800 transition-colors text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono text-emerald-500/70 mb-2 uppercase tracking-widest">
              Elemental Core
            </label>
            <select
              value={forgeData.type}
              onChange={(e) =>
                setForgeData({ ...forgeData, type: e.target.value })
              }
              className="w-full bg-slate-900/50 border border-white/10 rounded px-3 py-3 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 appearance-none"
            >
              {['void', 'fire', 'water', 'electric', 'wind', 'dark'].map(
                (t) => (
                  <option key={t} value={t}>
                    {t.toUpperCase()}
                  </option>
                ),
              )}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono text-emerald-500/70 mb-2 uppercase tracking-widest">
              Visual Sigil
            </label>
            <select
              value={forgeData.icon}
              onChange={(e) =>
                setForgeData({ ...forgeData, icon: e.target.value })
              }
              className="w-full bg-slate-900/50 border border-white/10 rounded px-3 py-3 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 appearance-none"
            >
              {[
                'Sparkles',
                'Flame',
                'Droplets',
                'Zap',
                'Skull',
                'Wind',
                'Eye',
                'Star',
                'Sword',
                'Shield',
                'Hammer',
              ].map((k) => (
                <option key={k} value={k}>
                  {k.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono text-emerald-500/70 mb-2 uppercase tracking-widest">
              Card Frame
            </label>
            <select
              data-testid="aether-forge-frame"
              value={forgeData.frame || 'standard'}
              onChange={(e) =>
                setForgeData({ ...forgeData, frame: e.target.value })
              }
              className="w-full bg-slate-900/50 border border-white/10 rounded px-3 py-3 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 appearance-none"
            >
              <option value="standard">STANDARD</option>
              <option value="neonGlow">NEON GLOW</option>
              <option value="goldFoil">GOLD FOIL</option>
              <option value="glitchMatrix">GLITCH MATRIX</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono text-emerald-500/70 mb-2 uppercase tracking-widest">
              Accessory / Hat
            </label>
            <select
              data-testid="aether-forge-hat"
              value={forgeData.hat || 'none'}
              onChange={(e) =>
                setForgeData({ ...forgeData, hat: e.target.value })
              }
              className="w-full bg-slate-900/50 border border-white/10 rounded px-3 py-3 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 appearance-none"
            >
              <option value="none">NONE</option>
              <option value="cyberCrown">CYBER CROWN</option>
              <option value="glitchHalo">GLITCH HALO</option>
              <option value="retroVisor">RETRO VISOR</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono text-emerald-500/70 mb-2 uppercase tracking-widest">
              Card Rarity
            </label>
            <select
              data-testid="aether-forge-rarity"
              value={forgeData.rarity || 'common'}
              onChange={(e) =>
                setForgeData({ ...forgeData, rarity: e.target.value })
              }
              className="w-full bg-slate-900/50 border border-white/10 rounded px-3 py-3 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 appearance-none"
            >
              <option value="common">COMMON</option>
              <option value="rare">RARE</option>
              <option value="ultra-rare">ULTRA-RARE</option>
              <option value="glitched">GLITCHED</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono text-emerald-500/70 mb-2 uppercase tracking-widest">
              Active Ability
            </label>
            <select
              data-testid="aether-forge-ability"
              value={forgeData.ability || 'none'}
              onChange={(e) =>
                setForgeData({ ...forgeData, ability: e.target.value })
              }
              className="w-full bg-slate-900/50 border border-white/10 rounded px-3 py-3 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 appearance-none"
            >
              <option value="none">NONE</option>
              <option value="overdrive">OVERDRIVE</option>
              <option value="ironWall">IRON WALL</option>
              <option value="voidShield">VOID SHIELD</option>
            </select>
          </div>
        </div>

        <div className="space-y-6 bg-slate-900/50 border border-white/5 p-5 rounded-lg">
          <NeonSlider
            label="ATK_POTENTIAL"
            value={forgeData.stats.atk}
            color="red"
            onChange={(v) =>
              setForgeData({
                ...forgeData,
                stats: { ...forgeData.stats, atk: v },
              })
            }
          />
          <NeonSlider
            label="DEF_RESILIENCE"
            value={forgeData.stats.def}
            color="indigo"
            onChange={(v) =>
              setForgeData({
                ...forgeData,
                stats: { ...forgeData.stats, def: v },
              })
            }
          />
          <NeonSlider
            label="SPD_AGILITY"
            value={forgeData.stats.spd}
            color="emerald"
            onChange={(v) =>
              setForgeData({
                ...forgeData,
                stats: { ...forgeData.stats, spd: v },
              })
            }
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono text-emerald-500/70 mb-2 uppercase tracking-widest">
            Lore Injection
          </label>
          <textarea
            rows="3"
            value={forgeData.desc}
            onChange={(e) =>
              setForgeData({ ...forgeData, desc: e.target.value })
            }
            className="w-full bg-slate-900/50 border border-white/10 rounded px-3 py-3 text-white/70 text-sm italic font-serif focus:outline-none focus:border-emerald-500 transition-colors resize-none"
          />
        </div>

        <div className="border-t border-white/10 pt-5 space-y-4">
          <label className="block text-[10px] font-mono text-emerald-500/70 uppercase tracking-widest">
            Presentation Override
          </label>

          <div className="flex gap-4">
            <button
              onClick={() =>
                setForgeData({ ...forgeData, hideDesc: !forgeData.hideDesc })
              }
              className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded font-mono text-xs transition-colors ${forgeData.hideDesc ? 'border-red-500/50 text-red-400 bg-red-900/20' : 'border-white/10 text-white/50 hover:border-emerald-500/50 hover:text-emerald-400'}`}
            >
              {forgeData.hideDesc ? <EyeOff size={14} /> : <Eye size={14} />}{' '}
              {forgeData.hideDesc ? 'LORE HIDDEN' : 'LORE VISIBLE'}
            </button>
            <button
              onClick={() =>
                setForgeData({ ...forgeData, hideStats: !forgeData.hideStats })
              }
              className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded font-mono text-xs transition-colors ${forgeData.hideStats ? 'border-red-500/50 text-red-400 bg-red-900/20' : 'border-white/10 text-white/50 hover:border-emerald-500/50 hover:text-emerald-400'}`}
            >
              {forgeData.hideStats ? <EyeOff size={14} /> : <Eye size={14} />}{' '}
              {forgeData.hideStats ? 'STATS HIDDEN' : 'STATS VISIBLE'}
            </button>
          </div>

          <div>
            <label className="flex items-center justify-center gap-2 w-full bg-slate-900/50 border border-dashed border-emerald-500/30 hover:border-emerald-500 rounded px-3 py-4 text-emerald-400/70 hover:text-emerald-400 font-mono text-xs cursor-pointer transition-colors">
              <Upload size={16} />
              {forgeData.customImage
                ? 'REPLACE CUSTOM ARTWORK'
                : 'UPLOAD CUSTOM ARTWORK'}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            {forgeData.customImage && (
              <button
                onClick={() =>
                  setForgeData({ ...forgeData, customImage: null })
                }
                className="w-full mt-2 text-center text-[10px] font-mono text-red-400/70 hover:text-red-400 uppercase tracking-widest"
              >
                Remove Artwork
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      data-testid="aether-root"
      className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden"
    >
      <GlitchStyles />
      <div className="noise-overlay"></div>
      <div className="crt-overlay"></div>

      {/* Settings Modal */}
      {showSettings && (
        <div
          data-testid="aether-modal-settings"
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div
            data-testid="aether-modal-settings-panel"
            className="bg-slate-900 border border-white/20 p-6 md:p-8 rounded-xl max-w-sm w-full shadow-2xl space-y-8 relative"
          >
            <button
              type="button"
              data-testid="aether-settings-close"
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <X size={24} />
            </button>
            <div>
              <h3 className="text-xl font-light tracking-widest glitch-text mb-1">
                SYSTEM_CFG
              </h3>
              <p className="text-xs font-mono text-white/40">
                Adjust UI degradation levels
              </p>
            </div>
            <div className="space-y-6">
              <NeonSlider
                label="GLITCH_INTENSITY"
                value={aesthetics.glitch}
                color="indigo"
                onChange={(v) => setAesthetics((s) => ({ ...s, glitch: v }))}
              />
              <NeonSlider
                label="CRT_SCANLINES"
                value={aesthetics.crt}
                color="emerald"
                onChange={(v) => setAesthetics((s) => ({ ...s, crt: v }))}
              />
              <NeonSlider
                label="GRAIN_NOISE"
                value={aesthetics.noise}
                color="red"
                onChange={(v) => setAesthetics((s) => ({ ...s, noise: v }))}
              />

              {/* Deck Back Selector */}
              <div className="flex flex-col gap-1.5 border-t border-white/10 pt-4">
                <label className="text-[10px] font-mono text-indigo-400/70 uppercase tracking-widest text-center">
                  Active Deck Back
                </label>
                <select
                  data-testid="aether-settings-deckback"
                  value={deckBack}
                  onChange={(e) => setDeckBack(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500 text-center appearance-none cursor-pointer"
                >
                  <option value="standard">STANDARD</option>
                  <option value="cyberpunkGrid">CYBERPUNK GRID</option>
                  <option value="voidVortex">VOID VORTEX</option>
                  <option value="goldenAether">GOLDEN AETHER</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav
        data-testid="aether-nav"
        className="fixed bottom-0 md:top-0 md:bottom-auto w-full z-50 bg-black/80 backdrop-blur-xl border-t md:border-b md:border-t-0 border-white/10 px-4 pt-3 pb-[calc(1.5rem+var(--safe-area-inset-bottom))] md:py-3 shadow-2xl"
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0">
          <div className="flex w-full md:w-auto justify-between items-center">
            <div className="flex items-center gap-2 group cursor-pointer">
              <Layers className="text-indigo-500 group-hover:animate-spin" />
              <span className="font-bold tracking-tighter text-xl glitch-hover">
                GLITCH<span className="font-light text-white/50">WORKS</span>
              </span>
            </div>
            <button
              type="button"
              data-testid="aether-settings-open"
              onClick={() => setShowSettings(true)}
              className="md:hidden text-white/50 hover:text-indigo-400 p-2"
            >
              <Settings size={20} />
            </button>
          </div>

          <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-2">
            {/* Scroll mask for mobile */}
            <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-full overflow-x-auto hide-scrollbar flex-nowrap w-full md:w-auto [mask-image:linear-gradient(to_right,black_85%,transparent_100%)] md:[mask-image:none]">
              {[
                { id: 'dex', icon: LayoutGrid, color: 'indigo' },
                { id: 'arena', icon: Sword, color: 'red' },
                { id: 'oracle', icon: Sparkles, color: 'purple' },
                { id: 'forge', icon: Hammer, color: 'emerald' },
              ].map((btn) => (
                <button
                  type="button"
                  data-testid={`aether-nav-${btn.id}`}
                  key={btn.id}
                  onClick={() => setView(btn.id)}
                  className={`shrink-0 px-4 md:px-5 py-2.5 rounded-full text-xs font-mono uppercase tracking-widest transition-all flex items-center gap-2 border ${
                    view === btn.id
                      ? `bg-${btn.color}-600/20 border-${btn.color}-500/50 text-${btn.color}-300 shadow-[0_0_15px_rgba(var(--tw-colors-${btn.color}-500),0.3)]`
                      : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <btn.icon
                    size={14}
                    className={view === btn.id ? 'animate-pulse' : ''}
                  />
                  <span>{btn.id}</span>
                </button>
              ))}
              <div className="w-8 shrink-0 md:hidden" />{' '}
              {/* Spacer to allow full scroll visibility */}
            </div>

            <button
              type="button"
              data-testid="aether-settings-open-desktop"
              onClick={() => setShowSettings(true)}
              className="hidden md:flex text-white/40 hover:text-indigo-400 p-2 ml-2 bg-slate-900/50 rounded-full border border-transparent hover:border-white/10 transition-colors"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </nav>

      <main
        data-testid="aether-main"
        className="relative z-10 pt-4 md:pt-28 pb-32 md:pb-12 max-w-6xl mx-auto min-h-screen"
      >
        {view === 'dex' && renderDexView()}
        {view === 'arena' && renderArenaView()}
        {view === 'oracle' && renderOracleView()}
        {view === 'forge' && renderForgeView()}
      </main>

      {/* Card Details Modal */}
      {selectedCard && view === 'dex' && (
        <div
          data-testid="aether-modal-card"
          className="fixed inset-0 z-[900] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="relative transform transition-transform animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              data-testid="aether-modal-card-close"
              className="absolute -top-16 right-0 text-white/50 hover:text-white transition-colors bg-white/5 p-2 rounded-full border border-white/10"
              onClick={() => setSelectedCard(null)}
            >
              <X size={24} />
            </button>
            <Card
              data={selectedCard}
              isFlipped={modalCardFlipped}
              size="lg"
              deckBack={deckBack}
              onClick={() => setModalCardFlipped(!modalCardFlipped)}
            />
            <p className="text-center text-white/40 font-mono text-[10px] uppercase tracking-widest mt-4 animate-pulse">
              Click Card to Flip
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
