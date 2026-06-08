import { resolveBattleWithEngine } from "./battleEngine.js";

export function resolveBattle(p1, p2) {
  return resolveBattleWithEngine(p1, p2, "standard");
}
