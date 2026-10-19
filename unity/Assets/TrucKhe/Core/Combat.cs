using System;
using System.Collections.Generic;
using System.Linq;

namespace TrucKhe.Core
{
    public sealed class SeededRandom
    {
        uint state;
        public SeededRandom(uint seed){state=seed;}
        public double Next(){unchecked{state+=0x6D2B79F5;uint t=state;t=(t^(t>>15))*(t|1);t^=t+((t^(t>>7))*(t|61));return (t^(t>>14))/4294967296.0;}}
    }
    public class Situation { public double distance,healthRatio,stamina,mana;public bool airborne,guarding;public Dictionary<string,double> cooldowns;public string lastSkill; }
    public static class MonsterAI
    {
        public static List<(Skill skill,double weight)> Candidates(Monster monster,Situation s)
        {
            var choices=new List<(Skill,double)>();
            foreach(var k in monster.skills)
            {
                if(s.distance<k.range[0]||s.distance>k.range[1]||(s.cooldowns.TryGetValue(k.id,out var cd)&&cd>0)||s.stamina<k.stamina||s.mana<k.mana)continue;
                double weight=k.weight;if(k.id==s.lastSkill)weight*=.15;if(s.guarding&&!k.blockable)weight*=2.5;if(s.airborne)weight*=k.kind=="projectile"?1.8:k.kind=="ground"?.35:.5;if(s.distance<150&&k.kind=="melee")weight*=2;if(s.healthRatio<.35)weight*=k.kind=="projectile"||k.kind=="ground"?1.3:.8;choices.Add((k,weight));
            }
            return choices;
        }
        public static Skill Choose(Monster m,Situation s,SeededRandom random)
        {
            var choices=Candidates(m,s);if(choices.Count==0)return null;double roll=random.Next()*choices.Sum(c=>c.weight);foreach(var c in choices){roll-=c.weight;if(roll<=0)return c.skill;}return choices.Last().skill;
        }
    }
    public class Shot { public int id;public double x,y,vx,vy,r,life,damage;public bool friendly,blockable;public string skillId,visual;public Slow slow; }
    public class Spark { public double x,y,life;public string color; }
    public class Cast { public Skill skill;public int face,shotsLeft;public double x,targetX,targetY,angle,shootTimer,elapsed;public bool hit; }
    public class Hazard { public double x,radius,height,progress;public bool active; }
    public class Decision { public double time,targetX,targetY;public string id; }
    public class DamageRecord { public string source,skill;public double amount; }
    public class Combat
    {
        public const double Floor=500,Width=1280,Height=720;
        public const double DashStaminaCost=22,SkillManaCost=18;
        public readonly string monster;
        public readonly Monster definition;
        public readonly Stats playerStats,enemyStats;
        public double time,hp,maxHp,stamina,mana,enemyHp,enemyMax,enemyStamina,enemyMana;
        public double x=280,y=Floor,vx,vy,attack,attackCooldown,skillCooldown,dash,dashCooldown,invulnerable,hurt,stagger,slowed,slowFactor=1,enemyStagger,enemyX=940,enemyTimer=1.4,enemyAttack,rootX;
        public int face=1,jumps,enemyFace=-1;
        public bool moving,guarding,enemyMoving,paused;
        public string enemyPhase="rest",lastSkill,outcome;
        public Dictionary<string,double> cooldowns=new Dictionary<string,double>();
        public Cast cast;
        public List<Shot> shots=new List<Shot>();
        public List<Spark> sparks=new List<Spark>();
        public List<Decision> decisions=new List<Decision>();
        public DamageRecord lastDamage;
        public HashSet<string> input=new HashSet<string>();
        readonly HashSet<string> queued=new HashSet<string>();
        readonly SeededRandom random;
        bool hit;
        int serial;
        double accumulator;
        static readonly DamageSpec PlayerAttack=new DamageSpec{type="physical",coefficient=1.5},PlayerSkill=new DamageSpec{type="magic",coefficient=3};
        public Combat(Content c,string id,Stats player=null,uint seed=1)
        {
            monster=id;definition=Maths.Clone(c.monsters[id]);playerStats=(player??c.playerStats).Copy();enemyStats=definition.stats.Copy();
            hp=maxHp=playerStats.life;stamina=playerStats.stamina;mana=playerStats.spiritualPower;enemyHp=enemyMax=enemyStats.life;enemyStamina=enemyStats.stamina;enemyMana=enemyStats.spiritualPower;random=new SeededRandom(seed);
        }
        public void Press(string action){if(paused||outcome!=null)return;if(!input.Contains(action))queued.Add(action);input.Add(action);}
        public void Release(string action)=>input.Remove(action);
        public void Clear(){input.Clear();queued.Clear();guarding=false;vx=0;moving=false;}
        public void Pause(bool value){paused=value;Clear();}
        public void End(string value){if(outcome!=null)return;outcome=value;Clear();shots.Clear();cast=null;}
        public void Update(double dt){if(paused||outcome!=null)return;accumulator+=Maths.Clamp(dt,0,.1);while(accumulator>=1.0/120&&outcome==null){Step(1.0/120);accumulator-=1.0/120;}}
        static double Tick(double v,double dt)=>Math.Max(0,v-dt);
        void Step(double dt)
        {
            time+=dt;attack=Tick(attack,dt);attackCooldown=Tick(attackCooldown,dt);skillCooldown=Tick(skillCooldown,dt);dash=Tick(dash,dt);dashCooldown=Tick(dashCooldown,dt);invulnerable=Tick(invulnerable,dt);hurt=Tick(hurt,dt);enemyAttack=Tick(enemyAttack,dt);stagger=Tick(stagger,dt);enemyStagger=Tick(enemyStagger,dt);slowed=Tick(slowed,dt);
            int direction=(input.Contains("right")?1:0)-(input.Contains("left")?1:0);double speed=playerStats.Speed;
            guarding=input.Contains("guard")&&stamina>1&&y>=Floor&&dash==0&&attack==0;
            if(direction!=0&&dash==0)face=direction;
            if(queued.Contains("jump")&&jumps<2&&!guarding){vy=jumps==0?-590:-510;jumps++;}
            if(queued.Contains("dash")&&dashCooldown==0&&stamina>=DashStaminaCost&&!guarding){dash=.2;dashCooldown=.8;stamina-=DashStaminaCost;invulnerable=Math.Max(invulnerable,.2);}
            if(input.Contains("attack")&&attackCooldown==0&&!guarding&&dash==0&&stagger==0){attack=.28/speed;attackCooldown=.42/speed;hit=false;}
            if(queued.Contains("skill")&&skillCooldown==0&&mana>=SkillManaCost&&!guarding&&stagger==0){mana-=SkillManaCost;skillCooldown=3.2;shots.Add(new Shot{id=++serial,x=x+face*35,y=y-38,vx=face*700,vy=0,r=19,friendly=true,life=2,damage=Stats.Damage(playerStats,enemyStats,PlayerSkill),blockable=true,skillId="spirit-slash"});}
            queued.Clear();stamina=Maths.Clamp(stamina+(guarding?-20:17)*dt,0,playerStats.stamina);mana=Math.Min(playerStats.spiritualPower,mana+3*dt);
            vx=dash>0?face*690:direction*(guarding?60:245)*speed*(stagger>0?.5:1)*(slowed>0?slowFactor:1);x=Maths.Clamp(x+vx*dt,28,Width-28);moving=Math.Abs(vx)>0;vy+=1400*dt;y+=vy*dt;if(y>=Floor){y=Floor;vy=0;jumps=0;}
            if(attack>.08/speed&&!hit&&(enemyX-x)*face>=-15&&Math.Abs(enemyX-x)<115&&Math.Abs(Floor-y)<100){hit=true;DamageEnemy(Stats.Damage(playerStats,enemyStats,PlayerAttack),"basic-attack");}
            if(enemyHp<=0){End("win");return;}
            UpdateEnemy(dt);
            foreach(var shot in shots)
            {
                double ox=shot.x,oy=shot.y;shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;
                double tx=shot.friendly?enemyX:x,ty=shot.friendly?Floor-35:y-38;
                if(SegmentHits(ox,oy,shot.x,shot.y,tx,ty,shot.r+23,shot.r+30)){if(shot.friendly)DamageEnemy(shot.damage,shot.skillId);else DamagePlayer(shot.damage,ox,shot.blockable,shot.skillId,shot.slow);shot.life=0;}
            }
            shots.RemoveAll(s=>s.life<=0||s.x<=-60||s.x>=Width+60||s.y<=-200||s.y>=Height+60);
            foreach(var s in sparks)s.life-=dt;sparks.RemoveAll(s=>s.life<=0);if(sparks.Count>30)sparks.RemoveRange(0,sparks.Count-30);
            if(hp<=0)End("lose");else if(enemyHp<=0)End("win");
        }
        void UpdateEnemy(double dt)
        {
            var ai=definition.ai;double speed=enemyStats.Speed;enemyMoving=false;
            enemyStamina=Math.Min(enemyStats.stamina,enemyStamina+ai.staminaRegen*dt);enemyMana=Math.Min(enemyStats.spiritualPower,enemyMana+ai.manaRegen*dt);
            foreach(var id in cooldowns.Keys.ToArray())cooldowns[id]=Math.Max(0,cooldowns[id]-dt);
            if(enemyPhase=="rest")
            {
                enemyFace=x<enemyX?-1:1;if(enemyStagger>0)return;double distance=Math.Abs(x-enemyX),motion=distance>ai.preferredRange[1]?1:distance<ai.preferredRange[0]?-.55:0;
                enemyMoving=motion!=0;enemyX=Maths.Clamp(enemyX+enemyFace*motion*ai.moveSpeed*speed*dt,90,Width-90);enemyTimer-=dt;
                if(enemyTimer<=0){var skill=MonsterAI.Choose(definition,new Situation{distance=distance,airborne=y<Floor-65,guarding=guarding,healthRatio=enemyHp/enemyMax,stamina=enemyStamina,mana=enemyMana,cooldowns=cooldowns,lastSkill=lastSkill},random);if(skill!=null)StartCast(skill);else enemyTimer=.25;}return;
            }
            var current=cast;enemyTimer-=dt;
            if(enemyPhase.StartsWith("warn")){if(enemyTimer<=0){enemyPhase=current.skill.kind=="projectile"?"shoot":current.skill.kind=="ground"?"root":current.skill.kind=="melee"?"melee":"rush";enemyTimer=current.skill.duration;}else return;}
            if(enemyTimer<=0){enemyPhase="rest";cast=null;enemyTimer=(current.skill.recovery+ai.decisionDelay[0]+random.Next()*(ai.decisionDelay[1]-ai.decisionDelay[0]))/speed;return;}
            current.elapsed+=dt;var k=current.skill;
            if(k.kind=="projectile")
            {
                current.shootTimer-=dt;while(current.shotsLeft>0&&current.shootTimer<=0){int index=k.count-current.shotsLeft;double offset=k.count>1?((double)index/(k.count-1)-.5)*k.spread:0,angle=current.angle+offset;
                    shots.Add(new Shot{id=++serial,x=enemyX+current.face*30,y=Floor-34,vx=Math.Cos(angle)*k.projectileSpeed,vy=Math.Sin(angle)*k.projectileSpeed,r=k.radius,friendly=false,life=5,damage=Stats.Damage(enemyStats,playerStats,k.damage),blockable=k.blockable,skillId=k.id,visual=k.visual,slow=k.slow});current.shotsLeft--;current.shootTimer+=k.interval;enemyAttack=.22;}
            }
            else
            {
                if(k.kind=="dash")enemyX=DashPosition(current);double relative=(x-enemyX)*current.face;
                bool inRange=k.kind=="ground"?GroundHazards(current).Any(h=>h.active&&Math.Abs(x-h.x)<h.radius&&y>Floor-h.height):k.kind=="melee"?relative>=-20&&relative<k.radius:Math.Abs(x-enemyX)<k.radius;
                if(!current.hit&&inRange&&y>Floor-k.height){current.hit=true;DamagePlayer(Stats.Damage(enemyStats,playerStats,k.damage),k.kind=="ground"?current.targetX:enemyX,k.blockable,k.id,k.slow);}enemyAttack=.1;
            }
        }
        public void StartCast(Skill skill)
        {
            enemyStamina-=skill.stamina;enemyMana-=skill.mana;cooldowns[skill.id]=skill.cooldown;
            double targetX=Maths.Clamp(x+(random.Next()*2-1)*enemyStats.AimError,28,Width-28),targetY=y-38;int direction=targetX<enemyX?-1:1;
            cast=new Cast{skill=skill,face=direction,x=enemyX,targetX=targetX,targetY=targetY,angle=Math.Atan2(targetY-(Floor-34),targetX-(enemyX+direction*30)),shotsLeft=skill.count};
            enemyFace=direction;rootX=targetX;lastSkill=skill.id;enemyPhase=skill.kind=="projectile"?"warn-shot":skill.kind=="ground"?"warn-root":skill.kind=="melee"?"warn-melee":"warn-dash";enemyTimer=Math.Max(.45,skill.windup/enemyStats.Speed);
            decisions.Add(new Decision{time=time,id=skill.id,targetX=targetX,targetY=targetY});if(decisions.Count>32)decisions.RemoveAt(0);
        }
        void DamageEnemy(double amount,string id){enemyHp=Math.Max(0,enemyHp-amount);enemyStagger=enemyStats.Stagger;lastDamage=new DamageRecord{source="player",skill=id,amount=amount};sparks.Add(new Spark{x=enemyX,y=Floor-45,life=.3,color="#fff6a8"});}
        public void DamagePlayer(double amount,double sourceX,bool blockable,string id="test",Slow slow=null)
        {
            if(invulnerable>0||outcome!=null)return;bool guarded=blockable&&guarding&&(sourceX-x)*face>=0&&stamina>=8;
            if(guarded){stamina-=8;amount=Math.Ceiling(amount*.15);sparks.Add(new Spark{x=x+face*24,y=y-35,life=.3,color="#85e7ed"});}
            if(slow!=null&&!guarded){slowed=Math.Max(slowed,slow.duration);slowFactor=slow.factor;}hp=Math.Max(0,hp-amount);invulnerable=.65;hurt=.2;if(!guarded)stagger=playerStats.Stagger;lastDamage=new DamageRecord{source="monster",skill=id,amount=amount};
        }
        public static bool SegmentHits(double x0,double y0,double x1,double y1,double cx,double cy,double hw,double hh)
        {
            double lo=0,hi=1;foreach(var v in new[]{new[]{x0,x1,cx,hw},new[]{y0,y1,cy,hh}}){double delta=v[1]-v[0];if(Math.Abs(delta)<1e-9){if(v[0]<v[2]-v[3]||v[0]>v[2]+v[3])return false;continue;}double a=(v[2]-v[3]-v[0])/delta,b=(v[2]+v[3]-v[0])/delta;lo=Math.Max(lo,Math.Min(a,b));hi=Math.Min(hi,Math.Max(a,b));if(lo>hi)return false;}return true;
        }
        public static double DashPosition(Cast c)=>Maths.Clamp(c.x+c.face*c.skill.travel*Math.Min(1,c.elapsed/c.skill.duration),90,1190);
        public static List<Hazard> GroundHazards(Cast c,bool warning=false)
        {
            var k=c.skill;var result=new List<Hazard>();
            if(k.pattern=="sequence"){int[] offsets={0,100,-100};for(int i=0;i<3;i++){double age=c.elapsed-i*.3;result.Add(new Hazard{x=c.targetX+offsets[i]*c.face,radius=k.radius,height=k.height,active=!warning&&age>=0&&age<.38,progress=Maths.Clamp(age/.38,0,1)});}return result;}
            result.Add(new Hazard{x=k.pattern=="wave"?c.x+c.face*k.travel*Math.Min(1,c.elapsed/k.duration):c.targetX,radius=k.radius,height=k.height,active=!warning,progress=c.elapsed/k.duration});return result;
        }
    }
}
