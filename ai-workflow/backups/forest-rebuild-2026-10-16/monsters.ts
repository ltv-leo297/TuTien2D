import type { Stats, DamageSpec } from './stats.ts';
import { PLAYER_STATS } from './stats.ts';
export type Skill = {
    id: string;
    name: {
        vi: string;
        en: string;
    };
    description: string;
    kind: 'projectile' | 'ground' | 'melee' | 'dash';
    damage: DamageSpec;
    stamina: number;
    mana: number;
    cooldown: number;
    weight: number;
    range: [
        number,
        number
    ];
    windup: number;
    recovery: number;
    duration: number;
    blockable: boolean;
    radius: number;
    height: number;
    count?: number;
    interval?: number;
    projectileSpeed?: number;
    spread?: number;
    travel?: number;
};
export type Monster = {
    name: {
        vi: string;
        en: string;
    };
    level: number;
    stats: Stats;
    art: {
        row: number;
        sheet: 'classic'|'forest';
        mapTile: number;
        mapSize: number;
        size: number;
        color: string;
    };
    forest: {
        x: number;
        y: number;
        skin: 'A' | 'B' | 'C' | 'D';
    };
    ai: {
        preferredRange: [
            number,
            number
        ];
        moveSpeed: number;
        decisionDelay: [
            number,
            number
        ];
        staminaRegen: number;
        manaRegen: number;
    };
    skills: Skill[];
};
/** Add a monster here. Existing skill kinds need no changes to AI or renderer.
 * Damage is derived from stats + coefficient; never put raw damage in a skill.
 * Units: seconds, world pixels, world pixels/second. See ai-workflow/MONSTERS.md.
 */
export const MONSTERS = {
  "wood-yao": {
    "name": {
      "vi": "Mộc Yêu non",
      "en": "Young Wood Spirit"
    },
    "level": 1,
    "stats": {
      "life": 240,
      "stamina": 85,
      "spiritualPower": 55,
      "attack": 18,
      "killingIntent": 0,
      "defense": 10,
      "magicResistance": 8,
      "willpower": 12,
      "speed": 12,
      "accuracy": 13
    },
    "art": {
      "row": 4,
      "size": 84,
      "color": "#efd985",
      "sheet": "classic",
      "mapTile": 4,
      "mapSize": 68
    },
    "forest": {
      "x": 408,
      "y": 468,
      "skin": "B"
    },
    "ai": {
      "preferredRange": [
        110,
        310
      ],
      "moveSpeed": 80,
      "decisionDelay": [
        0.65,
        1.2
      ],
      "staminaRegen": 12,
      "manaRegen": 5
    },
    "skills": [
      {
        "id": "seed-volley",
        "name": {
          "vi": "Liên Hạt",
          "en": "Seed volley"
        },
        "description": "Ba hạt bắn theo hướng đã báo; nhảy hoặc đỡ.",
        "kind": "projectile",
        "damage": {
          "type": "physical",
          "coefficient": 1.5
        },
        "stamina": 12,
        "mana": 0,
        "cooldown": 3.8,
        "weight": 3,
        "range": [
          140,
          1000
        ],
        "windup": 0.75,
        "recovery": 0.65,
        "duration": 0.7,
        "blockable": true,
        "radius": 9,
        "height": 0,
        "count": 3,
        "interval": 0.25,
        "projectileSpeed": 330,
        "spread": 0
      },
      {
        "id": "root-snare",
        "name": {
          "vi": "Địa Căn",
          "en": "Root snare"
        },
        "description": "Rễ trồi tại vị trí đã đánh dấu; nhảy cao hoặc rời vùng.",
        "kind": "ground",
        "damage": {
          "type": "magic",
          "coefficient": 2
        },
        "stamina": 0,
        "mana": 16,
        "cooldown": 5.5,
        "weight": 2,
        "range": [
          0,
          900
        ],
        "windup": 0.9,
        "recovery": 0.8,
        "duration": 0.55,
        "blockable": false,
        "radius": 65,
        "height": 95
      },
      {
        "id": "branch-sweep",
        "name": {
          "vi": "Hoành Chi",
          "en": "Branch sweep"
        },
        "description": "Quét cành phía trước ở cự ly gần; đỡ hoặc nhảy.",
        "kind": "melee",
        "damage": {
          "type": "physical",
          "coefficient": 2
        },
        "stamina": 18,
        "mana": 0,
        "cooldown": 2.8,
        "weight": 3,
        "range": [
          0,
          145
        ],
        "windup": 0.65,
        "recovery": 0.85,
        "duration": 0.22,
        "blockable": true,
        "radius": 125,
        "height": 95
      },
      {
        "id": "trunk-rush",
        "name": {
          "vi": "Mộc Xung",
          "en": "Trunk rush"
        },
        "description": "Lao theo một hướng khóa sẵn, có vạch báo toàn quãng lao.",
        "kind": "dash",
        "damage": {
          "type": "physical",
          "coefficient": 2.5
        },
        "stamina": 28,
        "mana": 0,
        "cooldown": 7,
        "weight": 1.5,
        "range": [
          180,
          550
        ],
        "windup": 1,
        "recovery": 1,
        "duration": 0.55,
        "blockable": true,
        "radius": 40,
        "height": 75,
        "travel": 300
      }
    ]
  },
  "spore-yao": {
    "name": {
      "vi": "Bào Tử Yêu",
      "en": "Spore Spirit"
    },
    "level": 1,
    "stats": {
      "life": 210,
      "stamina": 60,
      "spiritualPower": 95,
      "attack": 16,
      "killingIntent": 0,
      "defense": 7,
      "magicResistance": 14,
      "willpower": 17,
      "speed": 14,
      "accuracy": 17
    },
    "art": {
      "row": 5,
      "size": 84,
      "color": "#deb0ec",
      "sheet": "classic",
      "mapTile": 5,
      "mapSize": 54
    },
    "forest": {
      "x": 293,
      "y": 427,
      "skin": "C"
    },
    "ai": {
      "preferredRange": [
        220,
        420
      ],
      "moveSpeed": 95,
      "decisionDelay": [
        0.6,
        1.1
      ],
      "staminaRegen": 10,
      "manaRegen": 7
    },
    "skills": [
      {
        "id": "spore-volley",
        "name": {
          "vi": "Phi Bào",
          "en": "Spore volley"
        },
        "description": "Ba cầu bào tử nhắm điểm đã báo, không đuổi theo người chơi.",
        "kind": "projectile",
        "damage": {
          "type": "magic",
          "coefficient": 1.5
        },
        "stamina": 0,
        "mana": 12,
        "cooldown": 3.5,
        "weight": 3,
        "range": [
          140,
          1000
        ],
        "windup": 0.8,
        "recovery": 0.65,
        "duration": 0.75,
        "blockable": true,
        "radius": 14,
        "height": 0,
        "count": 3,
        "interval": 0.28,
        "projectileSpeed": 240,
        "spread": 0
      },
      {
        "id": "spore-field",
        "name": {
          "vi": "Bào Vực",
          "en": "Spore field"
        },
        "description": "Vùng bào tử khóa vị trí; một hit mỗi lần thi triển.",
        "kind": "ground",
        "damage": {
          "type": "magic",
          "coefficient": 2
        },
        "stamina": 0,
        "mana": 20,
        "cooldown": 6,
        "weight": 2,
        "range": [
          0,
          900
        ],
        "windup": 1,
        "recovery": 0.8,
        "duration": 1.1,
        "blockable": false,
        "radius": 85,
        "height": 100
      },
      {
        "id": "spore-fan",
        "name": {
          "vi": "Tán Bào",
          "en": "Spore fan"
        },
        "description": "Năm cầu bắn đồng thời theo hình quạt đã báo.",
        "kind": "projectile",
        "damage": {
          "type": "magic",
          "coefficient": 1.5
        },
        "stamina": 0,
        "mana": 24,
        "cooldown": 6.5,
        "weight": 1.5,
        "range": [
          100,
          750
        ],
        "windup": 1,
        "recovery": 0.95,
        "duration": 0.25,
        "blockable": true,
        "radius": 11,
        "height": 0,
        "count": 5,
        "interval": 0,
        "projectileSpeed": 285,
        "spread": 0.6
      },
      {
        "id": "cap-slam",
        "name": {
          "vi": "Chấn Tán",
          "en": "Cap slam"
        },
        "description": "Đập mũ nấm phía trước để đẩy lùi áp sát; nhảy hoặc đỡ.",
        "kind": "melee",
        "damage": {
          "type": "physical",
          "coefficient": 2
        },
        "stamina": 18,
        "mana": 0,
        "cooldown": 3,
        "weight": 4,
        "range": [
          0,
          160
        ],
        "windup": 0.7,
        "recovery": 0.9,
        "duration": 0.25,
        "blockable": true,
        "radius": 135,
        "height": 85
      }
    ]
  },
  "bamboo-serpent": {
    "name": {
      "vi": "Trúc Diệp Xà",
      "en": "Bamboo Leaf Serpent"
    },
    "level": 1,
    "stats": {
      "life": 190,
      "stamina": 90,
      "spiritualPower": 60,
      "attack": 17,
      "killingIntent": 0,
      "defense": 7,
      "magicResistance": 10,
      "willpower": 12,
      "speed": 19,
      "accuracy": 18
    },
    "art": {
      "row": 0,
      "size": 84,
      "color": "#a6dc73",
      "sheet": "forest",
      "mapTile": 6,
      "mapSize": 75
    },
    "forest": {
      "x": 1567,
      "y": 384,
      "skin": "B"
    },
    "ai": {
      "preferredRange": [
        90,
        220
      ],
      "moveSpeed": 115,
      "decisionDelay": [
        0.65,
        1.2
      ],
      "staminaRegen": 12,
      "manaRegen": 5
    },
    "skills": [
      {
        "id": "leaf-darts",
        "name": {
          "vi": "Phi Diệp",
          "en": "Leaf darts"
        },
        "description": "Bắn ba lá trúc theo hướng đã báo.",
        "kind": "projectile",
        "damage": {
          "type": "physical",
          "coefficient": 1.5
        },
        "stamina": 12,
        "mana": 0,
        "cooldown": 3.8,
        "weight": 3,
        "range": [
          140,
          1000
        ],
        "windup": 0.75,
        "recovery": 0.65,
        "duration": 0.7,
        "blockable": true,
        "radius": 9,
        "height": 0,
        "count": 3,
        "interval": 0.25,
        "projectileSpeed": 360,
        "spread": 0
      },
      {
        "id": "bamboo-thorns",
        "name": {
          "vi": "Trúc Thứ",
          "en": "Bamboo thorns"
        },
        "description": "Gai trúc mọc ở vị trí khóa sẵn.",
        "kind": "ground",
        "damage": {
          "type": "magic",
          "coefficient": 2
        },
        "stamina": 0,
        "mana": 16,
        "cooldown": 5.5,
        "weight": 2,
        "range": [
          0,
          900
        ],
        "windup": 0.9,
        "recovery": 0.8,
        "duration": 0.55,
        "blockable": false,
        "radius": 55,
        "height": 80
      },
      {
        "id": "fang-bite",
        "name": {
          "vi": "Xà Nha",
          "en": "Fang bite"
        },
        "description": "Cắn phía trước; nhảy hoặc đỡ.",
        "kind": "melee",
        "damage": {
          "type": "physical",
          "coefficient": 2
        },
        "stamina": 18,
        "mana": 0,
        "cooldown": 2.8,
        "weight": 3,
        "range": [
          0,
          145
        ],
        "windup": 0.65,
        "recovery": 0.85,
        "duration": 0.22,
        "blockable": true,
        "radius": 105,
        "height": 95
      },
      {
        "id": "serpent-rush",
        "name": {
          "vi": "Xà Ảnh",
          "en": "Serpent rush"
        },
        "description": "Lao một hướng theo vạch báo.",
        "kind": "dash",
        "damage": {
          "type": "physical",
          "coefficient": 2.5
        },
        "stamina": 28,
        "mana": 0,
        "cooldown": 7,
        "weight": 1.5,
        "range": [
          180,
          550
        ],
        "windup": 1,
        "recovery": 1,
        "duration": 0.55,
        "blockable": true,
        "radius": 40,
        "height": 75,
        "travel": 340
      }
    ]
  },
  "jade-beast": {
    "name": {
      "vi": "Thanh Nham Thú",
      "en": "Jade Crag Beast"
    },
    "level": 2,
    "stats": {
      "life": 340,
      "stamina": 110,
      "spiritualPower": 80,
      "attack": 22,
      "killingIntent": 0,
      "defense": 15,
      "magicResistance": 13,
      "willpower": 18,
      "speed": 9,
      "accuracy": 12
    },
    "art": {
      "row": 1,
      "size": 112,
      "color": "#91e6db",
      "sheet": "forest",
      "mapTile": 7,
      "mapSize": 180
    },
    "forest": {
      "x": 322,
      "y": 752,
      "skin": "A"
    },
    "ai": {
      "preferredRange": [
        100,
        250
      ],
      "moveSpeed": 62,
      "decisionDelay": [
        0.9,
        1.4
      ],
      "staminaRegen": 12,
      "manaRegen": 5
    },
    "skills": [
      {
        "id": "jade-shards",
        "name": {
          "vi": "Ngọc Phiến",
          "en": "Jade shards"
        },
        "description": "Ba mảnh ngọc theo hướng khóa sẵn.",
        "kind": "projectile",
        "damage": {
          "type": "physical",
          "coefficient": 1.5
        },
        "stamina": 12,
        "mana": 0,
        "cooldown": 3.8,
        "weight": 3,
        "range": [
          140,
          1000
        ],
        "windup": 1,
        "recovery": 1,
        "duration": 0.7,
        "blockable": true,
        "radius": 9,
        "height": 0,
        "count": 3,
        "interval": 0.25,
        "projectileSpeed": 265,
        "spread": 0
      },
      {
        "id": "crag-eruption",
        "name": {
          "vi": "Nham Trồi",
          "en": "Crag eruption"
        },
        "description": "Đá trồi dưới điểm đã đánh dấu.",
        "kind": "ground",
        "damage": {
          "type": "magic",
          "coefficient": 2
        },
        "stamina": 0,
        "mana": 16,
        "cooldown": 5.5,
        "weight": 2,
        "range": [
          0,
          900
        ],
        "windup": 1.2,
        "recovery": 1,
        "duration": 0.55,
        "blockable": false,
        "radius": 85,
        "height": 100
      },
      {
        "id": "stone-sweep",
        "name": {
          "vi": "Thạch Trảo",
          "en": "Stone sweep"
        },
        "description": "Quét chân trước trong vùng báo.",
        "kind": "melee",
        "damage": {
          "type": "physical",
          "coefficient": 2
        },
        "stamina": 18,
        "mana": 0,
        "cooldown": 2.8,
        "weight": 3,
        "range": [
          0,
          145
        ],
        "windup": 1,
        "recovery": 1,
        "duration": 0.22,
        "blockable": true,
        "radius": 140,
        "height": 95
      },
      {
        "id": "boulder-charge",
        "name": {
          "vi": "Nham Xung",
          "en": "Boulder charge"
        },
        "description": "Lao nặng theo vạch báo, nghỉ lâu sau chiêu.",
        "kind": "dash",
        "damage": {
          "type": "physical",
          "coefficient": 2.5
        },
        "stamina": 28,
        "mana": 0,
        "cooldown": 7,
        "weight": 1.5,
        "range": [
          180,
          550
        ],
        "windup": 1.2,
        "recovery": 1.3,
        "duration": 0.55,
        "blockable": true,
        "radius": 40,
        "height": 75,
        "travel": 260
      }
    ]
  }
} satisfies Record<string, Monster>;
export type MonsterId = keyof typeof MONSTERS;
export const MONSTER_IDS = Object.keys(MONSTERS) as MonsterId[];
export const isMonster = (id: string): id is MonsterId => Object.hasOwn(MONSTERS, id);
export function validateMonster(id: string, m: Monster) {
    const fail = (why: string) => { throw new Error(`${id}: ${why}`); };
    if (!m.name.vi || !m.name.en || !Number.isInteger(m.level) || m.level < 1 || m.level > 15)
        fail('name/level');
    for (const key of Object.keys(PLAYER_STATS) as (keyof Stats)[])
        if (!Number.isFinite(m.stats[key]) || m.stats[key] < 0)
            fail('stats');
    if (m.stats.life <= 0 || m.stats.speed <= 0)
        fail('life/speed');
    if (!['classic','forest'].includes(m.art.sheet) || !Number.isInteger(m.art.mapTile) || m.art.mapTile < 4 || m.art.mapTile > 7) fail('art sheet/map tile');
    if (!Number.isInteger(m.art.row) || m.art.row < 0 || m.art.row > 5 || !Number.isFinite(m.art.size) || m.art.size <= 0 || !/^#[0-9a-f]{6}$/i.test(m.art.color))
        fail('art');
    if (!['A', 'B', 'C', 'D'].includes(m.forest.skin) || !Number.isFinite(m.forest.x) || !Number.isFinite(m.forest.y))
        fail('forest placement');
    for (const n of [...m.ai.preferredRange, ...m.ai.decisionDelay, m.ai.moveSpeed, m.ai.staminaRegen, m.ai.manaRegen])
        if (!Number.isFinite(n) || n < 0)
            fail('AI numbers');
    if (m.ai.preferredRange[0] > m.ai.preferredRange[1] || m.ai.decisionDelay[0] > m.ai.decisionDelay[1])
        fail('AI range');
    if (m.skills.length < 3 || m.skills.length > 5 || new Set(m.skills.map(s => s.id)).size !== m.skills.length)
        fail('3–5 unique skills');
    for (const s of m.skills) {
        if (!s.id || !s.name.vi || !s.name.en)
            fail('skill name');
        if (!['projectile', 'ground', 'melee', 'dash'].includes(s.kind) || typeof s.blockable !== 'boolean')
            fail('skill kind/blockable');
        if (!['physical', 'magic', 'sword'].includes(s.damage.type) || s.damage.coefficient < 1 || s.damage.coefficient > 10 || !Number.isInteger(s.damage.coefficient * 2))
            fail('coefficient/type');
        for (const n of [s.stamina, s.mana, s.cooldown, s.weight, ...s.range, s.windup, s.recovery, s.duration, s.radius, s.height])
            if (!Number.isFinite(n) || n < 0)
                fail('skill numbers');
        if (s.windup < .45 || s.duration <= 0 || s.cooldown <= 0 || s.weight <= 0 || s.radius <= 0 || s.range[0] > s.range[1] || s.stamina > m.stats.stamina || s.mana > m.stats.spiritualPower)
            fail('skill limits');
        if (s.kind === 'projectile') {
            const { count, projectileSpeed, interval, spread } = s;
            if (![count, projectileSpeed, interval, spread].every(Number.isFinite) || !Number.isInteger(count) || (count ?? 0) < 1 || (count ?? 0) > 8 || (projectileSpeed ?? 0) <= 0 || (interval ?? -1) < 0 || (spread ?? -1) < 0 || (spread ?? 0) > Math.PI || (count === 1 && spread !== 0) || interval! * (count! - 1) >= s.duration)
                fail('projectile');
        }
        if (s.kind === 'dash' && (!Number.isFinite(s.travel) || (s.travel ?? 0) <= 0))
            fail('dash travel');
    }
}
for (const id of MONSTER_IDS)
    validateMonster(id, MONSTERS[id]);
