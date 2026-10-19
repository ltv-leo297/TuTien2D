using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;
using UnityEngine;
using TrucKhe.Core;
using Point=TrucKhe.Core.Point;

namespace TrucKhe
{
    public sealed class WorldView : MonoBehaviour
    {
        ArtLibrary art;
        Content data;
        World world;
        Transform mapRoot;
        SpriteRenderer player,water;
        readonly Dictionary<string,SpriteRenderer> actors=new Dictionary<string,SpriteRenderer>();
        readonly List<(SpriteRenderer renderer,double phase,double amplitude)> swaying=new List<(SpriteRenderer,double,double)>();
        readonly List<(SpriteRenderer renderer,MaterialPropertyBlock properties)> vegetation=new List<(SpriteRenderer,MaterialPropertyBlock)>();
        readonly List<(TextMesh label,string key)> labels=new List<(TextMesh,string)>();
        readonly List<SpriteRenderer> ambient=new List<SpriteRenderer>();
        LineRenderer route;
        Font font;
        TextMesh playerLabel;
        Material lineMaterial;
        EnvironmentView environment;
        string map;
        public Camera Camera {get;private set;}
        public void Initialize(ArtLibrary library,Camera camera){art=library;data=library.content;Camera=camera;font=Resources.Load<Font>("Fonts/NotoSans-Regular");lineMaterial=new Material(art.material);var effects=new GameObject("Environment effects");effects.transform.SetParent(transform,false);environment=effects.AddComponent<EnvironmentView>();environment.Initialize(art);}
        public static Vector3 Position(double x,double y)=>new Vector3((float)x/100,-(float)y/100,0);
        public Point ScreenPoint(Vector2 screen){var p=Camera.ScreenToWorldPoint(new Vector3(screen.x,screen.y,10));return new Point(p.x*100,-p.y*100);}
        public SpriteRenderer Make(string name,Sprite sprite,double x,double y,double width,double height,int order,Transform parent=null)
        {
            var go=new GameObject(name);go.transform.SetParent(parent?parent:mapRoot,false);var sr=go.AddComponent<SpriteRenderer>();sr.sharedMaterial=art.material;sr.sprite=sprite;sr.sortingOrder=order;Place(sr,x,y,width,height);return sr;
        }
        public static void Place(SpriteRenderer sr,double x,double y,double width,double height)
        {
            sr.transform.localPosition=Position(x,y);sr.transform.localScale=new Vector3((float)(width/sr.sprite.rect.width),(float)(height/sr.sprite.rect.height),1);
        }
        static int Order(double y)=>100+(int)Math.Round(y*10);
        public void SetWorld(World sim)
        {
            world=sim;if(map==world.map&&mapRoot)return;map=world.map;if(mapRoot){mapRoot.gameObject.SetActive(false);Destroy(mapRoot.gameObject);}
            actors.Clear();swaying.Clear();vegetation.Clear();labels.Clear();ambient.Clear();var root=new GameObject("Map — "+map);root.transform.SetParent(transform,false);mapRoot=root.transform;
            Make("Ground",art.Sprite("Baked/ground-"+map),960,1080,1920,1080,-100);
            water=null;if(map=="forest")water=Make("Animated water",art.Sprite("Baked/forest-water-0"),960,1080,1920,1080,-90);
            foreach(var p in sim.Scene.props)
            {
                if(p.hidden)continue;Sprite sprite;double width,height;
                if(p.atlas=="structures"){sprite=art.Sprite("Baked/structure-"+p.tile);width=p.size;height=width*sprite.rect.height/sprite.rect.width;}
                else
                {
                    var r=p.atlas=="forest"?data.forestFrames["objects"]["rects"][p.tile]:data.atlas[p.atlas=="scenery"?"scenery":"environment"][p.tile];
                    sprite=art.Sprite(p.atlas=="forest"?"Production/forest/objects":p.atlas=="scenery"?"Production/scenery":"Production/environment",ArtLibrary.RectOf(r));
                    double k=p.size/Math.Max(sprite.rect.width,sprite.rect.height);width=sprite.rect.width*k;height=sprite.rect.height*k;
                }
                var sr=Make(p.id,sprite,p.x,p.y,width,height*p.heightScale,p.layer=="ground"||sim.Scene.bridges.Any(b=>b.propId==p.id)?-50:Order(p.y));sr.flipX=p.flip;
                if(p.sway)swaying.Add((sr,p.x,.7));
                if(p.id=="forest-bridge")
                {
                    // Rail crop matches the original foreground clip; feet remain above the deck.
                    int crop=(int)(sprite.rect.width*.21);var rail=art.Sprite("Baked/structure-"+p.tile,new[]{0,(int)sprite.rect.height-crop,(int)sprite.rect.width,crop});Make("Bridge foreground rail",rail,p.x,p.y,width,width*.21,Order(p.y));
                }
            }
            foreach(var v in sim.Scene.vegetation){var sprite=art.Vegetation(v.kind);var sr=Make(v.id,sprite,v.x,v.y,v.height*sprite.rect.width/sprite.rect.height,v.height,Order(v.y));sr.flipX=v.flip;var block=new MaterialPropertyBlock();block.SetFloat("_BendHeight",sprite.rect.height/100);block.SetFloat("_BendStrength",(float)((v.kind=="bamboo"?4.8:3.6)*sprite.rect.height/v.height/100));block.SetFloat("_BendPhase",(float)v.phase);vegetation.Add((sr,block));}
            foreach(var gate in sim.Scene.gates){var foot=gate.Foot;var sr=Make("Gate "+gate.to,art.Sprite("Production/signpost-A"),foot.x,foot.y,96,96,Order(foot.y));sr.flipX=foot.x>gate.x+gate.w/2;Label(gate.to,foot.x,foot.y-64,Order(foot.y)+1,.0125f);}
            foreach(var a in sim.actors){var sr=Make(a.id,art.Hero(a.skin),a.x,a.y,40,70,Order(a.y));actors[a.id]=sr;Label(a.id,a.x,a.y-(a.mapSize>0?a.mapSize+14:85),20000,.024f);}
            player=Make("Player",art.Hero(sim.hero),sim.pos.x,sim.pos.y,40,72,Order(sim.pos.y));
            playerLabel=Label("",sim.pos.x,sim.pos.y+19,20001,.024f);
            var line=new GameObject("Destination route");line.transform.SetParent(mapRoot,false);route=line.AddComponent<LineRenderer>();route.sharedMaterial=lineMaterial;route.startColor=route.endColor=new Color(1,.95f,.7f,.6f);route.widthMultiplier=.025f;route.sortingOrder=0;route.useWorldSpace=false;
            for(int i=0;i<30;i++){var leaf=Make("Ambient particle "+i,UnitSprite(),0,0,5,2,15000);leaf.color=i%4==0?new Color(1,.86f,.55f,.6f):new Color(.35f,.55f,.22f,.55f);ambient.Add(leaf);}
            for(int i=0;i<24;i++){var ripple=Make("Water ripple "+i,UnitSprite(),0,0,12,2,-60);ripple.color=new Color(.8f,1,1,.65f);ambient.Add(ripple);}
        }
        static Sprite unit;
        public static Sprite UnitSprite(){if(!unit)unit=UnityEngine.Sprite.Create(Texture2D.whiteTexture,new Rect(0,0,1,1),new Vector2(.5f,.5f),100);return unit;}
        TextMesh Label(string key,double x,double y,int order,float size)
        {
            var go=new GameObject("Label "+key);go.transform.SetParent(mapRoot,false);go.transform.localPosition=Position(x,y);var text=go.AddComponent<TextMesh>();text.font=font;text.fontSize=64;text.characterSize=size;text.anchor=TextAnchor.MiddleCenter;text.alignment=TextAlignment.Center;text.color=new Color(1,.97f,.8f);var renderer=go.GetComponent<MeshRenderer>();renderer.sharedMaterial=font.material;renderer.sortingOrder=order;if(key.Length>0)labels.Add((text,key));return text;
        }
        public void Render(World sim,bool reduced,string locale,string name)
        {
            SetWorld(sim);double t=reduced?0:sim.time;
            if(water)water.sprite=art.Sprite("Baked/forest-water-"+((int)(t*6)%4));
            foreach(var entry in swaying)entry.renderer.transform.localRotation=Quaternion.Euler(0,0,(float)(Math.Sin(t*1.6+entry.phase)*entry.amplitude));
            foreach(var entry in vegetation){entry.properties.SetFloat("_BendTime",(float)t);entry.renderer.SetPropertyBlock(entry.properties);}
            player.sprite=art.Hero(sim.hero,sim.direction,sim.phase);double ps=72/data.spriteFrames["hero-"+sim.hero]["maxHeight"].Value<double>();Place(player,sim.pos.x,sim.pos.y,player.sprite.rect.width*ps,player.sprite.rect.height*ps);player.sortingOrder=Order(sim.pos.y);
            playerLabel.text=name;playerLabel.transform.localPosition=Position(sim.pos.x,sim.pos.y+19);
            foreach(var a in sim.actors)
            {
                var sr=actors[a.id];Sprite sprite;double k;
                if(a.role=="npc")
                {
                    int row=Array.IndexOf(new[]{"teacher","healer","smith"},a.id);
                    if(row>=0){sprite=art.Sprite("Production/npcs",ArtLibrary.RectOf(data.spriteFrames["npcs"]["frames"][row*3+(int)(t*(a.id=="smith"?4:1.8))%3]));k=70/data.spriteFrames["npcs"]["maxHeight"].Value<double>();}
                    else if(a.appearance!=null){int col=new[]{0,1,2,1}[(int)a.phase%4];bool farmer=a.appearance=="farmer",mirror=farmer&&a.direction==2&&col==1;int frame=mirror?7:a.direction*6+(farmer?0:3)+col;sprite=art.Sprite("Production/villagers",ArtLibrary.RectOf(data.spriteFrames["villagers"]["frames"][frame]));k=(farmer?66:61)/data.spriteFrames["villagers"]["maxHeight"].Value<double>();sr.flipX=mirror;}
                    else{sprite=art.Hero(a.skin,a.direction,a.phase);k=72/data.spriteFrames["hero-"+a.skin]["maxHeight"].Value<double>();}
                }
                else if(data.monsters.ContainsKey(a.id))
                {
                    int row=data.monsterIds.IndexOf(a.id);var rects=data.idleFrames["rects"].Skip(row*4).Take(4).ToArray();sprite=art.Sprite("Production/forest/monsters-idle-v4",ArtLibrary.RectOf(rects[(int)(t*3+row)%4]));k=(a.mapSize>0?a.mapSize:68)/rects.Max(r=>Math.Max(r[2].Value<double>(),r[3].Value<double>()));
                }
                else if(a.forestTile.HasValue){sprite=art.Sprite("Production/forest/objects",ArtLibrary.RectOf(data.forestFrames["objects"]["rects"][a.forestTile.Value]));k=43/Math.Max(sprite.rect.width,sprite.rect.height);}
                else{int tile=a.role=="resource"?(new[]{"ore","stone","soil"}.Contains(a.id)?8:10):(a.id.Contains("stone")||a.id.Contains("rock")?8:9);sprite=art.Sprite("Production/environment",ArtLibrary.RectOf(data.atlas["environment"][tile]));k=(a.role=="resource"?40:65)/Math.Max(sprite.rect.width,sprite.rect.height);}
                sr.sprite=sprite;Place(sr,a.x,a.y,sprite.rect.width*k,sprite.rect.height*k);sr.sortingOrder=Order(a.y);sr.color=new Color(1,1,1,sim.cooldowns.TryGetValue(a.id,out var cd)&&cd>sim.time?.3f:1);
            }
            foreach(var l in labels){l.label.text=data.Text(locale,l.key);var a=sim.actors.Find(actor=>actor.id==l.key);if(a!=null){l.label.transform.localPosition=Position(a.x,a.y-(a.mapSize>0?a.mapSize+14:85));l.label.gameObject.SetActive(a.role=="monster"||new[]{"teacher","healer","smith"}.Contains(a.id)||Point.Distance(sim.pos,a)<100);if(a.level>0)l.label.text+=" · "+data.Text(locale,"world.level")+" "+a.level;if(new[]{"teacher","healer","smith"}.Contains(a.id)&&!sim.visited.Contains(a.id))l.label.text="! "+l.label.text;}}
            route.positionCount=sim.route.Count>0?sim.route.Count+1:0;if(sim.route.Count>0){route.SetPosition(0,Position(sim.pos.x,sim.pos.y));for(int i=0;i<sim.route.Count;i++)route.SetPosition(i+1,Position(sim.route[i].x,sim.route[i].y));}
            for(int i=0;i<ambient.Count;i++)
            {
                var p=ambient[i];if(i<30){p.enabled=!reduced;p.transform.localPosition=Position((i*137+t*(8+i%5))%1920,(i*197+Math.Sin(t+i)*12)%1080);}
                else if(sim.Scene.rivers.Count>0&&!sim.Scene.landscape){var r=sim.Scene.rivers[(i-30)%sim.Scene.rivers.Count];double step=((i*41+t*18)%1000)/1000*(r.points.Count-1);int seg=(int)step;var a=r.points[seg];var b=r.points[Math.Min(seg+1,r.points.Count-1)];p.transform.localPosition=Position(a.x+(b.x-a.x)*(step-seg),a.y+(b.y-a.y)*(step-seg));p.enabled=true;}else p.enabled=false;
            }
            Follow(sim.pos);
            environment.Render(sim,reduced);
        }
        void Follow(Point pos)
        {
            Camera.rect=new Rect(0,0,1,1);double scale=Maths.Clamp(Math.Min(Screen.width/1920.0,Screen.height/1080.0),.8,1.2),vw=Screen.width/scale,vh=Screen.height/scale;
            double left=vw>=1920?(1920-vw)/2:Maths.Clamp(pos.x-vw/2,0,1920-vw),top=vh>=1080?(1080-vh)/2:Maths.Clamp(pos.y-vh/2,0,1080-vh);
            Camera.orthographicSize=(float)(vh/200);Camera.transform.position=new Vector3((float)((left+vw/2)/100),-(float)((top+vh/2)/100),-10);
        }
        public void ClearMap(){map=null;if(mapRoot){mapRoot.gameObject.SetActive(false);Destroy(mapRoot.gameObject);}mapRoot=null;}
        void OnDestroy(){if(lineMaterial)Destroy(lineMaterial);}
    }
}
