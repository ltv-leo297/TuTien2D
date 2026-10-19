using System;
using TrucKhe.Core;

static partial class Program
{
    static void MobileChecks()
    {
        var devices=new[]{
            (name:"desktop 16:9",w:1920.0,h:1080.0,x:0.0,y:0.0,sw:1920.0,sh:1080.0),
            (name:"Android cutout",w:2400.0,h:1080.0,x:96.0,y:0.0,sw:2304.0,sh:1080.0),
            (name:"iPhone landscape left",w:2556.0,h:1179.0,x:177.0,y:63.0,sw:2202.0,sh:1116.0),
            (name:"iPhone landscape right",w:2556.0,h:1179.0,x:177.0,y:0.0,sw:2202.0,sh:1116.0),
            (name:"iPad 4:3",w:2048.0,h:1536.0,x:0.0,y:40.0,sw:2048.0,sh:1496.0),
            (name:"compact phone",w:1280.0,h:720.0,x:44.0,y:18.0,sw:1192.0,sh:702.0)
        };
        foreach(var d in devices)Test("mobile safe area: "+d.name,()=>{
            var fit=ScreenLayout.Fit(d.w,d.h,d.x,d.y,d.sw,d.sh);double halfW=640*fit.scale,halfH=360*fit.scale;
            Check(fit.scale>0&&fit.centerX-halfW>=d.x-1e-6&&fit.centerX+halfW<=d.x+d.sw+1e-6&&fit.centerY-halfH>=d.y-1e-6&&fit.centerY+halfH<=d.y+d.sh+1e-6,"UI outside safe area");
            Check(Math.Abs(halfW*2-d.sw)<1e-6||Math.Abs(halfH*2-d.sh)<1e-6,"unused available scale");
            // Rightmost and lowest controls remain on-screen using the same transform as pointer inversion.
            foreach(var p in new[]{new Point(25,20),new Point(1255,685),new Point(640,360)}){
                double sx=fit.centerX+(p.x-640)*fit.scale,sy=fit.centerY+(360-p.y)*fit.scale;
                Near((sx-fit.centerX)/fit.scale+640,p.x,"pointer x inverse");Near(360-(sy-fit.centerY)/fit.scale,p.y,"pointer y inverse");
            }
        });
        Test("mobile safe area: zero transient area falls back to display",()=>{
            var fit=ScreenLayout.Fit(1920,1080,0,0,0,0);Near(fit.scale,1.5,"fallback scale");Near(fit.centerX,960,"fallback center");
            fit=ScreenLayout.Fit(1920,1080,-100,-20,2100,1200);Near(fit.scale,1.5,"clamped scale");Near(fit.centerY,540,"clamped center");
            Throws(()=>ScreenLayout.Fit(0,1080,0,0,0,0),"zero display");
        });
        foreach(var d in devices)Test("mobile A geometry: "+d.name,()=>{
            var fit=ScreenLayout.Fit(d.w,d.h,d.x,d.y,d.sw,d.sh,true);
            var layout=MobileUiLayout.Create(d.sw,d.sh);
            Near(fit.uiWidth,layout.Width,"logical width");Near(fit.uiHeight,layout.Height,"logical height");
            Near(fit.uiWidth*fit.scale,d.sw,"safe width used");Near(fit.uiHeight*fit.scale,d.sh,"safe height used");
            Check(layout.Actions.Count==7,"missing action");
            foreach(var a in layout.Actions){var r=a.Value;Check(r.w>=48&&r.h>=48,"small touch target "+a.Key);Check(r.x>=12&&r.y>=100&&r.x+r.w<=layout.Width-12&&r.y+r.h<=layout.Height-12,"unsafe action "+a.Key);}
            foreach(var a in layout.Actions)foreach(var b in layout.Actions){if(a.Key==b.Key)continue;var p=a.Value;var q=b.Value;Check(p.x+p.w<=q.x||q.x+q.w<=p.x||p.y+p.h<=q.y||q.y+q.h<=p.y,"overlapping touch targets "+a.Key+"/"+b.Key);}
            Check(layout.Bag.x+layout.Bag.w+8<=layout.Detail.x,"bag and detail overlap");
            Check(layout.Detail.x+layout.Detail.w<=layout.Width-12&&layout.Detail.y+layout.Detail.h<=layout.Height-12,"detail leaves screen");
            double cell=(layout.Bag.w-12-8-(layout.Columns-1)*8)/layout.Columns;
            Check(cell>=48,"inventory targets too small");Check(layout.Bag.h/(cell+8)>=2,"too few visible rows");
            Check(layout.Detail.h>=280&&layout.Detail.w>=220,"detail cannot retain fixed action and scroll body");
        });
        Test("mobile A scaling stays usable on short phones and tablet",()=>{
            foreach(var size in new[]{(w:640.0,h:360.0),(w:740.0,h:360.0),(w:844.0,h:390.0),(w:915.0,h:412.0),(w:1024.0,h:768.0)}){
                var fit=ScreenLayout.Fit(size.w,size.h,0,0,size.w,size.h,true);var layout=MobileUiLayout.Create(size.w,size.h);
                Check(layout.Actions["attack"].w*fit.scale>=64,"attack too small at phone reference density");
                Check(layout.Actions["left"].w*fit.scale>=48,"direction too small");
                Near(fit.centerX-fit.uiWidth*fit.scale/2,0,"left boundary");Near(fit.centerY-fit.uiHeight*fit.scale/2,0,"bottom boundary");
            }
            Throws(()=>MobileUiLayout.Create(double.NaN,390),"invalid dimensions");
        });
    }
}
