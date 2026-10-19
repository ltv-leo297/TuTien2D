using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using TrucKhe.Core;

namespace TrucKhe.Editor
{
    public sealed class PixelArtImporter : AssetPostprocessor
    {
        void OnPreprocessTexture()
        {
            if(!assetPath.StartsWith("Assets/TrucKhe/Resources/Art/",StringComparison.Ordinal))return;
            var importer=(TextureImporter)assetImporter;importer.textureType=TextureImporterType.Default;importer.filterMode=FilterMode.Point;importer.wrapMode=TextureWrapMode.Clamp;importer.mipmapEnabled=false;importer.npotScale=TextureImporterNPOTScale.None;importer.maxTextureSize=8192;importer.textureCompression=TextureImporterCompression.Uncompressed;importer.alphaIsTransparency=true;importer.isReadable=false;
        }
    }
    public static class ProjectTools
    {
        public const string MainScene="Assets/TrucKhe/Scenes/Main.unity";
        [MenuItem("Truc Khe/Open Main Scene")]
        public static void OpenMain(){if(EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo())EditorSceneManager.OpenScene(MainScene);}
        [MenuItem("Truc Khe/Validate Project")]
        public static void Validate()
        {
            var json=Resources.Load<TextAsset>("Data/content");if(!json)throw new Exception("Missing content.json");var content=Content.Parse(json.text);
            foreach(var scene in content.scenes.Values){if(new Navigation(scene).Blocked(scene.spawn))throw new Exception("Blocked spawn: "+scene.id);foreach(var gate in scene.gates)if(!content.scenes.ContainsKey(gate.to)||new Navigation(content.scenes[gate.to]).Blocked(gate.spawn))throw new Exception("Invalid gate: "+scene.id+"/"+gate.id);}
            Inventory.Create(content).Validate(content);new Ledger().Validate(content);
            using(var art=new ArtLibrary(content))
            {
                art.PreloadCombat();foreach(var id in new[]{"A","B","C","D"})for(int d=0;d<4;d++)for(int p=0;p<4;p++)art.Hero(id,d,p);
                foreach(var item in content.items)art.Item(item.id);foreach(var id in content.scenes.Keys)art.Texture("Baked/ground-"+id);
            }
            if(!Resources.Load<Font>("Fonts/NotoSans-Regular"))throw new Exception("Missing Vietnamese font");
            if(!File.Exists(MainScene))throw new Exception("Missing Main scene");
            Debug.Log("Truc Khe: content, assets, navigation spawns and scene references validated.");
        }
        [MenuItem("Truc Khe/Build/Windows x64")]
        public static void Windows()=>Build(BuildTarget.StandaloneWindows64,"Builds/Windows/TrucKhe.exe");
        [MenuItem("Truc Khe/Build/Linux x64")]
        public static void Linux()=>Build(BuildTarget.StandaloneLinux64,"Builds/Linux/TrucKhe.x86_64");
        [MenuItem("Truc Khe/Build/macOS")]
        public static void Mac()=>Build(BuildTarget.StandaloneOSX,"Builds/macOS/TrucKhe.app");
        static void Build(BuildTarget target,string output)
        {
            Validate();Directory.CreateDirectory(Path.GetDirectoryName(output));var result=BuildPipeline.BuildPlayer(new BuildPlayerOptions{scenes=new[]{MainScene},locationPathName=output,target=target,options=BuildOptions.None});
            if(result.summary.result!=BuildResult.Succeeded)throw new Exception("Player build failed: "+result.summary.result);Debug.Log("Player built: "+output);
        }
        [MenuItem("Truc Khe/Open Save Folder")]
        public static void OpenSaveFolder(){Directory.CreateDirectory(Application.persistentDataPath);EditorUtility.RevealInFinder(Application.persistentDataPath);}
    }
}
