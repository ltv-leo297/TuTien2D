using System.Collections.Generic;
using Newtonsoft.Json.Utilities;
using TrucKhe.Core;
using UnityEngine;
using UnityEngine.Scripting;
using Stack=TrucKhe.Core.Stack;

namespace TrucKhe
{
    // JSON creates collection wrappers through reflection. Preserve their concrete
    // generic implementations for IL2CPP as well as the model fields in link.xml.
    [Preserve]
    public static class JsonAot
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        public static void Register()
        {
            AotHelper.EnsureType<Content>();AotHelper.EnsureType<Progress>();AotHelper.EnsureType<Inventory>();AotHelper.EnsureType<Ledger>();
            AotHelper.EnsureList<int>();AotHelper.EnsureList<double>();AotHelper.EnsureList<string>();
            AotHelper.EnsureList<Point>();AotHelper.EnsureList<List<Point>>();AotHelper.EnsureList<Actor>();AotHelper.EnsureList<Prop>();
            AotHelper.EnsureList<Box>();AotHelper.EnsureList<Gate>();AotHelper.EnsureList<River>();AotHelper.EnsureList<Bridge>();AotHelper.EnsureList<Vegetation>();
            AotHelper.EnsureList<Item>();AotHelper.EnsureList<Skill>();AotHelper.EnsureList<Stack>();AotHelper.EnsureList<Charge>();
            AotHelper.EnsureDictionary<string,string>();AotHelper.EnsureDictionary<string,int>();AotHelper.EnsureDictionary<string,double>();
            AotHelper.EnsureDictionary<string,Scene>();AotHelper.EnsureDictionary<string,Monster>();AotHelper.EnsureDictionary<string,Item>();
            AotHelper.EnsureDictionary<string,Stack>();AotHelper.EnsureDictionary<string,List<Charge>>();
            AotHelper.EnsureDictionary<string,Dictionary<string,string>>();
        }
    }
}
