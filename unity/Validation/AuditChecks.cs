using System;
using System.IO;
using System.Linq;
using System.Diagnostics;
using System.Reflection;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using TrucKhe.Core;

static partial class Program
{
    static void WithStore(Content c,Action<SaveStore,string> run)
    {
        string dir=Path.Combine(Path.GetTempPath(),"truckhe-audit-"+Guid.NewGuid().ToString("N"));
        try{using(var store=new SaveStore(dir,c)){store.Change(p=>p.profile.name="Kiểm tra");run(store,dir);}}
        finally{if(Directory.Exists(dir))Directory.Delete(dir,true);}
    }
    static void Audit(Content c,string root)
    {
        Test("audit: incomplete web inventory/ledger/profile rejected without data loss",()=>WithStore(c,(store,dir)=>{
            foreach(string key in new[]{"truc-khe.inventory.v1","truc-khe.combat.v1","truc-khe.profile"})
            {
                var payload=new JObject{["truc-khe.progress"]=new JObject(),[key]=new JObject()};
                string before=File.ReadAllText(dir+"/progress-v1.json"),memory=JsonConvert.SerializeObject(store.Current);
                Throws(()=>store.ImportWeb(payload.ToString()),key);
                Check(File.ReadAllText(dir+"/progress-v1.json")==before&&JsonConvert.SerializeObject(store.Current)==memory,"invalid import changed save");
            }
        }));
        Test("audit: malformed legacy shapes and fractional quantities rejected",()=>WithStore(c,(store,dir)=>{
            foreach(string legacy in new[]{"null","[]","{\"bag\":null}","{\"bag\":[]}","{\"bag\":{\"herb\":1.5}}","{\"bag\":{\"herb\":\"3\"}}"})
            {
                string before=File.ReadAllText(dir+"/progress-v1.json");
                Throws(()=>store.ImportWeb("{\"truc-khe.progress\":"+legacy+"}"),legacy);
                Check(before==File.ReadAllText(dir+"/progress-v1.json"),"legacy corruption overwrote save");
            }
            var payload=new JObject{["truc-khe.inventory.v1"]=JObject.FromObject(store.Current.inventory)};
            payload["truc-khe.inventory.v1"]["slots"].First(x=>x.Type!=JTokenType.Null)["quantity"]=1.5;
            Throws(()=>store.ImportWeb(payload.ToString()),"fractional new inventory");
        }));
        Test("audit: native required fields cannot silently default",()=>{
            string dir=Path.Combine(Path.GetTempPath(),"truckhe-native-"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(dir);
            try{
                var valid=JObject.FromObject(new Progress{inventory=Inventory.Create(c)});
                foreach(string field in new[]{"version","profile","map","position","direction","visited","inventory","ledger"})
                {
                    var bad=(JObject)valid.DeepClone();bad.Remove(field);string raw=bad.ToString();File.WriteAllText(dir+"/progress-v1.json",raw);
                    Throws(()=>{using(var store=new SaveStore(dir,c)){}},"missing "+field);
                    Check(File.ReadAllText(dir+"/progress-v1.json")==raw,"native corruption changed");
                }
            }finally{Directory.Delete(dir,true);}
        });
        Test("audit: invalid sprite directions rejected by native and return saves",()=>WithStore(c,(store,dir)=>{
            foreach(int direction in new[]{-1,4,int.MaxValue})
            {
                Throws(()=>store.Change(p=>p.direction=direction),"native direction");
                Throws(()=>store.Change(p=>p.ledger.returnTo=new ReturnPoint{pos=c.scenes["forest"].spawn,direction=direction}),"return direction");
            }
        }));
        Test("audit: failed disk write preserves memory, file and backup; retry succeeds",()=>WithStore(c,(store,dir)=>{
            store.Change(p=>p.inventory=p.inventory.Apply(c,"add","herb",2));
            string before=File.ReadAllText(dir+"/progress-v1.json"),backup=File.ReadAllText(dir+"/progress-v1.json.bak"),memory=JsonConvert.SerializeObject(store.Current);
            Directory.CreateDirectory(dir+"/progress-v1.json.tmp");
            Throws(()=>store.Change(p=>p.inventory=p.inventory.Apply(c,"add","herb",3)),"blocked temporary path");
            Check(before==File.ReadAllText(dir+"/progress-v1.json")&&backup==File.ReadAllText(dir+"/progress-v1.json.bak")&&memory==JsonConvert.SerializeObject(store.Current),"failed write changed data");
            Directory.Delete(dir+"/progress-v1.json.tmp");store.Change(p=>p.inventory=p.inventory.Apply(c,"add","herb",3));
            Check(store.Current.inventory.slots.Where(s=>s?.itemId=="herb").Sum(s=>s.quantity)==5,"retry did not save exactly once");
            Check(File.ReadAllText(dir+"/progress-v1.json.bak")==before,"backup is not previous committed save");
        }));
        Test("audit: failed file replacement preserves prior save and can retry",()=>WithStore(c,(store,dir)=>{
            string path=dir+"/progress-v1.json",before=File.ReadAllText(path),memory=JsonConvert.SerializeObject(store.Current);
            Directory.CreateDirectory(path+".bak");
            Throws(()=>store.Change(p=>p.profile.name="Not committed"),"backup path blocks replacement");
            Check(File.ReadAllText(path)==before&&JsonConvert.SerializeObject(store.Current)==memory,"replacement failure changed progress");
            Directory.Delete(path+".bak");store.Change(p=>p.profile.name="Retry committed");
            Check(store.Current.profile.name=="Retry committed"&&File.ReadAllText(path+".bak")==before,"replacement retry or backup incorrect");
        }));
        Test("audit: save lease excludes a second OS process",()=>WithStore(c,(store,dir)=>{
            var start=new ProcessStartInfo(Environment.ProcessPath){UseShellExecute=false,RedirectStandardError=true,RedirectStandardOutput=true};
            if(Path.GetFileNameWithoutExtension(Environment.ProcessPath)=="dotnet")start.ArgumentList.Add(Assembly.GetExecutingAssembly().Location);
            start.ArgumentList.Add(root);start.ArgumentList.Add("--lease-probe");start.ArgumentList.Add(dir);
            using(var child=Process.Start(start)){if(!child.WaitForExit(15000)){child.Kill(true);throw new Exception("lease child timed out");}Check(child.ExitCode==23,"second process acquired save or failed unexpectedly: "+child.StandardError.ReadToEnd());}
        }));
        Test("audit: interrupted native battle recovers once across two reloads",()=>{
            string dir=Path.Combine(Path.GetTempPath(),"truckhe-recovery-"+Guid.NewGuid().ToString("N"));var point=c.scenes["forest"].spawn.Copy();double deadline;
            try{
                using(var store=new SaveStore(dir,c))store.Change(p=>p.ledger=p.ledger.Reserve(c.monsterIds[0],"interrupted",1000,new ReturnPoint{pos=point,direction=2}));
                using(var store=new SaveStore(dir,c)){deadline=store.Current.ledger.monsters[c.monsterIds[0]].Single().readyAt.Value;Check(store.Current.map=="forest"&&store.Current.direction==2,"return map/direction");Near(Point.Distance(store.Current.position,point),0,"return position");Check(store.Current.ledger.Available(c.monsterIds[0],SaveStore.Now)==9,"spent once");}
                using(var store=new SaveStore(dir,c))Near(store.Current.ledger.monsters[c.monsterIds[0]].Single().readyAt.Value,deadline,"no second recharge reset");
            }finally{if(Directory.Exists(dir))Directory.Delete(dir,true);}
        });
        Test("audit: equipped web save preserves identities, overflow, visits and charges",()=>WithStore(c,(store,dir)=>{
            var inv=Inventory.Create(c);inv=inv.Apply(c,"equip",inv.slots.First(s=>s?.itemId=="bamboo-sword").uid);inv.overflow["future-resource"]=42;
            var ledger=new Ledger();ledger.Validate(c);ledger=ledger.Reserve(c.monsterIds[0],"old",1000,new ReturnPoint{pos=c.scenes["forest"].spawn,direction=3}).Finish("old",2000);
            store.ImportWeb(new JObject{["truc-khe.inventory.v1"]=JObject.FromObject(inv),["truc-khe.combat.v1"]=JObject.FromObject(ledger),["truc-khe.progress"]=JObject.Parse("{\"visited\":[\"teacher\",\"healer\"]}")}.ToString());
            Check(JsonConvert.SerializeObject(store.Current.inventory)==JsonConvert.SerializeObject(inv),"import inventory identity");Check(store.Current.visited.SequenceEqual(new[]{"teacher","healer"}),"visits");Near(store.Current.ledger.monsters[c.monsterIds[0]][0].readyAt.Value,302000,"finished charge unchanged");
        }));
        Test("audit: inventory 100 equip/unequip cycles conserve all instance IDs",()=>{
            var inv=Inventory.Create(c);Func<Inventory,string[]> ids=x=>x.slots.Where(s=>s!=null).Concat(x.equipment.Values).Select(s=>s.uid).OrderBy(s=>s).ToArray();var original=ids(inv);
            for(int i=0;i<100;i++){var gear=inv.slots.First(s=>s!=null&&c.catalog[s.itemId].slot!=null);var slot=c.catalog[gear.itemId].slot;inv=inv.Apply(c,"equip",gear.uid).Apply(c,"unequip",slot);Check(ids(inv).SequenceEqual(original),"lost/duplicated instance");}
        });
        Test("audit: full charge pool, exact boundary, duplicate reserve and retired IDs",()=>{
            var l=new Ledger();l.Validate(c);var point=new ReturnPoint{pos=c.scenes["forest"].spawn};string id=c.monsterIds[0];
            for(int i=0;i<10;i++)l=l.Reserve(id,"enc-"+i,1000+i,point).Finish("enc-"+i,2000+i);
            Check(l.Available(id,301999)==0&&l.Available(c.monsterIds[1],301999)==10,"per-monster full pool");Throws(()=>l.Reserve(id,"eleventh",301999,point),"empty pool");
            Check(l.Available(id,302000)==1&&l.Available(id,302009)==10,"exact recharge boundaries");
            l=l.Reserve(id,"again",302000,point);string before=JsonConvert.SerializeObject(l);Check(JsonConvert.SerializeObject(l.Reserve(id,"again",302001,point))==before,"duplicate reserve");
            l.monsters["retired"]=new List<Charge>{new Charge{id="retired-1",startedAt=10,readyAt=300010}};l.Validate(c);Check(l.monsters["retired"].Count==1,"retired ledger lost");
        });
        Test("audit: AI eligibility rejects range, cooldown and insufficient resources",()=>{
            foreach(var m in c.monsters.Values){var s=new Situation{distance=200,stamina=0,mana=0,cooldowns=m.skills.ToDictionary(k=>k.id,k=>1.0)};Check(MonsterAI.Candidates(m,s).Count==0,"cooldown/resources");s.cooldowns.Clear();s.stamina=s.mana=10000;s.distance=100000;Check(MonsterAI.Candidates(m,s).Count==0,"range");}
        });
        Test("audit: diagonal projectile sweep and separate ground activation sites",()=>{
            Check(Combat.SegmentHits(0,0,100,100,50,50,2,2),"diagonal hit");Check(!Combat.SegmentHits(0,0,100,100,50,80,2,2),"diagonal miss");
            var skill=c.monsters.Values.SelectMany(m=>m.skills).Single(k=>k.pattern=="sequence");var cast=new Cast{skill=skill,x=900,targetX=600,face=-1,elapsed=.31};
            var sites=Combat.GroundHazards(cast);Check(sites.Select(h=>h.x).SequenceEqual(new[]{600.0,500,700}),"locked sites");Check(sites[0].active&&sites[1].active&&!sites[2].active,"timed activations");Check(Combat.GroundHazards(cast,true).All(h=>!h.active),"warning damages");
        });
        Test("audit: slow affects actual travel, expires and guard prevents it",()=>{
            var baseline=new Combat(c,c.monsterIds[0]);var slowed=new Combat(c,c.monsterIds[0]);slowed.DamagePlayer(1,slowed.x+20,true,slow:new Slow{factor=.5,duration=.3});slowed.stagger=0;
            baseline.Press("right");slowed.Press("right");for(int i=0;i<12;i++){baseline.Update(1.0/120);slowed.Update(1.0/120);}Check(slowed.x-280<(baseline.x-280)*.6,"slow movement");for(int i=0;i<40;i++)slowed.Update(1.0/120);Near(slowed.slowed,0,"slow expiry");
            var guard=new Combat(c,c.monsterIds[0]);guard.guarding=true;guard.DamagePlayer(1,guard.x+20,true,slow:new Slow{factor=.5,duration=1});Near(guard.slowed,0,"guard blocks slow");
        });
        Test("audit: combat snapshot independent from inventory and terminal states frozen",()=>{
            var inv=Inventory.Create(c);var stats=inv.EffectiveStats(c);var s=new Combat(c,c.monsterIds[0],stats);double attack=s.playerStats.attack;stats.attack=999;Near(s.playerStats.attack,attack,"snapshot isolated");
            foreach(string outcome in new[]{"win","lose","retreat"}){s=new Combat(c,c.monsterIds[0]);s.Press("guard");s.End(outcome);double time=s.time,hp=s.hp;s.Update(.1);s.DamagePlayer(100,s.x,true);s.Press("attack");Near(s.time,time,"terminal time");Near(s.hp,hp,"terminal damage");Check(s.input.Count==0&&s.cast==null&&s.shots.Count==0,"terminal cleanup");}
        });
    }
}
