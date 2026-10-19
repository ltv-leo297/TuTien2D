using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.UI;
using TrucKhe.Core;
using Stack=TrucKhe.Core.Stack;
using Point=TrucKhe.Core.Point;

namespace TrucKhe
{
    public sealed partial class GameUI
    {
        public static bool PreviewMobileInEditor;
        public bool Mobile=>Application.isMobilePlatform||(Application.isEditor&&PreviewMobileInEditor);
        float UiWidth=>Mobile?root.sizeDelta.x:1280;
        float UiHeight=>Mobile?root.sizeDelta.y:720;
        Vector2 lastLayout;
        Dictionary<string,Dictionary<string,string>> mobileStrings;
        string inventoryTab="bag";
        ScrollRect mobileBagScroll;
        float bagScrollPosition=1;
        Button mobileFilter;
        readonly List<(Image fill,Text text,Func<double> value,Func<double> max,float width)> mobileMeters=new List<(Image,Text,Func<double>,Func<double>,float)>();
        readonly Dictionary<string,(MobileRoundGraphic face,Text label)> mobileActions=new Dictionary<string,(MobileRoundGraphic,Text)>();
        string M(string key)=>mobileStrings[game.Locale][key];
        void InitializeMobile()
        {
            mobileStrings=JsonConvert.DeserializeObject<Dictionary<string,Dictionary<string,string>>>(Resources.Load<TextAsset>("Data/mobile-ui").text);
            lastLayout=root.sizeDelta;
        }
        public void ReconfigureLayout()
        {
            root.GetComponent<SafeAreaLayout>().Initialize(GetComponent<Canvas>(),Mobile);lastLayout=root.sizeDelta;
            if(screen)Rebuild();
        }
        void LateUpdate()
        {
            if(!Mobile||!root||!screen||game.Saves==null)return;
            if((lastLayout-root.sizeDelta).sqrMagnitude<.25f)return;
            // Do not destroy the focused field while the OS keyboard is editing it.
            if(TouchScreenKeyboard.visible&&GetComponentsInChildren<InputField>().Any(field=>field.isFocused))return;
            lastLayout=root.sizeDelta;Rebuild();
        }
        Button TouchButton(Transform parent,string label,float x,float y,float width,float height,Action action,bool primary=false)
        {
            var b=Button(parent,label,x,y,width,height,action,primary?Gold:Card);
            var text=b.GetComponentInChildren<Text>();text.fontSize=15;text.color=primary?Jade:Cream;
            b.navigation=new UnityEngine.UI.Navigation{mode=UnityEngine.UI.Navigation.Mode.None};return b;
        }
        void Icon(Transform parent,string action,float x,float y,float size,Color? color=null)
        {
            var icon=Node(action+" icon",parent,x,y,size,size).gameObject.AddComponent<MobileActionIcon>();icon.action=action;icon.color=color??Cream;icon.raycastTarget=false;
        }
        Button IconButton(Transform parent,string label,string icon,float x,float y,Action action)
        {
            var b=TouchButton(parent,"",x,y,72,64,action);b.name=label;Icon(b.transform,icon,24,4,24);Text(b.transform,label,3,32,66,28,13,Cream,TextAnchor.MiddleCenter);return b;
        }
        RectTransform TouchWindow(string title,float width=0,float height=0,bool close=true)
        {
            ReleasePointers();Kill(ref modal);game.World?.Stop();game.CloseEncounter();
            float w=width<=0?UiWidth-24:Mathf.Min(width,UiWidth-24),h=height<=0?UiHeight-24:Mathf.Min(height,UiHeight-24);
            var blocker=Image(root,-2000,-2000,UiWidth+4000,UiHeight+4000,new Color(0,.05f,.03f,.7f),raycast:true);modal=blocker.gameObject;
            var window=Image(blocker.transform,2000+(UiWidth-w)/2,2000+(UiHeight-h)/2,w,h,Jade,raycast:true).rectTransform;
            Image(window,0,0,w,2,Gold);Text(window,title,14,8,w-84,42,20,Gold);
            if(close)TouchButton(window,"×",w-60,4,52,48,ClosePanel);return window;
        }
        ScrollRect TouchScroll(Transform parent,string name,float x,float y,float w,float h,out RectTransform content)
        {
            var viewport=Image(parent,x,y,w,h,new Color(.025f,.10f,.08f,.9f),raycast:true).rectTransform;viewport.name=name;
            viewport.gameObject.AddComponent<RectMask2D>();var scroll=viewport.gameObject.AddComponent<ScrollRect>();scroll.horizontal=false;scroll.movementType=ScrollRect.MovementType.Clamped;scroll.scrollSensitivity=30;scroll.viewport=viewport;
            content=Node(name+" content",viewport,0,0,w-12,h);scroll.content=content;
            var track=Image(viewport,w-5,4,3,h-8,new Color(.14f,.26f,.20f)).rectTransform;
            var handle=Image(track,0,0,3,24,Gold).rectTransform;
            var body=content;
            scroll.onValueChanged.AddListener(_=>{float ratio=Mathf.Min(1,h/Mathf.Max(h,body.rect.height));handle.sizeDelta=new Vector2(3,(h-8)*ratio);handle.anchoredPosition=new Vector2(0,-(h-8)*(1-ratio)*(1-scroll.verticalNormalizedPosition));});
            return scroll;
        }
        void MobileSaveFailure()
        {
            NewScreen("failure");var w=TouchWindow(T("unity.saveError"),560,250,false);Text(w,T("unity.saveError"),20,60,w.rect.width-40,80,17);TouchButton(w,T("retry"),20,164,w.rect.width-40,52,game.OpenSave,true);
        }
        void MobileCreator(string hero,string name)
        {
            NewScreen("creator");selectedHero=hero??game.Saves?.Current.profile.hero??"A";
            Image(screen.transform,0,0,UiWidth,UiHeight,Jade);
            float half=(UiWidth-44)*.50f;
            Text(screen.transform,T("title"),16,10,half,30,18,Gold);Text(screen.transform,T("choose"),16,44,half,48,24);
            Text(screen.transform,T("name"),16,98,half,22,15,Muted);
            nameField=Input(screen.transform,name??game.Saves?.Current.profile.name??T("defaultName"),T("nameHint"),16,124,half,48);nameField.characterLimit=16;nameField.shouldHideMobileInput=false;
            TouchButton(screen.transform,T("start"),16,184,half,52,()=>game.StartGame(nameField.text,selectedHero),true);
            Text(screen.transform,M("tapMove"),16,250,half,48,16,Muted);
            TouchButton(screen.transform,"Tiếng Việt",16,UiHeight-64,(half-8)/2,48,()=>game.LocaleChange("vi"),game.Locale=="vi");
            TouchButton(screen.transform,"English",24+(half-8)/2,UiHeight-64,(half-8)/2,48,()=>game.LocaleChange("en"),game.Locale=="en");
            var area=Node("Mobile heroes",screen.transform,half+28,20,half,UiHeight-40);
            void Draw()
            {
                foreach(Transform child in area){child.gameObject.SetActive(false);Destroy(child.gameObject);}
                float cell=(half-8)/2;
                for(int i=0;i<4;i++){string id="ABCD"[i].ToString();var b=TouchButton(area,"",i%2*(cell+8),i/2*156,cell,148,()=>{selectedHero=id;Draw();},id==selectedHero);b.name="Hero "+id;Image(b.transform,(cell-64)/2,4,64,100,Color.white,game.Art.Hero(id));Text(b.transform,T("hero."+id),4,107,cell-8,36,14,id==selectedHero?Jade:Cream,TextAnchor.MiddleCenter);}
            }
            Draw();
        }
        void MobileExploration()
        {
            NewScreen("exploration");var p=Image(screen.transform,12,12,188,66,Jade,raycast:true).rectTransform;
            Image(p,6,3,42,58,Color.white,game.Art.Hero(game.World.hero));Text(p,game.PlayerName,56,6,126,25,16,Gold);Text(p,T("level"),56,31,126,22,13,Muted);Image(p,56,57,122,3,Green);
            TouchButton(screen.transform,"☰",UiWidth-60,12,48,48,Settings).name=T("settings");
            var mini=Image(screen.transform,UiWidth-182,12,114,96,Jade,raycast:true).rectTransform;mapTitle=Text(mini,T(game.World.map),5,2,104,30,12,Gold,TextAnchor.MiddleCenter);
            var r=Node("Minimap",mini,5,34,104,58.5f);minimap=r.gameObject.AddComponent<RawImage>();minimap.raycastTarget=true;
            r.gameObject.AddComponent<PointerControls>().click=pnt=>game.Direct(new Point(pnt.x*1920,pnt.y*1080));miniPlayer=Image(r,0,0,5,5,Cream).rectTransform;lastMap=null;
            IconButton(screen.transform,T("equipment.menu"),"bag",UiWidth-164,UiHeight-80,Inventory);
            IconButton(screen.transform,T("quests"),"quests",UiWidth-84,UiHeight-80,Quests);
            RefreshDialogue();Tick();
        }
        void MobileDialogue()
        {
            Kill(ref dialogue);if(mode!="exploration"||game.DialogueKey==null)return;
            float w=Mathf.Min(470,UiWidth-192);var box=Image(screen.transform,12,UiHeight-128,w,112,Jade,raycast:true).rectTransform;dialogue=box.gameObject;
            Text(box,T(game.Speaker),12,4,w-76,24,16,Gold);
            TouchButton(box,"×",w-56,0,48,48,()=>{game.DismissDialogue();Kill(ref dialogue);});
            TouchScroll(box,"Dialogue",8,36,w-16,68,out var content);var text=Text(content,T(game.DialogueKey),4,0,content.rect.width-8,150,15);content.sizeDelta=new Vector2(content.rect.width,Mathf.Max(68,text.preferredHeight));text.rectTransform.sizeDelta=new Vector2(content.rect.width-8,content.sizeDelta.y);
        }
        void MobileEncounter()
        {
            HideEncounter();if(game.Encounter==null)return;
            float w=Mathf.Min(400,UiWidth-32);var box=Image(screen.transform,(UiWidth-w)/2,UiHeight-180,w,160,Jade,raycast:true).rectTransform;encounter=box.gameObject;
            Text(box,T(game.Encounter),12,8,w-24,30,20,Gold,TextAnchor.MiddleCenter);remainingText=Text(box,"",12,44,w-24,28,16,Cream,TextAnchor.MiddleCenter);
            startBattle=TouchButton(box,T("combat.start"),12,92,w-132,52,game.BeginBattle,true);TouchButton(box,T("close"),w-112,92,100,52,game.CloseEncounter);Tick();
        }
        void MobileSettings()
        {
            panel="settings";var w=TouchWindow(T("settings"),620);float width=w.rect.width;
            TouchScroll(w,"Settings",12,60,width-24,w.rect.height-72,out var content);float full=content.rect.width;
            TouchButton(content,"Tiếng Việt",4,0,(full-16)/2,48,()=>game.LocaleChange("vi"),game.Locale=="vi");TouchButton(content,"English",12+(full-16)/2,0,(full-16)/2,48,()=>game.LocaleChange("en"),game.Locale=="en");
            TouchButton(content,T("motion")+": "+T(game.Reduced?"on":"off"),4,60,full-8,52,()=>game.ReducedChange(!game.Reduced));
            TouchButton(content,T("sound")+": "+T(game.Saves.Current.sound?"on":"off"),4,124,full-8,52,()=>game.SoundChange(!game.Saves.Current.sound));
            Text(content,T("audioHint"),8,184,full-16,52,14,Muted);TouchButton(content,T("back"),4,248,full-8,52,game.BackToCreator);content.sizeDelta=new Vector2(full,312);
        }
        void MobileQuests()
        {
            panel="quests";var w=TouchWindow(T("quests"),600);TouchScroll(w,"Quests",12,60,w.rect.width-24,w.rect.height-72,out var content);float width=content.rect.width;
            int count=new[]{"teacher","healer","smith"}.Count(game.World.visited.Contains);Text(content,T("questTitle"),8,0,width-16,32,19,Gold);Text(content,T(count==3?"questComplete":"questText"),8,40,width-16,70,16);
            int i=0;foreach(string id in new[]{"teacher","healer","smith"}){var b=TouchButton(content,(game.World.visited.Contains(id)?"✓ ":"○ ")+T(id),4,122+i*60,width-8,52,()=>game.NavigateNPC(id));b.interactable=game.World.map=="village";i++;}
            Text(content,T("questProgress","count",count),8,306,width-16,30,16,Gold);content.sizeDelta=new Vector2(width,346);
        }
        void MobileInventory()
        {
            if(mobileBagScroll)bagScrollPosition=mobileBagScroll.verticalNormalizedPosition;
            panel="inventory";var w=TouchWindow("",UiWidth,UiHeight);w.sizeDelta=new Vector2(UiWidth,UiHeight);w.anchoredPosition=new Vector2(2000,-2000);
            // Full safe-area canvas; header and action stay outside scroll regions.
            foreach(var b in w.GetComponentsInChildren<Button>())b.gameObject.SetActive(false);
            TouchButton(w,M("character"),12,6,138,48,()=>{inventoryTab="character";selectedUid=selectedSlot=null;MobileInventory();},inventoryTab=="character").name="Mobile character tab";
            TouchButton(w,M("bag"),158,6,124,48,()=>{inventoryTab="bag";selectedUid=selectedSlot=null;MobileInventory();},inventoryTab=="bag").name="Mobile bag tab";
            Text(w,T("equipment.capacity","count",game.Saves.Current.inventory.slots.Count(s=>s!=null)),UiWidth-206,8,138,44,14,Gold,TextAnchor.MiddleRight);
            TouchButton(w,"×",UiWidth-60,6,48,48,ClosePanel).name="Mobile inventory close";
            var layout=MobileUiLayout.Create(UiWidth,UiHeight);
            detail=Image(w,(float)layout.Detail.x,(float)layout.Detail.y,(float)layout.Detail.w,(float)layout.Detail.h,Card,raycast:true).rectTransform;detail.name="Mobile item detail";
            if(inventoryTab=="bag")
            {
                float grid=(float)layout.Bag.w;
                var input=Input(w,search,T("equipment.search"),12,64,grid-112,48);input.onValueChanged.AddListener(v=>{search=v;DrawMobileBag(true);});
                mobileFilter=TouchButton(w,T("equipment."+filter),grid-92,64,104,48,()=>{filter=filter=="all"?"gear":filter=="gear"?"materials":"all";mobileFilter.GetComponentInChildren<Text>().text=T("equipment."+filter);DrawMobileBag(true);});
                mobileBagScroll=TouchScroll(w,"Mobile bag viewport",12,120,grid,UiHeight-132,out bagContent);DrawMobileBag(false);mobileBagScroll.verticalNormalizedPosition=bagScrollPosition;
            }
            else
            {
                mobileBagScroll=null;DrawMobileCharacter(w,(float)layout.Bag.w);
            }
            DrawMobileDetail();
        }
        void DrawMobileBag(bool reset)
        {
            if(!bagContent)return;float position=reset?1:mobileBagScroll.verticalNormalizedPosition;
            Kill(ref bagGrid);bagGrid=Node("Mobile bag cells",bagContent,0,0,bagContent.rect.width,0).gameObject;
            var inv=game.Saves.Current.inventory;int columns=MobileUiLayout.Create(UiWidth,UiHeight).Columns;
            float size=(bagContent.rect.width-8-(columns-1)*8)/columns;int index=0;
            for(int source=0;source<inv.slots.Length;source++)
            {
                var stack=inv.slots[source];Item item=null;if(stack!=null)game.Content.catalog.TryGetValue(stack.itemId,out item);
                bool matches=filter=="all"||(filter=="gear"?item?.slot!=null:item!=null&&item.slot==null);
                if(search.Length>0)matches&=stack!=null&&(item?.name[game.Locale]??stack.itemId).IndexOf(search,StringComparison.CurrentCultureIgnoreCase)>=0;
                if(!matches)continue;int cell=index++;
                var b=TouchButton(bagGrid.transform,"",4+cell%columns*(size+8),4+cell/columns*(size+8),size,size,()=>{selectedUid=stack?.uid;selectedSlot=null;DrawMobileBag(false);DrawMobileDetail();},stack!=null&&stack.uid==selectedUid);
                b.name="Bag slot "+source;
                if(item!=null){Image(b.transform,8,5,size-16,size-23,Color.white,game.Art.Item(item.id));Text(b.transform,T("equipment.shortLevel","level",item.level),4,size-20,size-8,18,12,stack.uid==selectedUid?Jade:Gold);if(stack.quantity>1)Text(b.transform,stack.quantity.ToString(),4,size-20,size-8,18,12,stack.uid==selectedUid?Jade:Cream,TextAnchor.MiddleRight);}
                else Text(b.transform,stack==null?(source+1).ToString():"?",4,4,size-8,size-8,14,Muted,TextAnchor.MiddleCenter);
            }
            float bottom=8+Mathf.Ceil(index/(float)columns)*(size+8);
            if(index==0){Text(bagGrid.transform,T("equipment.noMatches"),8,8,bagContent.rect.width-16,60,16,Muted);bottom=76;}
            foreach(var e in inv.overflow){string id=e.Key;TouchButton(bagGrid.transform,T("equipment.claim")+" · "+(game.Content.catalog.TryGetValue(id,out var item)?item.name[game.Locale]:id)+" ×"+e.Value,4,bottom,bagContent.rect.width-8,52,()=>game.Equip("claim",id));bottom+=60;}
            bagContent.sizeDelta=new Vector2(bagContent.rect.width,bottom);((RectTransform)bagGrid.transform).sizeDelta=bagContent.sizeDelta;
            Canvas.ForceUpdateCanvases();mobileBagScroll.verticalNormalizedPosition=position;bagScrollPosition=position;
        }
        void DrawMobileCharacter(Transform parent,float width)
        {
            TouchScroll(parent,"Mobile character viewport",12,64,width,UiHeight-76,out var content);float full=content.rect.width;
            var inv=game.Saves.Current.inventory;Image(content,8,4,42,60,Color.white,game.Art.Hero(game.World.hero));Text(content,game.PlayerName,60,4,full-68,28,18,Gold);Text(content,T("level"),60,34,full-68,26,14,Muted);
            Text(content,T("equipment.slots"),8,76,full-16,28,16,Gold);
            float cell=(full-24)/2;
            for(int i=0;i<game.Content.slots.Count;i++)
            {
                string slot=game.Content.slots[i];inv.equipment.TryGetValue(slot,out var stack);
                var b=TouchButton(content,"",8+i%2*(cell+8),110+i/2*72,cell,64,()=>{selectedSlot=slot;selectedUid=stack?.uid;DrawMobileDetail();});b.name="Equipment "+slot;
                if(stack!=null&&game.Content.catalog.ContainsKey(stack.itemId))Image(b.transform,4,8,42,48,Color.white,game.Art.Item(stack.itemId));
                Text(b.transform,T("equipment.slot."+slot),50,4,cell-54,56,14);
            }
            float y=478;Text(content,T("cultivationStatus"),8,y,full-16,28,18,Gold);y+=34;
            Text(content,T("cultivationPath")+": "+T("cultivationUnchosen")+" · "+T("cultivationLevel")+" 0/15",8,y,full-16,52,15);y+=60;
            Text(content,T("powerAttributes"),8,y,full-16,28,18,Gold);y+=34;var stats=inv.EffectiveStats(game.Content);
            foreach(string key in Stats.Keys){Text(content,T("stat."+key),8,y,full-100,30,15);Text(content,stats.Get(key).ToString("0"),full-88,y,80,30,16,Green,TextAnchor.MiddleRight);y+=34;}
            Text(content,T("cultivationFoundation"),8,y+8,full-16,28,18,Gold);y+=44;string[] keys={"comprehension","rootBone","mentalState"};int[] values={78,62,74};for(int i=0;i<3;i++){Text(content,T("foundation."+keys[i])+"  "+values[i]+" · "+T(i==1?"grade.middle":"grade.high"),8,y,full-16,30,15);y+=34;}
            Text(content,T("equipment.visualNote"),8,y,full-16,62,14,Muted);content.sizeDelta=new Vector2(full,y+70);
        }
        void DrawMobileDetail()
        {
            if(!detail)return;foreach(Transform child in detail){child.gameObject.SetActive(false);Destroy(child.gameObject);}
            var inv=game.Saves.Current.inventory;Stack stack=selectedSlot!=null&&inv.equipment.TryGetValue(selectedSlot,out var equipped)?equipped:inv.slots.FirstOrDefault(s=>s!=null&&s.uid==selectedUid);
            float width=detail.rect.width,height=detail.rect.height;
            if(stack==null){Text(detail,T("equipment.select"),14,20,width-28,110,16,Muted);return;}
            if(!game.Content.catalog.TryGetValue(stack.itemId,out var item)){Text(detail,T("equipment.unknown"),14,20,width-28,110,16,Muted);return;}
            TouchScroll(detail,"Mobile item description",8,8,width-16,height-80,out var content);float full=content.rect.width;
            Image(content,4,4,64,64,Color.white,game.Art.Item(item.id));Text(content,item.name[game.Locale],76,4,full-80,48,17,Gold);Text(content,T("equipment.level","level",item.level),76,54,full-80,38,13,Muted);
            var desc=Text(content,item.description[game.Locale],4,100,full-8,140,15);float dh=Mathf.Max(46,desc.preferredHeight);desc.rectTransform.sizeDelta=new Vector2(full-8,dh);float y=108+dh;
            var current=inv.EffectiveStats(game.Content);var replacement=item.slot!=null&&inv.equipment.TryGetValue(item.slot,out var prior)&&game.Content.catalog.TryGetValue(prior.itemId,out var old)?old:null;
            foreach(string key in Stats.Keys)
            {
                double add=item.bonuses.TryGetValue(key,out var n)?n:0,remove=replacement!=null&&replacement.bonuses.TryGetValue(key,out var o)?o:0;
                double delta=selectedSlot==null?add-remove:-add;if(delta==0)continue;
                Text(content,T("stat."+key),4,y,full-8,22,14,Muted);Text(content,current.Get(key).ToString("0")+" → "+(current.Get(key)+delta).ToString("0"),4,y+22,full-8,26,18,delta>0?Green:Cream);y+=56;
            }
            content.sizeDelta=new Vector2(full,y+8);
            if(item.slot!=null){string op=selectedSlot==null?"equip":"unequip",id=selectedSlot??stack.uid;TouchButton(detail,T("equipment."+op),12,height-64,width-24,52,()=>game.Equip(op,id),true).name="Mobile equipment action";}
        }
        public void InventoryChanged(string operation,string id)
        {
            if(Mobile)
            {
                if(operation=="equip")selectedSlot=game.Saves.Current.inventory.equipment.FirstOrDefault(e=>e.Value?.uid==id).Key;
                else if(operation=="unequip"){selectedUid=game.Saves.Current.inventory.slots.FirstOrDefault(s=>s?.uid==selectedUid)?.uid;selectedSlot=null;}
            }
            Inventory();Toast(T("equipment.saved"));
        }
        void MobileMeter(Transform parent,string label,float x,float y,float width,Color color,Func<double> value,Func<double> max)
        {
            Text(parent,label,x,y,26,18,11,Muted);var bar=Image(parent,x+29,y+5,width-88,6,new Color(.02f,.07f,.05f));var fill=Image(bar.transform,0,0,width-88,6,color);
            var text=Text(parent,"",x+width-57,y,57,18,11,Cream,TextAnchor.MiddleRight);mobileMeters.Add((fill,text,value,max,width-88));
        }
        void MobileBattle()
        {
            NewScreen("combat");var s=game.Combat;
            var left=Image(screen.transform,12,10,206,90,Jade,raycast:true).rectTransform;Image(left,4,5,36,49,Color.white,game.Art.Hero(game.World.hero));Text(left,game.PlayerName,48,3,150,24,15,Gold);
            MobileMeter(left,M("hp"),8,30,190,new Color(.85f,.35f,.31f),()=>s.hp,()=>s.maxHp);MobileMeter(left,M("stamina"),8,49,190,Gold,()=>s.stamina,()=>s.playerStats.stamina);MobileMeter(left,M("mana"),8,68,190,new Color(.3f,.72f,.82f),()=>s.mana,()=>s.playerStats.spiritualPower);
            var enemy=Image(screen.transform,UiWidth-254,10,184,58,Jade,raycast:true).rectTransform;Text(enemy,T(s.monster),8,3,168,26,15,Gold);MobileMeter(enemy,M("hp"),8,32,168,new Color(.85f,.35f,.31f),()=>s.enemyHp,()=>s.enemyMax);
            TouchButton(screen.transform,"Ⅱ",UiWidth-60,10,48,48,()=>{ReleasePointers();s.Pause(true);CombatOverlay();}).name=T("combat.pause");
            foreach(var entry in MobileUiLayout.Create(UiWidth,UiHeight).Actions)
            {
                string action=entry.Key;var r=entry.Value;var rect=Node("Mobile action "+action,screen.transform,(float)r.x,(float)r.y,(float)r.w,(float)r.h);
                var face=rect.gameObject.AddComponent<MobileRoundGraphic>();face.color=action=="attack"?Gold:Card;face.border=action=="attack"?Cream:Muted;
                float size=(float)r.w;Icon(rect,action,(size-24)/2,action=="left"||action=="right"?(size-24)/2:7,24,action=="attack"?Jade:Cream);
                var label=Text(rect,action=="left"||action=="right"?"":action=="attack"?M("attack"):T("combat."+action),3,size-27,size-6,24,12,action=="attack"?Jade:Cream,TextAnchor.MiddleCenter);
                rect.gameObject.AddComponent<PointerControls>().hold=down=>{if(down){if(game.Combat==null||game.Combat.paused||game.Combat.outcome!=null||MobileActionBlocked(action))return;Held.Add(action);game.Combat.Press(action);}else{Held.Remove(action);game.Combat?.Release(action);}};
                mobileActions[action]=(face,label);
            }
            Tick();
        }
        bool MobileActionBlocked(string action)
        {
            var combat=game.Combat;return combat==null||(action=="skill"&&(combat.skillCooldown>0||combat.mana<Combat.SkillManaCost))||(action=="dash"&&(combat.dashCooldown>0||combat.stamina<Combat.DashStaminaCost));
        }
        void TickMobile()
        {
            foreach(var meter in mobileMeters){double max=Math.Max(1,meter.max()),value=meter.value();meter.fill.rectTransform.sizeDelta=new Vector2(meter.width*Mathf.Clamp01((float)(value/max)),6);meter.text.text=Math.Ceiling(value)+"/"+max;}
            if(game.Combat==null)return;var s=game.Combat;
            foreach(var pair in mobileActions)
            {
                string action=pair.Key;double cooldown=action=="skill"?s.skillCooldown:action=="dash"?s.dashCooldown:0;
                pair.Value.face.color=Held.Contains(action)?new Color(.4f,.60f,.38f):MobileActionBlocked(action)?new Color(.07f,.13f,.12f):action=="attack"?Gold:Card;
                if(action=="skill"||action=="dash")pair.Value.label.text=cooldown>0?T("combat.seconds","seconds",Math.Ceiling(cooldown)):T("combat."+action);
            }
        }
        void MobileCombatOverlay()
        {
            Kill(ref modal);ReleasePointers();var combat=game.Combat;if(combat==null||(!combat.paused&&combat.outcome==null))return;
            var w=TouchWindow(T(combat.outcome!=null?"combat."+combat.outcome:"combat.pause"),440,300,false);float full=w.rect.width;
            if(combat.outcome!=null){if(game.Error!=null)Text(w,game.Error,16,65,full-32,100,16,new Color(1,.65f,.5f));TouchButton(w,T("combat.return"),16,212,full-32,56,game.ReturnToMap,true);}
            else{TouchButton(w,T("combat.resume"),16,84,full-32,56,()=>{ReleasePointers();combat.Pause(false);Kill(ref modal);},true);TouchButton(w,T("combat.retreat"),16,160,full-32,56,ConfirmRetreat);}
        }
        void MobileConfirmRetreat()
        {
            var w=TouchWindow(T("combat.retreat"),460,280,false);float full=w.rect.width;Text(w,T("combat.retreatConfirm"),16,72,full-32,72,19,Cream,TextAnchor.MiddleCenter);
            TouchButton(w,T("combat.cancel"),16,190,(full-40)/2,56,CombatOverlay,true);TouchButton(w,T("combat.retreat"),24+(full-40)/2,190,(full-40)/2,56,game.Retreat);
        }
    }
}
