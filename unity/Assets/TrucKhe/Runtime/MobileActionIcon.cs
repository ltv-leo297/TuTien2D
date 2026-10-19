using UnityEngine;
using UnityEngine.UI;

namespace TrucKhe
{
    public sealed class MobileActionIcon : MaskableGraphic
    {
        public string action;
        protected override void OnPopulateMesh(VertexHelper vh)
        {
            vh.Clear();var r=rectTransform.rect;
            void Line(float x1,float y1,float x2,float y2)
            {
                var a=new Vector2(r.xMin+x1*r.width,r.yMin+y1*r.height);var b=new Vector2(r.xMin+x2*r.width,r.yMin+y2*r.height);
                var n=new Vector2(-(b-a).y,(b-a).x).normalized*1.7f;int k=vh.currentVertCount;
                vh.AddVert(a-n,color,Vector2.zero);vh.AddVert(a+n,color,Vector2.zero);vh.AddVert(b+n,color,Vector2.zero);vh.AddVert(b-n,color,Vector2.zero);vh.AddTriangle(k,k+1,k+2);vh.AddTriangle(k,k+2,k+3);
            }
            switch(action)
            {
                case "left":Line(.8f,.5f,.2f,.5f);Line(.2f,.5f,.5f,.8f);Line(.2f,.5f,.5f,.2f);break;
                case "right":Line(.2f,.5f,.8f,.5f);Line(.8f,.5f,.5f,.8f);Line(.8f,.5f,.5f,.2f);break;
                case "jump":Line(.5f,.2f,.5f,.85f);Line(.2f,.55f,.5f,.85f);Line(.8f,.55f,.5f,.85f);break;
                case "guard":Line(.15f,.8f,.5f,.9f);Line(.5f,.9f,.85f,.8f);Line(.15f,.8f,.2f,.35f);Line(.85f,.8f,.8f,.35f);Line(.2f,.35f,.5f,.1f);Line(.8f,.35f,.5f,.1f);break;
                case "attack":Line(.2f,.15f,.8f,.85f);Line(.8f,.85f,.6f,.8f);Line(.8f,.85f,.77f,.62f);Line(.15f,.4f,.45f,.15f);break;
                case "skill":for(int i=0;i<12;i++){float a=(i*.12f+.15f)*Mathf.PI,b=((i+1)*.12f+.15f)*Mathf.PI;Line(.5f+Mathf.Cos(a)*.37f,.5f+Mathf.Sin(a)*.37f,.5f+Mathf.Cos(b)*.37f,.5f+Mathf.Sin(b)*.37f);}Line(.2f,.2f,.85f,.85f);break;
                case "bag":Line(.3f,.85f,.7f,.85f);Line(.3f,.85f,.4f,.65f);Line(.7f,.85f,.6f,.65f);Line(.4f,.65f,.15f,.3f);Line(.6f,.65f,.85f,.3f);Line(.15f,.3f,.3f,.15f);Line(.85f,.3f,.7f,.15f);Line(.3f,.15f,.7f,.15f);break;
                case "quests":Line(.2f,.9f,.8f,.9f);Line(.2f,.9f,.2f,.1f);Line(.8f,.9f,.8f,.1f);Line(.2f,.1f,.8f,.1f);for(int i=0;i<3;i++)Line(.32f,.7f-i*.2f,.68f,.7f-i*.2f);break;
                default:Line(.15f,.7f,.65f,.7f);Line(.25f,.3f,.85f,.3f);Line(.6f,.55f,.85f,.3f);Line(.6f,.05f,.85f,.3f);break;
            }
        }
    }
}
