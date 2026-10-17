import { MONSTERS } from './monsters.ts';
import type { MonsterId, Monster, Skill } from './monsters.ts';
import { PLAYER_STATS, PLAYER_ATTACK, PLAYER_SKILL, damage, speedFactor, staggerDuration, aimError } from './stats.ts';
import type { Stats, DamageSpec } from './stats.ts';
import { chooseSkill, seededRandom } from './ai.ts';
export const ARENA_W = 1280, ARENA_H = 720, FLOOR = 500;
export type Action = 'left' | 'right' | 'jump' | 'attack' | 'guard' | 'dash' | 'skill';
export type Outcome = 'win' | 'lose' | 'retreat';
type Shot = {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    friendly: boolean;
    life: number;
    damage: number;
    blockable: boolean;
    skillId: string;
};
type Spark = {
    x: number;
    y: number;
    life: number;
    color: string;
};
export type Cast = {
    skill: Skill;
    face: number;
    x: number;
    targetX: number;
    targetY: number;
    angle: number;
    hit: boolean;
    shotsLeft: number;
    shootTimer: number;
    elapsed: number;
};
/** Swept segment against expanded hurtbox, including diagonal shots. */
export function segmentHits(x0: number, y0: number, x1: number, y1: number, cx: number, cy: number, halfW: number, halfH: number) {
    let lo = 0, hi = 1;
    for (const [start, end, center, half] of [[x0, x1, cx, halfW], [y0, y1, cy, halfH]]) {
        const delta = end - start;
        if (Math.abs(delta) < 1e-9) {
            if (start < center - half || start > center + half)
                return false;
            continue;
        }
        const a = (center - half - start) / delta, b = (center + half - start) / delta;
        lo = Math.max(lo, Math.min(a, b));
        hi = Math.min(hi, Math.max(a, b));
        if (lo > hi)
            return false;
    }
    return true;
}
export class CombatSimulation {
    monster: MonsterId;
    definition: Monster;
    playerStats: Readonly<Stats>;
    enemyStats: Readonly<Stats>;
    time = 0;
    hp: number;
    maxHp: number;
    stamina: number;
    mana: number;
    enemyHp: number;
    enemyMax: number;
    enemyStamina: number;
    enemyMana: number;
    x = 280;
    y = FLOOR;
    vx = 0;
    vy = 0;
    face = 1;
    jumps = 0;
    moving = false;
    guarding = false;
    attack = 0;
    attackCooldown = 0;
    skillCooldown = 0;
    dash = 0;
    dashCooldown = 0;
    invulnerable = 0;
    hurt = 0;
    stagger = 0;
    enemyStagger = 0;
    enemyX = 940;
    enemyFace = -1;
    enemyPhase: 'rest' | 'warn-shot' | 'shoot' | 'warn-root' | 'root' | 'warn-melee' | 'melee' | 'warn-dash' | 'rush' = 'rest';
    enemyTimer = 1.4;
    enemyAttack = 0;
    rootX = 0;
    cooldowns: Record<string, number> = {};
    cast: Cast | null = null;
    lastSkill: string | null = null;
    decisions: {
        time: number;
        id: string;
        targetX: number;
        targetY: number;
    }[] = [];
    lastDamage: {
        source: 'player' | 'monster';
        skill: string;
        amount: number;
    } | null = null;
    outcome: Outcome | null = null;
    paused = false;
    shots: Shot[] = [];
    sparks: Spark[] = [];
    input = new Set<Action>();
    private queued = new Set<Action>();
    private hit = false;
    private serial = 0;
    private accumulator = 0;
    private random: () => number;
    constructor(monster: MonsterId, options: {
        seed?: number;
        playerStats?: Stats;
    } = {}) {
        this.monster = monster;
        this.definition = structuredClone(MONSTERS[monster]);
        this.playerStats = Object.freeze({
            ...options.playerStats ?? PLAYER_STATS
        });
        this.enemyStats = Object.freeze({
            ...this.definition.stats
        });
        this.hp = this.maxHp = this.playerStats.life;
        this.stamina = this.playerStats.stamina;
        this.mana = this.playerStats.spiritualPower;
        this.enemyHp = this.enemyMax = this.enemyStats.life;
        this.enemyStamina = this.enemyStats.stamina;
        this.enemyMana = this.enemyStats.spiritualPower;
        this.random = seededRandom(options.seed ?? crypto.getRandomValues(new Uint32Array(1))[0]);
    }
    press(action: Action) { if (this.paused || this.outcome)
        return; if (!this.input.has(action))
        this.queued.add(action); this.input.add(action); }
    release(action: Action) { this.input.delete(action); }
    clear() { this.input.clear(); this.queued.clear(); this.guarding = false; this.vx = 0; this.moving = false; }
    pause(value: boolean) { this.paused = value; this.clear(); }
    end(outcome: Outcome) { if (this.outcome)
        return; this.outcome = outcome; this.clear(); this.shots = []; this.cast = null; }
    update(dt: number) { if (this.paused || this.outcome)
        return; this.accumulator += Math.max(0, Math.min(dt, .1)); while (this.accumulator >= 1 / 120 && !this.outcome) {
        this.step(1 / 120);
        this.accumulator -= 1 / 120;
    } }
    private step(dt: number) {
        this.time += dt;
        for (const key of ['attack', 'attackCooldown', 'skillCooldown', 'dash', 'dashCooldown', 'invulnerable', 'hurt', 'enemyAttack', 'stagger', 'enemyStagger'] as const)
            this[key] = Math.max(0, this[key] - dt);
        const direction = Number(this.input.has('right')) - Number(this.input.has('left')), speed = speedFactor(this.playerStats);
        this.guarding = this.input.has('guard') && this.stamina > 1 && this.y >= FLOOR && this.dash === 0 && this.attack === 0;
        if (direction && this.dash === 0)
            this.face = direction;
        if (this.queued.has('jump') && this.jumps < 2 && !this.guarding) {
            this.vy = this.jumps === 0 ? -590 : -510;
            this.jumps++;
        }
        if (this.queued.has('dash') && this.dashCooldown === 0 && this.stamina >= 22 && !this.guarding) {
            this.dash = .2;
            this.dashCooldown = .8;
            this.stamina -= 22;
            this.invulnerable = Math.max(this.invulnerable, .2);
        }
        if (this.input.has('attack') && this.attackCooldown === 0 && !this.guarding && this.dash === 0 && this.stagger === 0) {
            this.attack = .28 / speed;
            this.attackCooldown = .42 / speed;
            this.hit = false;
        }
        if (this.queued.has('skill') && this.skillCooldown === 0 && this.mana >= 18 && !this.guarding && this.stagger === 0) {
            this.mana -= 18;
            this.skillCooldown = 3.2;
            this.shots.push({
                id: ++this.serial, x: this.x + this.face * 35, y: this.y - 38, vx: this.face * 700, vy: 0, r: 19, friendly: true, life: 2, damage: damage(this.playerStats, this.enemyStats, PLAYER_SKILL), blockable: true, skillId: 'spirit-slash'
            });
        }
        this.queued.clear();
        this.stamina = Math.max(0, Math.min(this.playerStats.stamina, this.stamina + (this.guarding ? -20 : 17) * dt));
        this.mana = Math.min(this.playerStats.spiritualPower, this.mana + 3 * dt);
        this.vx = this.dash > 0 ? this.face * 690 : direction * (this.guarding ? 60 : 245) * speed * (this.stagger > 0 ? .5 : 1);
        this.x = Math.max(28, Math.min(ARENA_W - 28, this.x + this.vx * dt));
        this.moving = Math.abs(this.vx) > 0;
        this.vy += 1400 * dt;
        this.y += this.vy * dt;
        if (this.y >= FLOOR) {
            this.y = FLOOR;
            this.vy = 0;
            this.jumps = 0;
        }
        if (this.attack > .08 / speed && !this.hit && (this.enemyX - this.x) * this.face >= -15 && Math.abs(this.enemyX - this.x) < 115 && Math.abs(FLOOR - this.y) < 100) {
            this.hit = true;
            this.damageEnemy(damage(this.playerStats, this.enemyStats, PLAYER_ATTACK), 'basic-attack');
        }
        if (this.enemyHp <= 0) {
            this.end('win');
            return;
        }
        this.updateEnemy(dt);
        for (const shot of this.shots) {
            const oldX = shot.x, oldY = shot.y;
            shot.x += shot.vx * dt;
            shot.y += shot.vy * dt;
            shot.life -= dt;
            const tx = shot.friendly ? this.enemyX : this.x, ty = shot.friendly ? FLOOR - 35 : this.y - 38;
            if (segmentHits(oldX, oldY, shot.x, shot.y, tx, ty, shot.r + 23, shot.r + 30)) {
                if (shot.friendly)
                    this.damageEnemy(shot.damage, shot.skillId);
                else
                    this.damagePlayer(shot.damage, oldX, shot.blockable, shot.skillId);
                shot.life = 0;
            }
        }
        this.shots = this.shots.filter(s => s.life > 0 && s.x > -60 && s.x < ARENA_W + 60 && s.y > -200 && s.y < ARENA_H + 60);
        for (const s of this.sparks)
            s.life -= dt;
        this.sparks = this.sparks.filter(s => s.life > 0).slice(-30);
        if (this.hp <= 0)
            this.end('lose');
        else if (this.enemyHp <= 0)
            this.end('win');
    }
    private updateEnemy(dt: number) {
        const ai = this.definition.ai, speed = speedFactor(this.enemyStats);
        this.enemyStamina = Math.min(this.enemyStats.stamina, this.enemyStamina + ai.staminaRegen * dt);
        this.enemyMana = Math.min(this.enemyStats.spiritualPower, this.enemyMana + ai.manaRegen * dt);
        for (const id of Object.keys(this.cooldowns))
            this.cooldowns[id] = Math.max(0, this.cooldowns[id] - dt);
        if (this.enemyPhase === 'rest') {
            this.enemyFace = this.x < this.enemyX ? -1 : 1;
            if (this.enemyStagger > 0)
                return;
            const distance = Math.abs(this.x - this.enemyX), [near, far] = ai.preferredRange;
            const motion = distance > far ? 1 : distance < near ? -.55 : 0;
            this.enemyX = Math.max(90, Math.min(ARENA_W - 90, this.enemyX + this.enemyFace * motion * ai.moveSpeed * speed * dt));
            this.enemyTimer -= dt;
            if (this.enemyTimer <= 0) {
                const skill = chooseSkill(this.definition, {
                    distance, airborne: this.y < FLOOR - 65, guarding: this.guarding, healthRatio: this.enemyHp / this.enemyMax, stamina: this.enemyStamina, mana: this.enemyMana, cooldowns: this.cooldowns, lastSkill: this.lastSkill
                }, this.random);
                if (skill)
                    this.startCast(skill);
                else
                    this.enemyTimer = .25;
            }
            return;
        }
        const cast = this.cast!;
        this.enemyTimer -= dt;
        if (this.enemyPhase.startsWith('warn')) {
            if (this.enemyTimer <= 0) {
                this.enemyPhase = cast.skill.kind === 'projectile' ? 'shoot' : cast.skill.kind === 'ground' ? 'root' : cast.skill.kind === 'melee' ? 'melee' : 'rush';
                this.enemyTimer = cast.skill.duration;
            }
            else
                return;
        }
        if (this.enemyTimer <= 0) {
            this.enemyPhase = 'rest';
            this.cast = null;
            this.enemyTimer = (cast.skill.recovery + ai.decisionDelay[0] + this.random() * (ai.decisionDelay[1] - ai.decisionDelay[0])) / speed;
            return;
        }
        cast.elapsed += dt;
        const k = cast.skill;
        if (k.kind === 'projectile') {
            cast.shootTimer -= dt;
            while (cast.shotsLeft > 0 && cast.shootTimer <= 0) {
                const index = k.count! - cast.shotsLeft, offset = k.count! > 1 ? (index / (k.count! - 1) - .5) * k.spread! : 0, angle = cast.angle + offset;
                this.shots.push({
                    id: ++this.serial, x: this.enemyX + cast.face * 30, y: FLOOR - 34, vx: Math.cos(angle) * k.projectileSpeed!, vy: Math.sin(angle) * k.projectileSpeed!, r: k.radius, friendly: false, life: 5, damage: damage(this.enemyStats, this.playerStats, k.damage), blockable: k.blockable, skillId: k.id
                });
                cast.shotsLeft--;
                cast.shootTimer += k.interval!;
                this.enemyAttack = .22;
            }
        }
        else {
            if (k.kind === 'dash')
                this.enemyX = Math.max(90, Math.min(ARENA_W - 90, cast.x + cast.face * k.travel! * Math.min(1, cast.elapsed / k.duration)));
            const relative = (this.x - this.enemyX) * cast.face;
            const inRange = k.kind === 'ground' ? Math.abs(this.x - cast.targetX) < k.radius : k.kind === 'melee' ? relative >= -20 && relative < k.radius : Math.abs(this.x - this.enemyX) < k.radius;
            if (!cast.hit && inRange && this.y > FLOOR - k.height) {
                cast.hit = true;
                this.monsterHit(k.damage, k.kind === 'ground' ? cast.targetX : this.enemyX, k.blockable, k.id);
            }
            this.enemyAttack = .1;
        }
    }
    private startCast(skill: Skill) {
        this.enemyStamina -= skill.stamina;
        this.enemyMana -= skill.mana;
        this.cooldowns[skill.id] = skill.cooldown;
        const error = aimError(this.enemyStats), targetX = Math.max(28, Math.min(ARENA_W - 28, this.x + (this.random() * 2 - 1) * error)), targetY = this.y - 38;
        const face = targetX < this.enemyX ? -1 : 1;
        this.cast = {
            skill, face, x: this.enemyX, targetX, targetY, angle: Math.atan2(targetY - (FLOOR - 34), targetX - (this.enemyX + face * 30)), hit: false, shotsLeft: skill.count ?? 0, shootTimer: 0, elapsed: 0
        };
        this.enemyFace = face;
        this.rootX = targetX;
        this.lastSkill = skill.id;
        this.enemyPhase = skill.kind === 'projectile' ? 'warn-shot' : skill.kind === 'ground' ? 'warn-root' : skill.kind === 'melee' ? 'warn-melee' : 'warn-dash';
        this.enemyTimer = Math.max(.45, skill.windup / speedFactor(this.enemyStats));
        this.decisions.push({
            time: this.time, id: skill.id, targetX, targetY
        });
        this.decisions = this.decisions.slice(-32);
    }
    private monsterHit(spec: DamageSpec, sourceX: number, blockable: boolean, id: string) { this.damagePlayer(damage(this.enemyStats, this.playerStats, spec), sourceX, blockable, id); }
    private damageEnemy(amount: number, id: string) {
        this.enemyHp = Math.max(0, this.enemyHp - amount);
        this.enemyStagger = staggerDuration(this.enemyStats);
        this.lastDamage = {
            source: 'player', skill: id, amount
        };
        this.sparks.push({
            x: this.enemyX, y: FLOOR - 45, life: .3, color: '#fff6a8'
        });
    }
    damagePlayer(amount: number, sourceX: number, blockable: boolean, id = 'test') {
        if (this.invulnerable > 0 || this.outcome)
            return;
        const guarded = blockable && this.guarding && (sourceX - this.x) * this.face >= 0 && this.stamina >= 8;
        if (guarded) {
            this.stamina -= 8;
            amount = Math.ceil(amount * .15);
            this.sparks.push({
                x: this.x + this.face * 24, y: this.y - 35, life: .3, color: '#85e7ed'
            });
        }
        this.hp = Math.max(0, this.hp - amount);
        this.invulnerable = .65;
        this.hurt = .2;
        if (!guarded)
            this.stagger = staggerDuration(this.playerStats);
        this.lastDamage = {
            source: 'monster', skill: id, amount
        };
    }
    snapshot() { return {
        monster: this.monster, time: this.time, hp: this.hp, maxHp: this.maxHp, enemyHp: this.enemyHp, stamina: this.stamina, mana: this.mana, enemyStamina: this.enemyStamina, enemyMana: this.enemyMana, playerStats: {
            ...this.playerStats
        }, enemyStats: {
            ...this.enemyStats
        }, x: this.x, y: this.y, face: this.face, jumps: this.jumps, phase: this.enemyPhase, rootX: this.rootX, enemyX: this.enemyX, skillCooldown: this.skillCooldown, dashCooldown: this.dashCooldown, guarding: this.guarding, paused: this.paused, outcome: this.outcome, shots: this.shots.map(s => ({
            ...s
        })), input: [...this.input], enemySkill: this.cast?.skill.id ?? null, cooldowns: {
            ...this.cooldowns
        }, decisions: this.decisions.map(d => ({
            ...d
        })), lastDamage: this.lastDamage ? {
            ...this.lastDamage
        } : null
    }; }
}
