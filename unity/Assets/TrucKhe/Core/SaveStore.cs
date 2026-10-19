using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace TrucKhe.Core
{
    // Json.NET normally rounds floating-point JSON into int fields. A save must
    // reject such counts/directions instead of silently changing player data.
    sealed class SaveIntegerConverter : JsonConverter
    {
        public override bool CanConvert(Type type)=>type==typeof(int)||type==typeof(long);
        public override bool CanWrite=>false;
        public override object ReadJson(JsonReader reader,Type type,object existing,JsonSerializer serializer)
        {
            if(reader.TokenType!=JsonToken.Integer)throw new JsonSerializationException("Expected an integer in save data");
            long value=Convert.ToInt64(reader.Value);
            if(type==typeof(int))return checked((int)value);
            return value;
        }
        public override void WriteJson(JsonWriter writer,object value,JsonSerializer serializer)=>throw new NotSupportedException();
    }
    [Serializable] public class Profile { [JsonProperty(Required=Required.Always)] public string name="Vô Danh",hero="A"; }
    [Serializable] public class Progress
    {
        [JsonProperty(Required=Required.Always)] public int version=1;
        [JsonProperty(Required=Required.Always)] public Profile profile=new Profile();
        [JsonProperty(Required=Required.Always)] public string locale="vi",map="village";
        [JsonProperty(Required=Required.AllowNull)] public Point position;
        [JsonProperty(Required=Required.Always)] public int direction;
        [JsonProperty(Required=Required.Always)] public bool reducedMotion,sound;
        [JsonProperty(Required=Required.Always)] public List<string> visited=new List<string>();
        [JsonProperty(Required=Required.Always)] public Inventory inventory;
        [JsonProperty(Required=Required.Always)] public Ledger ledger=new Ledger();
        public void Validate(Content content)
        {
            if(version!=1||profile==null||string.IsNullOrWhiteSpace(profile.name)||profile.name.Length>16||direction<0||direction>3||!new[]{"A","B","C","D"}.Contains(profile.hero)||!content.scenes.ContainsKey(map)||!(locale=="vi"||locale=="en")||visited==null||visited.Any(string.IsNullOrEmpty)||inventory==null||ledger==null)throw new Exception("save");
            if(position!=null&&(!Maths.Finite(position.x)||!Maths.Finite(position.y)))throw new Exception("save");inventory.Validate(content);ledger.Validate(content);
        }
    }
    // A process-wide file lease prevents two desktop instances from overwriting progress.
    // Transactions serialize and validate a copy, then atomically replace the save.
    public sealed class SaveStore : IDisposable
    {
        readonly string path;
        readonly Content content;
        readonly FileStream lease;
        public Progress Current {get;private set;}
        public string DirectoryPath=>Path.GetDirectoryName(path);
        static T ReadSaved<T>(JToken token)=>token.ToObject<T>(JsonSerializer.Create(new JsonSerializerSettings{Converters={new SaveIntegerConverter()}}));
        public SaveStore(string directory,Content content)
        {
            this.content=content;Directory.CreateDirectory(directory);path=Path.Combine(directory,"progress-v1.json");
            lease=new FileStream(path+".lock",FileMode.OpenOrCreate,FileAccess.ReadWrite,FileShare.None);
            try
            {
                Current=File.Exists(path)?ReadSaved<Progress>(JObject.Parse(File.ReadAllText(path))):new Progress{inventory=Inventory.Create(content)};
                Current.Validate(content);
                // Interrupted encounters finish once on reopening, preserving their return point.
                if(Current.ledger.monsters.Values.SelectMany(x=>x).Any(e=>!e.readyAt.HasValue))
                    Change(p=>{p.ledger=p.ledger.Recover(Now);if(p.ledger.returnTo!=null){p.map=p.ledger.returnTo.map;p.position=p.ledger.returnTo.pos.Copy();p.direction=p.ledger.returnTo.direction;}});
            }
            catch{lease.Dispose();throw;}
        }
        public static double Now=>DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        public void Change(Action<Progress> mutation)
        {
            var next=Maths.Clone(Current);mutation(next);next.Validate(content);string json=JsonConvert.SerializeObject(next,Formatting.Indented);
            // Round-trip before touching the existing file. Bad/unknown save data never resets it.
            JsonConvert.DeserializeObject<Progress>(json).Validate(content);
            string temp=path+".tmp";
            using(var file=new FileStream(temp,FileMode.Create,FileAccess.Write,FileShare.None))using(var writer=new StreamWriter(file)){writer.Write(json);writer.Flush();file.Flush(true);}
            if(File.Exists(path))File.Replace(temp,path,path+".bak");else File.Move(temp,path);Current=next;
        }
        public void ImportWeb(string json)
        {
            var root=JObject.Parse(json);
            JToken Read(string key){var value=root[key];if(value?.Type!=JTokenType.String)return value;string text=value.Value<string>();if(key=="truc-khe.locale"&&(text=="vi"||text=="en"))return value;return JToken.Parse(text);}
            var inventory=Read("truc-khe.inventory.v1");var progress=Read("truc-khe.progress");
            if(inventory==null&&progress==null)throw new Exception("save");
            if(progress!=null&&!(progress is JObject))throw new Exception("save");
            var bag=progress?["bag"];if(bag!=null&&!(bag is JObject))throw new Exception("save");
            var imported=inventory!=null?ReadSaved<Inventory>(inventory):Inventory.Create(content,bag==null?null:ReadSaved<Dictionary<string,int>>(bag));imported.Validate(content);
            var savedLedger=Read("truc-khe.combat.v1");var ledger=savedLedger==null?new Ledger():ReadSaved<Ledger>(savedLedger);ledger.Validate(content);ledger=ledger.Recover(Now);
            var savedProfile=Read("truc-khe.profile");var profile=savedProfile==null?null:ReadSaved<Profile>(savedProfile);var locale=Read("truc-khe.locale")?.Value<string>();var reduced=Read("truc-khe.motion");
            Change(p=>{p.inventory=imported;p.ledger=ledger;if(profile!=null)p.profile=profile;if(locale=="vi"||locale=="en")p.locale=locale;if(reduced?.Type==JTokenType.Boolean)p.reducedMotion=reduced.Value<bool>();p.visited=progress?["visited"]?.ToObject<List<string>>()??new List<string>();if(ledger.returnTo!=null){p.map=ledger.returnTo.map;p.position=ledger.returnTo.pos.Copy();p.direction=ledger.returnTo.direction;}else{p.map="village";p.position=null;}});
        }
        public void Dispose()=>lease.Dispose();
    }
}
