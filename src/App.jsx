import { useState, useEffect } from 'react';
import INITIAL_DECK from './default_deck.json';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

import {
  AppNav,
  ArenaView,
  CardModal,
  DexView,
  ForgeView,
  GlitchOverlays,
  OracleView,
  SettingsModal,
} from './components/index.js';
import { usePersistedDeck } from './hooks/usePersistedDeck.js';
import { resolveBattleWithEngine } from './domain/battleEngine.js';
import { rulesets } from './domain/rulesets.js';
import { drawSpread } from './domain/deckState.js';
import { spreadCardCount } from './domain/oracleLayouts.js';
import { createLocalStorageDeckStorage } from './adapters/localStorageDeckStorage.js';
import { createConsoleTelemetry } from './adapters/consoleTelemetry.js';
import {
  DEFAULT_AESTHETICS,
  DEFAULT_FORGE_DATA,
} from './config/aetherConfig.js';

const defaultStorage = createLocalStorageDeckStorage();
const defaultTelemetry = createConsoleTelemetry();

export default function App({ storage = defaultStorage, telemetry = defaultTelemetry }) {
  const [view, setView] = useState('dex');
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
  const [modalCardFlipped, setModalCardFlipped] = useState(true);

  const [showSettings, setShowSettings] = useState(false);
  const [aesthetics, setAesthetics] = useState(DEFAULT_AESTHETICS);

  const [showDeckBacks, setShowDeckBacks] = useState(false);
  const [editingDeckId, setEditingDeckId] = useState(null);
  const [editingDeckName, setEditingDeckName] = useState('');
  const [newDeckName, setNewDeckName] = useState('');
  const [showCreateDeckInput, setShowCreateDeckInput] = useState(false);

  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [oracleDragOverZone, setOracleDragOverZone] = useState(null);
  const [revealedCardIds, setRevealedCardIds] = useState([]);

  const [arenaRuleset, setArenaRuleset] = useState('standard');
  const [arenaSlots, setArenaSlots] = useState({ p1: null, p2: null });
  const [battleLog, setBattleLog] = useState('[ WAITING FOR DATA INPUT ]');
  const [isClashing, setIsClashing] = useState(false);
  const [arenaMode, setArenaMode] = useState('standard');

  const [spread, setSpread] = useState([]);
  const [oracleLayout, setOracleLayout] = useState('threeCard');

  const [forgeData, setForgeData] = useState(DEFAULT_FORGE_DATA);

  useEffect(() => {
    document.documentElement.style.setProperty('--glitch-int', aesthetics.glitch / 100);
    document.documentElement.style.setProperty('--crt-opacity', aesthetics.crt / 100);
    document.documentElement.style.setProperty('--noise-opacity', aesthetics.noise / 100);
  }, [aesthetics]);

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
          : `[ ${activeRuleset.name.toUpperCase()} INITIALIZED ]`,
    );
  }, [arenaRuleset]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#020617' });
    }
  }, []);

  const handleArenaSelect = (card) => {
    if (isClashing) return;
    const activeRuleset = rulesets[arenaRuleset] || rulesets.standard;
    const clashSlots = activeRuleset.clashSlots;

    const emptySlot = clashSlots.find((slotId) => !arenaSlots[slotId]);
    if (emptySlot) {
      if (activeRuleset.bannedCardIds.includes(card.id)) {
        setBattleLog(`[ ERR: CARD ${card.id} BANNED IN ${activeRuleset.name.toUpperCase()} ]`);
        if (telemetry) {
          telemetry.log('warn', 'CARD_BAN_VIOLATION', {
            cardId: card.id,
            rulesetId: activeRuleset.id,
          });
        }
        return;
      }

      setArenaSlots((prev) => ({ ...prev, [emptySlot]: card }));
      setBattleLog(`[ ${emptySlot.toUpperCase()} FILLED ]`);
    }
  };

  const handleArenaDrop = (zoneId, cardId) => {
    const activeRuleset = rulesets[arenaRuleset] || rulesets.standard;
    const foundCard = deck.find((c) => c.id === cardId);
    if (!foundCard) return;

    if (activeRuleset.bannedCardIds.includes(foundCard.id)) {
      setBattleLog(`[ ERR: CARD ${foundCard.id} BANNED IN ${activeRuleset.name.toUpperCase()} ]`);
      if (telemetry) {
        telemetry.log('warn', 'CARD_BAN_VIOLATION', {
          cardId: foundCard.id,
          rulesetId: activeRuleset.id,
        });
      }
      return;
    }

    const zone = activeRuleset.zones.find((z) => z.id === zoneId);
    setArenaSlots((prev) => ({ ...prev, [zoneId]: foundCard }));
    setBattleLog(`[ ${(zone?.label || zoneId).toUpperCase()} FILLED ]`);
  };

  const handleResolveBattle = () => {
    const activeRuleset = rulesets[arenaRuleset] || rulesets.standard;
    const clashSlots = activeRuleset.clashSlots;
    const p1 = arenaSlots[clashSlots[0]];
    const p2 = arenaSlots[clashSlots[1]];

    if (!p1 || !p2 || isClashing || arenaMode === 'combatDisabled') return;

    setIsClashing(true);
    setBattleLog('[ ERR: DATA COLLISION DETECTED ]');

    setTimeout(() => {
      const result = resolveBattleWithEngine(p1, p2, arenaMode, arenaRuleset);
      setBattleLog(result.logLine);
      setIsClashing(false);
    }, 600);
  };

  const clearArena = () => {
    if (isClashing) return;
    const activeRuleset = rulesets[arenaRuleset] || rulesets.standard;
    const clearedSlots = {};
    activeRuleset.zones.forEach((z) => {
      clearedSlots[z.id] = null;
    });
    setArenaSlots(clearedSlots);
    setBattleLog(
      arenaMode === 'combatDisabled'
        ? '> SYSTEMS IN HARMONY. NO CLASH POSSIBLE.'
        : '[ ARENA WIPED ]',
    );
  };

  const handleSelectArenaMode = (selectedMode) => {
    setArenaMode(selectedMode);
    const activeRuleset = rulesets[arenaRuleset] || rulesets.standard;
    const clashSlots = activeRuleset.clashSlots;
    const p1ClashCard = arenaSlots[clashSlots[0]];
    const p2ClashCard = arenaSlots[clashSlots[1]];
    if (selectedMode === 'combatDisabled') {
      setBattleLog('> SYSTEMS IN HARMONY. NO CLASH POSSIBLE.');
    } else {
      setBattleLog(
        p1ClashCard && p2ClashCard
          ? '[ READY FOR COLLISION ]'
          : '[ WAITING FOR DATA INPUT ]',
      );
    }
  };

  const handleDrawSpread = () => {
    setSpread(drawSpread(deck, spreadCardCount(oracleLayout)));
    setRevealedCardIds([]);
  };

  const handleDropOnOracleZone = (cardId, zoneIndex) => {
    const foundCard = deck.find((c) => c.id === cardId);
    if (!foundCard) return;
    setSpread((prev) => {
      const next = [...prev];
      while (next.length <= zoneIndex) {
        next.push(null);
      }
      next[zoneIndex] = foundCard;
      return next;
    });
    setRevealedCardIds((prev) => [...prev, foundCard.id]);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForgeData((prev) => ({ ...prev, customImage: reader.result }));
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

  return (
    <div
      data-testid="aether-root"
      data-theme="glitch-dark"
      data-aether-ui="main"
      className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden"
    >
      <GlitchOverlays />

      {showSettings && (
        <SettingsModal
          aesthetics={aesthetics}
          deckBack={deckBack}
          onChangeAesthetics={setAesthetics}
          onChangeDeckBack={setDeckBack}
          onClose={() => setShowSettings(false)}
        />
      )}

      <AppNav
        view={view}
        onChangeView={setView}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main
        data-testid="aether-main"
        className="relative z-10 pt-4 md:pt-28 pb-32 md:pb-12 max-w-6xl mx-auto min-h-screen"
      >
        {view === 'dex' && (
          <DexView
            decks={decks}
            activeDeckId={activeDeckId}
            deck={deck}
            deckBack={deckBack}
            showDeckBacks={showDeckBacks}
            editingDeckId={editingDeckId}
            editingDeckName={editingDeckName}
            newDeckName={newDeckName}
            showCreateDeckInput={showCreateDeckInput}
            onSwitchDeck={switchDeck}
            onStartRename={() => {
              setEditingDeckId(activeDeckId);
              setEditingDeckName(decks.find((d) => d.id === activeDeckId).name);
            }}
            onChangeEditingName={setEditingDeckName}
            onCommitRename={() => {
              renameDeck(activeDeckId, editingDeckName);
              setEditingDeckId(null);
            }}
            onToggleCreate={setShowCreateDeckInput}
            onChangeNewName={setNewDeckName}
            onCreateDeck={() => {
              if (newDeckName.trim()) {
                createDeck(newDeckName.trim());
                setNewDeckName('');
                setShowCreateDeckInput(false);
              }
            }}
            onCancelCreate={() => setShowCreateDeckInput(false)}
            onDuplicateDeck={duplicateDeck}
            onDeleteDeck={deleteDeck}
            onToggleCardBacks={() => setShowDeckBacks((v) => !v)}
            onSelectCard={(card) => {
              setSelectedCard(card);
              setModalCardFlipped(true);
            }}
          />
        )}
        {view === 'arena' && (
          <ArenaView
            deck={deck}
            deckBack={deckBack}
            arenaRuleset={arenaRuleset}
            arenaSlots={arenaSlots}
            battleLog={battleLog}
            isClashing={isClashing}
            arenaMode={arenaMode}
            dragOverSlot={dragOverSlot}
            revealedCardIds={revealedCardIds}
            onSelectRuleset={setArenaRuleset}
            onSelectMode={handleSelectArenaMode}
            onClash={handleResolveBattle}
            onFlush={clearArena}
            onSelectCard={handleArenaSelect}
            onDropOnZone={handleArenaDrop}
            onClearZone={(zoneId) =>
              setArenaSlots((prev) => ({ ...prev, [zoneId]: null }))
            }
            onRevealZone={(cardId) =>
              setRevealedCardIds((prev) => [...prev, cardId])
            }
            onDragOverSlot={setDragOverSlot}
            onDragLeaveSlot={() => setDragOverSlot(null)}
          />
        )}
        {view === 'oracle' && (
          <OracleView
            deck={deck}
            deckBack={deckBack}
            spread={spread}
            oracleLayout={oracleLayout}
            revealedCardIds={revealedCardIds}
            oracleDragOverZone={oracleDragOverZone}
            onChangeLayout={(layout) => {
              setOracleLayout(layout);
              setSpread([]);
              setRevealedCardIds([]);
            }}
            onDraw={handleDrawSpread}
            onRevealAll={() =>
              setRevealedCardIds(spread.filter(Boolean).map((c) => c.id))
            }
            onRevealCard={(cardId) =>
              setRevealedCardIds((prev) => [...prev, cardId])
            }
            onDropOnZone={handleDropOnOracleZone}
            onDragOverZone={setOracleDragOverZone}
            onDragLeaveZone={() => setOracleDragOverZone(null)}
          />
        )}
        {view === 'forge' && (
          <ForgeView
            forgeData={forgeData}
            deckBack={deckBack}
            onChange={setForgeData}
            onCompile={saveForgeCard}
            onImageUpload={handleImageUpload}
          />
        )}
      </main>

      {selectedCard && view === 'dex' && (
        <CardModal
          card={selectedCard}
          isFlipped={modalCardFlipped}
          deckBack={deckBack}
          onClose={() => setSelectedCard(null)}
          onToggleFlip={() => setModalCardFlipped((v) => !v)}
        />
      )}
    </div>
  );
}
