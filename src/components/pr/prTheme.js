// Static class strings only (Tailwind v4 does not see dynamic class names).
// zenOS amber: #ffb400. All text >= 14px (text-sm), AA contrast on slate-950.
import { getTypeColor } from '../../domain/elemental.js';

export const AMBER = '#ffb400';

// Severity → elemental card type (reuses Card's gradient palette).
const ELEMENT = { block: 'fire', warn: 'electric', ok: 'wind', info: 'dark' };
export const severityGradient = (sev) => getTypeColor(ELEMENT[sev] || 'dark');

export const SEVERITY = {
  block: {
    label: 'BLOCK',
    text: 'text-red-300',
    border: 'border-red-400',
    chip: 'bg-red-950 text-red-200 border border-red-400',
  },
  warn: {
    label: 'DECIDE',
    text: 'text-[#ffb400]',
    border: 'border-[#ffb400]',
    chip: 'bg-amber-950 text-[#ffb400] border border-[#ffb400]',
  },
  ok: {
    label: 'OK',
    text: 'text-emerald-300',
    border: 'border-emerald-400',
    chip: 'bg-emerald-950 text-emerald-200 border border-emerald-400',
  },
  info: {
    label: 'INFO',
    text: 'text-slate-200',
    border: 'border-slate-500',
    chip: 'bg-slate-900 text-slate-200 border border-slate-500',
  },
};

export const VERDICT = {
  'no-merge': 'bg-red-950 text-red-100 border-2 border-red-400',
  'needs-review': 'bg-amber-950 text-[#ffb400] border-2 border-[#ffb400]',
  ready: 'bg-emerald-950 text-emerald-100 border-2 border-emerald-400',
};

export const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb400]';

// Nav active state for the 'prs' entry; App.jsx builds `bg-${color}-600/20 ...`
// dynamically, so the amber variants are listed here for the Tailwind scanner:
// bg-amber-600/20 border-amber-500/50 text-amber-300
