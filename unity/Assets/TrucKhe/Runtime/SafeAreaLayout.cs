using UnityEngine;
using TrucKhe.Core;

namespace TrucKhe
{
    [RequireComponent(typeof(RectTransform))]
    public sealed class SafeAreaLayout : MonoBehaviour
    {
        Canvas canvas;
        RectTransform layout;
        bool mobile;
        public void Initialize(Canvas owner,bool useMobile=false){canvas=owner;mobile=useMobile;layout=(RectTransform)transform;Apply(Screen.safeArea,Screen.width,Screen.height);}
        void LateUpdate(){if(canvas)Apply(Screen.safeArea,Screen.width,Screen.height);}
        public void Apply(Rect safe,int width,int height)
        {
            if(!canvas||width<=0||height<=0)return;
            var fit=ScreenLayout.Fit(width,height,safe.x,safe.y,safe.width,safe.height,mobile);
            layout.sizeDelta=new Vector2((float)fit.uiWidth,(float)fit.uiHeight);
            float factor=Mathf.Max(.001f,canvas.scaleFactor);
            layout.anchoredPosition=new Vector2((float)(fit.centerX-width*.5)/factor,(float)(fit.centerY-height*.5)/factor);
            float scale=(float)fit.scale/factor;layout.localScale=new Vector3(scale,scale,1);
        }
    }
}
