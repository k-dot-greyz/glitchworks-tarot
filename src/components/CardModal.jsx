import { X } from 'lucide-react';
import { Card } from './Card.jsx';

export function CardModal({ card, isFlipped, deckBack, onClose, onToggleFlip }) {
  return (
    <div
      data-testid="aether-modal-card"
      className="fixed inset-0 z-[900] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${card.name} details`}
    >
      <div
        className="relative transform transition-transform animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          data-testid="aether-modal-card-close"
          className="absolute -top-16 right-0 text-white/50 hover:text-white transition-colors bg-white/5 p-2 rounded-full border border-white/10"
          onClick={onClose}
          aria-label="Close card details"
        >
          <X size={24} />
        </button>
        <Card
          data={card}
          isFlipped={isFlipped}
          size="lg"
          deckBack={deckBack}
          onClick={onToggleFlip}
        />
        <p className="text-center text-white/40 font-mono text-[10px] uppercase tracking-widest mt-4 animate-pulse">
          Click Card to Flip
        </p>
      </div>
    </div>
  );
}
