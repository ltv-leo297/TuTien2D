using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using TrucKhe.Core;
using Stack=TrucKhe.Core.Stack;
using Point=TrucKhe.Core.Point;

namespace TrucKhe
{
    public sealed partial class GameUI : MonoBehaviour
    {
        GameRoot game;
        Font font;
        RectTransform root;
        GameObject screen,modal,encounter,dialogue,toastObject,errorObject;
        Text toastText,errorText,healthText,enemyText,staminaText,manaText,mapTitle,remainingText;
        Image healthFill,enemyFill,staminaFill,manaFill;
        RawImage minimap;
        RectTransform miniPlayer;
        readonly Dictionary<string,RectTransform> miniActors=new Dictionary<string,RectTransform>();
        readonly List<RaycastResult> pointerHits=new List<RaycastResult>();
        Button startBattle;
        double toastUntil;
        string mode="creator",panel,selectedHero="A",selectedUid,selectedSlot,search="",filter="all",lastMap;
        RectTransform bagContent,detail;
        GameObject bagGrid;
        InputField nameField;
        public readonly HashSet<string> Held=new HashSet<string>();
        public bool ModalOpen=>modal!=null;
        static readonly Color Jade=new Color(.055f,.19f,.16f,.97f),Card=new Color(.11f,.27f,.22f,.97f),Gold=new Color(.91f,.74f,.39f),Cream=new Color(.99f,.96f,.82f),Muted=new Color(.66f,.8f,.65f),Green=new Color(.43f,.85f,.56f);
        string T(string key,params object[] args)=>game.T(key,args);
        public void Initialize(GameRoot owner)
        {
            game=owner;font=Resources.Load<Font>("Fonts/NotoSans-Regular");
            var canvas=gameObject.AddComponent<Canvas>();canvas.renderMode=RenderMode.ScreenSpaceOverlay;canvas.sortingOrder=100;
            var scaler=gameObject.AddComponent<CanvasScaler>();scaler.uiScaleMode=CanvasScaler.ScaleMode.ScaleWithScreenSize;scaler.referenceResolution=new Vector2(1280,720);scaler.screenMatchMode=CanvasScaler.ScreenMatchMode.Expand;
            gameObject.AddComponent<GraphicRaycaster>();
            if(!EventSystem.current){var e=new GameObject("Event System");e.AddComponent<EventSystem>();e.AddComponent<StandaloneInputModule>();}
            root=Node("Layout",transform,0,0,1280,720);root.anchorMin=root.anchorMax=new Vector2(.5f,.5f);root.pivot=new Vector2(.5f,.5f);root.anchoredPosition=Vector2.zero;
            root.gameObject.AddComponent<SafeAreaLayout>().Initialize(canvas,Mobile);
            InitializeMobile();
        }
        public bool BlocksScreenPoint(Vector2 position)
        {
            // Raycast now; the cached pointer state can be one frame behind a new touch.
            if(!EventSystem.current)return false;
            pointerHits.Clear();EventSystem.current.RaycastAll(new PointerEventData(EventSystem.current){position=position},pointerHits);
            return pointerHits.Count>0;
        }
        public void ReleasePointers()
        {
            foreach(var pointer in GetComponentsInChildren<PointerControls>(true))pointer.ReleaseAll();
            Held.Clear();
        }
        public static RectTransform Node(string name,Transform parent,float x,float y,float w,float h)
        {
            var go=new GameObject(name,typeof(RectTransform));var r=(RectTransform)go.transform;r.SetParent(parent,false);r.anchorMin=r.anchorMax=new Vector2(0,1);r.pivot=new Vector2(0,1);r.anchoredPosition=new Vector2(x,-y);r.sizeDelta=new Vector2(w,h);return r;
        }
        Image Image(Transform parent,float x,float y,float w,float h,Color color,Sprite sprite=null,bool raycast=false)
        {
            var r=Node("Image",parent,x,y,w,h);var image=r.gameObject.AddComponent<Image>();image.color=color;image.sprite=sprite;image.raycastTarget=raycast;if(sprite)image.preserveAspect=true;return image;
        }
        Text Text(Transform parent,string value,float x,float y,float w,float h,int size=17,Color? color=null,TextAnchor align=TextAnchor.MiddleLeft)
        {
            var r=Node("Text",parent,x,y,w,h);var t=r.gameObject.AddComponent<Text>();t.font=font;t.fontSize=size;t.color=color??Cream;t.text=value;t.alignment=align;t.supportRichText=false;t.horizontalOverflow=HorizontalWrapMode.Wrap;t.verticalOverflow=VerticalWrapMode.Truncate;t.raycastTarget=false;return t;
        }
        Button Button(Transform parent,string label,float x,float y,float w,float h,Action action,Color? color=null)
        {
            var image=Image(parent,x,y,w,h,color??Card,raycast:true);image.name=label;var button=image.gameObject.AddComponent<Button>();button.targetGraphic=image;
            var colors=button.colors;colors.highlightedColor=new Color(1.2f,1.15f,.95f);colors.pressedColor=new Color(.75f,.85f,.7f);colors.disabledColor=new Color(.5f,.5f,.5f,.7f);button.colors=colors;
            Text(image.transform,label,7,2,w-14,h-4,16,Cream,TextAnchor.MiddleCenter);button.onClick.AddListener(()=>action());return button;
        }
        InputField Input(Transform parent,string value,string placeholder,float x,float y,float w,float h)
        {
            var image=Image(parent,x,y,w,h,new Color(.04f,.13f,.1f),raycast:true);var field=image.gameObject.AddComponent<InputField>();var text=Text(image.transform,value,12,4,w-24,h-8,18);field.textComponent=text;var hint=Text(image.transform,placeholder,12,4,w-24,h-8,17,Muted);field.placeholder=hint;field.text=value;field.targetGraphic=image;return field;
        }
        void Kill(ref GameObject go){if(go){go.SetActive(false);Destroy(go);}go=null;}
        void NewScreen(string value)
        {
            Held.Clear();Kill(ref modal);Kill(ref encounter);Kill(ref dialogue);Kill(ref screen);mode=value;panel=null;
            screen=Node(value,root,0,0,UiWidth,UiHeight).gameObject;
            mobileMeters.Clear();mobileActions.Clear();
            Kill(ref errorObject);var errorPanel=Image(root,Mobile?12:150,Mobile?108:674,Mobile?UiWidth-24:980,Mobile?60:40,Jade,raycast:Mobile).rectTransform;errorObject=errorPanel.gameObject;errorText=Text(errorPanel,"",12,2,Mobile?UiWidth-48:956,Mobile?56:36,15,new Color(1,.65f,.5f),TextAnchor.MiddleCenter);
            healthText=enemyText=staminaText=manaText=null;remainingText=null;minimap=null;miniPlayer=null;nameField=null;miniActors.Clear();
            if(toastObject)toastObject.transform.SetAsLastSibling();RefreshStatus();
        }
        RectTransform Window(string title,float w=1160,float h=630)
        {
            Kill(ref modal);game.World?.Stop();game.CloseEncounter();
            var blocker=Image(root,-2000,-2000,5280,4720,new Color(0,.06f,.04f,.65f),raycast:true);modal=blocker.gameObject;
            var window=Image(blocker.transform,2000+(1280-w)/2,2000+(720-h)/2,w,h,Jade,raycast:true).rectTransform;
            Image(window,0,0,w,3,Gold);Text(window,title,22,14,w-100,36,24,Gold);Button(window,"×",w-60,12,42,38,ClosePanel);return window;
        }
        public void SaveFailure()
        {
            if(Mobile){MobileSaveFailure();return;}
            NewScreen("failure");var bg=Image(screen.transform,300,220,680,260,Jade);Text(bg.transform,T("unity.saveError"),24,24,632,100,22);Button(bg.transform,T("retry"),240,160,200,50,game.OpenSave);RefreshStatus();
        }
        public void Creator(string hero=null,string name=null)
        {
            if(Mobile){MobileCreator(hero,name);return;}
            NewScreen("creator");selectedHero=hero??game.Saves?.Current.profile.hero??"A";
            Image(screen.transform,0,0,1280,720,new Color(.06f,.16f,.13f));var card=Image(screen.transform,70,75,1140,570,Jade).rectTransform;Image(card,0,0,1140,3,Gold);
            Text(card,T("title"),35,35,600,36,22,Gold);Text(card,T("choose"),35,90,620,75,32);Text(card,T("intro"),35,165,590,75,19,Muted);
            Text(card,T("name"),35,270,450,30);nameField=Input(card,name??game.Saves?.Current.profile.name??T("defaultName"),T("nameHint"),35,310,460,50);nameField.characterLimit=16;
            Button(card,T("start"),35,390,460,55,()=>game.StartGame(nameField.text,selectedHero),new Color(.3f,.48f,.28f));Text(card,T("controls"),35,460,550,50,16,Muted);
            var heroArea=Node("Hero selection",card,660,36,445,490);
            void DrawHeroes()
            {
                foreach(Transform child in heroArea){child.gameObject.SetActive(false);Destroy(child.gameObject);}
                Image(heroArea,130,0,150,215,Color.white,game.Art.Hero(selectedHero));Text(heroArea,T("hero."+selectedHero),0,220,445,35,23,Gold,TextAnchor.MiddleCenter);Text(heroArea,T("title."+selectedHero),0,255,445,30,17,Muted,TextAnchor.MiddleCenter);
                for(int i=0;i<4;i++){string id="ABCD"[i].ToString();var b=Button(heroArea,"",i*112,310,103,150,()=>{selectedHero=id;DrawHeroes();},id==selectedHero?new Color(.31f,.42f,.25f):Card);Image(b.transform,18,8,65,100,Color.white,game.Art.Hero(id));Text(b.transform,T("hero."+id),5,108,93,34,14,Cream,TextAnchor.MiddleCenter);}
            }
            DrawHeroes();LanguageButtons(card,860,525);
        }
        void LanguageButtons(Transform parent,float x,float y)
        {
            Button(parent,"Tiếng Việt",x,y,112,32,()=>game.LocaleChange("vi"),game.Locale=="vi"?new Color(.3f,.45f,.28f):Card);Button(parent,"English",x+120,y,112,32,()=>game.LocaleChange("en"),game.Locale=="en"?new Color(.3f,.45f,.28f):Card);
        }
        public void Exploration()
        {
            if(Mobile){MobileExploration();return;}
            NewScreen("exploration");var p=Image(screen.transform,20,18,275,96,Jade).rectTransform;Image(p,10,8,62,78,Color.white,game.Art.Hero(game.World.hero));Text(p,game.PlayerName,82,10,180,32,20,Gold);Text(p,T("level"),82,43,180,24,15,Muted);Image(p,82,76,172,7,Green);
            Button(screen.transform,T("settings"),1085,18,175,42,Settings);
            var mini=Image(screen.transform,1038,76,222,194,Jade).rectTransform;mapTitle=Text(mini,T(game.World.map),12,5,198,30,17,Gold);var r=Node("Minimap",mini,10,40,202,113.625f);minimap=r.gameObject.AddComponent<RawImage>();minimap.raycastTarget=true;
            r.gameObject.AddComponent<PointerControls>().click=pnt=>game.Direct(new Point(pnt.x*1920,pnt.y*1080));miniPlayer=Image(r,0,0,5,5,Cream).rectTransform;
            Text(mini,T("time"),10,158,202,24,13,Muted);lastMap=null;
            Button(screen.transform,T("equipment.menu"),1030,620,230,50,Inventory);Button(screen.transform,T("quests"),1030,560,230,50,Quests);Text(screen.transform,T("controls"),20,653,850,32,16,Muted);
            RefreshDialogue();Tick();
        }
        public void RefreshDialogue()
        {
            if(Mobile){MobileDialogue();return;}
            Kill(ref dialogue);if(mode!="exploration"||game.DialogueKey==null)return;
            var bg=Image(screen.transform,235,540,760,120,Jade).rectTransform;dialogue=bg.gameObject;Text(bg,T(game.Speaker),20,10,720,28,19,Gold);Text(bg,T(game.DialogueKey),20,42,720,65,17);
        }
        public void ShowEncounter()
        {
            if(Mobile){MobileEncounter();return;}
            HideEncounter();if(game.Encounter==null)return;
            var bg=Image(screen.transform,405,480,470,170,Jade,raycast:true).rectTransform;encounter=bg.gameObject;Image(bg,0,0,470,3,Gold);Text(bg,T(game.Encounter),20,16,430,35,23,Gold,TextAnchor.MiddleCenter);remainingText=Text(bg,"",20,58,430,30,18,Cream,TextAnchor.MiddleCenter);
            startBattle=Button(bg,T("combat.start"),20,108,285,44,game.BeginBattle);Button(bg,T("close"),315,108,135,44,game.CloseEncounter);Tick();
        }
        public void HideEncounter(){Kill(ref encounter);remainingText=null;startBattle=null;}
        public void ClosePanel(){ReleasePointers();Kill(ref modal);panel=null;if(game.Combat!=null)CombatOverlay();}
        public void Settings()
        {
            if(Mobile){MobileSettings();return;}
            panel="settings";var w=Window(T("settings"),670,510);LanguageButtons(w,30,85);Text(w,T("language"),30,50,550,30,18,Gold);
            Button(w,T("motion")+": "+T(game.Reduced?"on":"off"),30,150,610,48,()=>game.ReducedChange(!game.Reduced));Button(w,T("sound")+": "+T(game.Saves.Current.sound?"on":"off"),30,212,610,48,()=>game.SoundChange(!game.Saves.Current.sound));Text(w,T("audioHint"),30,268,610,30,15,Muted);
            if(!Application.isMobilePlatform)Button(w,T("unity.import"),30,315,280,45,ConfirmImport);
            Button(w,T("back"),Application.isMobilePlatform?30:330,315,Application.isMobilePlatform?610:310,45,game.BackToCreator);
            if(Application.platform!=RuntimePlatform.IPhonePlayer)Button(w,T("unity.quit"),30,380,610,44,()=>Application.Quit());
        }
        void ConfirmImport()
        {
            var w=Window(T("unity.import"),710,350);Text(w,T("unity.importHint"),25,75,660,60,19);Text(w,game.Saves.DirectoryPath,25,145,660,65,14,Muted);Button(w,T("unity.import"),25,245,320,48,game.ImportWebSave);Button(w,T("close"),360,245,320,48,Settings);
        }
        public void Quests()
        {
            if(Mobile){MobileQuests();return;}
            panel="quests";var w=Window(T("quests"),700,470);Text(w,T("questTitle"),28,65,644,35,24,Gold);int count=new[]{"teacher","healer","smith"}.Count(game.World.visited.Contains);Text(w,T(count==3?"questComplete":"questText"),28,110,644,65,18);
            int i=0;foreach(string id in new[]{"teacher","healer","smith"}){var b=Button(w,(game.World.visited.Contains(id)?"✓ ":"○ ")+T(id),28,190+i*59,644,48,()=>game.NavigateNPC(id));b.interactable=game.World.map=="village";i++;}Text(w,T("questProgress","count",count),28,380,644,30,18,Gold);
        }
        public void Inventory()
        {
            if(Mobile){MobileInventory();return;}
            panel="inventory";var w=Window(T("equipment.title"),1230,656);var inventory=game.Saves.Current.inventory;var stats=inventory.EffectiveStats(game.Content);
            var left=Image(w,18,64,260,470,Card).rectTransform;Image(left,14,12,56,76,Color.white,game.Art.Hero(game.World.hero));Text(left,game.PlayerName,80,18,170,30,20,Gold);Text(left,T("level"),80,48,170,28,14,Muted);Text(left,T("cultivationStatus"),14,100,230,27,19,Gold);Text(left,T("cultivationPath")+": "+T("cultivationUnchosen"),14,130,230,26,14);Text(left,T("cultivationLevel")+" 0/15  ·  "+T("characterLevel")+" 1",14,155,232,30,14,Muted);
            Text(left,T("powerAttributes"),14,194,230,27,19,Gold);
            for(int i=0;i<Stats.Keys.Length;i++){string key=Stats.Keys[i];double value=stats.Get(key),bonus=value-game.Content.playerStats.Get(key);Text(left,T("stat."+key),14,228+i*21,162,21,14);Text(left,value.ToString("0")+(bonus!=0?" +"+bonus.ToString("0"):""),176,228+i*21,76,21,14,bonus>0?Green:Cream,TextAnchor.MiddleRight);}
            var foundations=Image(w,18,544,260,91,Card).rectTransform;Text(foundations,T("cultivationFoundation"),10,0,240,28,16,Gold);
            string[] foundation={"comprehension","rootBone","mentalState"};int[] values={78,62,74};for(int i=0;i<3;i++)Text(foundations,T("foundation."+foundation[i])+"  "+values[i]+" · "+T(i==1?"grade.middle":"grade.high"),10,28+i*19,240,20,13);
            Text(w,T("equipment.slots"),296,66,285,30,18,Gold);
            for(int i=0;i<game.Content.slots.Count;i++)
            {
                string slot=game.Content.slots[i];inventory.equipment.TryGetValue(slot,out var stack);float x=296+(i%2)*127,y=110+(i/2)*80;
                var b=Button(w,"",x,y,117,72,()=>{selectedSlot=slot;selectedUid=stack?.uid;DrawDetail();});Text(b.transform,T("equipment.slot."+slot),5,1,107,22,13,Muted,TextAnchor.MiddleCenter);if(stack!=null&&game.Content.catalog.ContainsKey(stack.itemId))Image(b.transform,37,24,44,44,Color.white,game.Art.Item(stack.itemId));else Text(b.transform,"—",10,26,97,34,18,Muted,TextAnchor.MiddleCenter);
            }
            Text(w,T("equipment.visualNote"),296,525,255,65,14,Muted);
            Text(w,T("equipment.bag")+" · "+T("equipment.capacity","count",inventory.slots.Count(s=>s!=null)),568,64,640,30,19,Gold);
            var searchField=Input(w,search,T("equipment.search"),568,101,370,38);searchField.onValueChanged.AddListener(v=>{search=v;DrawBag();});
            string[] filters={"all","gear","materials"};for(int i=0;i<3;i++){string f=filters[i];Button(w,T("equipment."+f),946+i*87,101,82,38,()=>{filter=f;DrawBag();},f==filter?new Color(.3f,.45f,.28f):Card);}
            var viewport=Image(w,568,151,640,333,new Color(.035f,.13f,.11f),raycast:true).rectTransform;viewport.gameObject.AddComponent<RectMask2D>();var scroll=viewport.gameObject.AddComponent<ScrollRect>();scroll.horizontal=false;scroll.movementType=ScrollRect.MovementType.Clamped;scroll.scrollSensitivity=30;scroll.viewport=viewport;
            bagContent=Node("Inventory content",viewport,0,0,630,640);scroll.content=bagContent;
            detail=Image(w,568,495,640,140,Card,raycast:true).rectTransform;DrawBag();DrawDetail();
        }
        void DrawBag()
        {
            Kill(ref bagGrid);bagGrid=Node("Slots",bagContent,0,0,630,640).gameObject;var inv=game.Saves.Current.inventory;
            int index=0;
            for(int source=0;source<100;source++)
            {
                var stack=inv.slots[source];Item item=null;if(stack!=null)game.Content.catalog.TryGetValue(stack.itemId,out item);
                bool matches=filter=="all"||(filter=="gear"?item?.slot!=null:item!=null&&item.slot==null);
                if(search.Length>0)matches&=stack!=null&&(item?.name[game.Locale]??stack.itemId).IndexOf(search,StringComparison.CurrentCultureIgnoreCase)>=0;
                if(!matches)continue;int cell=index++;float x=cell%10*63+3,y=cell/10*63+3;
                var b=Button(bagGrid.transform,"",x,y,58,58,()=>{selectedUid=stack?.uid;selectedSlot=null;DrawDetail();},stack?.uid==selectedUid?new Color(.34f,.4f,.23f):Card);
                if(item!=null){Image(b.transform,7,3,44,44,Color.white,game.Art.Item(item.id));Text(b.transform,T("equipment.shortLevel","level",item.level),3,39,30,18,11,Gold);if(stack.quantity>1)Text(b.transform,stack.quantity.ToString(),25,39,30,18,12,Cream,TextAnchor.MiddleRight);}
                else if(stack!=null)Text(b.transform,"?",3,3,52,52,24,Gold,TextAnchor.MiddleCenter);
                else Text(b.transform,(source+1).ToString(),3,3,52,52,10,new Color(.3f,.42f,.34f),TextAnchor.MiddleCenter);
            }
            if(index==0)Text(bagGrid.transform,T("equipment.noMatches"),15,20,590,50,17,Muted);
            int rows=(int)Math.Ceiling(index/10.0);float bottom=Math.Max(63,rows*63+6);
            foreach(var e in inv.overflow){string id=e.Key;Button(bagGrid.transform,T("equipment.claim")+" · "+(game.Content.catalog.TryGetValue(id,out var item)?item.name[game.Locale]:id)+" ×"+e.Value,5,bottom,620,40,()=>game.Equip("claim",id));bottom+=46;}
            bagContent.sizeDelta=new Vector2(630,bottom);
        }
        void DrawDetail()
        {
            if(!detail)return;foreach(Transform child in detail){child.gameObject.SetActive(false);Destroy(child.gameObject);}var inv=game.Saves.Current.inventory;
            Stack stack=selectedSlot!=null&&inv.equipment.TryGetValue(selectedSlot,out var equipped)?equipped:inv.slots.FirstOrDefault(s=>s!=null&&s.uid==selectedUid);
            if(stack==null){Text(detail,T("equipment.select"),20,20,600,60,17,Muted);return;}
            if(!game.Content.catalog.TryGetValue(stack.itemId,out var item)){Text(detail,T("equipment.unknown"),20,20,600,70,17,Muted);return;}
            Image(detail,12,15,65,65,Color.white,game.Art.Item(item.id));Text(detail,item.name[game.Locale]+" · "+T("equipment.level","level",item.level),90,8,530,28,19,Gold);Text(detail,item.description[game.Locale],90,38,530,37,14);
            string bonuses=string.Join(" · ",item.bonuses.Select(b=>T("stat."+b.Key)+" +"+b.Value));
            if(item.slot!=null&&selectedSlot==null&&inv.equipment.TryGetValue(item.slot,out var prior)&&game.Content.catalog.TryGetValue(prior.itemId,out var old))
                bonuses=string.Join(" · ",Stats.Keys.Select(k=>(key:k,delta:(item.bonuses.TryGetValue(k,out var v)?v:0)-(old.bonuses.TryGetValue(k,out var o)?o:0))).Where(x=>x.delta!=0).Select(x=>T("stat."+x.key)+" "+(x.delta>0?"+":"")+x.delta));
            Text(detail,bonuses,12,83,405,46,14,Green);
            if(item.slot!=null){string op=selectedSlot==null?"equip":"unequip",id=selectedSlot??stack.uid;Button(detail,T("equipment."+op),435,89,190,38,()=>game.Equip(op,id),new Color(.3f,.45f,.27f));}
        }
        Image Meter(Transform parent,string title,float x,float y,float width,Color color,out Text text)
        {
            Text(parent,title,x,y,width,26,16,Gold);var bg=Image(parent,x,y+29,width,14,new Color(.025f,.09f,.07f));var fill=Image(bg.transform,0,0,width,14,color);text=Text(parent,"",x,y+45,width,24,14);return fill;
        }
        public void Battle()
        {
            if(Mobile){MobileBattle();return;}
            NewScreen("combat");var left=Image(screen.transform,25,20,340,198,Jade).rectTransform;healthFill=Meter(left,game.PlayerName,15,5,310,new Color(.44f,.75f,.38f),out healthText);
            staminaFill=Meter(left,T("stat.stamina"),15,74,145,new Color(.9f,.72f,.35f),out staminaText);manaFill=Meter(left,T("stat.spiritualPower"),175,74,150,new Color(.35f,.72f,.79f),out manaText);
            var right=Image(screen.transform,885,20,370,112,Jade).rectTransform;enemyFill=Meter(right,T(game.Combat.monster),15,6,340,new Color(.78f,.4f,.3f),out enemyText);
            Button(screen.transform,T("combat.pause"),555,20,170,42,()=>{game.Combat.Pause(true);CombatOverlay();});
            var controls=Node("Combat controls",screen.transform,0,575,1280,110);
            bool touch=Application.isMobilePlatform;float y=touch?10:42,h=touch?100:60;
            HoldButton(controls,"left",25,y,touch?120:85,h);HoldButton(controls,"right",touch?155:120,y,touch?120:85,h);HoldButton(controls,"jump",touch?300:240,y,touch?140:120,h);HoldButton(controls,"dash",685,y,120,h);HoldButton(controls,"guard",815,y,130,h);HoldButton(controls,"attack",955,y,140,h);HoldButton(controls,"skill",1105,y,150,h);
            if(!touch){Text(controls,"A / D / ← / →          Space",25,10,440,28,14,Muted);Text(controls,"Shift                   K                      J                      L",685,10,570,28,14,Muted);}Tick();
        }
        void HoldButton(Transform parent,string action,float x,float y,float w,float h)
        {
            var b=Button(parent,T("combat."+action),x,y,w,h,()=>{});b.gameObject.AddComponent<PointerControls>().hold=down=>{if(down){Held.Add(action);game.Combat?.Press(action);}else{Held.Remove(action);game.Combat?.Release(action);}};
        }
        public void CombatOverlay()
        {
            if(Mobile){MobileCombatOverlay();return;}
            Kill(ref modal);Held.Clear();var combat=game.Combat;if(combat==null)return;if(!combat.paused&&combat.outcome==null)return;
            var w=Window(T(combat.outcome!=null?"combat."+combat.outcome:"combat.pause"),540,330);
            // Close is a resume action during pause; results can only return through the save gate.
            foreach(var b in w.GetComponentsInChildren<Button>())b.gameObject.SetActive(false);
            if(combat.outcome!=null){Button(w,T("combat.return"),35,185,470,55,game.ReturnToMap);if(game.Error!=null)Text(w,game.Error,30,75,480,85,17,new Color(1,.65f,.5f));}
            else{Button(w,T("combat.resume"),35,100,470,55,()=>{combat.Pause(false);Kill(ref modal);});Button(w,T("combat.retreat"),35,180,470,55,ConfirmRetreat);}
        }
        void ConfirmRetreat()
        {
            if(Mobile){MobileConfirmRetreat();return;}
            var w=Window(T("combat.retreat"),590,300);foreach(var b in w.GetComponentsInChildren<Button>())b.gameObject.SetActive(false);Text(w,T("combat.retreatConfirm"),30,78,530,65,22,Cream,TextAnchor.MiddleCenter);Button(w,T("combat.cancel"),30,180,255,50,CombatOverlay);Button(w,T("combat.retreat"),305,180,255,50,game.Retreat);
        }
        public void Tick()
        {
            if(Mobile)TickMobile();
            if(game.Combat!=null&&healthText)
            {
                var s=game.Combat;void Fill(Image fill,Text text,double value,double max,float width){fill.rectTransform.sizeDelta=new Vector2(width*(float)(value/max),14);text.text=Math.Ceiling(value)+" / "+max;}
                Fill(healthFill,healthText,s.hp,s.maxHp,310);Fill(staminaFill,staminaText,s.stamina,s.playerStats.stamina,145);Fill(manaFill,manaText,s.mana,s.playerStats.spiritualPower,150);Fill(enemyFill,enemyText,s.enemyHp,s.enemyMax,340);
            }
            if(minimap&&game.World!=null)
            {
                var sim=game.World;if(lastMap!=sim.map){lastMap=sim.map;minimap.texture=game.Art.Texture("Baked/minimap-"+sim.map);mapTitle.text=T(sim.map);foreach(var marker in miniActors.Values)Destroy(marker.gameObject);miniActors.Clear();foreach(var a in sim.actors)miniActors[a.id]=Image(minimap.transform,0,0,3,3,a.role=="monster"?new Color(.9f,.55f,.3f):a.role=="npc"?Gold:Muted).rectTransform;miniPlayer.SetAsLastSibling();}
                var size=minimap.rectTransform.sizeDelta;
                foreach(var a in sim.actors)if(miniActors.TryGetValue(a.id,out var marker))marker.anchoredPosition=new Vector2((float)a.x/1920*size.x-1.5f,-(float)a.y/1080*size.y+1.5f);
                miniPlayer.anchoredPosition=new Vector2((float)sim.pos.x/1920*size.x-2.5f,-(float)sim.pos.y/1080*size.y+2.5f);
            }
            if(remainingText&&game.Encounter!=null){int n=game.Saves.Current.ledger.Available(game.Encounter,SaveStore.Now);remainingText.text=T("combat.remaining","count",n);startBattle.interactable=n>0;var t=startBattle.GetComponentInChildren<Text>();t.text=T(n>0?"combat.start":"combat.empty");}
            if(toastObject&&Time.unscaledTime>toastUntil)Kill(ref toastObject);
            RefreshStatus();
        }
        public void RefreshStatus(){if(errorText){errorText.text=game.Error??"";errorObject.SetActive(!string.IsNullOrEmpty(game.Error)&&!(Mobile&&(mode=="failure"||game.Combat?.outcome!=null)));if(errorObject.activeSelf)errorObject.transform.SetAsLastSibling();}}
        public void Toast(string value)
        {
            Kill(ref toastObject);var bg=Image(root,Mobile?12:240,Mobile?8:665,Mobile?UiWidth-24:800,Mobile?52:42,Jade).rectTransform;toastObject=bg.gameObject;toastText=Text(bg,value,12,2,Mobile?UiWidth-48:776,Mobile?48:38,16,Cream,TextAnchor.MiddleCenter);toastUntil=Time.unscaledTime+(Mobile?2.5:6.5);
        }
        public void Rebuild()
        {
            string oldPanel=panel;ReleasePointers();if(mode=="failure"){SaveFailure();return;}if(mode=="creator"){string typed=nameField?nameField.text:null;Creator(selectedHero,typed);}else if(mode=="combat"){Battle();CombatOverlay();}else{Exploration();if(game.Encounter!=null)ShowEncounter();}if(oldPanel=="settings")Settings();else if(oldPanel=="inventory")Inventory();else if(oldPanel=="quests")Quests();
        }
    }
}
