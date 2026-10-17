import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../game/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage();
const metadata={};
for(const name of ['objects','combat']){
 const data=fs.readFileSync(`assets/production/forest/${name}.png`).toString('base64');
 const result=await page.evaluate(async({data,name})=>{
  const img=new Image();img.src='data:image/png;base64,'+data;await img.decode();
  const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);
  const pixels=ctx.getImageData(0,0,c.width,c.height).data;
  // Gutters measured against the generated atlas, not assumed equal cells.
  let boxes=name==='objects'?[[0,0,536,480],[536,0,320,480],[856,0,292,480],[1148,0,292,480],[0,480,360,310],[360,480,360,310],[720,480,350,310],[1070,480,370,310],[0,790,360,290],[360,790,360,290],[720,790,360,290],[1080,790,360,290]]:Array.from({length:12},(_,i)=>[i%6*362,Math.floor(i/6)*362,362,362]);
  if(name==='combat'){
    boxes=[];
    for(let row=0;row<2;row++){
      const top=row*362,bottom=(row+1)*362,cuts=[0];
      for(let col=1;col<6;col++){
        const center=col*362;let best=center,score=Infinity;
        for(let x=center-80;x<=center+80;x++){let count=0;for(let y=top;y<bottom;y++)if(pixels[(y*c.width+x)*4+3]>8)count++;const value=count*1000+Math.abs(x-center);if(value<score){score=value;best=x;}}
        cuts.push(best);
      }
      cuts.push(c.width);for(let col=0;col<6;col++)boxes.push([cuts[col],top,cuts[col+1]-cuts[col],bottom-top]);
    }
  }
  const rects=boxes.map(([x,y,w,h])=>{let l=x+w,r=x,t=y+h,b=y;for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++){if(pixels[(py*c.width+px)*4+3]>8){l=Math.min(l,px);r=Math.max(r,px);t=Math.min(t,py);b=Math.max(b,py);}}return [l,t,r-l+1,b-t+1];});
  const icons=name==='objects'?rects.slice(8).map(([x,y,w,h])=>{const o=document.createElement('canvas');o.width=o.height=256;const q=o.getContext('2d');q.imageSmoothingEnabled=false;const s=224/Math.max(w,h);q.drawImage(img,x,y,w,h,(256-w*s)/2,(256-h*s)/2,w*s,h*s);return o.toDataURL('image/png').split(',')[1];}):[];
  return {width:img.width,height:img.height,rects,icons};
 },{data,name});
 metadata[name]={width:result.width,height:result.height,rects:result.rects};
 if(name==='objects')for(const [i,id] of ['spirit-grass','dew-flower','purple-lingzhi','jade-herb'].entries())for(const base of ['assets/production/items','game/public/assets/production/items'])fs.writeFileSync(`${base}/${id}-b1.png`,Buffer.from(result.icons[i],'base64'));
}
await browser.close();
fs.writeFileSync('assets/production/forest/frames.json',JSON.stringify(metadata,null,2)+'\n');
fs.copyFileSync('assets/production/forest/frames.json','game/src/engine/forest-frames.json');
console.log(metadata);
