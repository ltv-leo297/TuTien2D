using UnityEngine;
using UnityEngine.UI;

namespace TrucKhe
{
    // UI geometry only: no generated artwork, texture allocation or font-dependent icons.
    public sealed class MobileRoundGraphic : MaskableGraphic, ICanvasRaycastFilter
    {
        public Color border=new Color(.65f,.76f,.55f);
        protected override void OnPopulateMesh(VertexHelper vh)
        {
            vh.Clear();var rect=rectTransform.rect;var center=rect.center;
            float radius=Mathf.Min(rect.width,rect.height)*.5f;
            Disk(vh,center,radius,border);Disk(vh,center,radius-2,color);
        }
        static void Disk(VertexHelper vh,Vector2 center,float radius,Color tint)
        {
            int first=vh.currentVertCount;vh.AddVert(center,tint,Vector2.zero);
            for(int i=0;i<=48;i++){float a=i*Mathf.PI*2/48;vh.AddVert(center+new Vector2(Mathf.Cos(a),Mathf.Sin(a))*radius,tint,Vector2.zero);if(i>0)vh.AddTriangle(first,first+i,first+i+1);}
        }
        public bool IsRaycastLocationValid(Vector2 point,Camera camera)
        {
            RectTransformUtility.ScreenPointToLocalPointInRectangle(rectTransform,point,camera,out var local);
            return (local-rectTransform.rect.center).sqrMagnitude<=Mathf.Pow(Mathf.Min(rectTransform.rect.width,rectTransform.rect.height)*.5f,2);
        }
    }
}
