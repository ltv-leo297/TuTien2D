import {useEffect,useRef,useState} from 'react';
import type {Locale,TextKey} from '../i18n';
import {translate} from '../i18n';
import {SCENES,blocked} from '../engine/scene';
import type {HeroId} from '../engine/scene';
import type {Simulation} from '../engine/simulation';
import {acquireSession,available,finish,readLedger,recover,reserve,writeLedger} from './charges';
import type {MonsterId} from './charges';
import {CombatSimulation} from './simulation';
import type {Action,Outcome} from './simulation';
import {drawCombat,loadCombatArt} from './renderer';
import type {CombatArt} from './renderer';
import type {Stats} from './stats';
import './combat.css';
type Profile={hero:HeroId;name:string};
type Battle={id:string;sim:CombatSimulation;art:CombatArt};
type Props={monster:MonsterId|null;world:Simulation;profile:Profile;locale:Locale;reduced:boolean;getPlayerStats:()=>Stats;onClose:()=>void;onBusy:(value:boolean)=>void};
export function CombatFlow({monster,world,profile,locale,reduced,getPlayerStats,onClose,onBusy}:Props){
  const [battle,setBattle]=useState<Battle|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState<TextKey|null>(null),[count,setCount]=useState(0),[ready,setReady]=useState(false);
  const release=useRef<null|(()=>void)>(null),starting=useRef(false),mounted=useRef(true);
  const t=(key:TextKey,args:Record<string,string|number>={})=>translate(locale,key,args);
  useEffect(()=>{mounted.current=true;let cancelled=false;void(async()=>{try{const unlock=await acquireSession();if(!unlock)return;try{const ledger=readLedger(),next=recover(ledger,Date.now());if(next.returnTo){world.map='forest';world.pos=blocked(SCENES.forest,next.returnTo.pos)?{...SCENES.forest.spawn}:{...next.returnTo.pos};world.direction=next.returnTo.direction;world.route=[];world.pending=null;world.loadActors();delete next.returnTo;}writeLedger(next);}finally{unlock();}}catch{if(!cancelled)setError('combat.saveError');}finally{if(!cancelled)setReady(true);}})();return()=>{cancelled=true;mounted.current=false;release.current?.();release.current=null;};},[world]);
  useEffect(()=>{if(!monster||battle)return;const refresh=()=>{try{setCount(available(readLedger(),monster,Date.now()));}catch{setError('combat.saveError');setCount(0);}};refresh();const timer=setInterval(refresh,1000);window.addEventListener('storage',refresh);return()=>{clearInterval(timer);window.removeEventListener('storage',refresh);};},[monster,battle]);
  const begin=async()=>{
    if(!monster||starting.current||!ready)return;starting.current=true;setError(null);setLoading(true);onBusy(true);
    try{
      release.current=await acquireSession();if(!release.current)throw new Error('busy');
      // Recover an abandoned encounter only while exclusively holding the session lock.
      const ledger=recover(readLedger(),Date.now());if(available(ledger,monster,Date.now())<=0)throw new Error('empty');
      const art=await loadCombatArt();if(!mounted.current){release.current?.();release.current=null;return;}
      const id=crypto.randomUUID(),sim=new CombatSimulation(monster,{playerStats:getPlayerStats()});
      writeLedger(reserve(ledger,monster,id,Date.now(),{map:'forest',pos:{...world.pos},direction:world.direction}));
      world.route=[];world.pending=null;world.destination=null;setBattle({id,sim,art});
    }catch(e){const message=e instanceof Error?e.message:'';setError(message==='busy'?'combat.busy':message==='empty'?'combat.empty':message==='asset'?'combat.loadError':'combat.saveError');release.current?.();release.current=null;onBusy(false);}
    finally{starting.current=false;setLoading(false);}
  };
  const settle=()=>{if(!battle)return;try{writeLedger(finish(readLedger(),battle.id,Date.now()));setError(null);}catch{setError('combat.saveError');}};
  const returnToWorld=()=>{if(!battle)return;try{const ledger=finish(readLedger(),battle.id,Date.now());delete ledger.returnTo;writeLedger(ledger);release.current?.();release.current=null;setBattle(null);setError(null);onBusy(false);onClose();}catch{setError('combat.saveError');}};
  if(battle)return <BattleScreen battle={battle} profile={profile} locale={locale} reduced={reduced} onFinish={settle} onReturn={returnToWorld} error={error}/>;
  if(!monster)return null;
  return <section className="encounter-card" role="dialog" aria-label={t('combat.encounter')} onKeyDown={e=>{if(e.key==='Escape'&&!loading)onClose();}}>
    <button className="encounter-close" aria-label={t('close')} disabled={loading} onClick={onClose}>×</button>
    <h2>{t(monster)}</h2><p className="encounter-count">{t('combat.remaining',{count})}</p>
    {error&&<p role="alert">{t(error)}</p>}
    <button className="battle-primary" autoFocus disabled={loading||!ready||count===0} onClick={()=>void begin()}>{t(loading?'combat.loading':count===0?'combat.empty':'combat.start')}</button>
  </section>;
}
const keys:Record<string,Action>={KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'jump',KeyJ:'attack',KeyK:'guard',ShiftLeft:'dash',ShiftRight:'dash',KeyL:'skill'};
const actions:Array<{action:Action;key:string;label:TextKey}>=[{action:'left',key:'A / ←',label:'combat.left'},{action:'right',key:'D / →',label:'combat.right'},{action:'jump',key:'Space',label:'combat.jump'},{action:'dash',key:'Shift',label:'combat.dash'},{action:'guard',key:'K',label:'combat.guard'},{action:'attack',key:'J',label:'combat.attack'},{action:'skill',key:'L',label:'combat.skill'}];
function BattleScreen({battle,profile,locale,reduced,onFinish,onReturn,error}:{battle:Battle;profile:Profile;locale:Locale;reduced:boolean;onFinish:()=>void;onReturn:()=>void;error:TextKey|null}){
  const {sim,art}=battle,canvas=useRef<HTMLCanvasElement>(null),[hud,setHud]=useState(()=>sim.snapshot()),[confirmExit,setConfirmExit]=useState(false);
  const finishRef=useRef(onFinish);finishRef.current=onFinish;const finished=useRef(false),sources=useRef(new Map<string,Action>());
  const t=(key:TextKey,args:Record<string,string|number>={})=>translate(locale,key,args);
  const input=(source:string,action:Action,pressed:boolean)=>{if(pressed){if(sources.current.has(source))return;sources.current.set(source,action);sim.press(action);}else{sources.current.delete(source);if(![...sources.current.values()].includes(action))sim.release(action);}};
  const pause=(value:boolean)=>{sources.current.clear();sim.pause(value);setHud(sim.snapshot());};
  useEffect(()=>{
    const down=(e:KeyboardEvent)=>{if(e.code==='Escape'){e.preventDefault();pause(!sim.paused);setConfirmExit(false);return;}const action=keys[e.code];if(action){e.preventDefault();if(!e.repeat)input(e.code,action,true);}};
    const up=(e:KeyboardEvent)=>{const action=keys[e.code];if(action){e.preventDefault();input(e.code,action,false);}};
    const blur=()=>pause(true),visibility=()=>{if(document.hidden)pause(true);};
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);
    return()=>{sim.clear();sources.current.clear();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);};
  },[sim]);
  useEffect(()=>{
    const element=canvas.current!,ctx=element.getContext('2d')!;let raf=0,last=performance.now(),hudTime=0;const samples:number[]=[];
    const frame=(now:number)=>{const dt=(now-last)/1000;last=now;const w=element.clientWidth,h=element.clientHeight,dpr=Math.min(2,devicePixelRatio);if(element.width!==Math.round(w*dpr)||element.height!==Math.round(h*dpr)){element.width=Math.round(w*dpr);element.height=Math.round(h*dpr);}sim.update(dt);drawCombat(ctx,sim,art,profile.hero,w,h,dpr,reduced);if(dt>0&&dt<.2&&!sim.paused){samples.push(dt*1000);if(samples.length>600)samples.shift();}if(now-hudTime>100||(sim.outcome&&!finished.current)){hudTime=now;setHud(sim.snapshot());}if(sim.outcome&&!finished.current){finished.current=true;finishRef.current();}raf=requestAnimationFrame(frame);};raf=requestAnimationFrame(frame);
    if(new URLSearchParams(location.search).has('debug'))Object.assign(window,{__combat:{snapshot:()=>({...sim.snapshot(),backing:{width:element.width,height:element.height},frameTimes:[...samples]})}});
    return()=>{cancelAnimationFrame(raf);delete (window as Window&{__combat?:unknown}).__combat;};
  },[sim,art,profile.hero,reduced]);
  const end=(outcome:Outcome)=>{sim.end(outcome);setHud(sim.snapshot());};
  const meter=(key:TextKey,value:number,max:number,kind:string)=><div className={`combat-meter ${kind}`}><div><span>{t(key)}</span><span>{Math.ceil(value)} / {max}</span></div><div className="combat-track"><i style={{width:`${Math.max(0,value/max)*100}%`}}/></div></div>;
  return <section className="combat-shell" aria-label={t('combat.screen')}>
    <canvas ref={canvas} className="combat-canvas" aria-label={t('combat.canvas')}/>
    <header className="combat-hud"><section className="combat-player combat-box"><strong>{profile.name}</strong><div className="combat-meters">{meter('stat.life',hud.hp,sim.maxHp,'life')}{meter('stat.stamina',hud.stamina,sim.playerStats.stamina,'stamina')}{meter('stat.spiritualPower',hud.mana,sim.playerStats.spiritualPower,'mana')}</div></section><span className="combat-location combat-box">{t('forest')}</span><section className="combat-enemy combat-box"><strong>{t(sim.monster)}</strong>{meter('health',hud.enemyHp,sim.enemyMax,'life')}</section></header>
    <button className="combat-pause combat-button" onClick={()=>pause(true)}>{t('combat.pause')}</button>
    <nav className="combat-controls" aria-label={t('combat.controls')}>{actions.map(({action,key,label})=>{const cooldown=action==='skill'?hud.skillCooldown:action==='dash'?hud.dashCooldown:0,unavailable=action==='skill'?hud.mana<18:action==='dash'?hud.stamina<22:action==='guard'?hud.stamina<1:false;return <button key={action} className={`combat-button action-${action}`} aria-label={t(label)} aria-disabled={unavailable||cooldown>0} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);input(`pointer-${e.pointerId}`,action,true);}} onPointerUp={e=>input(`pointer-${e.pointerId}`,action,false)} onPointerCancel={e=>input(`pointer-${e.pointerId}`,action,false)} onLostPointerCapture={e=>input(`pointer-${e.pointerId}`,action,false)} onKeyDown={e=>{if(e.code==='Enter'){e.preventDefault();input(`button-${action}`,action,true);}}} onKeyUp={e=>{if(e.code==='Enter')input(`button-${action}`,action,false);}}><kbd>{key}</kbd><span>{t(label)}</span>{cooldown>0&&<small>{t('combat.seconds',{seconds:Math.ceil(cooldown)})}</small>}</button>;})}</nav>
    {(hud.paused||hud.outcome)&&<div className="combat-scrim"><section className="combat-dialog" role="dialog" aria-modal="true" aria-label={t(hud.outcome?`combat.${hud.outcome}`:'combat.pause')} onKeyDown={e=>{if(e.key==='Tab'){const list=e.currentTarget.querySelectorAll<HTMLButtonElement>('button'),first=list[0],last=list[list.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}}>
      <h2>{t(hud.outcome?`combat.${hud.outcome}`:'combat.pause')}</h2>
      {error&&<p role="alert">{t(error)}</p>}
      {hud.outcome?<button autoFocus className="battle-primary" onClick={onReturn}>{t('combat.return')}</button>:confirmExit?<><p>{t('combat.retreatConfirm')}</p><button className="battle-primary" onClick={()=>end('retreat')}>{t('combat.retreat')}</button><button className="combat-button" onClick={()=>setConfirmExit(false)}>{t('combat.cancel')}</button></>:<><button autoFocus className="battle-primary" onClick={()=>pause(false)}>{t('combat.resume')}</button><button className="combat-button" onClick={()=>setConfirmExit(true)}>{t('combat.retreat')}</button></>}
    </section></div>}
  </section>;
}
