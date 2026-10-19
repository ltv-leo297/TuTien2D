using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;
using UnityEngine;
using TrucKhe.Core;

namespace TrucKhe
{
    // Fixed pools: no emitters or coroutines survive a map switch.
    public sealed class EnvironmentView : MonoBehaviour
    {
        readonly List<SpriteRenderer> pool=new List<SpriteRenderer>();
        ArtLibrary art;
        int cursor;
        Texture2D circleTexture;
        Sprite circle;
        public void Initialize(ArtLibrary library)
        {
            art=library;circleTexture=new Texture2D(16,16,TextureFormat.RGBA32,false);circleTexture.filterMode=FilterMode.Point;
            var pixels=new Color[256];for(int y=0;y<16;y++)for(int x=0;x<16;x++){float d=Vector2.Distance(new Vector2(x+.5f,y+.5f),new Vector2(8,8));pixels[y*16+x]=new Color(1,1,1,Mathf.Clamp01(8-d));}circleTexture.SetPixels(pixels);circleTexture.Apply();circle=Sprite.Create(circleTexture,new Rect(0,0,16,16),new Vector2(.5f,.5f),100);
        }
        void Dot(double x,double y,double w,double h,Color color,bool round=false)
        {
            if(cursor==pool.Count){var go=new GameObject("Environment effect "+cursor);go.transform.SetParent(transform,false);var sr=go.AddComponent<SpriteRenderer>();sr.sharedMaterial=art.material;sr.sortingOrder=18000;pool.Add(sr);}
            var sprite=pool[cursor++];sprite.enabled=true;sprite.sprite=round?circle:WorldView.UnitSprite();sprite.color=color;WorldView.Place(sprite,x,y,w,h);
        }
        static double Rand(double n){double r=Math.Sin(n*127.1+311.7)*43758.5453;return r-Math.Floor(r);}
        public void Render(World sim,bool reduced)
        {
            cursor=0;double t=reduced?0:sim.time;var forge=sim.Scene.props.Find(p=>p.id=="forge");
            if(forge!=null)
            {
                var config=art.content.ambient["forge"];double k=forge.size/235,x=forge.x+config["flameOffset"][0].Value<double>()*k,y=forge.y+config["flameOffset"][1].Value<double>()*k*forge.heightScale;
                Dot(x,y,28+Math.Sin(t*11)*4,22,new Color(1,.65f,.2f,.25f),true);
                for(int i=0;i<5;i++){double h=10+Math.Sin(t*(12+i)+i)*5;Dot(x-7+i*3.5,y-h/2+3,5,h,new Color(1,.45f,.13f));}Dot(x,y-1,5,8,new Color(1,.9f,.55f));
                int smoke=config["smokeCount"].Value<int>();for(int i=0;i<smoke;i++){double progress=(t*.35+(double)i/smoke)%1;Dot(forge.x+config["chimneyOffset"][0].Value<double>()*k+Math.Sin(progress*5)*13,forge.y+config["chimneyOffset"][1].Value<double>()*k*forge.heightScale-progress*90,8+progress*24,10+progress*20,new Color(.88f,.91f,.86f,(float)((1-progress)*.32)),true);}
                for(int i=0;i<config["sparkCount"].Value<int>();i++){double age=(t*1.1+i/4.0)%1;Dot(x+Math.Sin(i*4)*age*12,y-age*28,2,3,new Color(1,.86f,.47f));}
            }
            if(sim.map=="village")
            {
                foreach(var fall in new[]{new[]{180.0,145,64,92},new[]{1740.0,180,65,74},new[]{1835.0,580,64,78}})
                {
                    for(int i=0;i<20;i++){double x=fall[0]-fall[2]/2+i*fall[2]/20,edge=Math.Abs(i-9.5)/9.5,top=fall[1]+Math.Floor(Rand(i+41)*10),h=fall[3]-edge*17;Dot(x,top+h/2,fall[2]/20+1,h,i%3==0?new Color(.7f,1,.96f):new Color(.15f,.8f,.9f));double flow=(t*75+i*17)%h;Dot(x,top+flow,2,Math.Min(9+i%11,h-flow),new Color(.9f,1,.96f,.85f));}
                    for(int i=0;i<10;i++){double phase=(t*1.7+i/10.0)%1;Dot(fall[0]+(Rand(i+51)-.5)*(fall[2]+15),fall[1]+fall[3]-phase*19,3,3,new Color(.9f,1,.96f));}
                }
            }
            if(!reduced)for(int i=0;i<art.content.ambient["butterflies"]["count"].Value<int>();i++){double x=420+i*210+Math.Sin(t*.7+i)*24,y=650+Math.Cos(t*.8+i*3)*100,wing=2+Math.Abs(Math.Sin(t*12+i))*4;var color=i%2==0?new Color(.87f,.94f,1):new Color(1,.97f,.75f);Dot(x-wing/2,y,wing,6,color,true);Dot(x+wing/2,y,wing,6,color,true);}
            for(int i=cursor;i<pool.Count;i++)pool[i].enabled=false;
        }
        void OnDestroy(){if(circle)Destroy(circle);if(circleTexture)Destroy(circleTexture);}
    }
}
