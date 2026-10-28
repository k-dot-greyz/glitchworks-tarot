import React, { useEffect, useMemo, useState } from 'react';
import { buildSurface } from '../../domain/prSurface/index.js';
import { exampleRepoFixtures, LOCAL_FIXTURES_ENABLED, loadLocalFixtures } from '../../fixtures/github/index.js';
import { PrCentralCard, PrSidecarCard } from './PrCard.jsx';
import { PrModal } from './PrModal.jsx';
import { VERDICT, FOCUS } from './prTheme.js';
import { prModalItem } from './prModalItem.js';

// Real captures in src/fixtures/github/_local/ replace the synthetic set only when
// VITE_PR_LOCAL_FIXTURES=1 and no `fixtures` prop is passed; ?fixtures=synthetic opts out.
const wantsLocal = () =>
  LOCAL_FIXTURES_ENABLED &&
  (typeof window === 'undefined' || new URLSearchParams(window.location.search).get('fixtures') !== 'synthetic');

export const PrSpreadView = ({ fixtures: fixturesProp }) => {
  const [localFixtures, setLocalFixtures] = useState(null);
  useEffect(() => {
    if (fixturesProp || !wantsLocal()) return undefined;
    let live = true;
    loadLocalFixtures().then((fx) => live && fx && setLocalFixtures(fx));
    return () => {
      live = false;
    };
  }, [fixturesProp]);
  const fixtures = fixturesProp || localFixtures || exampleRepoFixtures;
  const surface = useMemo(() => buildSurface(fixtures), [fixtures]);
  const [selected, setSelected] = useState(surface.prs[0]?.number);
  const [modal, setModal] = useState(null);
  const [showLow, setShowLow] = useState(false);
  const pr = surface.prs.find((p) => p.number === selected) || surface.prs[0];
  if (!pr) return <p className="text-sm p-6">No PR fixtures.</p>;

  const left = pr.sidecars.filter((_, i) => i % 2 === 0);
  const right = pr.sidecars.filter((_, i) => i % 2 === 1);
  const lowCount = pr.sidecars.filter((s) => s.collapsed).length;
  const sidecar = (s) => (
    <li key={s.id}>
      <PrSidecarCard sidecar={s} expanded={showLow} onOpen={() => setModal(s)} />
    </li>
  );

  return (
    <section data-testid="pr-spread" aria-labelledby="pr-spread-title" className="px-4 md:px-6 pt-4 text-white">
      <header className="text-center mb-5">
        <h2
          id="pr-spread-title"
          className="text-3xl md:text-4xl font-light tracking-[0.2em] text-[#ffb400] glitch-text"
        >
          THE ORACLE · PR SPREAD
        </h2>
        <p className="text-sm font-mono text-slate-300 mt-2">
          {surface.repo} · {surface.sourceLabel} · snapshot {surface.snapshotAt} · read-only · no network · never
          merges
        </p>
      </header>

      <div role="group" aria-label="Choose a pull request" className="flex flex-wrap justify-center gap-2 mb-6">
        {surface.prs.map((p) => (
          <button
            key={p.number}
            type="button"
            data-testid={`pr-select-${p.number}`}
            aria-pressed={p.number === pr.number}
            onClick={() => setSelected(p.number)}
            className={`flex items-center gap-2 text-sm font-mono px-3 py-2 rounded-full border ${p.number === pr.number ? 'border-[#ffb400] bg-amber-950 text-white' : 'border-slate-600 bg-slate-900 text-slate-200 hover:border-slate-300'} ${FOCUS}`}
          >
            <span>#{p.number}</span>
            <span className={`px-1.5 rounded ${VERDICT[p.verdict.id]}`}>{p.verdict.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_minmax(20rem,24rem)_1fr] gap-4 md:gap-6 items-start">
        <div className="md:order-2 flex justify-center">
          <PrCentralCard pr={pr} onOpen={() => setModal(prModalItem(pr))} />
        </div>
        <ul aria-label="Sidecars, highest signal (left column)" className="md:order-1 space-y-4">
          {left.map(sidecar)}
        </ul>
        <ul aria-label="Sidecars (right column)" className="md:order-3 space-y-4">
          {right.map(sidecar)}
        </ul>
      </div>

      {lowCount > 0 && (
        <div className="flex justify-center mt-5">
          <button
            type="button"
            data-testid="pr-toggle-low-signal"
            aria-expanded={showLow}
            onClick={() => setShowLow((v) => !v)}
            className={`text-sm font-mono px-4 py-2 rounded-full border border-slate-500 text-slate-100 bg-slate-900 hover:border-[#ffb400] ${FOCUS}`}
          >
            {showLow ? 'Collapse' : 'Expand'} {lowCount} low-signal sidecar
            {lowCount === 1 ? '' : 's'}
          </button>
        </div>
      )}

      {modal && <PrModal item={modal} onClose={() => setModal(null)} />}
    </section>
  );
};

export default PrSpreadView;
