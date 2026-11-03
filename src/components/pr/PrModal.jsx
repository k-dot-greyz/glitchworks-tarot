import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink } from 'lucide-react';
import { SEVERITY, FOCUS } from './prTheme.js';
import { isGithubHtmlUrl } from '../../domain/prSurface/index.js';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const RefLink = ({ r }) => (
  <a
    href={r.url}
    target="_blank"
    rel="noopener noreferrer"
    data-testid="pr-modal-ref"
    className={`inline-flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-lg bg-slate-900 border border-[#ffb400] text-[#ffb400] text-sm hover:bg-amber-950 break-all ${FOCUS}`}
  >
    <span className="font-mono text-slate-300 uppercase">{r.kind}</span>
    <span>{r.label}</span>
    <ExternalLink size={14} aria-hidden="true" />
    <span className="sr-only">(opens github.com in a new tab)</span>
  </a>
);

/**
 * Accessible read-only details dialog: role=dialog, aria-modal, focus moves in,
 * Tab is trapped, Esc / backdrop / close button close it, focus returns to the
 * card that opened it.
 */
export const PrModal = ({ item, onClose }) => {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    return () => {
      if (opener && typeof opener.focus === 'function') opener.focus();
    };
  }, []);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const nodes = [...dialogRef.current.querySelectorAll(FOCUSABLE)];
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const sev = SEVERITY[item.severity] || SEVERITY.info;
  const refs = (item.refs || []).filter((r) => isGithubHtmlUrl(r.url));
  const titleId = `pr-modal-title-${item.id}`;

  // Portal to <body>: <main> is a z-10 stacking context, so the fixed nav (z-50) would cover the modal.
  return createPortal(
    <div
      data-testid="pr-modal-backdrop"
      className="fixed inset-0 z-[900] flex items-start md:items-center justify-center bg-black/90 backdrop-blur-md p-3 md:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="pr-modal"
        onKeyDown={onKeyDown}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-2xl my-4 rounded-xl bg-slate-950 border-2 ${sev.border} shadow-2xl p-5 md:p-6 text-white`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-mono uppercase tracking-widest text-slate-300">{item.arcana}</p>
            <h2 id={titleId} className="text-xl md:text-2xl font-serif text-white">
              {item.title}
            </h2>
            <p className="text-sm text-slate-200 mt-1">
              <span className={`font-mono px-1.5 mr-2 rounded ${sev.chip}`}>{sev.label}</span>
              {item.summary}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            data-testid="pr-modal-close"
            onClick={onClose}
            aria-label="Close details"
            className={`shrink-0 text-white bg-white/10 p-2 rounded-full border border-white/20 hover:bg-white/20 ${FOCUS}`}
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="References" className="mt-5">
          <h3 className="text-sm font-mono uppercase tracking-widest text-[#ffb400] mb-2">References index</h3>
          {refs.length ? (
            <ul className="flex flex-wrap gap-2">
              {refs.map((r) => (
                <li key={r.url}>
                  <RefLink r={r} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-300">No github.com references for this card.</p>
          )}
        </nav>

        {item.sections?.length > 1 && (
          <nav aria-label="Contents" className="mt-4">
            <h3 className="text-sm font-mono uppercase tracking-widest text-slate-300 mb-1">Contents</h3>
            <ol className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {item.sections.map((s) => (
                <li key={s.heading}>
                  <a
                    className={`underline text-slate-100 hover:text-[#ffb400] ${FOCUS}`}
                    href={`#pr-sec-${item.id}-${slug(s.heading)}`}
                  >
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="mt-4 space-y-5">
          {(item.sections || []).map((s) => (
            <section key={s.heading} id={`pr-sec-${item.id}-${slug(s.heading)}`} aria-label={s.heading}>
              <h3 className="text-base font-semibold text-white border-b border-white/15 pb-1 mb-2">{s.heading}</h3>
              {s.rows.length ? (
                <ul className="space-y-1.5">
                  {s.rows.map((row, i) => (
                    <li key={`${row.label}-${i}`} className="text-sm flex flex-col md:flex-row md:gap-3">
                      <span className={`font-mono break-all md:w-2/5 shrink-0 ${SEVERITY[row.tone || 'info'].text}`}>
                        {row.label}
                      </span>
                      <span className="text-slate-200 break-words">
                        {row.value}
                        {row.url && isGithubHtmlUrl(row.url) && (
                          <>
                            {' '}
                            <a
                              className={`underline text-[#ffb400] ${FOCUS}`}
                              href={row.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              open
                              <span className="sr-only"> {row.label} on github.com</span>
                            </a>
                          </>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-300">{s.empty || 'Nothing here.'}</p>
              )}
            </section>
          ))}
        </div>

        <p className="mt-6 text-sm text-slate-300 border-t border-white/15 pt-3">
          Read-only snapshot. This surface never merges, comments or writes; act on github.com.
          {item.derived ? ' Some values on this card are derived (see README-PROTO.md).' : ''}
        </p>
      </div>
    </div>,
    document.body,
  );
};
