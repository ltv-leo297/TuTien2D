/** Shared source for the character panel and both sides of combat. */
export type Stats = {
    life: number;
    stamina: number;
    spiritualPower: number;
    attack: number;
    killingIntent: number;
    defense: number;
    magicResistance: number;
    willpower: number;
    speed: number;
    accuracy: number;
};
export type DamageType = 'physical' | 'magic' | 'sword';
export type DamageSpec = {
    type: DamageType;
    coefficient: number;
};
export const PLAYER_STATS: Readonly<Stats> = Object.freeze({
    life: 120, stamina: 80, spiritualPower: 65, attack: 18, killingIntent: 12,
    defense: 15, magicResistance: 11, willpower: 14, speed: 16, accuracy: 17,
});
export const PLAYER_ATTACK: DamageSpec = {
    type: 'physical', coefficient: 1.5
};
export const PLAYER_SKILL: DamageSpec = {
    type: 'magic', coefficient: 3
};
/** Exact formulas from the 2026-10-04 cultivation note; guard is a later stage. */
export function damage(attacker: Readonly<Stats>, target: Readonly<Stats>, skill: DamageSpec) {
    const power = attacker.attack + (skill.type === 'sword' ? attacker.killingIntent : 0);
    const resistance = skill.type === 'magic' ? target.magicResistance : target.defense + (skill.type === 'sword' ? target.magicResistance : 0);
    return Math.max(1, power * skill.coefficient - resistance);
}
export const speedFactor = (stats: Readonly<Stats>) => Math.max(.65, Math.min(1.5, stats.speed / 16));
export const staggerDuration = (stats: Readonly<Stats>) => .24 / (1 + stats.willpower / 20);
export const aimError = (stats: Readonly<Stats>) => Math.max(2, 70 / (1 + stats.accuracy / 5));
