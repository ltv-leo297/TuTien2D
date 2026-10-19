using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;

namespace TrucKhe
{
    public sealed class PointerControls : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, ICancelHandler
    {
        public Action<bool> hold;
        public Action<Vector2> click;
        readonly HashSet<int> pointers=new HashSet<int>();
        public void OnPointerDown(PointerEventData e)
        {
            if(e.button!=PointerEventData.InputButton.Left)return;
            if(hold!=null&&pointers.Add(e.pointerId)&&pointers.Count==1)hold(true);
            if(click!=null&&RectTransformUtility.ScreenPointToLocalPointInRectangle((RectTransform)transform,e.position,e.pressEventCamera,out var p))
            {var r=((RectTransform)transform).rect;click(new Vector2((p.x-r.xMin)/r.width,1-(p.y-r.yMin)/r.height));}
        }
        public void OnPointerUp(PointerEventData e){if(pointers.Remove(e.pointerId)&&pointers.Count==0)hold?.Invoke(false);}
        public void OnCancel(BaseEventData e)=>ReleaseAll();
        public void ReleaseAll(){bool held=pointers.Count>0;pointers.Clear();if(held)hold?.Invoke(false);}
        void OnDisable()=>ReleaseAll();
        void OnApplicationFocus(bool focused){if(!focused)ReleaseAll();}
        void OnApplicationPause(bool paused){if(paused)ReleaseAll();}
    }
}
