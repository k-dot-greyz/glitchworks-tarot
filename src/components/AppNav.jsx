import { Layers, LayoutGrid, Sword, Sparkles, Hammer, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dex', icon: LayoutGrid, color: 'indigo' },
  { id: 'arena', icon: Sword, color: 'red' },
  { id: 'oracle', icon: Sparkles, color: 'purple' },
  { id: 'forge', icon: Hammer, color: 'emerald' },
];

export function AppNav({ view, onChangeView, onOpenSettings }) {
  return (
    <nav
      data-testid="aether-nav"
      aria-label="Aether Deck views"
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
            onClick={onOpenSettings}
            className="md:hidden text-white/50 hover:text-indigo-400 p-2"
            aria-label="Open settings"
          >
            <Settings size={20} />
          </button>
        </div>

        <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-2">
          <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-full overflow-x-auto hide-scrollbar flex-nowrap w-full md:w-auto [mask-image:linear-gradient(to_right,black_85%,transparent_100%)] md:[mask-image:none]">
            {NAV_ITEMS.map((btn) => (
              <button
                type="button"
                data-testid={`aether-nav-${btn.id}`}
                key={btn.id}
                onClick={() => onChangeView(btn.id)}
                aria-current={view === btn.id ? 'page' : undefined}
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
            <div className="w-8 shrink-0 md:hidden" />
          </div>

          <button
            type="button"
            data-testid="aether-settings-open-desktop"
            onClick={onOpenSettings}
            className="hidden md:flex text-white/40 hover:text-indigo-400 p-2 ml-2 bg-slate-900/50 rounded-full border border-transparent hover:border-white/10 transition-colors"
            aria-label="Open settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}
