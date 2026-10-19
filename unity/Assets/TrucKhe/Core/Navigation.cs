using System;
using System.Collections.Generic;
using System.Linq;

namespace TrucKhe.Core
{
    // Coordinates deliberately match the measured web artwork: 1920 x 1080, Y down.
    public class Navigation
    {
        public const int Width=1920, Height=1080, Radius=10, Cell=20, Cols=96, Rows=54;
        public readonly Scene scene;
        readonly List<Box> solids;
        public Navigation(Scene scene,IEnumerable<Box> bodies=null)
        {
            this.scene=scene;
            solids=scene.props.Where(p=>p.solid!=null).Select(p=>p.solid).Concat(scene.gates.Select(g=>g.Solid)).ToList();
            if(bodies!=null)solids.AddRange(bodies);
        }
        public static bool InPolygon(Point p,IList<Point> poly)
        {
            bool result=false;
            for(int i=0,j=poly.Count-1;i<poly.Count;j=i++) { var a=poly[i];var b=poly[j]; if((a.y>p.y)!=(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)result=!result; }
            return result;
        }
        public static double RiverDistance(Point p,River r)
        {
            double d=double.PositiveInfinity;
            for(int i=1;i<r.points.Count;i++) { var a=r.points[i-1];var b=r.points[i];double dx=b.x-a.x,dy=b.y-a.y,t=Maths.Clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy),0,1);d=Math.Min(d,Point.Distance(p,new Point(a.x+dx*t,a.y+dy*t))); }
            return d;
        }
        public bool Outside(Point p)
        {
            if(scene.walkable==null)return false;
            return Corners(p).Any(c=>!scene.walkable.Any(poly=>InPolygon(c,poly)));
        }
        static IEnumerable<Point> Corners(Point p) { yield return p;yield return new Point(p.x-10,p.y-10);yield return new Point(p.x+10,p.y-10);yield return new Point(p.x-10,p.y+10);yield return new Point(p.x+10,p.y+10); }
        public bool WaterBlocked(Point p)
        {
            if(scene.rivers.Any(r=>RiverDistance(p,r)<r.width/2+10))
                for(int dx=-10;dx<=10;dx+=5)for(int dy=-10;dy<=10;dy+=5) { var foot=new Point(p.x+dx,p.y+dy); if(scene.rivers.Any(r=>RiverDistance(foot,r)<r.width/2)&&!scene.bridges.Any(b=>InPolygon(foot,b.deck)))return true; }
            foreach(var r in scene.water)
            {
                if(!r.Intersects(p))continue;
                var left=Math.Max(p.x-10,r.x);var right=Math.Min(p.x+10,r.x+r.w);var top=Math.Max(p.y-10,r.y);var bottom=Math.Min(p.y+10,r.y+r.h);
                var corners=new[]{new Point(left,top),new Point(right,top),new Point(left,bottom),new Point(right,bottom)};
                if(!scene.bridges.Any(b=>corners.All(c=>InPolygon(c,b.deck))))return true;
            }
            return false;
        }
        static bool OutOfBounds(Point p)=>p.x<10||p.y<10||p.x>1910||p.y>1070;
        public bool Blocked(Point p)=>OutOfBounds(p)||Outside(p)||WaterBlocked(p)||solids.Any(r=>r.Intersects(p));
        public static bool SweptBox(Point a,Point b,Box r,double radius=10)
        {
            double enter=0,exit=1;
            var values=new[]{new[]{a.x,b.x-a.x,r.x-radius,r.x+r.w+radius},new[]{a.y,b.y-a.y,r.y-radius,r.y+r.h+radius}};
            foreach(var v in values) { if(Math.Abs(v[1])<1e-12) { if(v[0]<=v[2]||v[0]>=v[3])return false;continue; }double t1=(v[2]-v[0])/v[1],t2=(v[3]-v[0])/v[1];enter=Math.Max(enter,Math.Min(t1,t2));exit=Math.Min(exit,Math.Max(t1,t2));if(enter>=exit)return false; }
            return enter<exit;
        }
        bool CrossesBoundary(Point a,Point b)
        {
            if(scene.walkable==null)return false;
            if(Outside(a)||Outside(b))return true;
            double dx=b.x-a.x,dy=b.y-a.y;
            foreach(var start in Corners(a))
            {
                var cuts=new List<double>{0,1};
                foreach(var poly in scene.walkable)for(int i=0;i<poly.Count;i++) { var p=poly[i];var q=poly[(i+1)%poly.Count];double ex=q.x-p.x,ey=q.y-p.y,den=dx*ey-dy*ex;if(Math.Abs(den)<1e-10)continue;double t=((p.x-start.x)*ey-(p.y-start.y)*ex)/den,u=((p.x-start.x)*dy-(p.y-start.y)*dx)/den;if(t>0&&t<1&&u>=0&&u<=1)cuts.Add(t); }
                cuts.Sort();for(int i=1;i<cuts.Count;i++){double t=(cuts[i-1]+cuts[i])/2;var p=new Point(start.x+dx*t,start.y+dy*t);if(!scene.walkable.Any(poly=>InPolygon(p,poly)))return true;}
            }
            return false;
        }
        public bool Clear(Point a,Point b)
        {
            if(OutOfBounds(a)||OutOfBounds(b)||solids.Any(r=>SweptBox(a,b,r))||CrossesBoundary(a,b))return false;
            int n=(int)Math.Ceiling(Point.Distance(a,b)/4);
            for(int i=0;i<=n;i++){double t=n>0?(double)i/n:0;if(WaterBlocked(new Point(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t)))return false;}return true;
        }
        static Point Center(int id)=>new Point((id%Cols)*Cell+10,(id/Cols)*Cell+10);
        static int CellOf(Point p)=>(int)Maths.Clamp(Math.Floor(p.y/Cell),0,Rows-1)*Cols+(int)Maths.Clamp(Math.Floor(p.x/Cell),0,Cols-1);
        public List<Point> Find(Point start,Point goal)
        {
            var empty=new List<Point>();if(Blocked(start))return empty;
            bool goalFree=!Blocked(goal);if(goalFree&&Clear(start,goal))return new List<Point>{goal.Copy()};
            int begin=CellOf(start),wanted=CellOf(goal),best=begin;double bestD=double.PositiveInfinity;
            // List preserves insertion order so equal-cost paths match the source A*.
            var open=new List<int>{begin};var parents=new Dictionary<int,int>();var costs=new Dictionary<int,double>{{begin,0}};var closed=new HashSet<int>();
            int[,] directions={{1,0},{-1,0},{0,1},{0,-1},{1,1},{1,-1},{-1,1},{-1,-1}};
            while(open.Count>0)
            {
                int current=-1;double score=double.PositiveInfinity;
                foreach(int id in open){double f=costs[id]+Point.Distance(Center(id),goal);if(f<score){score=f;current=id;}}
                open.Remove(current);closed.Add(current);var cp=current==begin?start:Center(current);double d=Point.Distance(cp,goal);
                if(d<bestD){bestD=d;best=current;}if((current==wanted||d<Cell*2)&&goalFree&&Clear(cp,goal)){best=current;break;}
                int x=current%Cols,y=current/Cols;
                for(int i=0;i<8;i++){int nx=x+directions[i,0],ny=y+directions[i,1];if(nx<0||ny<0||nx>=Cols||ny>=Rows)continue;int next=ny*Cols+nx;var np=Center(next);if(closed.Contains(next)||!Clear(cp,np))continue;double cost=costs[current]+Point.Distance(cp,np);if(!costs.TryGetValue(next,out var old)||cost<old){costs[next]=cost;parents[next]=current;if(!open.Contains(next))open.Add(next);}}
            }
            var route=new List<Point>();int cursor=best;
            while(cursor!=begin){route.Insert(0,Center(cursor));if(!parents.TryGetValue(cursor,out cursor))return empty;}
            if(goalFree&&Clear(route.Count>0?route[route.Count-1]:start,goal))route.Add(goal.Copy());
            var smooth=new List<Point>();var from=start;
            for(int i=0;i<route.Count;){int far=i;while(far+1<route.Count&&Clear(from,route[far+1]))far++;smooth.Add(route[far]);from=route[far];i=far+1;}
            return smooth;
        }
        public double Walk(Point pos,List<Point> route,double budget)
        {
            double moved=0;
            while(route.Count>0&&budget>0){var next=route[0];double d=Point.Distance(pos,next);if(d<.01){route.RemoveAt(0);continue;}double step=Math.Min(Math.Min(budget,d),4);var p=new Point(pos.x+(next.x-pos.x)/d*step,pos.y+(next.y-pos.y)/d*step);if(!Clear(pos,p)){route.Clear();break;}pos.x=p.x;pos.y=p.y;moved+=step;budget-=step;if(step>=d-.001)route.RemoveAt(0);}return moved;
        }
    }
}
