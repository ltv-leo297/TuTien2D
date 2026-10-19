using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;

namespace TrucKhe.Core
{
    [Serializable] public class Stack { [JsonProperty(Required=Required.Always)] public string uid,itemId; [JsonProperty(Required=Required.Always)] public int quantity; }
    [Serializable] public class Inventory
    {
        [JsonProperty(Required=Required.Always)] public int version=1;
        [JsonProperty(Required=Required.Always)] public long revision;
        [JsonProperty(Required=Required.Always)] public Stack[] slots=new Stack[100];
        [JsonProperty(Required=Required.Always)] public Dictionary<string,Stack> equipment=new Dictionary<string,Stack>();
        [JsonProperty(Required=Required.Always)] public Dictionary<string,int> overflow=new Dictionary<string,int>();
        public void Validate(Content c)
        {
            if(version!=1||revision<0||slots==null||slots.Length!=100||equipment==null||overflow==null)throw new Exception("invalid");
            var seen=new HashSet<string>();
            void Check(Stack s,string slot=null)
            {
                if(s==null||string.IsNullOrEmpty(s.uid)||!seen.Add(s.uid)||string.IsNullOrEmpty(s.itemId)||s.quantity<=0)throw new Exception("invalid");
                c.catalog.TryGetValue(s.itemId,out var item);
                if(item!=null&&s.quantity>item.stackMax)throw new Exception("invalid");
                if(slot!=null&&(!c.slots.Contains(slot)||s.quantity!=1||(item!=null&&item.slot!=slot)))throw new Exception("invalid");
            }
            foreach(var s in slots)if(s!=null)Check(s);
            foreach(var entry in equipment)Check(entry.Value,entry.Key);
            foreach(var entry in overflow)if(string.IsNullOrEmpty(entry.Key)||entry.Value<=0)throw new Exception("invalid");
        }
        int Insert(Content c,string id,int quantity)
        {
            if(!c.catalog.TryGetValue(id,out var item))throw new Exception("unknown");int remaining=quantity;
            foreach(var s in slots)if(s!=null&&s.itemId==id){int n=Math.Min(item.stackMax-s.quantity,remaining);s.quantity+=n;remaining-=n;}
            for(int i=0;i<100&&remaining>0;i++)if(slots[i]==null){int n=Math.Min(item.stackMax,remaining);slots[i]=new Stack{uid=Guid.NewGuid().ToString("N"),itemId=id,quantity=n};remaining-=n;}
            return remaining;
        }
        public static Inventory Create(Content c,Dictionary<string,int> legacy=null)
        {
            var state=new Inventory();state.equipment["weapon"]=new Stack{uid=Guid.NewGuid().ToString("N"),itemId="wood-sword",quantity=1};
            foreach(var e in legacy??new Dictionary<string,int>()){if(e.Value<0)throw new Exception("invalid");if(e.Value==0)continue;int rem=c.catalog.ContainsKey(e.Key)?state.Insert(c,e.Key,e.Value):e.Value;if(rem>0)state.overflow[e.Key]=rem;}
            foreach(var id in c.starterItems){int rem=state.Insert(c,id,1);if(rem>0)state.overflow[id]=(state.overflow.TryGetValue(id,out var n)?n:0)+rem;}
            state.Validate(c);return state;
        }
        public Inventory Apply(Content c,string operation,string id,int quantity=1)
        {
            Validate(c);var next=Maths.Clone(this);
            switch(operation)
            {
                case "equip":
                    int index=Array.FindIndex(next.slots,s=>s!=null&&s.uid==id);if(index<0)throw new Exception("stale");var stack=next.slots[index];
                    if(!c.catalog.TryGetValue(stack.itemId,out var item)||item.slot==null)throw new Exception("unknown");
                    next.slots[index]=next.equipment.TryGetValue(item.slot,out var old)?old:null;next.equipment[item.slot]=stack;break;
                case "unequip":
                    if(!next.equipment.TryGetValue(id,out var equipped))throw new Exception("stale");int free=Array.IndexOf(next.slots,null);if(free<0)throw new Exception("full");next.slots[free]=equipped;next.equipment.Remove(id);break;
                case "add":
                    if(quantity<=0)throw new Exception("invalid");if(next.Insert(c,id,quantity)>0)throw new Exception("full");break;
                case "claim":
                    if(!next.overflow.TryGetValue(id,out var count))throw new Exception("stale");int remaining=next.Insert(c,id,count);if(remaining==count)throw new Exception("full");if(remaining>0)next.overflow[id]=remaining;else next.overflow.Remove(id);break;
                default:throw new Exception("operation");
            }
            next.revision++;next.Validate(c);return next;
        }
        public Stats EffectiveStats(Content c)
        {
            var result=c.playerStats.Copy();foreach(var s in equipment.Values)if(c.catalog.TryGetValue(s.itemId,out var item))foreach(var bonus in item.bonuses)result.Add(bonus.Key,bonus.Value);return result;
        }
    }
    [Serializable] public class Charge { [JsonProperty(Required=Required.Always)] public string id; [JsonProperty(Required=Required.Always)] public double startedAt; public double? readyAt; }
    [Serializable] public class ReturnPoint { [JsonProperty(Required=Required.Always)] public string map="forest";[JsonProperty(Required=Required.Always)] public Point pos;[JsonProperty(Required=Required.Always)] public int direction; }
    [Serializable] public class Ledger
    {
        [JsonProperty(Required=Required.Always)] public int version=1;
        [JsonProperty(Required=Required.Always)] public Dictionary<string,List<Charge>> monsters=new Dictionary<string,List<Charge>>();
        public ReturnPoint returnTo;
        public void Validate(Content c)
        {
            if(version!=1||monsters==null)throw new Exception("save");var ids=new HashSet<string>();
            foreach(var list in monsters.Values)
            {
                if(list==null||list.Count>10)throw new Exception("save");
                foreach(var e in list)if(e==null||string.IsNullOrEmpty(e.id)||!ids.Add(e.id)||!Maths.Finite(e.startedAt)||e.startedAt<0||(e.readyAt.HasValue&&(!Maths.Finite(e.readyAt.Value)||e.readyAt<e.startedAt)))throw new Exception("save");
            }
            foreach(var id in c.monsterIds)if(!monsters.ContainsKey(id))monsters[id]=new List<Charge>();
            if(returnTo!=null&&(returnTo.map!="forest"||returnTo.direction<0||returnTo.direction>3||returnTo.pos==null||!Maths.Finite(returnTo.pos.x)||!Maths.Finite(returnTo.pos.y)))throw new Exception("save");
        }
        public int Available(string id,double now)=>10-(monsters.TryGetValue(id,out var entries)?entries.Count(e=>!e.readyAt.HasValue||e.readyAt>now):0);
        public Ledger Reserve(string monster,string id,double now,ReturnPoint point)
        {
            if(monsters.Values.SelectMany(x=>x).Any(e=>e.id==id))return this;
            if(monsters.Values.SelectMany(x=>x).Any(e=>!e.readyAt.HasValue)||Available(monster,now)<=0)throw new Exception("empty");
            var next=Maths.Clone(this);next.returnTo=point;
            foreach(var entries in next.monsters.Values)entries.RemoveAll(e=>e.readyAt.HasValue&&e.readyAt<=now);
            if(!next.monsters.ContainsKey(monster))next.monsters[monster]=new List<Charge>();next.monsters[monster].Add(new Charge{id=id,startedAt=now});return next;
        }
        public Ledger Finish(string id,double now)
        {
            var next=Maths.Clone(this);foreach(var e in next.monsters.Values.SelectMany(x=>x))if(e.id==id&&!e.readyAt.HasValue)e.readyAt=Math.Max(now,e.startedAt)+300000;return next;
        }
        public Ledger Recover(double now)
        {
            var next=Maths.Clone(this);foreach(var e in next.monsters.Values.SelectMany(x=>x))if(!e.readyAt.HasValue)e.readyAt=Math.Max(now,e.startedAt)+300000;return next;
        }
    }
}
