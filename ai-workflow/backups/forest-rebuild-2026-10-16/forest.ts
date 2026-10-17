import type {Scene,Prop,Actor,Point} from './scene.ts';
import {FOREST_VEGETATION} from './forest-layers.ts';
import {MONSTERS,MONSTER_IDS} from '../combat/monsters.ts';
// User's attached image #1 (2026-10-16) is authoritative, regardless of old A–E filenames.
// Survey coordinates are in that reference's 1672×941 canvas, transformed once to world space.
const sx=1920/1672,sy=1080/941;
const point=([x,y]:number[]):Point=>({x:x*sx,y:y*sy});
const polygon=(points:number[][])=>points.map(point);
const rect=(x:number,y:number,w:number,h:number)=>({x:x*sx,y:y*sy,w:w*sx,h:h*sy});
export const FOREST_BRIDGE_DECK=polygon([[668,458],[891,458],[891,502],[668,502]]);
export function createForest():Scene{
 const props:Prop[]=[
  {id:'abandoned-cottage',tile:0,...point([320,310]),size:350*sx,atlas:'structures',solid:rect(165,205,292,92)},
  {id:'forest-bridge',tile:1,...point([780,540]),size:224*sx,atlas:'structures',layer:'ground'},
 ];
 // Walkable polygons trace open ground, including grass beside paths. They exclude dense
 // rocks, trunks and water; the bridge is a separate, measured deck through the stream.
 const walkable=[
  polygon([[1672,365],[1600,374],[1540,410],[1450,405],[1415,425],[1315,425],[1240,403],[1150,400],[1040,397],[990,420],[925,443],[870,450],[865,504],[955,530],[1080,550],[1210,548],[1270,550],[1300,580],[1285,620],[1270,680],[1235,728],[1180,770],[1090,785],[1030,780],[990,752],[930,750],[880,770],[885,825],[940,853],[1030,870],[1130,850],[1220,825],[1320,785],[1380,735],[1420,690],[1470,650],[1475,605],[1445,567],[1495,545],[1565,525],[1625,495],[1672,480]]),
  polygon([[1220,430],[1210,390],[1250,345],[1290,322],[1300,283],[1230,270],[1175,257],[1155,220],[1200,210],[1270,217],[1345,220],[1380,250],[1410,290],[1400,337],[1370,375],[1375,427],[1325,465]]),
  polygon([[697,442],[657,400],[636,365],[602,304],[596,271],[545,235],[530,199],[469,177],[440,151],[384,120],[315,112],[220,108],[157,121],[107,144],[91,190],[70,216],[82,254],[140,295],[176,326],[184,373],[213,414],[280,434],[347,450],[396,441],[444,435],[483,451],[551,464],[603,487],[648,500],[701,503]]),
  polygon([[215,415],[288,430],[334,461],[355,498],[348,530],[328,565],[343,600],[390,627],[442,649],[443,675],[410,703],[356,706],[305,692],[251,683],[210,667],[178,638],[181,596],[214,565],[252,548],[270,514],[251,486],[208,469]]),
  // A narrow sunlit track along the east side of the cottage/bamboo grove.
  polygon([[470,187],[541,208],[586,250],[620,294],[643,329],[654,367],[684,400],[702,451],[665,455],[629,418],[612,374],[592,339],[565,302],[530,268],[480,247]]),
  polygon([[350,410],[460,410],[470,432],[590,430],[665,450],[660,477],[590,480],[520,475],[440,470],[350,450]]),
  polygon([[1068,730],[1100,741],[1110,795],[1050,820],[1025,785],[1040,754]]),
  FOREST_BRIDGE_DECK,
 ];
 // Explicit hard footprints complement the landscape's surveyed navigation regions.
 const obstacles=[
  ['cottage-east-rock',440,235,55,60],['bamboo-west',470,300,125,120],
  ['west-lantern',674,398,20,50],['east-lantern',900,398,32,48],
  ['west-flower-fence',535,485,115,24],['east-fence',902,516,72,35],
  ['island-rock',167,580,64,62],['island-tree',385,542,62,65],
  ['east-log',1068,267,120,57],['south-log',918,649,142,100],
 ] as const;
 for(const [id,x,y,w,h] of obstacles)props.push({id,tile:0,x:0,y:0,size:0,solid:rect(x,y,w,h),hidden:true});
 const plants:Actor[]=[
  {id:'herb',itemId:'herb',skin:'C',role:'resource',...point([1190,445]),forestTile:8,level:1},
  {id:'spirit-grass-1',itemId:'spirit-grass',skin:'C',role:'resource',...point([1325,690]),forestTile:8,level:1},
  {id:'spirit-grass-2',itemId:'spirit-grass',skin:'C',role:'resource',...point([275,425]),forestTile:8,level:1},
  {id:'dew-flower-1',itemId:'dew-flower',skin:'C',role:'resource',...point([1215,253]),forestTile:9,level:1},
  {id:'dew-flower-2',itemId:'dew-flower',skin:'C',role:'resource',...point([440,413]),forestTile:9,level:1},
  {id:'purple-lingzhi',itemId:'purple-lingzhi',skin:'D',role:'resource',...point([1080,760]),forestTile:10,level:2},
  {id:'jade-herb',itemId:'jade-herb',skin:'B',role:'resource',...point([385,675]),forestTile:11,level:2},
  {id:'bamboo',skin:'B',role:'resource',...point([635,355])},
  {id:'mushroom',skin:'D',role:'resource',...point([1260,735])},
 ];
 for(const v of FOREST_VEGETATION){
  const width=v.height*(v.kind==='bamboo'?.36:.18),height=v.height*.065;
  props.push({id:v.id,x:v.x,y:v.y,tile:0,size:0,hidden:true,solid:{x:v.x-width/2,y:v.y-height,w:width,h:height}});
 }
 return {id:'forest',landscape:true,spawn:point([1585,468]),props,walkable,vegetation:FOREST_VEGETATION,
  actors:[...plants,...MONSTER_IDS.map(id=>({id,role:'monster' as const,...MONSTERS[id].forest,level:MONSTERS[id].level,forestTile:MONSTERS[id].art.mapTile,mapSize:MONSTERS[id].art.mapSize}))],
  water:[],rivers:[
   {width:75*sx,points:polygon([[820,-40],[818,150],[846,230],[810,345],[795,425],[780,500],[740,565],[680,635],[595,695],[520,760],[450,800],[400,850],[350,980]])},
   {width:55*sx,points:polygon([[70,560],[85,630],[145,675],[230,713],[330,743],[420,750],[525,730]])},
  ],
  bridges:[{propId:'forest-bridge',deck:FOREST_BRIDGE_DECK}],
  cascades:[rect(810,35,40,155),rect(875,160,25,45),rect(400,810,28,57)],
  paths:[],
  gates:[{id:'village',x:1878,y:465,w:42,h:145,to:'village',spawn:{x:55,y:535}}]};
}
