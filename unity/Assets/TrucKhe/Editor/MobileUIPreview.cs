using UnityEditor;
using UnityEngine;

namespace TrucKhe.Editor
{
    public static class MobileUIPreview
    {
        const string Menu="Truc Khe/Mobile/Preview Phone UI in Editor";
        [MenuItem(Menu)] public static void Toggle()
        {
            GameUI.PreviewMobileInEditor=!GameUI.PreviewMobileInEditor;
            foreach(var ui in Object.FindObjectsOfType<GameUI>())ui.ReconfigureLayout();
            Debug.Log("Truc Khe: phone UI preview "+(GameUI.PreviewMobileInEditor?"enabled":"disabled")+". Choose a landscape Game view or Device Simulator. This is not a native device test.");
        }
        [MenuItem(Menu,true)] public static bool Validate(){UnityEditor.Menu.SetChecked(Menu,GameUI.PreviewMobileInEditor);return true;}
    }
}
