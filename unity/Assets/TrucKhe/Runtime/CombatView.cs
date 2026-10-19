using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;
using UnityEngine;
using TrucKhe.Core;

namespace TrucKhe
{
    public sealed class CombatView : MonoBehaviour
    {
        ArtLibrary art;
        Camera cameraView;
        readonly List<SpriteRenderer> pool=new List<SpriteRenderer>();
        readonly List<LineRenderer> lines=new List<LineRenderer>();
        Material lineMaterial;
        int cursor,lineCursor;
        public void Initialize(ArtLibrary library,Camera camera){art=library;cameraView=camera;lineMaterial=new Material(art.material);}
        SpriteRenderer Draw(Sprite sprite,double x,double y,double width,double height,int order,Color? color=null,bool flip=false)
        {
            if(cursor>=pool.Count){var go=new GameObject("Combat sprite "+cursor);go.transform.SetParent(transform,false);pool.Add(go.AddComponent<SpriteRenderer>());}
            var sr=pool[cursor++];sr.enabled=true;sr.sharedMaterial=art.material;sr.sprite=sprite;sr.sortingOrder=order;sr.color=color??Color.white;sr.flipX=flip;sr.transform.localRotation=Quaternion.identity;WorldView.Place(sr,x,y,width,height);return sr;
        }
        static Color ColorOf(string hex){ColorUtility.TryParseHtmlString(hex,out var c);return c;}
        void Rect(double x,double y,double w,double h,Color c,int order=10)=>Draw(WorldView.UnitSprite(),x+w/2,y+h/2,w,h,order,c);
        void Line(Vector3[] points,Color color,float width=.04f,bool loop=false)
        {
            if(lineCursor>=lines.Count){var go=new GameObject("Telegraph "+lineCursor);go.transform.SetParent(transform,false);var line=go.AddComponent<LineRenderer>();line.sharedMaterial=lineMaterial;line.sortingOrder=40;line.useWorldSpace=false;lines.Add(line);}
            var lr=lines[lineCursor++];lr.enabled=true;lr.startColor=lr.endColor=color;lr.widthMultiplier=width;lr.loop=loop;lr.positionCount=points.Length;lr.SetPositions(points);
        }
        void Outline(double x,double y,double w,double h,Color c)=>Line(new[]{WorldView.Position(x,y),WorldView.Position(x+w,y),WorldView.Position(x+w,y+h),WorldView.Position(x,y+h)},c,.035f,true);
        void Ellipse(double x,double y,double w,double h,Color c,double start=0,double end=Math.PI*2)
        {
            var pts=new Vector3[32];for(int i=0;i<pts.Length;i++){double a=start+(end-start)*i/(pts.Length-1);pts[i]=WorldView.Position(x+Math.Cos(a)*w,y+Math.Sin(a)*h);}Line(pts,c);
        }
        void Eruption(Skill k,double x,double radius,double height,double progress)
        {
            int index=Array.IndexOf(new[]{"seed","spore","leaf","jade"},k.visual);var sp=art.Sprite("Production/forest/skill-effects-v4",ArtLibrary.RectOf(art.content.effectFrames["rects"][4+Math.Max(0,index)]));Draw(sp,x,500,radius*2,height,45,new Color(1,1,1,(float)(.85+.15*Math.Sin(progress*Math.PI))));
        }
        public void Render(Combat s,string hero,bool reduced)
        {
            cursor=lineCursor=0;double target=1280.0/720,aspect=(double)Screen.width/Screen.height;
            cameraView.rect=aspect>target?new Rect((float)((1-target/aspect)/2),0,(float)(target/aspect),1):new Rect(0,(float)((1-aspect/target)/2),1,(float)(aspect/target));cameraView.orthographicSize=3.6f;cameraView.transform.position=new Vector3(6.4f,-3.6f,-10);
            var bg=art.Sprite("Production/combat-arena");double groundRatio=art.content.combatFrames["groundRatio"].Value<double>(),scale=Math.Max(1280/bg.rect.width,Math.Max(500/(bg.rect.height*groundRatio),220/(bg.rect.height*(1-groundRatio))));
            Draw(bg,640,500+bg.rect.height*scale*(1-groundRatio),bg.rect.width*scale,bg.rect.height*scale,-100);
            Rect(s.x-24,498,48,6,new Color(0,.1f,.05f,.3f),0);Rect(s.enemyX-25,498,50,6,new Color(0,.1f,.05f,.3f),0);
            var cast=s.cast;Color warning=ColorOf("#ffe786"),enemyColor=ColorOf(s.definition.art.color);
            if(cast!=null)
            {
                var k=cast.skill;bool warn=s.enemyPhase.StartsWith("warn");Color fill=warn?new Color(.46f,.25f,.16f,.45f):new Color(enemyColor.r,enemyColor.g,enemyColor.b,.4f);
                if(k.kind=="ground")
                {
                    if(warn&&k.pattern=="wave"){double end=cast.x+cast.face*k.travel;double left=Math.Min(cast.x,end)-k.radius,width=Math.Abs(end-cast.x)+2*k.radius;Rect(left,500-k.height,width,k.height,fill);Outline(left,500-k.height,width,k.height,warning);}
                    else foreach(var h in Combat.GroundHazards(cast,warn)){Rect(h.x-h.radius,500-h.height,h.radius*2,h.height,fill);Outline(h.x-h.radius,500-h.height,h.radius*2,h.height,warning);if(h.active)Eruption(k,h.x,h.radius,h.height,h.progress);}
                }
                else if(k.kind=="melee"||k.kind=="dash")
                {
                    double start=k.kind=="dash"?cast.x:s.enemyX,reach=k.kind=="dash"?Math.Abs(Maths.Clamp(cast.x+cast.face*k.travel,90,1190)-cast.x)+k.radius:k.radius;
                    double left=k.kind=="dash"&&!warn?s.enemyX-k.radius:cast.face>0?start-(k.kind=="dash"?k.radius:20):start-reach,width=k.kind=="dash"&&!warn?k.radius*2:reach+(k.kind=="dash"?k.radius:20);
                    Rect(left,500-k.height,width,k.height,fill);Outline(left,500-k.height,width,k.height,warning);if(!warn&&k.kind=="dash")Eruption(k,s.enemyX-cast.face*k.radius*.5,k.radius*.65,k.height*.65,cast.elapsed/k.duration);
                }
                else if(warn)
                {
                    int count=k.spread>0?k.count:1;for(int i=0;i<count;i++){double angle=cast.angle+(k.spread>0?((double)i/(k.count-1)-.5)*k.spread:0),x=s.enemyX+cast.face*30,y=466;Line(new[]{WorldView.Position(x,y),WorldView.Position(x+Math.Cos(angle)*520,y+Math.Sin(angle)*520)},warning);}
                }
            }
            int ef=s.enemyAttack>0?(cast?.skill.kind=="ground"?3:4):s.enemyPhase.StartsWith("warn")?5:s.enemyMoving&&!reduced?1+(int)(s.time*6)%2:0;
            Sprite es;double ek;
            if(s.definition.art.sheet=="forest"){int row=s.definition.art.row;var rects=art.content.forestFrames["combat"]["rects"].Skip(row*6).Take(6).ToArray();es=art.Sprite("Production/forest/combat",ArtLibrary.RectOf(rects[ef]));ek=s.definition.art.size/rects.Max(r=>r[3].Value<double>());}
            else{es=art.Classic(s.definition.art.row,ef);ek=s.definition.art.size/art.content.combatFrames["rowHeights"][s.definition.art.row].Value<double>();}
            Draw(es,s.enemyX,500,es.rect.width*ek,es.rect.height*ek,50,flip:s.enemyFace<0);
            int hf=s.hurt>0||s.guarding?5:s.attack>0?4:s.y<499?3:s.moving?1+(int)(s.time*10)%2:0,rowHero="ABCD".IndexOf(hero,StringComparison.Ordinal);var hs=art.Classic(rowHero,hf);double hk=94/art.content.combatFrames["rowHeights"][rowHero].Value<double>();Draw(hs,s.x,s.y,hs.rect.width*hk,hs.rect.height*hk,60,new Color(1,1,1,s.invulnerable>.2&&!reduced&&(int)(s.time*15)%2!=0?.45f:1),s.face<0);
            if(s.guarding)Ellipse(s.x+s.face*27,s.y-38,13,35,ColorOf("#9fe7e9"));
            if(s.attack>0)Ellipse(s.x,s.y-40,67*s.face,67,ColorOf("#9cf9ee"),-1.2,1.2);
            if(s.slowed>0)Ellipse(s.x,s.y-4,25,7,ColorOf("#a8df71"));
            if(s.dash>0&&!reduced)for(int i=1;i<4;i++)Rect(s.x-s.face*i*25-12,s.y-50,22,3,new Color(.7f,1,.9f,.6f),70);
            foreach(var shot in s.shots)
            {
                if(shot.friendly){Rect(shot.x-shot.r,shot.y-shot.r*.5,shot.r*2,shot.r,ColorOf("#a7fff1"),80);continue;}
                int index=Math.Max(0,Array.IndexOf(new[]{"seed","spore","leaf","jade"},shot.visual));var sp=art.Sprite("Production/forest/skill-effects-v4",ArtLibrary.RectOf(art.content.effectFrames["rects"][index]),.5f,.5f);double height=shot.r*2;var sr=Draw(sp,shot.x,shot.y,height*sp.rect.width/sp.rect.height,height,80);sr.transform.localRotation=Quaternion.Euler(0,0,(float)(-Math.Atan2(shot.vy,shot.vx)*180/Math.PI));
            }
            if(!reduced)foreach(var spark in s.sparks)for(int i=0;i<6;i++){double a=i*Math.PI/3,r=(.3-spark.life)*100;Rect(spark.x+Math.Cos(a)*r,spark.y+Math.Sin(a)*r,5,5,ColorOf(spark.color),90);}
            for(int i=cursor;i<pool.Count;i++)pool[i].enabled=false;for(int i=lineCursor;i<lines.Count;i++)lines[i].enabled=false;
        }
        void OnDestroy(){if(lineMaterial)Destroy(lineMaterial);}
    }
}
