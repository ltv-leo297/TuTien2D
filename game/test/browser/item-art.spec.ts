import {test,expect} from '@playwright/test';
import {ITEMS} from '../../src/items/catalog';
import {itemIconUrl} from '../../src/items/art';
import {migrateInventory} from '../../src/items/inventory';

test('all B icons load, have genuine cutout alpha and remain identifiable at thumbnail sizes',async({page},testInfo)=>{
 const state=migrateInventory(null);
 state.slots=Array.from({length:100},(_,i)=>ITEMS[i]?{uid:`art-${i}`,itemId:ITEMS[i].id,quantity:ITEMS[i].slot?1:3}:null);
 await page.addInitScript(s=>{if(!localStorage.getItem('truc-khe.inventory.v1'))localStorage.setItem('truc-khe.inventory.v1',JSON.stringify(s));},state);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1280,height:720});await page.goto('/');
 // Node has no Vite BASE_URL; resolve fixture URLs against the hosted page.
 const iconUrl=(id?:string)=>new URL(itemIconUrl(id)!.slice(1),page.url()).pathname;
 await page.getByRole('button',{name:'Bước vào Trúc Khê',exact:true}).click();
 await page.getByRole('button',{name:'Hành trang',exact:true}).click();
 await expect(page.locator('.item-cell .item-art')).toHaveCount(ITEMS.length);
 await expect.poll(()=>page.locator('.item-cell img').evaluateAll(imgs=>imgs.every(img=>(img as HTMLImageElement).complete&&(img as HTMLImageElement).naturalWidth>0))).toBe(true);
 await expect(page.locator('.item-art-missing')).toHaveCount(0);
 const alpha=await page.evaluate(async items=>{
  const result=[];
  for(const item of items){
   const img=new Image();img.src=item.url!;await img.decode();
   const c=document.createElement('canvas');c.width=img.width;c.height=img.height;
   const ctx=c.getContext('2d')!;ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;
   let visible=0,edge=0,minX=c.width,minY=c.height,maxX=0,maxY=0;
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const a=data[(y*c.width+x)*4+3];if(a>16){visible++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);if(x===0||y===0||x===c.width-1||y===c.height-1)edge++;}}
   result.push({id:item.id,ratio:visible/(c.width*c.height),edge,bounds:[minX,minY,maxX,maxY],width:c.width,height:c.height});
  }return result;
 },ITEMS.map(i=>({id:i.id,url:iconUrl(i.iconAssetId)})));
 for(const a of alpha){expect(a.ratio,a.id).toBeGreaterThan(.025);expect(a.ratio,a.id).toBeLessThan(.85);expect(a.edge,a.id).toBe(0);}
 await testInfo.attach('item-alpha-audit',{body:JSON.stringify(alpha,null,2),contentType:'application/json'});
 await page.locator('.item-cell[data-item="truc-khe-robe"]').click();
 await expect(page.locator('.item-detail img')).toHaveAttribute('src',iconUrl(ITEMS.find(i=>i.id==='truc-khe-robe')!.iconAssetId));
 const action=(await page.locator('.item-detail .equipment-primary').boundingBox())!,detail=(await page.locator('.item-detail').boundingBox())!;
 expect(action.y+action.height).toBeLessThanOrEqual(detail.y+detail.height);
 await page.screenshot({path:'test-results/item-B-runtime.png'});
 await page.getByRole('button',{name:'Trang bị',exact:true}).click();
 await expect(page.locator('.gear-slot[data-slot="body"] img')).toHaveAttribute('src',/truc-khe-robe-b1.png/);
 await page.keyboard.press('Escape');await page.reload();await page.getByRole('button',{name:'Bước vào Trúc Khê',exact:true}).click();await page.getByRole('button',{name:'Hành trang',exact:true}).click();
 await expect(page.locator('.gear-slot[data-slot="body"] img')).toHaveAttribute('src',/truc-khe-robe-b1.png/);
 // Test-only contact sheet, not a new player-facing gallery or mockup-selection page.
 await page.evaluate(items=>{
  document.body.replaceChildren();const board=document.createElement('main');
  board.style.cssText='display:grid;grid-template-columns:repeat(5,1fr);gap:12px;padding:18px;background:#153c32;color:#fff4d6;font:12px sans-serif';
  for(const item of items){const cell=document.createElement('section');cell.style.cssText='padding:8px;border:1px solid #617c63;border-radius:8px;display:flex;flex-wrap:wrap;align-items:center;gap:8px';const title=document.createElement('div');title.textContent=item.name;title.style.width='100%';cell.append(title);
   for(const size of [120,48,24]){const img=document.createElement('img');img.src=item.url!;img.width=size;img.height=size;img.style.cssText='object-fit:contain;image-rendering:auto';cell.append(img);}board.append(cell);
  }document.body.append(board);
 },ITEMS.map(i=>({name:i.name.vi,url:iconUrl(i.iconAssetId)})));
 await page.screenshot({path:'test-results/item-B-contact-sheet.png',fullPage:true});
 expect(errors).toEqual([]);
});

test('failed image and unknown saved item show explicit localized fallback without losing ownership',async({page})=>{
 const state=migrateInventory(null);state.slots[20]={uid:'old-unknown',itemId:'retired-jade',quantity:1};
 await page.addInitScript(s=>{if(!localStorage.getItem('truc-khe.inventory.v1'))localStorage.setItem('truc-khe.inventory.v1',JSON.stringify(s));},state);
 await page.route('**/items/bamboo-sword-b1.png',r=>r.abort());
 await page.goto('/');await page.getByRole('button',{name:'Bước vào Trúc Khê',exact:true}).click();await page.getByRole('button',{name:'Hành trang',exact:true}).click();
 const broken=page.locator('.item-cell[data-item="bamboo-sword"]');await expect(broken.getByRole('img',{name:'Chưa tải được hình vật phẩm'})).toBeVisible();
 await page.locator('.item-cell[data-item="retired-jade"]').click();await expect(page.locator('.item-detail')).toContainText('retired-jade');await expect(page.locator('.item-detail .equipment-primary')).toHaveCount(0);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('truc-khe.inventory.v1')!).slots[20].itemId)).toBe('retired-jade');
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'Tùy chọn',exact:true}).click();await page.getByLabel('Ngôn ngữ').selectOption('en');await page.keyboard.press('Escape');await page.getByRole('button',{name:'Equipment',exact:true}).click();
 await expect(broken.getByRole('img',{name:'Item image unavailable'})).toBeVisible();
});
