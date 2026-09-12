import { Hammer, Save, Upload, Eye, EyeOff } from 'lucide-react';
import { Card } from './Card.jsx';
import { NeonSlider } from './NeonSlider.jsx';

export function ForgeView({
  forgeData,
  deckBack,
  onChange,
  onCompile,
  onImageUpload,
}) {
  return (
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
          onClick={onCompile}
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
              onChange={(e) => onChange({ ...forgeData, name: e.target.value })}
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
              onChange={(e) => onChange({ ...forgeData, sub: e.target.value })}
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
              onChange={(e) => onChange({ ...forgeData, type: e.target.value })}
              className="w-full bg-slate-900/50 border border-white/10 rounded px-3 py-3 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 appearance-none"
            >
              {['void', 'fire', 'water', 'electric', 'wind', 'dark'].map((t) => (
                <option key={t} value={t}>
                  {t.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono text-emerald-500/70 mb-2 uppercase tracking-widest">
              Visual Sigil
            </label>
            <select
              value={forgeData.icon}
              onChange={(e) => onChange({ ...forgeData, icon: e.target.value })}
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
              onChange={(e) => onChange({ ...forgeData, frame: e.target.value })}
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
              onChange={(e) => onChange({ ...forgeData, hat: e.target.value })}
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
              onChange={(e) => onChange({ ...forgeData, rarity: e.target.value })}
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
              onChange={(e) => onChange({ ...forgeData, ability: e.target.value })}
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
              onChange({
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
              onChange({
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
              onChange({
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
            onChange={(e) => onChange({ ...forgeData, desc: e.target.value })}
            className="w-full bg-slate-900/50 border border-white/10 rounded px-3 py-3 text-white/70 text-sm italic font-serif focus:outline-none focus:border-emerald-500 transition-colors resize-none"
          />
        </div>

        <div className="border-t border-white/10 pt-5 space-y-4">
          <label className="block text-[10px] font-mono text-emerald-500/70 uppercase tracking-widest">
            Presentation Override
          </label>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() =>
                onChange({ ...forgeData, hideDesc: !forgeData.hideDesc })
              }
              className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded font-mono text-xs transition-colors ${forgeData.hideDesc ? 'border-red-500/50 text-red-400 bg-red-900/20' : 'border-white/10 text-white/50 hover:border-emerald-500/50 hover:text-emerald-400'}`}
            >
              {forgeData.hideDesc ? <EyeOff size={14} /> : <Eye size={14} />}{' '}
              {forgeData.hideDesc ? 'LORE HIDDEN' : 'LORE VISIBLE'}
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({ ...forgeData, hideStats: !forgeData.hideStats })
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
                onChange={onImageUpload}
                className="hidden"
              />
            </label>
            {forgeData.customImage && (
              <button
                type="button"
                onClick={() => onChange({ ...forgeData, customImage: null })}
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
}
