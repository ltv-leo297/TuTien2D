using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace TrucKhe.Core
{
    [Serializable] public class Point
    {
        public double x, y;
        public Point() { }
        public Point(double x, double y) { this.x = x; this.y = y; }
        public Point Copy() => new Point(x, y);
        public static double Distance(Point a, Point b) => Math.Sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y));
    }
    [Serializable] public class Box : Point
    {
        public double w, h;
        public bool Intersects(Point p, double r=10) => p.x+r>x && p.x-r<x+w && p.y+r>y && p.y-r<y+h;
        public bool Contains(Point p) => p.x>=x && p.x<=x+w && p.y>=y && p.y<=y+h;
    }
    [Serializable] public class Prop : Point
    {
        public string id, atlas, layer;
        public int tile;
        public double size, heightScale=1;
        public bool sway, flip, hidden;
        public Box solid;
    }
    [Serializable] public class Actor : Point
    {
        public string id, skin, role, appearance, itemId;
        public int? forestTile;
        public int level;
        public double mapSize;
        public List<Point> patrol;
        [JsonIgnore] public List<Point> route=new List<Point>();
        [JsonIgnore] public double phase=1, wait=2;
        [JsonIgnore] public int direction, patrolIndex;
    }
    [Serializable] public class Gate : Box
    {
        public string id, to;
        public Point spawn;
        public Point Center => new Point(Maths.Clamp(x+w/2,48,1872),Maths.Clamp(y+h/2,48,1032));
        public Point Foot { get { var c=Center; return x<=0?new Point(c.x+55,c.y+52):x+w>=1920?new Point(c.x-55,c.y+52):y<=0?new Point(c.x+60,c.y+64):new Point(c.x+60,Math.Min(1072,c.y+64)); } }
        public Box Solid => new Box{x=Foot.x-6,y=Foot.y-9,w=12,h=9};
    }
    [Serializable] public class River { public List<Point> points; public double width; }
    [Serializable] public class Bridge { public string propId; public List<Point> deck; }
    [Serializable] public class Vegetation : Point { public string id,kind; public double height,phase; public bool flip; }
    [Serializable] public class Scene
    {
        public string id;
        public Point spawn;
        public List<Prop> props=new List<Prop>();
        public List<Actor> actors=new List<Actor>();
        public List<Gate> gates=new List<Gate>();
        public List<Box> water=new List<Box>();
        public List<River> rivers=new List<River>();
        public List<Bridge> bridges=new List<Bridge>();
        public List<List<Point>> walkable;
        public List<Vegetation> vegetation=new List<Vegetation>();
        public bool landscape;
    }
    [Serializable] public class Stats
    {
        public double life,stamina,spiritualPower,attack,killingIntent,defense,magicResistance,willpower,speed,accuracy;
        public static readonly string[] Keys={"life","stamina","spiritualPower","attack","killingIntent","defense","magicResistance","willpower","speed","accuracy"};
        public Stats Copy() => (Stats)MemberwiseClone();
        public double Get(string key) => (double)typeof(Stats).GetField(key).GetValue(this);
        public void Add(string key,double n) { var f=typeof(Stats).GetField(key); if(f==null)throw new Exception("stat"); f.SetValue(this,(double)f.GetValue(this)+n); }
        public static double Damage(Stats a,Stats b,DamageSpec s) => Math.Max(1,(a.attack+(s.type=="sword"?a.killingIntent:0))*s.coefficient-(s.type=="magic"?b.magicResistance:b.defense+(s.type=="sword"?b.magicResistance:0)));
        public double Speed => Maths.Clamp(speed/16,.65,1.5);
        public double Stagger => .24/(1+willpower/20);
        public double AimError => Math.Max(2,70/(1+accuracy/5));
    }
    [Serializable] public class DamageSpec { public string type; public double coefficient; }
    [Serializable] public class Slow { public double factor,duration; }
    [Serializable] public class Skill
    {
        public string id,kind,visual,pattern,description;
        public Dictionary<string,string> name;
        public DamageSpec damage;
        public Slow slow;
        public double stamina,mana,cooldown,weight,windup,recovery,duration,radius,height,interval,projectileSpeed,spread,travel;
        public double[] range;
        public int count;
        public bool blockable;
    }
    [Serializable] public class MonsterArt { public int row,mapTile; public double mapSize,size; public string sheet,color; }
    [Serializable] public class Brain { public double[] preferredRange,decisionDelay; public double moveSpeed,staminaRegen,manaRegen; }
    [Serializable] public class Monster
    {
        public Dictionary<string,string> name;
        public int level;
        public Stats stats;
        public MonsterArt art;
        public Brain ai;
        public List<Skill> skills;
    }
    [Serializable] public class Item
    {
        public string id,slot,iconAssetId,visualId;
        public int level,stackMax;
        public Dictionary<string,string> name,description;
        public Dictionary<string,double> bonuses;
    }
    [Serializable] public class Content
    {
        public Dictionary<string,Scene> scenes;
        public Dictionary<string,Monster> monsters;
        public List<string> monsterIds,slots,starterItems;
        public List<Item> items;
        public Stats playerStats;
        public Dictionary<string,Dictionary<string,string>> locales;
        public JObject atlas,spriteFrames,forestFrames,idleFrames,vegetation,combatFrames,effectFrames,ambient;
        [JsonIgnore] public Dictionary<string,Item> catalog;
        public static Content Parse(string json) { var c=JsonConvert.DeserializeObject<Content>(json); c.catalog=c.items.ToDictionary(i=>i.id); return c; }
        public string Text(string locale,string key,params object[] args)
        {
            if(key==null)return "";
            string value;
            if(monsters.TryGetValue(key,out var m))value=m.name[locale];
            else if(!locales[locale].TryGetValue(key,out value)&&!locales["vi"].TryGetValue(key,out value))value=key;
            for(int i=0;i+1<args.Length;i+=2)value=value.Replace("{"+args[i]+"}",Convert.ToString(args[i+1]));
            return value;
        }
    }
    public static class Maths
    {
        public static double Clamp(double v,double min,double max)=>Math.Max(min,Math.Min(max,v));
        public static bool Finite(double v)=>!double.IsNaN(v)&&!double.IsInfinity(v);
        public static T Clone<T>(T value)=>JsonConvert.DeserializeObject<T>(JsonConvert.SerializeObject(value));
    }
}
