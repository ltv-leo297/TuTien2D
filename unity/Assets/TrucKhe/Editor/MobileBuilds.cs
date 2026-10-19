using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEngine;
using UnityEngine.Rendering;

namespace TrucKhe.Editor
{
    public static class MobileBuilds
    {
        public const string ApplicationId="com.tutien2d.truckhe";

        [MenuItem("Truc Khe/Mobile/Apply Android and iOS Settings")]
        public static void Configure()
        {
            PlayerSettings.defaultInterfaceOrientation=UIOrientation.AutoRotation;
            PlayerSettings.allowedAutorotateToLandscapeLeft=true;
            PlayerSettings.allowedAutorotateToLandscapeRight=true;
            PlayerSettings.allowedAutorotateToPortrait=false;
            PlayerSettings.allowedAutorotateToPortraitUpsideDown=false;
            PlayerSettings.statusBarHidden=true;
            foreach(var group in new[]{BuildTargetGroup.Android,BuildTargetGroup.iOS})
            {
                // Preserve the developer's store identity and signing configuration.
                if(string.IsNullOrEmpty(PlayerSettings.GetApplicationIdentifier(group)))PlayerSettings.SetApplicationIdentifier(group,ApplicationId);
                PlayerSettings.SetScriptingBackend(group,ScriptingImplementation.IL2CPP);
                PlayerSettings.SetApiCompatibilityLevel(group,ApiCompatibilityLevel.NET_Standard_2_0);
                PlayerSettings.SetManagedStrippingLevel(group,ManagedStrippingLevel.Low);
            }
            PlayerSettings.Android.minSdkVersion=AndroidSdkVersions.AndroidApiLevel26;
            PlayerSettings.Android.targetSdkVersion=AndroidSdkVersions.AndroidApiLevelAuto;
            PlayerSettings.Android.targetArchitectures=AndroidArchitecture.ARM64;
            PlayerSettings.Android.buildApkPerCpuArchitecture=false;
            if(PlayerSettings.Android.bundleVersionCode<1)PlayerSettings.Android.bundleVersionCode=1;
            PlayerSettings.SetUseDefaultGraphicsAPIs(BuildTarget.Android,false);
            PlayerSettings.SetGraphicsAPIs(BuildTarget.Android,new[]{GraphicsDeviceType.OpenGLES3});
            PlayerSettings.iOS.targetOSVersionString="15.0";
            PlayerSettings.iOS.targetDevice=iOSTargetDevice.iPhoneAndiPad;
            PlayerSettings.iOS.sdkVersion=iOSSdkVersion.DeviceSDK;
            PlayerSettings.iOS.requiresFullScreen=true;
            PlayerSettings.SetArchitecture(BuildTargetGroup.iOS,(int)AppleMobileArchitecture.ARM64);
            if(string.IsNullOrEmpty(PlayerSettings.iOS.buildNumber))PlayerSettings.iOS.buildNumber="1";
            PlayerSettings.SetUseDefaultGraphicsAPIs(BuildTarget.iOS,false);
            PlayerSettings.SetGraphicsAPIs(BuildTarget.iOS,new[]{GraphicsDeviceType.Metal});
            AssetDatabase.SaveAssets();
            Debug.Log("Truc Khe: mobile settings applied (landscape, IL2CPP ARM64, Android 8+, iOS 15+). Signing settings preserved.");
        }

        [MenuItem("Truc Khe/Build/Android APK (Development)")]
        public static void AndroidApk()=>Build(BuildTarget.Android,"Builds/Android/TrucKhe-dev.apk",false,BuildOptions.Development);
        [MenuItem("Truc Khe/Build/Android AAB (Release)")]
        public static void AndroidAab()=>Build(BuildTarget.Android,"Builds/Android/TrucKhe.aab",true,BuildOptions.None);
        [MenuItem("Truc Khe/Build/iOS Xcode Project")]
        public static void IOS()=>Build(BuildTarget.iOS,"Builds/iOS",false,BuildOptions.None);

        static void Build(BuildTarget target,string defaultOutput,bool bundle,BuildOptions options)
        {
            var group=BuildPipeline.GetBuildTargetGroup(target);
            if(!BuildPipeline.IsBuildTargetSupported(group,target))throw new BuildFailedException("Install "+target+" Build Support for this Unity Editor through Unity Hub (Android also needs SDK, NDK and OpenJDK).");
            // Switching inside an executeMethod may reload assemblies mid-build.
            if(EditorUserBuildSettings.activeBuildTarget!=target)throw new BuildFailedException("Switch Platform to "+target+" first, or start Unity with -buildTarget "+target+" before -executeMethod.");
            if(bundle&&(!PlayerSettings.Android.useCustomKeystore||string.IsNullOrEmpty(PlayerSettings.Android.keystoreName)||string.IsNullOrEmpty(PlayerSettings.Android.keyaliasName)))
                throw new BuildFailedException("Configure the release upload keystore and key alias in Player Settings > Android > Publishing Settings before building an AAB.");
            Configure();ProjectTools.Validate();
            string output=OutputPath(defaultOutput,target,bundle);
            Directory.CreateDirectory(target==BuildTarget.iOS?output:Path.GetDirectoryName(output));
            bool oldBundle=EditorUserBuildSettings.buildAppBundle,oldExport=EditorUserBuildSettings.exportAsGoogleAndroidProject;
            try
            {
                if(target==BuildTarget.Android){EditorUserBuildSettings.buildAppBundle=bundle;EditorUserBuildSettings.exportAsGoogleAndroidProject=false;}
                var report=BuildPipeline.BuildPlayer(new BuildPlayerOptions{scenes=new[]{ProjectTools.MainScene},target=target,targetGroup=group,locationPathName=output,options=options});
                if(report.summary.result!=BuildResult.Succeeded)throw new BuildFailedException("Mobile build failed: "+report.summary.result+". See the Unity build log.");
                Debug.Log("Truc Khe mobile output: "+output+(target==BuildTarget.iOS?" (Xcode project; signing/archive required on macOS)":""));
            }
            finally{EditorUserBuildSettings.buildAppBundle=oldBundle;EditorUserBuildSettings.exportAsGoogleAndroidProject=oldExport;}
        }
        static string OutputPath(string fallback,BuildTarget target,bool bundle)
        {
            string output=fallback;var args=Environment.GetCommandLineArgs();
            for(int i=0;i<args.Length;i++)if(args[i]=="-trucKheBuildPath")
            {
                if(i+1>=args.Length||args[i+1].StartsWith("-",StringComparison.Ordinal))throw new BuildFailedException("-trucKheBuildPath requires an output path.");
                output=args[++i];
            }
            string project=Directory.GetParent(Application.dataPath).FullName;
            output=Path.GetFullPath(Path.IsPathRooted(output)?output:Path.Combine(project,output));
            foreach(string protectedDir in new[]{"Assets","Packages","ProjectSettings"})
            {
                string full=Path.Combine(project,protectedDir);
                if(output.Equals(full,StringComparison.OrdinalIgnoreCase)||output.StartsWith(full+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))throw new BuildFailedException("Build output must be outside "+protectedDir+".");
            }
            if(output.Equals(project,StringComparison.OrdinalIgnoreCase))throw new BuildFailedException("Build output cannot be the project root.");
            if(target==BuildTarget.Android&&!output.EndsWith(bundle?".aab":".apk",StringComparison.OrdinalIgnoreCase))throw new BuildFailedException("Android output extension must match the selected APK/AAB build.");
            return output;
        }
    }

    // Also protect manual File > Build Settings builds from a mismatched backend.
    public sealed class MobileBuildGuard : IPreprocessBuildWithReport
    {
        public int callbackOrder=>0;
        public void OnPreprocessBuild(BuildReport report)
        {
            var target=report.summary.platform;if(target!=BuildTarget.Android&&target!=BuildTarget.iOS)return;
            var group=BuildPipeline.GetBuildTargetGroup(target);
            if(PlayerSettings.GetScriptingBackend(group)!=ScriptingImplementation.IL2CPP)
                throw new BuildFailedException("Truc Khe mobile requires IL2CPP. Use Truc Khe > Mobile > Apply Android and iOS Settings.");
            if(target==BuildTarget.Android&&(PlayerSettings.Android.targetArchitectures&AndroidArchitecture.ARM64)==0)
                throw new BuildFailedException("Android ARM64 is required. Apply the Truc Khe mobile settings.");
            if(!PlayerSettings.allowedAutorotateToLandscapeLeft||!PlayerSettings.allowedAutorotateToLandscapeRight||PlayerSettings.allowedAutorotateToPortrait||PlayerSettings.allowedAutorotateToPortraitUpsideDown||PlayerSettings.defaultInterfaceOrientation!=UIOrientation.AutoRotation)
                throw new BuildFailedException("Truc Khe mobile uses landscape only. Apply the Truc Khe mobile settings.");
        }
    }
}
