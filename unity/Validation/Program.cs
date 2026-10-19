using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using TrucKhe.Core;

static partial class Program
{
    static int passed;
    static void Check(bool result,string message){if(!result)throw new Exception(message);}
    static void Near(double a,double b,string name,double tolerance=.000001)=>Check(Math.Abs(a-b)<tolerance,$"{name}: {a} != {b}");
    static void Test(string name,Action action){action();passed++;Console.WriteLine("PASS "+name);}
    static void Throws(Action action,string name){try{action();}catch{return;}throw new Exception("Expected failure: "+name);}
    static void Main(string[] args)
    {
        string root=args.Length>0?Path.GetFullPath(args[0]):Path.GetFullPath("..");
        var c=Content.Parse(File.ReadAllText(root+"/Assets/TrucKhe/Resources/Data/content.json"));
        if(args.Length>1&&args[1]=="--lease-probe")
        {
            try{using(var store=new SaveStore(args[2],c)){}Environment.ExitCode=0;}
            catch(IOException){Environment.ExitCode=23;}
            return;
        }
        var fixtures=JObject.Parse(File.ReadAllText(root+"/Validation/web-fixtures.json"));
        Test("catalog and locale completeness",()=>{Check(c.scenes.Count==4&&c.monsters.Count==4&&c.items.Count==23,"content counts");Check(c.monsters.Values.Sum(m=>m.skills.Count)==16,"skills");foreach(var m in c.monsters.Values)foreach(var k in m.skills)Check(k.windup>=.45&&k.range.Length==2,"warning");Check(c.locales["vi"].Keys.OrderBy(x=>x).SequenceEqual(c.locales["en"].Keys.OrderBy(x=>x)),"locales");});
        foreach(var f in fixtures["combats"])
        {
            string id=f["id"].Value<string>();uint seed=f["seed"].Value<uint>();
            Test($"TypeScript/C# combat replay {id} seed {seed}",()=>{
                var sim=new Combat(c,id,seed:seed);int snapshot=0;
                for(int i=0;i<1200;i++)
                {
                    if(i==0)sim.Press("right");if(i==160){sim.Release("right");sim.Press("attack");}
                    if(i==240)sim.Press("skill");if(i==241)sim.Release("skill");if(i==300||i==330)sim.Press("jump");if(i==301||i==331)sim.Release("jump");if(i==460)sim.Press("dash");if(i==461)sim.Release("dash");if(i==600){sim.Release("attack");sim.Press("guard");}if(i==720){sim.Release("guard");sim.Press("attack");}sim.Update(1.0/120);
                    if(i%120!=119)continue;var expected=f["snapshots"][snapshot++];
                    foreach(string key in new[]{"time","hp","maxHp","enemyHp","stamina","mana","enemyStamina","enemyMana","x","y","face","jumps","rootX","enemyX","skillCooldown","dashCooldown","slowed","slowFactor"})Near(Convert.ToDouble(typeof(Combat).GetField(key).GetValue(sim)),expected[key].Value<double>(),id+" "+key);
                    Check(sim.enemyPhase==expected["phase"].Value<string>(),"enemy phase");Check(sim.outcome==expected["outcome"].Value<string>(),"outcome");Check(sim.shots.Count==expected["shots"].Count(),"shots");Check(sim.decisions.Select(d=>d.id).SequenceEqual(expected["decisions"].Select(d=>d["id"].Value<string>())),"AI decisions");
                }
            });
        }
        foreach(var f in fixtures["navigation"])
        {
            string map=f["map"].Value<string>();var start=f["start"].ToObject<Point>();var goal=f["goal"].ToObject<Point>();var expected=f["route"].ToObject<List<Point>>();
            Test($"navigation {map} {goal.x:F0},{goal.y:F0}",()=>{var nav=new Navigation(c.scenes[map]);var route=nav.Find(start,goal);var p=start.Copy();foreach(var next in route){Check(nav.Clear(p,next),"invalid segment");p=next;}if(expected.Count>0)Near(Point.Distance(p,goal),Point.Distance(expected.Last(),goal),"destination",.01);var walker=start.Copy();while(route.Count>0)nav.Walk(walker,route,1.37);Near(Point.Distance(walker,p),0,"variable step traversal");});
        }
        Test("damage formulas",()=>{var a=c.playerStats;var b=c.monsters.First().Value.stats;Near(Stats.Damage(a,b,new DamageSpec{type="physical",coefficient=1.5}),a.attack*1.5-b.defense,"physical");Near(Stats.Damage(a,b,new DamageSpec{type="magic",coefficient=3}),a.attack*3-b.magicResistance,"magic");Near(Stats.Damage(a,b,new DamageSpec{type="sword",coefficient=2}),(a.attack+a.killingIntent)*2-b.defense-b.magicResistance,"sword");});
        foreach(var gate in c.scenes["village"].gates)Test("native world gate round trip "+gate.to,()=>{var world=new World(c,"A");world.Go(new Point(gate.x+gate.w/2,gate.y+gate.h/2));for(int i=0;i<2000&&world.map=="village";i++)world.Update(1.0/60);Check(world.map==gate.to,"outbound gate");var back=world.Scene.gates.Single();world.Go(new Point(back.x+back.w/2,back.y+back.h/2));for(int i=0;i<2000&&world.map!= "village";i++)world.Update(1.0/60);Check(world.map=="village"&&world.transitions==2,"return gate");});
        Test("native NPC approach and resource cooldown",()=>{var world=new World(c,"A");world.Go(c.scenes["village"].actors.First(a=>a.id=="teacher"),"teacher");for(int i=0;i<2000&&!world.visited.Contains("teacher");i++)world.Update(1.0/60);Check(world.visited.Contains("teacher"),"conversation");world.Restore("forest",c.scenes["forest"].spawn,0);var plant=world.actors.First(a=>a.id=="herb");world.Go(plant,plant.id);for(int i=0;i<2000&&!world.events.Any(e=>e.type=="gather");i++)world.Update(1.0/60);Check(world.events.Count(e=>e.type=="gather")==1,"gather once");world.Go(plant,plant.id);for(int i=0;i<20;i++)world.Update(1.0/60);Check(world.events.Count(e=>e.type=="gather")==1&&world.events.Any(e=>e.type=="cooldown"),"cooldown");});
        Test("equip swap, bonus once, full bag rollback and unequip",()=>{
            var inv=Inventory.Create(c);var s=inv.slots.First(x=>x?.itemId=="bamboo-sword");var next=inv.Apply(c,"equip",s.uid);Near(next.EffectiveStats(c).attack,c.playerStats.attack+9,"bonus");Check(inv.equipment["weapon"].itemId=="wood-sword","immutable operation");
            while(next.slots.Any(x=>x==null))next=next.Apply(c,"add","wood-sword");string before=JsonConvert.SerializeObject(next);Throws(()=>next.Apply(c,"unequip","weapon"),"full unequip");Throws(()=>next.Apply(c,"add","herb",100),"full insert");Check(before==JsonConvert.SerializeObject(next),"atomic");next=next.Apply(c,"equip",next.slots.First(x=>x.itemId=="wood-sword").uid);Check(next.equipment["weapon"].itemId=="wood-sword","full swap");next.Validate(c);
        });
        Test("migration preserves overflow and unknown IDs",()=>{var inv=Inventory.Create(c,new Dictionary<string,int>{{"herb",12000},{"future-resource",24}});Check(inv.overflow["future-resource"]==24,"unknown");Check(inv.slots.Where(s=>s?.itemId=="herb").Sum(s=>s.quantity)+inv.overflow["herb"]==12000,"count");});
        Test("charges independent recharge, duplicate finish and recovery",()=>{var l=new Ledger();l.Validate(c);string id=c.monsterIds[0];var p=new ReturnPoint{pos=c.scenes["forest"].spawn};l=l.Reserve(id,"first",1000,p);Check(l.Available(id,1000)==9,"reserve");Throws(()=>l.Reserve(id,"second",1001,p),"active");l=l.Finish("first",2000).Finish("first",9999);l=l.Reserve(id,"second",3000,p).Finish("second",4000);Check(l.Available(id,302000)==9&&l.Available(id,304000)==10,"independent");l=l.Reserve(id,"interrupted",310000,p).Recover(320000);Check(l.monsters[id].Single(e=>e.id=="interrupted").readyAt==620000,"recovery");});
        Test("guard, iframe, double jump, pause and slow",()=>{var s=new Combat(c,c.monsterIds[0]);s.guarding=true;s.DamagePlayer(100,s.x+20,true);Near(s.hp,s.maxHp-15,"guard");s.DamagePlayer(100,s.x+20,true);Near(s.hp,s.maxHp-15,"iframe");s.Press("jump");s.Update(.02);s.Release("jump");s.Press("jump");s.Update(.02);s.Release("jump");s.Press("jump");s.Update(.02);Check(s.jumps==2,"double jump");s.Pause(true);double t=s.time;s.Update(.1);Near(t,s.time,"paused");Check(s.input.Count==0,"input release");});
        foreach(var m in c.monsters)foreach(var skill in m.Value.skills)Test("skill execution "+skill.id,()=>{var s=new Combat(c,m.Key);s.x=650;s.enemyX=700;s.StartCast(skill);double target=s.cast.targetX;s.x=900;s.Update(.1);Near(s.cast.targetX,target,"locked target");for(int i=0;i<800&&s.cast!=null;i++)s.Update(1.0/120);Check(s.cast==null||s.outcome!=null,"cast completes");});
        Test("native save transactions, process lease, web import, corruption preservation",()=>{
            string dir=Path.Combine(Path.GetTempPath(),"truckhe-test-"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(dir);
            try{
                using(var store=new SaveStore(dir,c)){store.Change(p=>p.profile.name="Lâm Phong");Throws(()=>{using(var other=new SaveStore(dir,c)){}},"lease");store.Change(p=>p.inventory=p.inventory.Apply(c,"add","herb",2));string old=File.ReadAllText(dir+"/progress-v1.json");Throws(()=>store.Change(p=>p.inventory.slots=new TrucKhe.Core.Stack[2]),"invalid transaction");Check(old==File.ReadAllText(dir+"/progress-v1.json"),"save unchanged");store.ImportWeb(JsonConvert.SerializeObject(new Dictionary<string,object>{{"truc-khe.progress",new{bag=new{herb=7},visited=new[]{"teacher"}}},{"truc-khe.profile",new{name="Vân Ly",hero="C"}}}));Check(store.Current.profile.hero=="C"&&store.Current.visited.Contains("teacher"),"import");}
                using(var reloaded=new SaveStore(dir,c)){Check(reloaded.Current.inventory.slots.Where(x=>x?.itemId=="herb").Sum(x=>x.quantity)==7,"reload");reloaded.ImportWeb("{\"truc-khe.progress\":{},\"truc-khe.locale\":\"en\",\"truc-khe.motion\":true}");Check(reloaded.Current.locale=="en"&&reloaded.Current.reducedMotion,"parsed web preferences");reloaded.ImportWeb(JsonConvert.SerializeObject(new Dictionary<string,string>{{"truc-khe.progress","{}"},{"truc-khe.locale","\"vi\""}}));Check(reloaded.Current.locale=="vi","raw localStorage strings");}File.WriteAllText(dir+"/progress-v1.json","broken");Throws(()=>{using(var s=new SaveStore(dir,c)){}},"malformed save");Check(File.ReadAllText(dir+"/progress-v1.json")=="broken","preserve corruption");
            }finally{Directory.Delete(dir,true);}
        });
        Audit(c,root);
        MobileChecks();
        Console.WriteLine($"RESULT: {passed} checks passed. Unity rendering/editor/player execution is a separate gate.");
    }
}
