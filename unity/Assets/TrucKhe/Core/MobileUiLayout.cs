using System;
using System.Collections.Generic;

namespace TrucKhe.Core
{
    public struct UiRect
    {
        public double x,y,w,h;
        public UiRect(double x,double y,double w,double h){this.x=x;this.y=y;this.w=w;this.h=h;}
    }
    // Logical UI coordinates, independent of the world/camera and of display pixels.
    public sealed class MobileUiLayout
    {
        public double Width,Height;
        public int Columns;
        public UiRect Bag,Detail;
        public readonly Dictionary<string,UiRect> Actions=new Dictionary<string,UiRect>();
        public static MobileUiLayout Create(double safeWidth,double safeHeight)
        {
            if(!Maths.Finite(safeWidth)||!Maths.Finite(safeHeight)||safeWidth<=0||safeHeight<=0)throw new ArgumentOutOfRangeException(nameof(safeWidth));
            double aspect=safeWidth/safeHeight,w=Math.Max(640,390*aspect),h=w/aspect;
            var layout=new MobileUiLayout{Width=w,Height=h,Columns=w<760?4:5};
            double grid=Math.Floor((w-36)*.60);
            layout.Bag=new UiRect(12,120,grid,h-132);
            layout.Detail=new UiRect(24+grid,64,w-grid-36,h-76);
            layout.Actions.Add("left",new UiRect(16,h-80,64,64));
            layout.Actions.Add("right",new UiRect(88,h-80,64,64));
            layout.Actions.Add("jump",new UiRect(w-164,h-184,64,64));
            layout.Actions.Add("skill",new UiRect(w-92,h-172,64,64));
            layout.Actions.Add("dash",new UiRect(w-228,h-132,56,56));
            layout.Actions.Add("guard",new UiRect(w-164,h-72,56,56));
            layout.Actions.Add("attack",new UiRect(w-92,h-92,76,76));
            return layout;
        }
    }
}
