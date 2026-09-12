import { AetherTestFixtures } from './AetherTestFixtures.js';

/**
 * Constructor-instantiated fixtures for Aether Deck component library security tests.
 * Override defaults via constructor options — no scattered magic literals in specs.
 */
export class ComponentLibraryHarness {
  constructor(options = {}) {
    this.base = new AetherTestFixtures(options);

    this.hostileStrings = {
      xssName:
        options.xssName ??
        '<img src=x onerror=alert(1)>',
      xssSub:
        options.xssSub ??
        '"><script>document.body.dataset.pwned="1"</script>',
      xssDesc:
        options.xssDesc ??
        '{{constructor.constructor("return this")()}}',
      deckName:
        options.deckName ??
        '<svg onload=alert(1)>HOSTILE DECK</svg>',
    };

    this.oracleLayouts = {
      threeCard: options.threeCardLayoutId ?? 'threeCard',
      celticCross: options.celticCrossLayoutId ?? 'celticCross',
      theClash: options.theClashLayoutId ?? 'theClash',
      agenticInjection:
        options.agenticLayoutId ?? 'agentic-injection-layout',
    };

    this.deckBacks = {
      standard: options.standardDeckBack ?? 'standard',
      agenticInjection:
        options.agenticDeckBack ?? 'agentic-injection-deckback',
    };

    this.forgedCardIds = {
      valid: options.validCardId ?? '001',
      unknown: options.unknownCardId ?? 'agentic-unknown-card-id',
    };
  }

  hostileCard(overrides = {}) {
    return this.base.validCard({
      id: overrides.id ?? this.forgedCardIds.valid,
      name: overrides.name ?? this.hostileStrings.xssName,
      sub: overrides.sub ?? this.hostileStrings.xssSub,
      desc: overrides.desc ?? this.hostileStrings.xssDesc,
      ...overrides,
    });
  }

  hostileDeckEntry(overrides = {}) {
    return {
      id: overrides.id ?? 'hostile-deck',
      name: overrides.name ?? this.hostileStrings.deckName,
      deckBack: overrides.deckBack ?? this.deckBacks.standard,
      cards: overrides.cards ?? [this.base.validCard()],
    };
  }

  oracleViewProps(overrides = {}) {
    const card = this.base.validCard();
    return {
      deck: overrides.deck ?? [card],
      deckBack: overrides.deckBack ?? this.deckBacks.standard,
      spread: overrides.spread ?? [],
      oracleLayout: overrides.oracleLayout ?? this.oracleLayouts.threeCard,
      revealedCardIds: overrides.revealedCardIds ?? [],
      oracleDragOverZone: overrides.oracleDragOverZone ?? null,
      onChangeLayout: overrides.onChangeLayout ?? (() => {}),
      onDraw: overrides.onDraw ?? (() => {}),
      onRevealAll: overrides.onRevealAll ?? (() => {}),
      onRevealCard: overrides.onRevealCard ?? (() => {}),
      onDropOnZone: overrides.onDropOnZone ?? (() => {}),
      onDragOverZone: overrides.onDragOverZone ?? (() => {}),
      onDragLeaveZone: overrides.onDragLeaveZone ?? (() => {}),
    };
  }

  dexViewProps(overrides = {}) {
    const deckEntry = this.hostileDeckEntry();
    return {
      decks: overrides.decks ?? [deckEntry],
      activeDeckId: overrides.activeDeckId ?? deckEntry.id,
      deck: overrides.deck ?? [this.base.validCard()],
      deckBack: overrides.deckBack ?? this.deckBacks.standard,
      showDeckBacks: overrides.showDeckBacks ?? false,
      editingDeckId: overrides.editingDeckId ?? null,
      editingDeckName: overrides.editingDeckName ?? '',
      newDeckName: overrides.newDeckName ?? '',
      showCreateDeckInput: overrides.showCreateDeckInput ?? false,
      onSwitchDeck: overrides.onSwitchDeck ?? (() => {}),
      onStartRename: overrides.onStartRename ?? (() => {}),
      onChangeEditingName: overrides.onChangeEditingName ?? (() => {}),
      onCommitRename: overrides.onCommitRename ?? (() => {}),
      onToggleCreate: overrides.onToggleCreate ?? (() => {}),
      onChangeNewName: overrides.onChangeNewName ?? (() => {}),
      onCreateDeck: overrides.onCreateDeck ?? (() => {}),
      onCancelCreate: overrides.onCancelCreate ?? (() => {}),
      onDuplicateDeck: overrides.onDuplicateDeck ?? (() => {}),
      onDeleteDeck: overrides.onDeleteDeck ?? (() => {}),
      onToggleCardBacks: overrides.onToggleCardBacks ?? (() => {}),
      onSelectCard: overrides.onSelectCard ?? (() => {}),
    };
  }

  forgeViewProps(overrides = {}) {
    const hostile = this.hostileCard({ id: '999' });
    return {
      forgeData: overrides.forgeData ?? hostile,
      deckBack: overrides.deckBack ?? this.deckBacks.standard,
      onChange: overrides.onChange ?? (() => {}),
      onCompile: overrides.onCompile ?? (() => {}),
      onImageUpload: overrides.onImageUpload ?? (() => {}),
    };
  }
}
