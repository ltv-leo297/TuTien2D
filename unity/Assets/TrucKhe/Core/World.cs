using System;
using System.Collections.Generic;
using System.Linq;

namespace TrucKhe.Core
{
    public class WorldEvent { public string type,id,itemId; }
    public class World
    {
        readonly Content content;
        public string map="village",hero,pending;
        public Point pos;
        public List<Point> route=new List<Point>();
        public List<Actor> actors;
        public int direction,transitions;
        public double phase=1,time;
        public bool moving;
        public HashSet<string> visited=new HashSet<string>();
        public Dictionary<string,double> cooldowns=new Dictionary<string,double>();
        public List<WorldEvent> events=new List<WorldEvent>();
        public Scene Scene=>content.scenes[map];
        public World(Content content,string hero){this.content=content;this.hero=hero;pos=Scene.spawn.Copy();LoadActors();}
        public void LoadActors()=>actors=Maths.Clone(Scene.actors);
        public void Stop(){route.Clear();pending=null;moving=false;}
        public void Restore(string map,Point pos,int direction){this.map=map;this.pos=pos.Copy();this.direction=direction;Stop();LoadActors();if(new Navigation(Scene).Blocked(this.pos))this.pos=Scene.spawn.Copy();}
        Navigation Nav(string exclude=null,bool includePlayer=false)
        {
            var boxes=actors.Where(a=>a.id!=exclude).Select(a=>{double r=a.role=="monster"?20:a.role=="resource"?12:10;return new Box{x=a.x-r,y=a.y-r,w=2*r,h=2*r};}).ToList();
            if(includePlayer)boxes.Add(new Box{x=pos.x-10,y=pos.y-10,w=20,h=20});return new Navigation(Scene,boxes);
        }
        public void Go(Point point,string actorId=null)
        {
            pending=actorId;var goal=point;var nav=Nav();List<Point> approach=null;
            var actor=actors.Find(a=>a.id==actorId);
            if(actor!=null)
            {
                actor.route.Clear();goal=new Point(actor.x,actor.y+42);int[,] offsets={{0,42},{-42,0},{42,0},{0,-42},{-32,32},{32,32},{-32,-32},{32,-32}};
                for(int i=0;i<8;i++){var candidate=new Point(actor.x+offsets[i,0],actor.y+offsets[i,1]);if(nav.Blocked(candidate)||!new Navigation(Scene).Clear(candidate,actor))continue;var found=nav.Find(pos,candidate);if(found.Count>0&&Point.Distance(found[found.Count-1],candidate)<2){goal=candidate;approach=found;break;}}
            }
            route=approach??nav.Find(pos,goal);if(route.Count==0||Point.Distance(route[route.Count-1],goal)>25)events.Add(new WorldEvent{type="blocked",id=""});
        }
        public static int Facing(double dx,double dy)=>Math.Abs(dx)>Math.Abs(dy)?dx<0?1:2:dy<0?3:0;
        public void Update(double dt)
        {
            dt=Maths.Clamp(dt,0,.1);time+=dt;var old=pos.Copy();var goal=route.LastOrDefault();var nav=Nav();moving=nav.Walk(pos,route,dt*210)>0;
            if(goal!=null&&route.Count==0&&Point.Distance(pos,goal)>3)route=nav.Find(pos,goal);
            if(moving){direction=Facing(pos.x-old.x,pos.y-old.y);phase=(phase+dt*9)%4;}else phase=1;
            foreach(var a in actors)
            {
                if(a.patrol==null||a.id==pending)continue;var before=a.Copy();var navigation=Nav(a.id,true);
                if(a.route.Count>0){navigation.Walk(a,a.route,dt*40);a.direction=Facing(a.x-before.x,a.y-before.y);a.phase=(a.phase+dt*6)%4;}
                else{a.phase=1;a.wait-=dt;if(a.wait<=0){a.patrolIndex=(a.patrolIndex+1)%a.patrol.Count;a.route=navigation.Find(a,a.patrol[a.patrolIndex]);a.wait=3;}}
            }
            if(pending!=null)
            {
                var a=actors.Find(x=>x.id==pending);
                if(a!=null&&Point.Distance(pos,a)<65&&new Navigation(Scene).Clear(pos,a))
                {
                    Stop();if(a.role=="resource") { if(cooldowns.TryGetValue(a.id,out var until)&&until>time)events.Add(new WorldEvent{type="cooldown",id=a.id});else{cooldowns[a.id]=time+20;events.Add(new WorldEvent{type="gather",id=a.id,itemId=a.itemId??a.id});} }
                    else{visited.Add(a.id);events.Add(new WorldEvent{type="talk",id=a.id});}
                }
                else if(route.Count==0)pending=null;
            }
            var gate=Scene.gates.Find(g=>g.Contains(pos));
            if(gate!=null&&!new Navigation(content.scenes[gate.to]).Blocked(gate.spawn)){Restore(gate.to,gate.spawn,0);transitions++;events.Add(new WorldEvent{type="map",id=map});}
        }
    }
}
