using UnityEditor;
using UnityEngine;

namespace TrucKhe.Editor
{
    [InitializeOnLoad]
    public static class MobileUIPreview
    {
        const string Menu="Truc Khe/Mobile/Preview Phone UI in Editor";
        const string SessionKey="TrucKhe.MobileUIPreview.Enabled";
        // Entering Play Mode reloads static fields by default. Restore the preview
        // choice after that reload so enabling it before Play actually takes effect.
        static MobileUIPreview()
        {
            GameUI.PreviewMobileInEditor=SessionState.GetBool(SessionKey,false);
        }
        [MenuItem(Menu)] public static void Toggle()
        {
            GameUI.PreviewMobileInEditor=!GameUI.PreviewMobileInEditor;
            SessionState.SetBool(SessionKey,GameUI.PreviewMobileInEditor);
            foreach(var ui in Object.FindObjectsByType<GameUI>(FindObjectsSortMode.None))ui.ReconfigureLayout();
            Debug.Log("Truc Khe: phone UI preview "+(GameUI.PreviewMobileInEditor?"enabled":"disabled")+". Choose a landscape Game view or Device Simulator. This is not a native device test.");
        }
        [MenuItem(Menu,true)] public static bool Validate(){UnityEditor.Menu.SetChecked(Menu,GameUI.PreviewMobileInEditor);return true;}
    }
}
