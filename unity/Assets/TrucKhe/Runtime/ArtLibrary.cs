using System;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;
using UnityEngine;
using TrucKhe.Core;

namespace TrucKhe
{
    public sealed class ArtLibrary : IDisposable
    {
        readonly Dictionary<string,Texture2D> textures=new Dictionary<string,Texture2D>();
        readonly Dictionary<string,Sprite> sprites=new Dictionary<string,Sprite>();
        readonly HashSet<string> bentSprites=new HashSet<string>();
        public readonly Content content;
        public readonly Material material;
        public ArtLibrary(Content content){this.content=content;var shader=Resources.Load<Shader>("PixelSprite");if(!shader)throw new Exception("Missing PixelSprite shader");material=new Material(shader);}
        public Texture2D Texture(string path)
        {
            if(!textures.TryGetValue(path,out var t)){t=Resources.Load<Texture2D>("Art/"+path);if(!t)throw new Exception("Missing artwork: "+path);textures[path]=t;}return t;
        }
        public Sprite Sprite(string path,int[] rect=null,float pivotX=.5f,float pivotY=0)
        {
            string key=path+":"+(rect==null?"all":string.Join(",",rect))+":"+pivotX+":"+pivotY;
            if(sprites.TryGetValue(key,out var old))return old;var t=Texture(path);
            var r=rect==null?new Rect(0,0,t.width,t.height):new Rect(rect[0],t.height-rect[1]-rect[3],rect[2],rect[3]);
            var sprite=UnityEngine.Sprite.Create(t,r,new Vector2(pivotX,pivotY),100,0,SpriteMeshType.FullRect);sprite.name=key;sprites[key]=sprite;return sprite;
        }
        public static int[] RectOf(JToken t)=>t.ToObject<int[]>();
        public Sprite Hero(string hero,int direction=0,double phase=1)=>Sprite("Production/hero-"+hero,RectOf(content.spriteFrames["hero-"+hero]["frames"][direction*3+new[]{0,1,2,1}[(int)phase%4]]));
        public Sprite Vegetation(string kind)
        {
            var sprite=Sprite("Production/forest/"+kind+"-v3",RectOf(content.vegetation[kind]["rect"]));
            if(bentSprites.Add(kind))
            {
                // OverrideGeometry takes rect-space pixels. Unity applies pivot and PPU itself.
                const int bands=20;var vertices=new Vector2[(bands+1)*2];var triangles=new ushort[bands*6];float width=sprite.rect.width,height=sprite.rect.height;
                for(int i=0;i<=bands;i++){vertices[i*2]=new Vector2(0,height*i/bands);vertices[i*2+1]=new Vector2(width,height*i/bands);if(i==bands)continue;int j=i*6;triangles[j]=(ushort)(i*2);triangles[j+1]=(ushort)(i*2+1);triangles[j+2]=(ushort)(i*2+2);triangles[j+3]=(ushort)(i*2+1);triangles[j+4]=(ushort)(i*2+3);triangles[j+5]=(ushort)(i*2+2);}
                sprite.OverrideGeometry(vertices,triangles);
            }
            return sprite;
        }
        public Sprite Item(string id)
        {
            if(!content.catalog.TryGetValue(id,out var item))return null;var bits=item.iconAssetId.Split('.');return Sprite("Production/items/"+bits[1]+"-"+bits[2],pivotY:.5f);
        }
        public Sprite Classic(int row,int frame)
        {
            var rect=RectOf(content.combatFrames["rows"][row][frame]);return Sprite("Production/combat-actors",rect,content.combatFrames["pivots"][row][frame].Value<float>()/rect[2]);
        }
        public void PreloadCombat()
        {
            foreach(var p in new[]{"Production/combat-arena","Production/combat-actors","Production/forest/combat","Production/forest/skill-effects-v4"})Texture(p);
        }
        static void Release(UnityEngine.Object value){if(!value)return;if(Application.isPlaying)UnityEngine.Object.Destroy(value);else UnityEngine.Object.DestroyImmediate(value);}
        public void Dispose(){foreach(var s in sprites.Values)Release(s);sprites.Clear();Release(material);}
    }
}
