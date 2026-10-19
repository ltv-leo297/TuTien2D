using System;
using System.IO;
using System.Linq;
using UnityEngine;
using UnityEngine.EventSystems;
using TrucKhe.Core;
using Point=TrucKhe.Core.Point;

namespace TrucKhe
{
    public sealed class GameRoot : MonoBehaviour
    {
        // Test runner supplies an isolated directory; normal players use persistentDataPath.
        public static string SaveDirectoryOverride;
        public Content Content {get;private set;}
        public ArtLibrary Art {get;private set;}
        public SaveStore Saves {get;private set;}
        public World World {get;private set;}
        public Combat Combat {get;private set;}
        public string Encounter {get;private set;}
        public string Error {get;private set;}
        public string DialogueKey {get;private set;}
        public string Speaker {get;private set;}
        public GameUI UI {get;private set;}
        public Camera GameCamera {get;private set;}
        public WorldView WorldView {get;private set;}
        CombatView combatView;
        AudioSource ambience;
        string encounterId;
        bool outcomeSaved,finalizeAttempted,focused=true,hasFocus=true,appPaused;
        double checkpoint;
        public string Locale=>Saves?.Current.locale??"vi";
        public string T(string key,params object[] args)=>Content.Text(Locale,key,args);
        public bool Reduced=>Saves?.Current.reducedMotion??false;
        public string PlayerName=>Saves?.Current.profile.name??T("defaultName");
        void Awake()
        {
            Application.targetFrameRate=60;
            if(Application.isMobilePlatform){Input.multiTouchEnabled=true;Input.simulateMouseWithTouches=false;}
            try
            {
                var data=Resources.Load<TextAsset>("Data/content");if(!data)throw new Exception("Missing Data/content.json");Content=TrucKhe.Core.Content.Parse(data.text);Art=new ArtLibrary(Content);
                var cam=new GameObject("Game Camera");GameCamera=cam.AddComponent<Camera>();cam.tag="MainCamera";GameCamera.orthographic=true;GameCamera.clearFlags=CameraClearFlags.SolidColor;GameCamera.backgroundColor=new Color(.06f,.18f,.15f);GameCamera.nearClipPlane=.1f;GameCamera.farClipPlane=100;cam.AddComponent<AudioListener>();
                var view=new GameObject("Exploration");WorldView=view.AddComponent<WorldView>();WorldView.Initialize(Art,GameCamera);
                var cv=new GameObject("Combat");combatView=cv.AddComponent<CombatView>();combatView.Initialize(Art,GameCamera);cv.SetActive(false);
                ambience=gameObject.AddComponent<AudioSource>();ambience.loop=true;ambience.playOnAwake=false;ambience.volume=.17f;
                UI=new GameObject("Game UI").AddComponent<GameUI>();UI.Initialize(this);OpenSave();
            }
            catch(Exception e){Debug.LogException(e);Error=e.Message;}
        }
        public void OpenSave()
        {
            try{Saves?.Dispose();Saves=new SaveStore(SaveDirectoryOverride??Application.persistentDataPath,Content);Error=null;UI.Creator();}
            catch(Exception e){Debug.LogException(e);Error=T("unity.saveError");UI.SaveFailure();}
        }
        public bool Commit(Action<Progress> action,string failure="unity.saveError")
        {
            try{Saves.Change(action);Error=null;return true;}catch(Exception e){Debug.LogException(e);Error=T(e.Message=="full"?"equipment.full":e.Message=="stale"?"equipment.stale":failure);UI?.RefreshStatus();return false;}
        }
        public void StartGame(string name,string hero)
        {
            name=name.Trim();if(name.Length==0)return;if(name.Length>16)name=name.Substring(0,16);
            if(!Commit(p=>p.profile=new Profile{name=name,hero=hero}))return;
            World=new World(Content,hero);var save=Saves.Current;World.visited=save.visited.ToHashSet();World.Restore(save.map,save.position??Content.scenes[save.map].spawn,save.direction);WorldView.gameObject.SetActive(true);WorldView.SetWorld(World);DialogueKey=Speaker=null;Encounter=null;UI.Exploration();UpdateSound();
        }
        void Update()
        {
            if(World==null||Saves==null||!focused)return;
            if(Combat!=null)
            {
                if(Input.GetKeyDown(KeyCode.Escape)&&Combat.outcome==null){Combat.Pause(!Combat.paused);UI.CombatOverlay();}
                if(!Combat.paused&&Combat.outcome==null)ReadCombatInput();Combat.Update(Time.unscaledDeltaTime);combatView.Render(Combat,World.hero,Reduced);
                if(Combat.outcome!=null&&!finalizeAttempted){finalizeAttempted=true;FinalizeBattle();UI.CombatOverlay();}
                UI.Tick();return;
            }
            if(Input.GetKeyDown(KeyCode.Escape)){UI.ClosePanel();Encounter=null;World.Stop();DialogueKey=Speaker=null;}
            if(!UI.ModalOpen)
            {
                ReadWorldPointer();
                World.Update(Time.unscaledDeltaTime);ProcessEvents();
            }
            WorldView.Render(World,Reduced,Locale,PlayerName);UI.Tick();
            checkpoint+=Time.unscaledDeltaTime;if(checkpoint>=10){checkpoint=0;PersistWorld();}
        }
        void ProcessEvents()
        {
            bool changed=false;
            foreach(var e in World.events.ToArray())
            {
                if(e.type=="talk")
                {
                    if(World.map=="forest"&&Content.monsters.ContainsKey(e.id)){Encounter=e.id;Speaker=DialogueKey=null;UI.ShowEncounter();}
                    else{Encounter=null;Speaker=e.id;DialogueKey=World.actors.Find(a=>a.id==e.id)?.role=="monster"?"talk.monster":"talk."+e.id;}changed=true;
                }
                else if(e.type=="gather") { if(!Commit(p=>p.inventory=p.inventory.Apply(Content,"add",e.itemId,1),"equipment.saveError"))World.cooldowns.Remove(e.id);else UI.Toast(T("gather","name",T(e.itemId))); }
                else if(e.type=="cooldown")UI.Toast(T("cooldown"));
                else if(e.type=="blocked")UI.Toast(T("blocked"));
                else if(e.type=="map"){WorldView.SetWorld(World);DialogueKey=Speaker=null;Encounter=null;changed=true;}
            }
            World.events.Clear();if(changed){PersistWorld();UI.RefreshDialogue();}
        }
        public void Direct(Point point)
        {
            if(Combat!=null||UI.ModalOpen||World==null)return;Encounter=null;UI.HideEncounter();Speaker=DialogueKey=null;
            var gate=World.Scene.gates.Find(g=>Point.Distance(new Point(g.Foot.x,g.Foot.y-64),point)<36);
            if(gate!=null){World.Go(new Point(gate.x+gate.w/2,gate.y+gate.h/2));UI.RefreshDialogue();return;}
            var actor=World.actors.OrderByDescending(a=>a.y).FirstOrDefault(a=>point.x>a.x-Math.Max(25,a.mapSize/2)&&point.x<a.x+Math.Max(25,a.mapSize/2)&&point.y>a.y-Math.Max(65,a.mapSize)&&point.y<a.y+14);
            World.Go(point,actor?.id);if(actor!=null&&actor.role!="resource")UI.Toast(T("walking","name",T(actor.id)));UI.RefreshDialogue();
        }
        void ReadWorldPointer()
        {
            if(Input.touchCount>0)
            {
                for(int i=0;i<Input.touchCount;i++)
                {
                    var touch=Input.GetTouch(i);
                    if(touch.phase!=TouchPhase.Began||UI.BlocksScreenPoint(touch.position)||!Screen.safeArea.Contains(touch.position))continue;
                    Direct(WorldView.ScreenPoint(touch.position));break;
                }
                return;
            }
            if(!Application.isMobilePlatform&&Input.GetMouseButtonDown(0)&&!UI.BlocksScreenPoint(Input.mousePosition))Direct(WorldView.ScreenPoint(Input.mousePosition));
        }
        public void NavigateNPC(string id){UI.ClosePanel();var a=World.actors.Find(x=>x.id==id);if(a!=null)World.Go(a,id);}
        public void CloseEncounter(){Encounter=null;UI.HideEncounter();}
        public void BeginBattle()
        {
            if(Combat!=null||Encounter==null)return;
            try
            {
                Art.PreloadCombat();var state=new Combat(Content,Encounter,Saves.Current.inventory.EffectiveStats(Content),BitConverter.ToUInt32(Guid.NewGuid().ToByteArray(),0));string id=Guid.NewGuid().ToString("N");
                if(!Commit(p=>{p.map=World.map;p.position=World.pos.Copy();p.direction=World.direction;p.ledger=p.ledger.Reserve(Encounter,id,SaveStore.Now,new ReturnPoint{map=World.map,pos=World.pos.Copy(),direction=World.direction});},"combat.saveError"))return;
                encounterId=id;outcomeSaved=false;finalizeAttempted=false;Combat=state;World.Stop();WorldView.gameObject.SetActive(false);combatView.gameObject.SetActive(true);Encounter=null;DialogueKey=Speaker=null;UI.Battle();
            }
            catch(Exception e){Debug.LogException(e);Error=T("combat.loadError");UI.RefreshStatus();}
        }
        bool FinalizeBattle()
        {
            if(outcomeSaved)return true;
            if(!Commit(p=>p.ledger=p.ledger.Finish(encounterId,SaveStore.Now),"combat.saveError"))return false;outcomeSaved=true;return true;
        }
        public void ReturnToMap()
        {
            if(Combat==null||Combat.outcome==null||!FinalizeBattle())return;
            var back=Saves.Current.ledger.returnTo;if(back!=null)World.Restore(back.map,back.pos,back.direction);Combat.Clear();Combat=null;encounterId=null;combatView.gameObject.SetActive(false);WorldView.gameObject.SetActive(true);WorldView.SetWorld(World);UI.Exploration();PersistWorld();
        }
        public void Retreat(){Combat?.End("retreat");finalizeAttempted=true;FinalizeBattle();UI.CombatOverlay();}
        public void Equip(string op,string id){if(Combat!=null)return;if(Commit(p=>p.inventory=p.inventory.Apply(Content,op,id),"equipment.saveError"))UI.InventoryChanged(op,id);}
        public void DismissDialogue(){DialogueKey=Speaker=null;World?.Stop();}
        public void LocaleChange(string locale){if(Commit(p=>p.locale=locale))UI.Rebuild();}
        public void ReducedChange(bool value){if(Commit(p=>p.reducedMotion=value))UI.Settings();}
        public void SoundChange(bool value){if(Commit(p=>p.sound=value)){UpdateSound();UI.Settings();}}
        void UpdateSound(){if(Saves.Current.sound&&focused){if(!ambience.clip)ambience.clip=Resources.Load<AudioClip>("Art/Production/nam-linh-ambience");if(!ambience.isPlaying)ambience.Play();}else ambience.Pause();}
        public void BackToCreator(){if(Combat!=null||!PersistWorld())return;World=null;Encounter=null;DialogueKey=Speaker=null;WorldView.ClearMap();WorldView.gameObject.SetActive(false);ambience.Pause();UI.Creator();}
        public void ImportWebSave()
        {
            if(Combat!=null)return;
            string file=Path.Combine(Saves.DirectoryPath,"web-save.json");if(!File.Exists(file)){UI.Toast(T("unity.importMissing"));return;}
            try{Saves.ImportWeb(File.ReadAllText(file));World=null;BackToCreator();UI.Toast(T("unity.importDone"));}catch(Exception e){Debug.LogException(e);Error=T("unity.saveError");UI.RefreshStatus();}
        }
        public bool PersistWorld()
        {
            if(World==null||Saves==null||Combat!=null)return true;
            return Commit(p=>{p.map=World.map;p.position=World.pos.Copy();p.direction=World.direction;p.visited=World.visited.ToList();});
        }
        void ReadCombatInput()
        {
            void Hold(string action,params KeyCode[] keys){bool pressed=keys.Any(Input.GetKey);if(pressed||UI.Held.Contains(action))Combat.Press(action);else Combat.Release(action);}
            Hold("left",KeyCode.A,KeyCode.LeftArrow);Hold("right",KeyCode.D,KeyCode.RightArrow);Hold("jump",KeyCode.Space);Hold("attack",KeyCode.J);Hold("guard",KeyCode.K);Hold("dash",KeyCode.LeftShift,KeyCode.RightShift);Hold("skill",KeyCode.L);
        }
        void RefreshActivation()
        {
            bool active=hasFocus&&!appPaused;if(active==focused)return;focused=active;
            if(!active){UI?.ReleasePointers();World?.Stop();if(Combat!=null&&Combat.outcome==null){Combat.Pause(true);UI.CombatOverlay();}else if(Combat!=null)FinalizeBattle();else PersistWorld();ambience?.Pause();}
            else if(Saves!=null&&World!=null)UpdateSound();
        }
        void OnApplicationFocus(bool value){hasFocus=value;RefreshActivation();}
        void OnApplicationPause(bool value){appPaused=value;RefreshActivation();}
        void OnApplicationQuit(){if(Combat!=null&&Combat.outcome==null){Combat.End("retreat");FinalizeBattle();}else PersistWorld();}
        void OnDestroy(){Saves?.Dispose();Art?.Dispose();}
        void OnGUI(){if(UI==null&&Error!=null)GUI.Label(new Rect(20,20,Screen.width-40,100),Error);}
    }
}
