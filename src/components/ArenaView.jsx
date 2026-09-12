import { Card } from './Card.jsx';
import { PlaymatZone } from './PlaymatZone.jsx';
import { rulesets } from '../domain/rulesets.js';
import { arenaModes } from '../domain/battleEngine.js';

export function ArenaView({
  deck,
  deckBack,
  arenaRuleset,
  arenaSlots,
  battleLog,
  isClashing,
  arenaMode,
  dragOverSlot,
  revealedCardIds,
  onSelectRuleset,
  onSelectMode,
  onClash,
  onFlush,
  onSelectCard,
  onDropOnZone,
  onClearZone,
  onRevealZone,
  onDragOverSlot,
  onDragLeaveSlot,
}) {
  const activeRuleset = rulesets[arenaRuleset] || rulesets.standard;
  const p2Zones = activeRuleset.zones.filter((z) => z.player === 2);
  const p1Zones = activeRuleset.zones.filter((z) => z.player === 1);
  const globalZones = activeRuleset.zones.filter((z) => z.scope === 'global');
  const clashSlots = activeRuleset.clashSlots;
  const p1ClashCard = arenaSlots[clashSlots[0]];
  const p2ClashCard = arenaSlots[clashSlots[1]];

  const renderArenaZone = (zone) => {
    const card = arenaSlots[zone.id];
    const isOver = dragOverSlot === zone.id;
    const isFlipped = card
      ? zone.isFaceDown
        ? revealedCardIds.includes(card.id)
        : true
      : false;

    return (
      <PlaymatZone
        key={zone.id}
        label={zone.label}
        isOver={isOver}
        size={zone.size || 'sm'}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => onDragOverSlot(zone.id)}
        onDragLeave={() => onDragLeaveSlot()}
        onDrop={(e) => {
          e.preventDefault();
          onDragLeaveSlot();
          const cardId = e.dataTransfer.getData('text/plain');
          onDropOnZone(zone.id, cardId);
        }}
      >
        {card ? (
          <Card
            data={card}
            isFlipped={isFlipped}
            size={zone.size || 'sm'}
            clashing={isClashing && (activeRuleset.clashSlots || []).includes(zone.id)}
            onClick={() => {
              if (zone.isFaceDown && !isFlipped) {
                onRevealZone(card.id);
              } else {
                onClearZone(zone.id);
              }
            }}
            deckBack={deckBack}
          />
        ) : null}
      </PlaymatZone>
    );
  };

  return (
    <div
      data-testid="aether-view-arena"
      className="flex flex-col h-full p-4 max-w-6xl mx-auto space-y-6"
    >
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-light text-indigo-300 glitch-text tracking-widest">
          THE ARENA
        </h2>
        <p className="text-white/40 font-mono text-[10px]">
          {activeRuleset.name.toUpperCase()} ACTIVE
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-6 bg-slate-950/40 p-6 rounded-2xl border border-white/5 shadow-inner">
        {p2Zones.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-4 border-b border-white/5 pb-4">
            {p2Zones.map(renderArenaZone)}
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          {globalZones.length > 0 && (
            <div className="flex flex-col gap-4">
              {globalZones.map(renderArenaZone)}
            </div>
          )}

          {p2Zones.length === 0 && p1Zones.length === 0 && (
            <div className="flex items-center gap-6">
              {renderArenaZone(activeRuleset.zones[0])}
              {renderArenaZone(activeRuleset.zones[1])}
            </div>
          )}

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

            <div className="w-full md:min-w-[240px] flex flex-col gap-1">
              <label className="text-[9px] font-mono text-indigo-400/70 uppercase tracking-widest text-center">
                Ruleset
              </label>
              <select
                data-testid="aether-arena-ruleset-select"
                value={arenaRuleset}
                onChange={(e) => onSelectRuleset(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/10 rounded px-3 py-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-indigo-500 text-center appearance-none cursor-pointer"
              >
                {Object.values(rulesets).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:min-w-[240px] flex flex-col gap-1">
              <label className="text-[9px] font-mono text-indigo-400/70 uppercase tracking-widest text-center">
                Arena Mode
              </label>
              <select
                data-testid="aether-arena-mode-select"
                value={arenaMode}
                onChange={(e) => onSelectMode(e.target.value)}
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
              onClick={onClash}
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
              onClick={onFlush}
              className="text-[9px] font-mono text-white/40 hover:text-white uppercase tracking-widest hover:bg-white/5 px-2 py-0.5 rounded"
            >
              Flush_Memory
            </button>
          </div>
        </div>

        {p1Zones.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-4 border-t border-white/5 pt-4">
            {p1Zones.map(renderArenaZone)}
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-white/10 bg-black/20 rounded-xl p-4">
        <p className="text-[10px] text-white/30 font-mono text-center mb-2 uppercase tracking-widest">
          Local_Storage_Array (Drag Cards to Slots)
        </p>
        <div className="overflow-x-auto hide-scrollbar flex items-center gap-4 px-4 pb-4 [mask-image:linear-gradient(to_right,black_90%,transparent_100%)]">
          {deck.map((card) => {
            const isPlaced = Object.values(arenaSlots).some(
              (slotCard) => slotCard?.id === card.id,
            );
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
                  onClick={() => onSelectCard(card)}
                  size="sm"
                  deckBack={deckBack}
                />
              </div>
            );
          })}
          <div className="w-12 shrink-0" />
        </div>
      </div>
    </div>
  );
}
