using System;
using UnityEditor.Build;
using UnityEngine;
using UnityEngine.Rendering;

namespace TrucKhe.Editor
{
    public static class Unity6Project
    {
        // Keep in sync with ProjectSettings/ProjectVersion.txt.
        public const string EditorVersion="6000.3.26f1";

        public static void ValidateEnvironment()
        {
            if(!Application.unityVersion.StartsWith("6000.3.",StringComparison.Ordinal))
                throw new BuildFailedException("Open this project with Unity 6.3 LTS ("+EditorVersion+" recommended). Current Editor: "+Application.unityVersion);
#if !ENABLE_LEGACY_INPUT_MANAGER
            throw new BuildFailedException("Enable Input Manager (Old) in Player Settings > Active Input Handling, then restart Unity. This project uses UnityEngine.Input and StandaloneInputModule.");
#endif
            if(GraphicsSettings.defaultRenderPipeline!=null||QualitySettings.renderPipeline!=null)
                throw new BuildFailedException("Truc Khe uses the Built-in Render Pipeline. Clear the render pipeline asset in Graphics and the active Quality settings before validating/building.");
        }
    }
}
