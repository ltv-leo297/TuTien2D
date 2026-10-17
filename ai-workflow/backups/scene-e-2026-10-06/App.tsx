import {useEffect,useMemo,useRef,useState} from 'react';
import {translate} from './i18n';
import type {Locale,Message,TextKey} from './i18n';
import {WIDTH,HEIGHT,SCENES} from './engine/scene';
import type {HeroId,Point} from './engine/scene';
import {Simulation} from './engine/simulation';
import {Renderer,loadArt} from './engine/renderer';
import type {Art} from './engine/renderer';
import {cameraFor,toWorld} from './engine/camera';
import {distance} from './engine/navigation';
import spriteFrames from './engine/sprite-frames.json';
type Profile={name:string;hero:HeroId};
const heroes:HeroId[]=['A','B','C','D'];
const read=(key:string,fallback:unknown)=>{try{return JSON.parse(localStorage.getItem(key)??'null')??fallback;}catch{return fallback;}};
const save=(key:string,value:unknown)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Optional storage. */}};
function Icon({name}:{name:'bag'|'quest'|'person'|'settings'|'close'}){const paths={bag:'M8 7 6 3h12l-2 4M8 7c-2 3-5 5-5 9 0 5 18 5 18 0 0-4-3-6-5-9ZM8 7h8',quest:'M6 3h13v17H6zM9 8h7M9 12h7M9 16h4',person:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-3c0-7 16-7 16 0v3',settings:'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6',close:'M5 5l14 14M19 5 5 19'};return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function Portrait({hero}:{hero:HeroId}){const sheet=spriteFrames[`hero-${hero}`],[x,y,w,h]=sheet.frames[1];return <div className={`portrait hero-${hero}`} style={{backgroundSize:`${sheet.width/w*100}% ${sheet.height/h*100}%`,backgroundPosition:`${x/(sheet.width-w)*100}% ${y/(sheet.height-h)*100}%`}} aria-hidden="true"/>;}
function Language({locale,onChange}:{locale:Locale;onChange:(locale:Locale)=>void}){return <select aria-label={translate(locale,'language')} value={locale} onChange={e=>onChange(e.target.value as Locale)}><option value="vi">{translate(locale,'vi')}</option><option value="en">{translate(locale,'en')}</option></select>;}
function Game({profile,art,locale,setLocale,onBack}:{profile:Profile;art:Art;locale:Locale;setLocale:(locale:Locale)=>void;onBack:()=>void}){
  const [sim]=useState(()=>{const s=new Simulation(profile.hero),p=read('truc-khe.progress',{}) as {bag?:Record<string,number>;visited?:string[]};if(p.bag)s.bag=Object.fromEntries(Object.entries(p.bag).filter(([id,n])=>Object.values(SCENES).some(scene=>scene.actors.some(a=>a.id===id&&a.role==='resource'))&&Number.isInteger(n)&&n>=0));if(Array.isArray(p.visited))s.visited=new Set(p.visited.filter(id=>['teacher','healer','smith'].includes(id)));return s;});
  const canvasRef=useRef<HTMLCanvasElement>(null),miniRef=useRef<HTMLCanvasElement>(null),audioRef=useRef<HTMLAudioElement>(null);
  const renderer=useMemo(()=>new Renderer(art),[art]);
  const [message,setMessage]=useState<Message>({key:'welcome',args:{name:profile.name}}),[speaker,setSpeaker]=useState<TextKey|null>(null),[panel,setPanel]=useState<'bag'|'quests'|'character'|'settings'|null>(null);
  const [reduced,setReduced]=useState(()=>Boolean(read('truc-khe.motion',matchMedia('(prefers-reduced-motion: reduce)').matches))),[sound,setSound]=useState(false),[,setRevision]=useState(0),[showQuest,setShowQuest]=useState(true);
  const hover=useRef<string|null>(null),cameraRef=useRef(cameraFor(innerWidth,innerHeight,sim.pos,devicePixelRatio)),fps=useRef({value:0,frames:0,start:performance.now(),samples:[] as number[]});
  const t=(key:TextKey,args:Record<string,string|number>={})=>translate(locale,key,args);
  useEffect(()=>{save('truc-khe.motion',reduced);},[reduced]);
  useEffect(()=>{const audio=audioRef.current;if(!audio)return;audio.volume=.17;if(sound)void audio.play().catch(()=>setSound(false));else audio.pause();return()=>audio.pause();},[sound]);
  useEffect(()=>{const listener=(e:KeyboardEvent)=>{if(e.key==='Escape'){setPanel(null);sim.route=[];sim.pending=null;}};window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener);},[sim]);
  useEffect(()=>{
    const canvas=canvasRef.current!,ctx=canvas.getContext('2d')!;let raf=0,last=performance.now(),miniTimer=0,w=canvas.clientWidth,h=canvas.clientHeight;
    const resize=()=>{w=canvas.clientWidth;h=canvas.clientHeight;cameraRef.current=cameraFor(w,h,sim.pos,devicePixelRatio);canvas.width=Math.round(w*cameraRef.current.dpr);canvas.height=Math.round(h*cameraRef.current.dpr);};const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
    const frame=(now:number)=>{
      const delta=(now-last)/1000;last=now;if(canvas.width!==Math.round(w*Math.min(2,devicePixelRatio)))resize();sim.update(delta);cameraRef.current=cameraFor(w,h,sim.pos,devicePixelRatio);
      renderer.draw(ctx,sim,cameraRef.current,key=>translate(locale,key),profile.name,reduced,new URLSearchParams(location.search).has('colliders'),hover.current);
      miniTimer+=delta;if(miniTimer>.1&&miniRef.current){renderer.minimap(miniRef.current.getContext('2d')!,sim);miniTimer=0;}
      if(sim.events.length){for(const event of sim.events.splice(0)){
        if(event.type==='talk'){setSpeaker(event.id as TextKey);setMessage({key:(sim.actors.find(a=>a.id===event.id)?.role==='monster'?'talk.monster':`talk.${event.id}`) as TextKey});}
        else if(event.type==='map'){setSpeaker(null);setMessage({key:'arrived',nameKey:event.id as TextKey});}
        else if(event.type==='gather'){setSpeaker(null);setMessage({key:'gather',nameKey:event.id as TextKey});}
        else if(event.type==='cooldown')setMessage({key:'cooldown'});else setMessage({key:'blocked'});
      }save('truc-khe.progress',{bag:sim.bag,visited:[...sim.visited]});setRevision(n=>n+1);}
      const m=fps.current;m.frames++;if(delta>0&&delta<.2)m.samples.push(delta*1000);if(m.samples.length>600)m.samples.shift();if(now-m.start>=1000){m.value=m.frames*1000/(now-m.start);m.frames=0;m.start=now;}raf=requestAnimationFrame(frame);
    };
    const visibility=()=>{cancelAnimationFrame(raf);if(!document.hidden){last=performance.now();raf=requestAnimationFrame(frame);if(sound)void audioRef.current?.play().catch(()=>setSound(false));}else audioRef.current?.pause();};document.addEventListener('visibilitychange',visibility);raf=requestAnimationFrame(frame);
    if(new URLSearchParams(location.search).has('debug'))Object.assign(window,{__game:{snapshot:()=>({map:sim.map,pos:{...sim.pos},route:sim.route.map(p=>({...p})),actors:sim.actors.map(a=>({id:a.id,x:a.x,y:a.y})),bag:{...sim.bag},visited:[...sim.visited],direction:sim.direction,phase:sim.phase,time:sim.time,transitions:sim.transitions,camera:cameraRef.current,fps:fps.current.value,frameTimes:fps.current.samples,backing:{width:canvas.width,height:canvas.height}})}});
    return()=>{cancelAnimationFrame(raf);observer.disconnect();document.removeEventListener('visibilitychange',visibility);delete (window as Window&{__game?:unknown}).__game;};
  },[renderer,sim,locale,reduced,profile.name,sound]);
  const direct=(p:Point)=>{const a=sim.actors.find(a=>distance(a,p)<35);sim.go(p,a?.id);if(a){setSpeaker(null);setMessage({key:'walking',nameKey:a.id as TextKey});}};
  const worldPoint=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();return toWorld({x:e.clientX-r.left,y:e.clientY-r.top},cameraRef.current);};
  const navigate=(id:string)=>{const a=sim.actors.find(a=>a.id===id);if(a){sim.go(a,id);setMessage({key:'walking',nameKey:id as TextKey});setPanel(null);}};
  const complete=['teacher','healer','smith'].filter(id=>sim.visited.has(id)).length,args={...message.args,...(message.nameKey?{[message.key==='arrived'?'map':'name']:t(message.nameKey)}:{})};
  const quest=<><p>{t(complete===3?'questComplete':'questText')}</p><div className="quest-people">{(['teacher','healer','smith'] as TextKey[]).map(id=><button key={id} disabled={sim.map!=='village'} onClick={()=>navigate(id)}><span className={sim.visited.has(id)?'check done':'check'}>{sim.visited.has(id)?'✓':'○'}</span>{t(id)}<span aria-hidden="true">↗</span></button>)}</div><small>{t('questProgress',{count:complete})}</small></>;
  return <main className="game-shell"><canvas ref={canvasRef} className="world-canvas" aria-label={t('canvas')} tabIndex={0} onPointerDown={e=>{if(e.button===0)direct(worldPoint(e));}} onPointerMove={e=>{const p=worldPoint(e);hover.current=sim.actors.find(a=>distance(a,p)<35)?.id??null;e.currentTarget.style.cursor=hover.current?'pointer':'crosshair';}}/>
    <header className="topbar"><div className="player-card"><Portrait hero={profile.hero}/><div><strong>{profile.name}</strong><small>{t('level')}</small><div className="health" role="meter" aria-label={t('health')} aria-valuenow={100} aria-valuemin={0} aria-valuemax={100}><i/></div></div></div><div className="location"><small>{t('time')}</small><strong>{t(sim.map)}</strong></div><button className="icon-button" aria-label={t('settings')} onClick={()=>setPanel('settings')}><Icon name="settings"/></button></header>
    <aside className="quest-card"><button className="quest-heading" onClick={()=>setShowQuest(v=>!v)} aria-expanded={showQuest}><span className="quest-gem">!</span><strong>{t('questTitle')}</strong><span>{showQuest?'−':'+'}</span></button>{showQuest&&quest}</aside>
    <aside className="map-card"><div><span>{t('map')}</span><small>{t(sim.map)}</small></div><canvas ref={miniRef} width={240} height={135} aria-label={t('mapHint')} onPointerDown={e=>{const r=e.currentTarget.getBoundingClientRect();direct({x:(e.clientX-r.left)/r.width*WIDTH,y:(e.clientY-r.top)/r.height*HEIGHT});}}/><small>{t('mapHint')}</small></aside>
    <section className="dialogue" aria-live="polite">{speaker&&<strong>{t(speaker)}</strong>}<p>{t(message.key,args)}</p></section>
    <nav className="quickbar" aria-label={t('explore')}>{(['bag','quests','character'] as const).map((id,i)=><button key={id} aria-label={t(id)} onClick={()=>setPanel(id)}><Icon name={(['bag','quest','person'] as const)[i]}/><span>{t(id)}</span>{id==='bag'&&Object.keys(sim.bag).length>0&&<b aria-hidden="true">{Object.values(sim.bag).reduce((a,b)=>a+b,0)}</b>}</button>)}</nav><div className="controls-tip">{t('controls')}</div><audio ref={audioRef} src="/assets/production/nam-linh-ambience.wav" loop preload="none"/>
    {panel&&<div className="modal-scrim" onPointerDown={e=>{if(e.target===e.currentTarget)setPanel(null);}}><section className="modal" role="dialog" aria-modal="true" aria-label={t(panel)} onKeyDown={e=>{if(e.key==='Tab'){const elements=e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),select,input'),first=elements[0],last=elements[elements.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}}><header><h2>{t(panel)}</h2><button autoFocus className="icon-button" onClick={()=>setPanel(null)} aria-label={t('close')}><Icon name="close"/></button></header>
    {panel==='settings'&&<div className="settings"><label>{t('language')}<Language locale={locale} onChange={setLocale}/></label><label>{t('motion')}<input type="checkbox" checked={reduced} onChange={e=>setReduced(e.target.checked)}/></label><label>{t('sound')}<input type="checkbox" checked={sound} onChange={e=>setSound(e.target.checked)}/></label><small>{t('audioHint')}</small><button className="secondary" onClick={onBack}>{t('back')}</button></div>}
    {panel==='bag'&&(Object.keys(sim.bag).length?<ul className="inventory">{Object.entries(sim.bag).map(([id,count])=><li key={id}><span>{t(id as TextKey)}</span><b>×{new Intl.NumberFormat(locale).format(count)}</b></li>)}</ul>:<p>{t('emptyBag')}</p>)}
    {panel==='quests'&&<><h3>{t('questTitle')}</h3>{quest}<p>{t('help')}</p></>}{panel==='character'&&<div className="profile"><Portrait hero={profile.hero}/><h3>{profile.name}</h3><p>{t(`title.${profile.hero}`)}</p><p>{t('level')}</p><small>{t('saved')}</small></div>}
    </section></div>}</main>;
}
export default function App(){
  const [locale,setLocaleState]=useState<Locale>(()=>read('truc-khe.locale','vi')==='en'?'en':'vi');const setLocale=(v:Locale)=>{setLocaleState(v);save('truc-khe.locale',v);};const t=(key:TextKey)=>translate(locale,key);
  const [profile,setProfile]=useState<Profile|null>(null),[hero,setHero]=useState<HeroId>('A'),[name,setName]=useState(()=>{const old=read('truc-khe.profile',null) as Profile|null;return typeof old?.name==='string'?old.name:translate(locale,'defaultName');}),[art,setArt]=useState<Art|null>(null),[error,setError]=useState(false),[retry,setRetry]=useState(0);
  useEffect(()=>{document.documentElement.lang=locale;document.title=translate(locale,'title');},[locale]);
  useEffect(()=>{let active=true;setError(false);void loadArt().then(v=>{if(active)setArt(v);}).catch(()=>{if(active)setError(true);});return()=>{active=false;};},[retry]);
  const start=()=>{if(!name.trim()||!art)return;const value={name:name.trim().slice(0,16),hero};save('truc-khe.profile',value);setProfile(value);};
  if(profile&&art)return <Game profile={profile} art={art} locale={locale} setLocale={setLocale} onBack={()=>setProfile(null)}/>;
  return <main className="creator-shell"><div className="creator-language"><Language locale={locale} onChange={setLocale}/></div><section className="creator-card"><div className="creator-copy"><span className="eyebrow">{t('title')}</span><h1>{t('choose')}</h1><p>{t('intro')}</p><label className="name-label">{t('name')}<input value={name} maxLength={16} placeholder={t('nameHint')} onChange={e=>setName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')start();}}/></label><button className="enter-button" disabled={!name.trim()||!art} onClick={start}>{art?t('start'):t('loading')}</button>{error&&<div role="alert"><p>{t('loadError')}</p><button className="secondary" onClick={()=>setRetry(n=>n+1)}>{t('retry')}</button></div>}<small>{t('controls')}</small></div><div className="hero-preview"><Portrait hero={hero}/><strong>{t(`hero.${hero}`)}</strong><span>{t(`title.${hero}`)}</span></div><div className="hero-grid" aria-label={t('portrait')}>{heroes.map(id=><button className={`hero-option ${id===hero?'active':''}`} key={id} aria-pressed={id===hero} onClick={()=>setHero(id)}><Portrait hero={id}/><span>{t(`hero.${id}`)}</span><small>{t(`title.${id}`)}</small></button>)}</div></section></main>;
}
