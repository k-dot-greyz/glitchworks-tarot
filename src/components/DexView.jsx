import {
  Layers,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import { Card } from './Card.jsx';

export function DexView({
  decks,
  activeDeckId,
  deck,
  deckBack,
  showDeckBacks,
  editingDeckId,
  editingDeckName,
  newDeckName,
  showCreateDeckInput,
  onSwitchDeck,
  onStartRename,
  onChangeEditingName,
  onCommitRename,
  onToggleCreate,
  onChangeNewName,
  onCreateDeck,
  onCancelCreate,
  onDuplicateDeck,
  onDeleteDeck,
  onToggleCardBacks,
  onSelectCard,
}) {
  return (
    <div data-testid="aether-view-dex" className="p-4 space-y-6 pb-24">
      <div className="bg-slate-900/80 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Layers className="text-indigo-400" size={20} />
          {editingDeckId === activeDeckId ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editingDeckName}
                onChange={(e) => onChangeEditingName(e.target.value)}
                className="bg-slate-950 border border-white/20 rounded px-2 py-1 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={onCommitRename}
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
                onChange={(e) => onSwitchDeck(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name.toUpperCase()}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onStartRename}
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
                onChange={(e) => onChangeNewName(e.target.value)}
                className="bg-slate-950 border border-white/20 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={onCreateDeck}
                className="p-1 bg-emerald-600/30 border border-emerald-500 text-emerald-400 rounded hover:bg-emerald-600 hover:text-white transition-colors"
              >
                <Check size={14} />
              </button>
              <button
                type="button"
                onClick={onCancelCreate}
                className="p-1 bg-red-600/30 border border-red-500 text-red-400 rounded hover:bg-red-600 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onToggleCreate(true)}
              className="flex items-center gap-1.5 bg-indigo-950/40 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white text-indigo-300 px-3 py-1.5 rounded font-mono text-xs tracking-wider transition-all"
            >
              <Plus size={14} /> NEW_DECK
            </button>
          )}

          <button
            type="button"
            onClick={() => onDuplicateDeck(activeDeckId)}
            className="flex items-center gap-1.5 bg-indigo-950/40 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white text-indigo-300 px-3 py-1.5 rounded font-mono text-xs tracking-wider transition-all"
          >
            <Copy size={14} /> CLONE_DECK
          </button>

          <button
            type="button"
            onClick={() => onDeleteDeck(activeDeckId)}
            disabled={decks.length <= 1}
            className="flex items-center gap-1.5 bg-red-950/40 border border-red-500/30 hover:bg-red-600 hover:text-white text-red-300 px-3 py-1.5 rounded font-mono text-xs tracking-wider transition-all disabled:opacity-35 disabled:pointer-events-none"
          >
            <Trash2 size={14} /> DELETE_DECK
          </button>

          <button
            type="button"
            onClick={onToggleCardBacks}
            className={`flex items-center gap-1.5 border px-3 py-1.5 rounded font-mono text-xs tracking-wider transition-all ${showDeckBacks ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-950 border-white/10 hover:bg-white/5 text-white/70'}`}
          >
            {showDeckBacks ? <EyeOff size={14} /> : <Eye size={14} />} CARD_BACKS
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {deck.map((card) => (
          <div
            key={card.id}
            className="flex justify-center transform hover:-translate-y-2 transition-transform duration-300"
          >
            <Card
              data={card}
              isFlipped={!showDeckBacks}
              onClick={() => onSelectCard(card)}
              deckBack={deckBack}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
