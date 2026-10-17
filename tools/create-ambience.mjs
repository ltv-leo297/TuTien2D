import fs from 'node:fs';
// Original deterministic wind/stream and bird synthesis; no external samples.
const rate=22050,seconds=16,count=rate*seconds,buffer=Buffer.alloc(44+count*2);
buffer.write('RIFF',0);buffer.writeUInt32LE(buffer.length-8,4);buffer.write('WAVEfmt ',8);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(1,22);buffer.writeUInt32LE(rate,24);buffer.writeUInt32LE(rate*2,28);buffer.writeUInt16LE(2,32);buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(count*2,40);
let seed=23,filtered=0;
for(let i=0;i<count;i++){
  const t=i/rate;seed=(seed*1664525+1013904223)>>>0;filtered=filtered*.97+(seed/4294967296-.5)*.03;
  let sample=filtered*.65;for(const start of [2,2.5,7,7.25,12,12.5]){const age=t-start;if(age>0&&age<.2)sample+=Math.sin(2*Math.PI*(1800*age+2200*age*age))*.04*Math.sin(Math.PI*age/.2)**2;}
  const fade=Math.min(1,t/.5,(seconds-t)/.5);buffer.writeInt16LE(Math.round(Math.max(-1,Math.min(1,sample))*fade*32767),44+i*2);
}
for(const dir of ['assets/audio','game/public/assets/production']){fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(`${dir}/nam-linh-ambience.wav`,buffer);}
console.log('Saved original 16-second ambient loop.');
