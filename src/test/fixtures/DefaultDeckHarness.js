import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateDeck } from '../../domain/deckValidation.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Constructor-instantiated harness for shipped default deck invariants.
 * Override patterns and anchors via options — no scattered literals in specs.
 */
export class DefaultDeckHarness {
  constructor(options = {}) {
    this.deckPath =
      options.deckPath ??
      join(__dirname, '../../default_deck.json');

    this.contaminationPatterns = options.contaminationPatterns ?? [
      /last\.?fm/i,
      /scrobble/i,
      /^Sync:/i,
    ];

    this.anchorCards = options.anchorCards ?? {
      fool: {
        id: options.foolId ?? '000',
        name: options.foolName ?? 'The Fool',
        sub: options.foolSub ?? 'Infinite Potential',
      },
      glitch: {
        id: options.glitchId ?? '404',
        name: options.glitchName ?? 'The Glitch',
        sub: options.glitchSub ?? 'Anomaly',
      },
    };

    this.expectedCardCount = options.expectedCardCount ?? 17;
    this.lockfilePath =
      options.lockfilePath ?? join(__dirname, '../../../package-lock.json');

    this.pinnedDependencies = options.pinnedDependencies ?? {
      '@xmldom/xmldom': { minVersion: '0.8.15' },
      'fast-uri': { minVersion: '3.1.7' },
    };
  }

  loadDeck() {
    const raw = readFileSync(this.deckPath, 'utf8');
    return JSON.parse(raw);
  }

  loadLockfile() {
    const raw = readFileSync(this.lockfilePath, 'utf8');
    return JSON.parse(raw);
  }

  assertSchemaValid(deck) {
    if (!validateDeck(deck)) {
      throw new Error('default deck failed validateDeck');
    }
    return true;
  }

  assertUniqueIds(deck) {
    const ids = deck.map((card) => card.id);
    if (new Set(ids).size !== ids.length) {
      throw new Error(`duplicate card ids: ${ids.join(', ')}`);
    }
    return true;
  }

  assertNoContamination(deck) {
    const hits = [];
    for (const card of deck) {
      const blob = `${card.name}\n${card.sub}\n${card.desc}`;
      for (const pattern of this.contaminationPatterns) {
        if (pattern.test(blob)) {
          hits.push({ id: card.id, pattern: String(pattern), field: blob });
        }
      }
    }
    if (hits.length > 0) {
      throw new Error(
        `contamination markers found: ${JSON.stringify(hits.slice(0, 3))}`,
      );
    }
    return true;
  }

  assertAnchorCards(deck) {
    for (const [key, anchor] of Object.entries(this.anchorCards)) {
      const found = deck.find((c) => c.id === anchor.id);
      if (!found) {
        throw new Error(`anchor card missing: ${key} (${anchor.id})`);
      }
      if (found.name !== anchor.name || found.sub !== anchor.sub) {
        throw new Error(
          `anchor ${key} mismatch: expected ${anchor.name}/${anchor.sub}, got ${found.name}/${found.sub}`,
        );
      }
    }
    return true;
  }

  assertCanonical(deck) {
    this.assertSchemaValid(deck);
    this.assertUniqueIds(deck);
    this.assertNoContamination(deck);
    this.assertAnchorCards(deck);
    if (deck.length !== this.expectedCardCount) {
      throw new Error(
        `expected ${this.expectedCardCount} cards, got ${deck.length}`,
      );
    }
    return true;
  }

  resolveLockfileVersion(packageName) {
    const lock = this.loadLockfile();
    const entry =
      lock.packages?.[`node_modules/${packageName}`] ??
      lock.dependencies?.[packageName];
    return entry?.version ?? null;
  }

  assertPinnedDependencies() {
    const failures = [];
    for (const [pkg, spec] of Object.entries(this.pinnedDependencies)) {
      const version = this.resolveLockfileVersion(pkg);
      if (!version) {
        failures.push(`${pkg}: not found in lockfile`);
        continue;
      }
      if (this.compareSemver(version, spec.minVersion) < 0) {
        failures.push(`${pkg}: ${version} < ${spec.minVersion}`);
      }
    }
    if (failures.length > 0) {
      throw new Error(failures.join('; '));
    }
    return true;
  }

  compareSemver(a, b) {
    const pa = a.split('.').map((n) => parseInt(n, 10));
    const pb = b.split('.').map((n) => parseInt(n, 10));
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const da = pa[i] ?? 0;
      const db = pb[i] ?? 0;
      if (da !== db) return da - db;
    }
    return 0;
  }
}
