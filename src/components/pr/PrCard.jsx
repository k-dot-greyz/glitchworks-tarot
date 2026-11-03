import React from 'react';
import { rarityBorders } from '../cardTheme.js';
import { SEVERITY, VERDICT, FOCUS, severityGradient } from './prTheme.js';

// Tarot frame shared by PR + sidecar cards (same structure as Card.jsx front:
// rounded-xl gradient by element type, rarity border, inset inner frame).
const Frame = ({ children, gradient, border, className = '' }) => (
  <div
    className={`relative w-full h-full rounded-xl bg-gradient-to-br ${gradient} border-2 ${border} backdrop-blur-md shadow-2xl overflow-hidden ${className}`}
  >
    <div className="absolute inset-2 border border-white/10 rounded-lg pointer-events-none" aria-hidden="true"></div>
    <div className="relative z-10 h-full flex flex-col">{children}</div>
  </div>
);

const Stat = ({ label, value, tone = 'info' }) => (
  <div className="flex flex-col gap-0.5 p-2 bg-black/50 rounded">
    <dt className="text-sm text-slate-300 uppercase tracking-wide">{label}</dt>
    <dd className={`text-base font-mono font-bold ${SEVERITY[tone].text}`}>{value}</dd>
  </div>
);

export const FlagChip = ({ flag }) => (
  <li className={`text-sm px-2 py-0.5 rounded ${SEVERITY[flag.severity].chip}`} title={flag.reason}>
    <span className="sr-only">{SEVERITY[flag.severity].label}: </span>
    {flag.label}
  </li>
);

export const PrCentralCard = ({ pr, onOpen }) => {
  const ciTone = pr.ci.failed ? 'block' : pr.ci.state === 'success' ? 'ok' : 'warn';
  const rvTone = pr.reviews.changesRequested ? 'block' : pr.reviews.approved ? 'ok' : 'warn';
  const mgTone = pr.mergeability.mergeable === false ? 'block' : pr.mergeability.state === 'clean' ? 'ok' : 'warn';
  const decisive = pr.flags.filter((f) => f.severity !== 'info');
  const context = pr.flags.filter((f) => f.severity === 'info');
  return (
    <button
      type="button"
      data-testid="pr-central-card"
      onClick={onOpen}
      aria-label={`PR #${pr.number}: ${pr.title}. Verdict ${pr.verdict.label}. Open details`}
      className={`block w-full max-w-[24rem] min-h-[34rem] text-left rounded-xl transition-transform hover:-translate-y-1 ${FOCUS}`}
    >
      <Frame
        gradient={severityGradient(pr.verdict.id === 'no-merge' ? 'block' : pr.verdict.id === 'ready' ? 'ok' : 'warn')}
        border={rarityBorders['ultra-rare']}
      >
        <div className="p-5 flex flex-col gap-3 h-full">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-base text-white">#{pr.number}</span>
            <span
              data-testid="pr-verdict"
              className={`text-sm font-mono font-bold px-2 py-1 rounded ${VERDICT[pr.verdict.id]}`}
            >
              {pr.verdict.label}
            </span>
          </div>
          <h3 className="font-serif text-lg leading-snug text-white line-clamp-3">{pr.title}</h3>
          <p className="text-sm text-slate-200 font-mono break-all">
            {pr.author} · <span className="text-[#ffb400]">{pr.base}</span> ← {pr.head}
          </p>
          <p className="text-sm text-slate-200">{pr.verdict.reasons.join(' · ')}</p>
          <dl className="grid grid-cols-2 gap-2">
            <Stat
              label="CI"
              value={pr.ci.total ? `${pr.ci.passed}/${pr.ci.total} ${pr.ci.state}` : 'none'}
              tone={ciTone}
            />
            <Stat
              label="Reviews"
              value={`${pr.reviews.approved}✓ ${pr.reviews.changesRequested}✗ ${pr.reviews.pending} pend`}
              tone={rvTone}
            />
            <Stat
              label="Mergeable"
              value={pr.mergeability.mergeable === null ? 'unknown' : pr.mergeability.state}
              tone={mgTone}
            />
            <Stat
              label="Size"
              value={`+${pr.stats.additions} −${pr.stats.deletions} ${pr.stats.size}`}
              tone={pr.stats.size === 'XL' || pr.stats.size === 'L' ? 'warn' : 'info'}
            />
            <Stat
              label="Files"
              value={`${pr.stats.changedFiles} · ${pr.stats.commits} commit${pr.stats.commits === 1 ? '' : 's'}`}
            />
            <Stat
              label="Age"
              value={`${pr.ageDays}d${pr.draft ? ' · draft' : ''}`}
              tone={pr.draft ? 'block' : 'info'}
            />
          </dl>
          {decisive.length > 0 && (
            <ul aria-label="Decision flags" className="flex flex-wrap gap-1.5">
              {decisive.map((f) => (
                <FlagChip key={f.id} flag={f} />
              ))}
            </ul>
          )}
          {context.length > 0 && (
            <ul aria-label="Context flags" className="flex flex-wrap gap-1.5">
              {context.map((f) => (
                <FlagChip key={f.id} flag={f} />
              ))}
            </ul>
          )}
          {pr.labels.length > 0 && <p className="text-sm text-slate-300 font-mono mt-auto">{pr.labels.join(' · ')}</p>}
        </div>
      </Frame>
    </button>
  );
};

export const PrSidecarCard = ({ sidecar, expanded, onOpen }) => {
  const sev = SEVERITY[sidecar.severity];
  const compact = sidecar.collapsed && !expanded;
  return (
    <button
      type="button"
      data-testid={`pr-sidecar-${sidecar.id}`}
      data-collapsed={compact ? 'true' : 'false'}
      onClick={onOpen}
      aria-label={`${sidecar.title}: ${sidecar.summary}. ${sev.label}. Open details`}
      className={`block w-full text-left rounded-xl transition-transform hover:-translate-y-0.5 ${compact ? 'min-h-[5.5rem]' : 'min-h-[10.5rem]'} ${FOCUS}`}
    >
      <Frame gradient={severityGradient(sidecar.severity)} border={sev.border} className={compact ? 'opacity-90' : ''}>
        <div className="p-4 flex flex-col gap-1.5 h-full">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-mono uppercase tracking-widest text-slate-300">{sidecar.arcana}</span>
            <span className={`text-sm font-mono px-1.5 rounded ${sev.chip}`}>{sev.label}</span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="text-base font-semibold text-white">{sidecar.title}</h4>
            <span className={`font-mono text-lg font-bold ${sev.text}`}>{sidecar.metric}</span>
          </div>
          {!compact && <p className="text-sm text-slate-200 leading-snug">{sidecar.summary}</p>}
          {!compact && sidecar.derived && <p className="text-sm text-slate-400 mt-auto">derived</p>}
        </div>
      </Frame>
    </button>
  );
};
