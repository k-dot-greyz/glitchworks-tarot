import { X } from 'lucide-react';
import { NeonSlider } from './NeonSlider.jsx';

export function SettingsModal({
  aesthetics,
  deckBack,
  onChangeAesthetics,
  onChangeDeckBack,
  onClose,
}) {
  return (
    <div
      data-testid="aether-modal-settings"
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="System configuration"
    >
      <div
        data-testid="aether-modal-settings-panel"
        className="bg-slate-900 border border-white/20 p-6 md:p-8 rounded-xl max-w-sm w-full shadow-2xl space-y-8 relative"
      >
        <button
          type="button"
          data-testid="aether-settings-close"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white"
          aria-label="Close settings"
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
            onChange={(v) => onChangeAesthetics((s) => ({ ...s, glitch: v }))}
          />
          <NeonSlider
            label="CRT_SCANLINES"
            value={aesthetics.crt}
            color="emerald"
            onChange={(v) => onChangeAesthetics((s) => ({ ...s, crt: v }))}
          />
          <NeonSlider
            label="GRAIN_NOISE"
            value={aesthetics.noise}
            color="red"
            onChange={(v) => onChangeAesthetics((s) => ({ ...s, noise: v }))}
          />

          <div className="flex flex-col gap-1.5 border-t border-white/10 pt-4">
            <label className="text-[10px] font-mono text-indigo-400/70 uppercase tracking-widest text-center">
              Active Deck Back
            </label>
            <select
              data-testid="aether-settings-deckback"
              value={deckBack}
              onChange={(e) => onChangeDeckBack(e.target.value)}
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
  );
}
