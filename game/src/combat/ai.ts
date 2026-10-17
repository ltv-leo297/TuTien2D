import type { Monster, Skill } from './monsters.ts';
export type Situation = {
    distance: number;
    airborne: boolean;
    guarding: boolean;
    healthRatio: number;
    stamina: number;
    mana: number;
    cooldowns: Readonly<Record<string, number>>;
    lastSkill: string | null;
};
/** Deterministic PRNG for replay/tests. Production gets a new crypto seed per encounter. */
export function seededRandom(seed: number) { let state = seed >>> 0; return () => { state += 0x6D2B79F5; let t = state; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function candidates(monster: Monster, s: Situation): {
    skill: Skill;
    weight: number;
}[] {
    return monster.skills.filter(k => s.distance >= k.range[0] && s.distance <= k.range[1] && (s.cooldowns[k.id] ?? 0) <= 0 && s.stamina >= k.stamina && s.mana >= k.mana).map(skill => {
        let weight = skill.weight;
        if (skill.id === s.lastSkill)
            weight *= .15;
        if (s.guarding && !skill.blockable)
            weight *= 2.5;
        if (s.airborne)
            weight *= skill.kind === 'projectile' ? 1.8 : skill.kind === 'ground' ? .35 : .5;
        if (s.distance < 150 && skill.kind === 'melee')
            weight *= 2;
        if (s.healthRatio < .35)
            weight *= skill.kind === 'projectile' || skill.kind === 'ground' ? 1.3 : .8;
        return {
            skill, weight
        };
    });
}
export function chooseSkill(monster: Monster, s: Situation, random: () => number) {
    const choices = candidates(monster, s);
    if (!choices.length)
        return null;
    let roll = random() * choices.reduce((n, c) => n + c.weight, 0);
    for (const c of choices) {
        roll -= c.weight;
        if (roll <= 0)
            return c.skill;
    }
    return choices[choices.length - 1].skill;
}
