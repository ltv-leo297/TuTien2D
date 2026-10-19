using System;

namespace TrucKhe.Core
{
    // Bottom-left screen coordinates. Desktop keeps its 1280x720 canvas; mobile
    // uses logical dimensions derived from the safe aspect ratio, not desktop shrink-to-fit.
    public struct ScreenLayout
    {
        public double centerX,centerY,scale,uiWidth,uiHeight;
        public static ScreenLayout Fit(double width,double height,double x,double y,double safeWidth,double safeHeight,bool mobile=false)
        {
            if(!Maths.Finite(width)||!Maths.Finite(height)||width<=0||height<=0)throw new ArgumentOutOfRangeException(nameof(width));
            double left=Maths.Clamp(x,0,width),bottom=Maths.Clamp(y,0,height);
            double right=Maths.Clamp(x+safeWidth,0,width),top=Maths.Clamp(y+safeHeight,0,height);
            if(!Maths.Finite(left)||!Maths.Finite(bottom)||!Maths.Finite(right)||!Maths.Finite(top)||right<=left||top<=bottom){left=bottom=0;right=width;top=height;}
            var layout=mobile?MobileUiLayout.Create(right-left,top-bottom):null;
            double uiWidth=layout?.Width??1280,uiHeight=layout?.Height??720;
            return new ScreenLayout{centerX=(left+right)/2,centerY=(bottom+top)/2,scale=Math.Min((right-left)/uiWidth,(top-bottom)/uiHeight),uiWidth=uiWidth,uiHeight=uiHeight};
        }
    }
}
