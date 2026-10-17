import {PLAYER_STATS} from '../combat/stats.ts';
import type {Stats} from '../combat/stats.ts';
export const SLOTS=['weapon','head','body','cloak','wrists','waist','legs','jade','feet','artifact'] as const;
export type Slot=typeof SLOTS[number];
export type Item={id:string;name:{vi:string;en:string};description:{vi:string;en:string};level:number;slot:Slot|null;stackMax:number;bonuses:Partial<Stats>;iconAssetId:string;visualId:string|null};
// Single source for item definitions. Levels are intrinsic item levels, not player requirements.
export const ITEMS:Item[]=[
  {
    "id": "wood-sword",
    "iconAssetId": "item.wood-sword.b1",
    "name": {
      "vi": "Kiếm gỗ",
      "en": "Wooden Sword"
    },
    "description": {
      "vi": "Kiếm gỗ tập luyện của người mới nhập môn.",
      "en": "A wooden training sword for beginners."
    },
    "level": 1,
    "slot": "weapon",
    "stackMax": 1,
    "bonuses": {
      "attack": 3
    },
    "visualId": null
  },
  {
    "id": "bamboo-sword",
    "iconAssetId": "item.bamboo-sword.b1",
    "name": {
      "vi": "Thanh Trúc Kiếm",
      "en": "Green Bamboo Sword"
    },
    "description": {
      "vi": "Thân kiếm nhẹ, thuận tay khi xuất chiêu.",
      "en": "A light blade made for precise strikes."
    },
    "level": 3,
    "slot": "weapon",
    "stackMax": 1,
    "bonuses": {
      "attack": 9,
      "accuracy": 2
    },
    "visualId": null
  },
  {
    "id": "green-wind-cloak",
    "iconAssetId": "item.green-wind-cloak.b1",
    "name": {
      "vi": "Áo choàng Thanh Phong",
      "en": "Green Wind Cloak"
    },
    "description": {
      "vi": "Áo choàng nhẹ của khách lữ hành.",
      "en": "A light cloak worn by travelers."
    },
    "level": 2,
    "slot": "cloak",
    "stackMax": 1,
    "bonuses": {
      "magicResistance": 2,
      "speed": 1
    },
    "visualId": null
  },
  {
    "id": "cloud-step-boots",
    "iconAssetId": "item.cloud-step-boots.b1",
    "name": {
      "vi": "Giày Vân Bộ",
      "en": "Cloudstep Boots"
    },
    "description": {
      "vi": "Giày mềm thích hợp đường rừng.",
      "en": "Soft boots suited to woodland paths."
    },
    "level": 2,
    "slot": "feet",
    "stackMax": 1,
    "bonuses": {
      "speed": 2,
      "defense": 1
    },
    "visualId": null
  },
  {
    "id": "truc-khe-robe",
    "iconAssetId": "item.truc-khe-robe.b1",
    "name": {
      "vi": "Pháp bào Trúc Khê",
      "en": "Truc Khe Robe"
    },
    "description": {
      "vi": "Pháp bào giản dị được may tại Trúc Khê.",
      "en": "A simple robe sewn in Truc Khe."
    },
    "level": 1,
    "slot": "body",
    "stackMax": 1,
    "bonuses": {
      "defense": 2,
      "life": 8
    },
    "visualId": null
  },
  {
    "id": "nam-linh-pants",
    "iconAssetId": "item.nam-linh-pants.b1",
    "name": {
      "vi": "Quần vải Nam Lĩnh",
      "en": "Nam Linh Trousers"
    },
    "description": {
      "vi": "Quần vải bền cho hành trình dài.",
      "en": "Durable trousers for long journeys."
    },
    "level": 1,
    "slot": "legs",
    "stackMax": 1,
    "bonuses": {
      "defense": 1,
      "stamina": 4
    },
    "visualId": null
  },
  {
    "id": "calm-jade",
    "iconAssetId": "item.calm-jade.b1",
    "name": {
      "vi": "Ngọc bội An Tâm",
      "en": "Calming Jade"
    },
    "description": {
      "vi": "Miếng ngọc giúp tâm trí vững vàng.",
      "en": "A jade pendant that steadies the mind."
    },
    "level": 2,
    "slot": "jade",
    "stackMax": 1,
    "bonuses": {
      "willpower": 3,
      "magicResistance": 1
    },
    "visualId": null
  },
  {
    "id": "bamboo-headband",
    "iconAssetId": "item.bamboo-headband.b1",
    "name": {
      "vi": "Khăn Thanh Trúc",
      "en": "Bamboo Headband"
    },
    "description": {
      "vi": "Khăn buộc tóc đơn giản của đệ tử mới.",
      "en": "A simple headband for new disciples."
    },
    "level": 1,
    "slot": "head",
    "stackMax": 1,
    "bonuses": {
      "life": 4,
      "willpower": 1
    },
    "visualId": null
  },
  {
    "id": "leather-bracers",
    "iconAssetId": "item.leather-bracers.b1",
    "name": {
      "vi": "Hộ uyển da",
      "en": "Leather Bracers"
    },
    "description": {
      "vi": "Da thuộc bảo vệ cổ tay khi luyện võ.",
      "en": "Leather guards that protect the wrists."
    },
    "level": 1,
    "slot": "wrists",
    "stackMax": 1,
    "bonuses": {
      "defense": 1,
      "accuracy": 1
    },
    "visualId": null
  },
  {
    "id": "qi-belt",
    "iconAssetId": "item.qi-belt.b1",
    "name": {
      "vi": "Đai Luyện Khí",
      "en": "Qi Training Belt"
    },
    "description": {
      "vi": "Đai thắt chắc chắn dùng khi tu luyện.",
      "en": "A sturdy belt worn during training."
    },
    "level": 2,
    "slot": "waist",
    "stackMax": 1,
    "bonuses": {
      "stamina": 8,
      "spiritualPower": 4
    },
    "visualId": null
  },
  {
    "id": "spirit-gourd",
    "iconAssetId": "item.spirit-gourd.b1",
    "name": {
      "vi": "Hồ lô Tụ Linh",
      "en": "Spirit Gathering Gourd"
    },
    "description": {
      "vi": "Pháp bảo tích linh lực; bản đầu chỉ cộng chỉ số.",
      "en": "A spirit vessel; initially grants stats only."
    },
    "level": 4,
    "slot": "artifact",
    "stackMax": 1,
    "bonuses": {
      "spiritualPower": 15,
      "magicResistance": 3
    },
    "visualId": null
  },
  {
    "id": "dark-iron-sword",
    "iconAssetId": "item.dark-iron-sword.b1",
    "name": {
      "vi": "Huyền Thiết Kiếm",
      "en": "Dark Iron Sword"
    },
    "description": {
      "vi": "Kiếm huyền thiết nặng, thiên về sát phạt.",
      "en": "A heavy dark-iron blade built for offense."
    },
    "level": 6,
    "slot": "weapon",
    "stackMax": 1,
    "bonuses": {
      "attack": 18,
      "killingIntent": 4
    },
    "visualId": null
  },
  {
    "id": "nine-cloud-robe",
    "iconAssetId": "item.nine-cloud-robe.b1",
    "name": {
      "vi": "Cửu Vân Pháp Bào",
      "en": "Nine Clouds Robe"
    },
    "description": {
      "vi": "Pháp bào cấp cao, số liệu chỉ để minh họa.",
      "en": "A high-level robe with illustrative balance values."
    },
    "level": 9,
    "slot": "body",
    "stackMax": 1,
    "bonuses": {
      "defense": 18,
      "magicResistance": 12,
      "life": 40
    },
    "visualId": null
  },
  {
    "id": "herb",
    "iconAssetId": "item.herb.b1",
    "name": {
      "vi": "Lá Thanh Tâm",
      "en": "Thanh Tam Leaf"
    },
    "description": {
      "vi": "Nguyên liệu thu thập được khi khám phá.",
      "en": "A material gathered while exploring."
    },
    "level": 1,
    "slot": null,
    "stackMax": 99,
    "bonuses": {},
    "visualId": null
  },
  {
    "id": "bamboo",
    "iconAssetId": "item.bamboo.b1",
    "name": {
      "vi": "Trúc non",
      "en": "Young Bamboo"
    },
    "description": {
      "vi": "Nguyên liệu thu thập được khi khám phá.",
      "en": "A material gathered while exploring."
    },
    "level": 1,
    "slot": null,
    "stackMax": 99,
    "bonuses": {},
    "visualId": null
  },
  {
    "id": "mushroom",
    "iconAssetId": "item.mushroom.b1",
    "name": {
      "vi": "Nấm rừng",
      "en": "Forest Mushroom"
    },
    "description": {
      "vi": "Nguyên liệu thu thập được khi khám phá.",
      "en": "A material gathered while exploring."
    },
    "level": 1,
    "slot": null,
    "stackMax": 99,
    "bonuses": {},
    "visualId": null
  },
  {
    "id": "ore",
    "iconAssetId": "item.ore.b1",
    "name": {
      "vi": "Thiết khoáng",
      "en": "Iron Ore"
    },
    "description": {
      "vi": "Nguyên liệu thu thập được khi khám phá.",
      "en": "A material gathered while exploring."
    },
    "level": 1,
    "slot": null,
    "stackMax": 99,
    "bonuses": {},
    "visualId": null
  },
  {
    "id": "stone",
    "iconAssetId": "item.stone.b1",
    "name": {
      "vi": "Đá huyền vân",
      "en": "Dark Vein Stone"
    },
    "description": {
      "vi": "Nguyên liệu thu thập được khi khám phá.",
      "en": "A material gathered while exploring."
    },
    "level": 1,
    "slot": null,
    "stackMax": 99,
    "bonuses": {},
    "visualId": null
  },
  {
    "id": "soil",
    "iconAssetId": "item.soil.b1",
    "name": {
      "vi": "Xích thổ",
      "en": "Red Earth"
    },
    "description": {
      "vi": "Nguyên liệu thu thập được khi khám phá.",
      "en": "A material gathered while exploring."
    },
    "level": 1,
    "slot": null,
    "stackMax": 99,
    "bonuses": {},
    "visualId": null
  },
{
  "id": "spirit-grass",
  "iconAssetId": "item.spirit-grass.b1",
  "name": {
    "vi": "Thanh Linh Thảo",
    "en": "Spirit Grass"
  },
  "description": {
    "vi": "Linh thảo hái trong Rừng Thanh Trúc.",
    "en": "A spirit herb gathered in Thanh Truc Forest."
  },
  "level": 1,
  "slot": null,
  "stackMax": 99,
  "bonuses": {},
  "visualId": null
},
{
  "id": "dew-flower",
  "iconAssetId": "item.dew-flower.b1",
  "name": {
    "vi": "Bạch Lộ Hoa",
    "en": "White Dew Flower"
  },
  "description": {
    "vi": "Linh thảo hái trong Rừng Thanh Trúc.",
    "en": "A spirit herb gathered in Thanh Truc Forest."
  },
  "level": 1,
  "slot": null,
  "stackMax": 99,
  "bonuses": {},
  "visualId": null
},
{
  "id": "purple-lingzhi",
  "iconAssetId": "item.purple-lingzhi.b1",
  "name": {
    "vi": "Tử Vân Chi",
    "en": "Violet Cloud Lingzhi"
  },
  "description": {
    "vi": "Linh thảo hái trong Rừng Thanh Trúc.",
    "en": "A spirit herb gathered in Thanh Truc Forest."
  },
  "level": 2,
  "slot": null,
  "stackMax": 99,
  "bonuses": {},
  "visualId": null
},
{
  "id": "jade-herb",
  "iconAssetId": "item.jade-herb.b1",
  "name": {
    "vi": "Ngọc Tủy Thảo",
    "en": "Jade Marrow Herb"
  },
  "description": {
    "vi": "Linh thảo hái trong Rừng Thanh Trúc.",
    "en": "A spirit herb gathered in Thanh Truc Forest."
  },
  "level": 2,
  "slot": null,
  "stackMax": 99,
  "bonuses": {},
  "visualId": null
}
];
export const CATALOG:Readonly<Record<string,Item>>=Object.freeze(Object.assign(Object.create(null),Object.fromEntries(ITEMS.map(item=>[item.id,item]))));
export const STARTER_ITEMS=['bamboo-sword','green-wind-cloak','cloud-step-boots','truc-khe-robe','nam-linh-pants','calm-jade','bamboo-headband','leather-bracers','qi-belt','spirit-gourd'];
export function validateCatalog(items:Item[]){const ids=new Set<string>();for(const item of items){
 if(!item.id||ids.has(item.id)||!Number.isInteger(item.level)||item.level<1||item.level>9||!Number.isSafeInteger(item.stackMax)||item.stackMax<1||item.stackMax>99)throw Error('catalog');
 if(!/^item\.[a-z0-9-]+\.b\d+$/.test(item.iconAssetId))throw Error('icon-asset');
 if(item.slot!==null&&(!SLOTS.includes(item.slot)||item.stackMax!==1))throw Error('slot');
 for(const locale of ['vi','en'] as const)if(!item.name[locale]||!item.description[locale])throw Error('locale');
 for(const [key,value] of Object.entries(item.bonuses))if(!(key in PLAYER_STATS)||!Number.isFinite(value)||value<0)throw Error('bonus');
 if(item.slot===null&&Object.keys(item.bonuses).length)throw Error('material-bonus');ids.add(item.id);
}}
validateCatalog(ITEMS);
