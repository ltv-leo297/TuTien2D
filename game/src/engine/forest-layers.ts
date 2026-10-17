import type {Point} from './scene.ts';
export type Vegetation=Point & {id:string;kind:'tree'|'bamboo'|'blossom';height:number;flip:boolean;phase:number};
const sx=1920/1672,sy=1080/941;
// Independent rooted sprites surveyed against the selected composition. Nothing
// here is a crop of the flattened landscape; ground exists underneath every tree.
const trees=[
 [73,125,215],[17,291,223],[438,116,203],[1007,365,226],[1280,226,298],
 [1435,105,210],[1650,119,240],[1655,298,195],[417,610,195],[14,546,248],
 [-20,930,245],[65,1020,200],[650,942,249],[874,710,211],[1142,736,234],
 [1670,811,265],[1610,1010,255],[1475,1030,225],[858,1050,225],
 [255,36,180],[755,50,170],[1155,35,190],
 ];
const bamboo=[
 [285,94,198],[614,180,221],[1130,153,224],[1510,159,244],[1655,290,227],
 [543,421,224],[74,458,214],[32,788,200],[118,811,201],[724,807,214],
 [954,699,203],[1233,700,231],[1404,1007,249],[1340,964,200],[1580,718,215],
 [1628,607,215],[484,85,180],[575,75,192],[1490,37,192],[1710,452,211],
 [541,1040,200],[37,120,196],[872,1040,218],
 ];
const blossom=[[224,857,182],[1111,919,218],[1568,1052,173]];
export const FOREST_VEGETATION:Vegetation[]=[...trees.map(p=>({p,kind:'tree' as const})),...bamboo.map(p=>({p,kind:'bamboo' as const})),...blossom.map(p=>({p,kind:'blossom' as const}))].map(({p:[x,y,height],kind},i)=>({id:`forest-${kind}-${i}`,kind,x:x*sx,y:y*sy,height:height*sy,flip:i%3===0,phase:i*1.73}));
// Wind bends increasingly toward the crown. The rooted bottom never translates.
export function vegetationBend(heightFraction:number,time:number,phase:number,kind:Vegetation['kind']){
 const bend=Math.max(0,(heightFraction-.2)/.8);
 return bend*bend*((kind==='bamboo'?4.8:3.6)*Math.sin(time*1.6+phase)+1.3*Math.sin(time*3.7+phase*.7));
}
