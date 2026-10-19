using System;
using System.Collections;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using TrucKhe.Core;

namespace TrucKhe.Tests
{
    public class GameFlowTests
    {
        string directory;
        GameRoot game;
        [UnitySetUp] public IEnumerator SetUp()
        {
            directory=Path.Combine(Application.temporaryCachePath,"TrucKhe-tests-"+Guid.NewGuid().ToString("N"));GameRoot.SaveDirectoryOverride=directory;
            yield return SceneManager.LoadSceneAsync("Main");yield return null;
            game=UnityEngine.Object.FindFirstObjectByType<GameRoot>();Assert.NotNull(game);Assert.IsNull(game.Error);Assert.NotNull(game.UI);
        }
        [UnityTearDown] public IEnumerator TearDown()
        {
            foreach(var root in SceneManager.GetActiveScene().GetRootGameObjects())UnityEngine.Object.Destroy(root);
            yield return null;GameRoot.SaveDirectoryOverride=null;if(Directory.Exists(directory))Directory.Delete(directory,true);
        }
        [UnityTest] public IEnumerator CreatorInventoryLocalesAndReturn()
        {
            game.StartGame("Vân Ly","C");yield return null;Assert.AreEqual("village",game.World.map);Assert.IsNull(game.Error);
            game.UI.Inventory();yield return null;var item=game.Saves.Current.inventory.slots.First(s=>s?.itemId=="bamboo-sword");game.Equip("equip",item.uid);yield return null;Assert.AreEqual("bamboo-sword",game.Saves.Current.inventory.equipment["weapon"].itemId);
            game.LocaleChange("en");yield return null;Assert.AreEqual("en",game.Locale);Assert.IsTrue(UnityEngine.Object.FindObjectsByType<Text>(FindObjectsSortMode.None).Any(t=>t.text==game.T("equipment.title")));game.UI.ClosePanel();Assert.IsFalse(game.UI.ModalOpen);
            game.BackToCreator();yield return null;game.StartGame("Vân Ly","C");yield return null;Assert.AreEqual("bamboo-sword",game.Saves.Current.inventory.equipment["weapon"].itemId);LogAssert.NoUnexpectedReceived();
        }
        [UnityTest] public IEnumerator EncounterPauseResultPreservesWorld()
        {
            game.StartGame("Thanh Phong","A");yield return null;
            game.World.Restore("forest",game.Content.scenes["forest"].spawn,2);game.World.events.Add(new WorldEvent{type="talk",id=game.Content.monsterIds[0]});yield return null;
            Assert.NotNull(game.Encounter);var point=game.World.pos.Copy();string id=game.Encounter;game.BeginBattle();yield return null;Assert.NotNull(game.Combat);Assert.AreEqual(9,game.Saves.Current.ledger.Available(id,SaveStore.Now));
            game.Combat.Press("right");game.Combat.Pause(true);double t=game.Combat.time;yield return null;Assert.AreEqual(t,game.Combat.time);Assert.IsEmpty(game.Combat.input);
            game.Retreat();yield return null;game.ReturnToMap();yield return null;Assert.IsNull(game.Combat);Assert.AreEqual("forest",game.World.map);Assert.Less(Point.Distance(point,game.World.pos),.001);Assert.IsFalse(game.Saves.Current.ledger.monsters[id].Any(e=>!e.readyAt.HasValue));LogAssert.NoUnexpectedReceived();
        }
        [UnityTest] public IEnumerator AllMapsAndHeroesRenderWithoutMissingResources()
        {
            foreach(string hero in new[]{"A","B","C","D"})
            {
                game.StartGame("Vô Danh",hero);
                foreach(var map in game.Content.scenes.Values){game.World.Restore(map.id,map.spawn,0);yield return null;Assert.IsNull(game.Error);Assert.Greater(UnityEngine.Object.FindObjectsByType<SpriteRenderer>(FindObjectsSortMode.None).Count(s=>s.sprite!=null),5);}
                game.BackToCreator();yield return null;
            }
            LogAssert.NoUnexpectedReceived();
        }
        [UnityTest] public IEnumerator VegetationGeometryRetainsPixelBoundsAndRootPivot()
        {
            foreach(string kind in new[]{"tree","bamboo","blossom"})
            {
                var sprite=game.Art.Vegetation(kind);var vertices=sprite.vertices;
                Assert.AreEqual(42,vertices.Length);
                Assert.That(vertices.Max(v=>v.x)-vertices.Min(v=>v.x),Is.EqualTo(sprite.rect.width/sprite.pixelsPerUnit).Within(.001f));
                Assert.That(vertices.Min(v=>v.y),Is.EqualTo(0).Within(.001f));
                Assert.That(vertices.Max(v=>v.y),Is.EqualTo(sprite.rect.height/sprite.pixelsPerUnit).Within(.001f));
                Assert.IsTrue(sprite.uv.All(uv=>uv.x>=0&&uv.x<=1&&uv.y>=0&&uv.y<=1));
            }
            yield return null;LogAssert.NoUnexpectedReceived();
        }
        [UnityTest] public IEnumerator CreatorLocalePreservesDraftHeroAndName()
        {
            game.UI.Creator("D","Mây Trắng");game.LocaleChange("en");yield return null;
            var input=game.UI.GetComponentInChildren<InputField>();Assert.AreEqual("Mây Trắng",input.text);
            var start=game.UI.GetComponentsInChildren<Button>().Single(b=>b.name==game.T("start"));start.onClick.Invoke();yield return null;
            Assert.AreEqual("D",game.World.hero);Assert.AreEqual("Mây Trắng",game.PlayerName);LogAssert.NoUnexpectedReceived();
        }
        [UnityTest] public IEnumerator FailedWorldSaveKeepsWorldUntilRetry()
        {
            game.StartGame("Lâm Phong","B");yield return null;var world=game.World;
            string blocked=Path.Combine(directory,"progress-v1.json.tmp");Directory.CreateDirectory(blocked);
            LogAssert.Expect(LogType.Exception,new Regex("(UnauthorizedAccessException|IOException)"));
            game.BackToCreator();Assert.AreSame(world,game.World);Assert.IsNotNull(game.Error);
            Directory.Delete(blocked);game.BackToCreator();yield return null;Assert.IsNull(game.World);Assert.IsNull(game.Error);LogAssert.NoUnexpectedReceived();
        }
        [UnityTest] public IEnumerator WebImportUsesSaveDirectoryAndDoesNotOverwriteImportedProgress()
        {
            game.StartGame("Cũ","A");yield return null;
            File.WriteAllText(Path.Combine(directory,"web-save.json"),"{\"truc-khe.progress\":{\"bag\":{\"herb\":7},\"visited\":[\"teacher\"]},\"truc-khe.profile\":{\"name\":\"Mới\",\"hero\":\"D\"}}");
            game.ImportWebSave();yield return null;Assert.IsNull(game.World);Assert.AreEqual("Mới",game.PlayerName);Assert.IsTrue(game.Saves.Current.visited.Contains("teacher"));
            game.StartGame(game.PlayerName,"D");yield return null;Assert.IsTrue(game.World.visited.Contains("teacher"));Assert.AreEqual(7,game.Saves.Current.inventory.slots.Where(s=>s?.itemId=="herb").Sum(s=>s.quantity));LogAssert.NoUnexpectedReceived();
        }
        [UnityTest] public IEnumerator FailedResultSaveKeepsBattleAndRetrySpendsOnlyOneCharge()
        {
            game.StartGame("Thanh Phong","A");yield return null;
            string id=game.Content.monsterIds[0];game.World.Restore("forest",game.Content.scenes["forest"].spawn,2);game.World.events.Add(new WorldEvent{type="talk",id=id});yield return null;game.BeginBattle();yield return null;
            string blocked=Path.Combine(directory,"progress-v1.json.tmp");Directory.CreateDirectory(blocked);
            LogAssert.Expect(LogType.Exception,new Regex("(UnauthorizedAccessException|IOException)"));game.Retreat();
            Assert.NotNull(game.Combat);Assert.IsNull(game.Saves.Current.ledger.monsters[id].Single().readyAt);
            Directory.Delete(blocked);game.ReturnToMap();yield return null;
            Assert.IsNull(game.Combat);Assert.AreEqual(9,game.Saves.Current.ledger.Available(id,SaveStore.Now));Assert.IsNotNull(game.Saves.Current.ledger.monsters[id].Single().readyAt);LogAssert.NoUnexpectedReceived();
        }
        [UnityTest] public IEnumerator FocusLossPausesBattleAndClearsHeldInput()
        {
            game.StartGame("Thanh Phong","A");yield return null;
            game.World.Restore("forest",game.Content.scenes["forest"].spawn,0);game.World.events.Add(new WorldEvent{type="talk",id=game.Content.monsterIds[0]});yield return null;game.BeginBattle();yield return null;
            game.UI.Held.Add("guard");game.Combat.Press("guard");game.SendMessage("OnApplicationFocus",false);double time=game.Combat.time;
            yield return null;Assert.IsTrue(game.Combat.paused);Assert.IsEmpty(game.Combat.input);Assert.IsEmpty(game.UI.Held);Assert.AreEqual(time,game.Combat.time);
            game.SendMessage("OnApplicationFocus",true);yield return null;Assert.IsTrue(game.Combat.paused);Assert.AreEqual(time,game.Combat.time);LogAssert.NoUnexpectedReceived();
        }
        [UnityTest] public IEnumerator MultipleTouchesReleaseOnlyAfterLastFingerAndClearOnCancel()
        {
            var pointer=new GameObject("Pointer test").AddComponent<PointerControls>();bool held=false;int presses=0;
            pointer.hold=down=>{held=down;if(down)presses++;};
            PointerEventData Finger(int id)=>new PointerEventData(EventSystem.current){pointerId=id,button=PointerEventData.InputButton.Left};
            pointer.OnPointerDown(Finger(1));pointer.OnPointerDown(Finger(2));Assert.AreEqual(1,presses);
            pointer.OnPointerUp(Finger(1));Assert.IsTrue(held);pointer.OnPointerUp(Finger(2));Assert.IsFalse(held);
            pointer.OnPointerDown(Finger(3));pointer.OnCancel(new BaseEventData(EventSystem.current));Assert.IsFalse(held);
            pointer.OnPointerDown(Finger(4));pointer.SendMessage("OnApplicationPause",true);Assert.IsFalse(held);
            pointer.OnPointerDown(Finger(5));pointer.OnPointerUp(Finger(5));Assert.IsFalse(held,"Old fingers must not keep the button pressed after resume");
            UnityEngine.Object.Destroy(pointer.gameObject);yield return null;LogAssert.NoUnexpectedReceived();
        }
        [UnityTest] public IEnumerator TouchRaycastBlocksHudAndModalButAllowsWorld()
        {
            game.StartGame("Vân Ly","C");yield return null;Canvas.ForceUpdateCanvases();
            var settings=game.UI.GetComponentsInChildren<Button>().Single(b=>b.name==game.T("settings"));
            var rect=(RectTransform)settings.transform;var buttonPoint=RectTransformUtility.WorldToScreenPoint(null,rect.TransformPoint(rect.rect.center));
            Assert.IsTrue(game.UI.BlocksScreenPoint(buttonPoint));
            var layout=game.UI.transform.Find("Layout");var center=RectTransformUtility.WorldToScreenPoint(null,layout.position);
            Assert.IsFalse(game.UI.BlocksScreenPoint(center));game.UI.Inventory();Canvas.ForceUpdateCanvases();Assert.IsTrue(game.UI.BlocksScreenPoint(center));
            yield return null;LogAssert.NoUnexpectedReceived();
        }
        [UnityTest] public IEnumerator SafeAreaTransformKeepsEntireUiInsideInsetDisplay()
        {
            yield return null;Canvas.ForceUpdateCanvases();
            var layout=game.UI.GetComponentInChildren<SafeAreaLayout>();var rect=(RectTransform)layout.transform;
            int width=Screen.width,height=Screen.height;var safe=new Rect(width*.08f,height*.06f,width*.84f,height*.9f);
            layout.Apply(safe,width,height);Canvas.ForceUpdateCanvases();var corners=new Vector3[4];rect.GetWorldCorners(corners);
            foreach(var corner in corners){var screen=RectTransformUtility.WorldToScreenPoint(null,corner);Assert.That(screen.x,Is.InRange(safe.xMin-1,safe.xMax+1));Assert.That(screen.y,Is.InRange(safe.yMin-1,safe.yMax+1));}
            layout.Apply(Screen.safeArea,width,height);LogAssert.NoUnexpectedReceived();
        }
        [UnityTest] public IEnumerator BackgroundSavesWorldAndWaitsForBothFocusAndResume()
        {
            game.StartGame("Vân Ly","C");yield return null;game.World.visited.Add("teacher");
            game.SendMessage("OnApplicationPause",true);game.SendMessage("OnApplicationFocus",false);double time=game.World.time;
            Assert.IsTrue(game.Saves.Current.visited.Contains("teacher"));
            game.SendMessage("OnApplicationPause",false);yield return null;Assert.AreEqual(time,game.World.time);
            game.SendMessage("OnApplicationFocus",true);yield return null;Assert.Greater(game.World.time,time);LogAssert.NoUnexpectedReceived();
        }
    }
}
