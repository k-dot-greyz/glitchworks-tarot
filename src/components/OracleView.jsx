import { Eye, Shuffle } from 'lucide-react';
import { Card } from './Card.jsx';
import { PlaymatZone } from './PlaymatZone.jsx';
import { ORACLE_LAYOUTS } from '../domain/oracleLayouts.js';

export function OracleView({
  deck,
  deckBack,
  spread,
  oracleLayout,
  revealedCardIds,
  oracleDragOverZone,
  onChangeLayout,
  onDraw,
  onRevealAll,
  onRevealCard,
  onDropOnZone,
  onDragOverZone,
  onDragLeaveZone,
}) {
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
      <PlaymatZone
        label={label}
        isOver={isOver}
        size={size}
        extraClasses={extraClasses}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => onDragOverZone(index)}
        onDragLeave={() => onDragLeaveZone()}
        onDrop={(e) => {
          e.preventDefault();
          onDragLeaveZone();
          const cardId = e.dataTransfer.getData('text/plain');
          onDropOnZone(cardId, index);
        }}
      >
        {card ? (
          <Card
            data={card}
            isFlipped={isFlipped}
            size={size}
            deckBack={deckBack}
            onClick={() => {
              if (!isFlipped) onRevealCard(card.id);
            }}
          />
        ) : null}
      </PlaymatZone>
    );
  };

  const placedCount = spread.filter(Boolean).length;

  return (
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

      <div className="w-full max-w-[240px] flex flex-col gap-1.5">
        <label className="text-[10px] font-mono text-indigo-400/70 uppercase tracking-widest text-center">
          Spread Layout
        </label>
        <select
          data-testid="aether-oracle-layout-select"
          value={oracleLayout}
          onChange={(e) => onChangeLayout(e.target.value)}
          className="w-full bg-slate-900/80 border border-white/10 rounded px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500 text-center appearance-none cursor-pointer"
        >
          {Object.values(ORACLE_LAYOUTS).map((layout) => (
            <option key={layout.id} value={layout.id}>
              {layout.label}
            </option>
          ))}
        </select>
      </div>

      <div className="my-4">
        {spread.length > 0 ? (
          oracleLayout === 'threeCard' ? (
            <div className="flex flex-col md:flex-row gap-8 lg:gap-12 perspective-1000">
              {renderOracleZone(spread[0], 'T-Minus (Past)', 0, 'md')}
              {renderOracleZone(spread[1], 'T-Zero (Present)', 1, 'md')}
              {renderOracleZone(spread[2], 'T-Plus (Future)', 2, 'md')}
            </div>
          ) : oracleLayout === 'celticCross' ? (
            <div className="flex flex-col md:grid md:grid-cols-3 gap-8 items-center justify-items-center max-w-4xl">
              <div></div>
              {renderOracleZone(spread[2], 'Goal', 2, 'sm')}
              <div></div>

              {renderOracleZone(spread[3], 'Past', 3, 'sm')}
              <div
                className={`relative w-24 h-40 flex items-center justify-center rounded-xl border-2 transition-all ${oracleDragOverZone === 0 || oracleDragOverZone === 1 ? 'border-indigo-500 bg-indigo-500/10 scale-105 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'border-transparent'}`}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => onDragOverZone(0)}
                onDragLeave={() => onDragLeaveZone()}
                onDrop={(e) => {
                  e.preventDefault();
                  onDragLeaveZone();
                  const cardId = e.dataTransfer.getData('text/plain');
                  if (!spread[0]) {
                    onDropOnZone(cardId, 0);
                  } else {
                    onDropOnZone(cardId, 1);
                  }
                }}
              >
                <div className="absolute z-10">
                  {spread[0] ? (
                    <Card
                      data={spread[0]}
                      isFlipped={revealedCardIds.includes(spread[0].id)}
                      size="sm"
                      deckBack={deckBack}
                      onClick={() => {
                        if (!revealedCardIds.includes(spread[0].id)) {
                          onRevealCard(spread[0].id);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-24 h-40 rounded-xl border-2 border-dashed border-indigo-500/20 bg-indigo-900/5 flex items-center justify-center text-indigo-400/20 font-mono text-[10px]">
                      PRESENT
                    </div>
                  )}
                </div>
                <div className="absolute z-20 rotate-90 opacity-90 scale-95">
                  {spread[1] ? (
                    <Card
                      data={spread[1]}
                      isFlipped={revealedCardIds.includes(spread[1].id)}
                      size="sm"
                      deckBack={deckBack}
                      onClick={() => {
                        if (!revealedCardIds.includes(spread[1].id)) {
                          onRevealCard(spread[1].id);
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
        ) : oracleLayout === 'celticCross' ? (
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
        {spread.length > 0 && revealedCardIds.length < placedCount && (
          <button
            type="button"
            onClick={onRevealAll}
            className="flex items-center gap-2 bg-emerald-900/50 border border-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded font-mono text-sm tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95"
          >
            <Eye size={16} /> REVEAL ALL
          </button>
        )}
        <button
          type="button"
          data-testid="aether-oracle-draw"
          onClick={onDraw}
          className="flex items-center gap-2 bg-indigo-900/50 border border-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded font-mono text-sm tracking-widest shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all active:scale-95 group"
        >
          <Shuffle size={16} className="group-hover:animate-spin" />
          {spread.length > 0 ? 'RECALCULATE' : 'INITIALIZE SEQUENCE'}
        </button>
      </div>

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
          <div className="w-12 shrink-0" />
        </div>
      </div>
    </div>
  );
}
