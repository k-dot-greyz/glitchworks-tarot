export const ORACLE_LAYOUTS = {
  threeCard: {
    id: 'threeCard',
    label: 'PAST / PRESENT / FUTURE (3 CARDS)',
    cardCount: 3,
  },
  celticCross: {
    id: 'celticCross',
    label: 'CELTIC CROSS (5 CARDS)',
    cardCount: 5,
  },
  theClash: {
    id: 'theClash',
    label: 'THE CLASH (3 CARDS)',
    cardCount: 3,
  },
};

export function spreadCardCount(layout) {
  return ORACLE_LAYOUTS[layout]?.cardCount ?? 3;
}
