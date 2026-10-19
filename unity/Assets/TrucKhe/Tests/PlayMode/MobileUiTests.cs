using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
using UnityEngine.UI;

namespace TrucKhe.Tests
{
    public class MobileUiTests
    {
        string directory;
        GameRoot game;
        Button Button(string name)=>game.UI.GetComponentsInChildren<Button>().Single(b=>b.name==name);
        void SelectSword(){int i=Array.FindIndex(game.Saves.Current.inventory.slots,s=>s?.itemId=="bamboo-sword");Button("Bag slot "+i).onClick.Invoke();}
        [UnitySetUp] public IEnumerator Setup()
        {
            GameUI.PreviewMobileInEditor=true;directory=Path.Combine(Application.temporaryCachePath,"TrucKhe-mobile-"+Guid.NewGuid().ToString("N"));GameRoot.SaveDirectoryOverride=directory;
            yield return SceneManager.LoadSceneAsync("Main");yield return null;game=UnityEngine.Object.FindObjectOfType<GameRoot>();Assert.IsNull(game.Error);Assert.IsTrue(game.UI.Mobile);
            game.StartGame("Vân Sinh","A");yield return null;
        }
        [UnityTearDown] public IEnumerator Cleanup()
        {
            foreach(var root in SceneManager.GetActiveScene().GetRootGameObjects())UnityEngine.Object.Destroy(root);
            yield return null;GameRoot.SaveDirectoryOverride=null;GameUI.PreviewMobileInEditor=false;if(Directory.Exists(directory))Directory.Delete(directory,true);
        }
        [UnityTest] public IEnumerator BagTabsEquipUnequipAndFilterPreserveInventory()
        {
            var position=game.World.pos.Copy();game.UI.Inventory();yield return null;
            Assert.AreEqual(100,game.UI.GetComponentsInChildren<Button>().Count(b=>b.name.StartsWith("Bag slot ")));
            var sword=game.Saves.Current.inventory.slots.Single(s=>s?.itemId=="bamboo-sword");SelectSword();Button("Mobile equipment action").onClick.Invoke();yield return null;
            Assert.AreEqual(sword.uid,game.Saves.Current.inventory.equipment["weapon"].uid);Assert.AreEqual(27,game.Saves.Current.inventory.EffectiveStats(game.Content).attack);
            Button("Mobile character tab").onClick.Invoke();yield return null;Assert.AreEqual(10,game.UI.GetComponentsInChildren<Button>().Count(b=>b.name.StartsWith("Equipment ")));
            Button("Equipment weapon").onClick.Invoke();Button("Mobile equipment action").onClick.Invoke();yield return null;Assert.IsFalse(game.Saves.Current.inventory.equipment.ContainsKey("weapon"));Assert.AreEqual(1,game.Saves.Current.inventory.slots.Count(s=>s?.uid==sword.uid));
            Button("Mobile bag tab").onClick.Invoke();var search=game.UI.GetComponentInChildren<InputField>();search.text="no-matching-item-123";yield return null;Assert.AreEqual(0,game.UI.GetComponentsInChildren<Button>().Count(b=>b.name.StartsWith("Bag slot ")));search.text="";yield return null;Assert.AreEqual(100,game.UI.GetComponentsInChildren<Button>().Count(b=>b.name.StartsWith("Bag slot ")));
            Button("Mobile inventory close").onClick.Invoke();Assert.IsFalse(game.UI.ModalOpen);Assert.Less(TrucKhe.Core.Point.Distance(position,game.World.pos),.001);LogAssert.NoUnexpectedReceived();
        }
        [UnityTest] public IEnumerator LastBagRowScrollsIntoViewWhileCloseAndEquipRemainFixed()
        {
            game.UI.Inventory();yield return null;SelectSword();Canvas.ForceUpdateCanvases();
            var scroll=game.UI.GetComponentsInChildren<ScrollRect>().Single(s=>s.name=="Mobile bag viewport");
            var action=(RectTransform)Button("Mobile equipment action").transform;Vector3 actionPosition=action.position;
            scroll.verticalNormalizedPosition=0;yield return null;Canvas.ForceUpdateCanvases();
            var last=(RectTransform)Button("Bag slot 99").transform;
            var point=RectTransformUtility.WorldToScreenPoint(null,last.TransformPoint(last.rect.center));
            Assert.IsTrue(RectTransformUtility.RectangleContainsScreenPoint(scroll.viewport,point));Assert.AreEqual(actionPosition,action.position);
            Assert.IsTrue(Button("Mobile inventory close").gameObject.activeInHierarchy);LogAssert.NoUnexpectedReceived();
        }
        [UnityTest] public IEnumerator CombatHasSevenTouchActionsAndPauseReleasesEveryFinger()
        {
            game.World.Restore("forest",game.Content.scenes["forest"].spawn,0);game.World.events.Add(new TrucKhe.Core.WorldEvent{type="talk",id=game.Content.monsterIds[0]});yield return null;game.BeginBattle();yield return null;
            var controls=game.UI.GetComponentsInChildren<PointerControls>().Where(p=>p.name.StartsWith("Mobile action ")).ToArray();Assert.AreEqual(7,controls.Length);
            foreach(string action in new[]{"right","guard"}){var p=controls.Single(c=>c.name=="Mobile action "+action);p.OnPointerDown(new PointerEventData(EventSystem.current){pointerId=action=="right"?1:2,button=PointerEventData.InputButton.Left});}
            Assert.IsTrue(game.UI.Held.Contains("right"));Assert.IsTrue(game.UI.Held.Contains("guard"));Button(game.T("combat.pause")).onClick.Invoke();yield return null;
            Assert.IsTrue(game.Combat.paused);Assert.IsEmpty(game.UI.Held);Assert.IsEmpty(game.Combat.input);
            Button(game.T("combat.resume")).onClick.Invoke();yield return null;Assert.IsEmpty(game.UI.Held);LogAssert.NoUnexpectedReceived();
        }
        [UnityTest] public IEnumerator ResizePreservesBagTabAndSelectionAndBlocksMapTouches()
        {
            game.UI.Inventory();yield return null;SelectSword();
            var layout=game.UI.GetComponentInChildren<SafeAreaLayout>();layout.Apply(new Rect(Screen.width*.12f,Screen.height*.04f,Screen.width*.76f,Screen.height*.92f),Screen.width,Screen.height);
            game.UI.SendMessage("LateUpdate");Canvas.ForceUpdateCanvases();
            Assert.IsNotNull(Button("Mobile equipment action"));Assert.AreEqual(100,game.UI.GetComponentsInChildren<Button>().Count(b=>b.name.StartsWith("Bag slot ")));
            Assert.IsTrue(game.UI.BlocksScreenPoint(new Vector2(Screen.width*.5f,Screen.height*.5f)));
            layout.Apply(Screen.safeArea,Screen.width,Screen.height);yield return null;LogAssert.NoUnexpectedReceived();
        }
        [UnityTest] public IEnumerator SaveFailureLeavesEquipActionTouchableForRetry()
        {
            game.UI.Inventory();yield return null;SelectSword();string blocked=Path.Combine(directory,"progress-v1.json.tmp");Directory.CreateDirectory(blocked);
            LogAssert.Expect(LogType.Exception,new Regex("(UnauthorizedAccessException|IOException)"));Button("Mobile equipment action").onClick.Invoke();yield return null;
            Assert.AreEqual("wood-sword",game.Saves.Current.inventory.equipment["weapon"].itemId);Assert.IsNotNull(game.Error);
            Canvas.ForceUpdateCanvases();var button=Button("Mobile equipment action");var rect=(RectTransform)button.transform;var point=RectTransformUtility.WorldToScreenPoint(null,rect.TransformPoint(rect.rect.center));
            var hits=new List<RaycastResult>();EventSystem.current.RaycastAll(new PointerEventData(EventSystem.current){position=point},hits);Assert.AreEqual(button.gameObject,hits[0].gameObject,"Error banner must not cover retry action");
            Directory.Delete(blocked);button.onClick.Invoke();yield return null;Assert.AreEqual("bamboo-sword",game.Saves.Current.inventory.equipment["weapon"].itemId);Assert.IsNull(game.Error);LogAssert.NoUnexpectedReceived();
        }
        [UnityTest] public IEnumerator LocaleSwitchKeepsTabAndShowsTranslatedItemActions()
        {
            game.UI.Inventory();yield return null;SelectSword();game.LocaleChange("en");yield return null;
            Assert.AreEqual(game.T("equipment.equip"),Button("Mobile equipment action").GetComponentInChildren<Text>().text);
            Assert.AreEqual("Bag",Button("Mobile bag tab").GetComponentInChildren<Text>().text);Assert.AreEqual(100,game.UI.GetComponentsInChildren<Button>().Count(b=>b.name.StartsWith("Bag slot ")));
            LogAssert.NoUnexpectedReceived();
        }
    }
}
