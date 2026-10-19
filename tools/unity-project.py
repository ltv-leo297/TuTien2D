"""Generate stable Unity GUIDs or validate the portable project without Unity.

Usage: python3 tools/unity-project.py --sync-meta
       python3 tools/unity-project.py --check
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import struct

ROOT = Path(__file__).resolve().parent.parent
UNITY = ROOT / "unity"
ASSETS = UNITY / "Assets"


def guid(path):
    return hashlib.sha256(("truckhe-unity-v1/" + path.as_posix()).encode()).hexdigest()[:32]


def sync():
    for path in sorted(ASSETS.rglob("*")):
        if path.suffix == ".meta":
            continue
        meta = path.with_name(path.name + ".meta")
        if meta.exists():
            continue
        text = "fileFormatVersion: 2\nguid: " + guid(path.relative_to(UNITY)) + "\n"
        if path.is_dir():
            text += "folderAsset: yes\nDefaultImporter:\n  externalObjects: {}\n"
        elif path.suffix == ".cs":
            text += "MonoImporter:\n  externalObjects: {}\n  serializedVersion: 2\n  defaultReferences: []\n  executionOrder: 0\n  icon: {instanceID: 0}\n"
        elif path.suffix == ".asmdef":
            text += "AssemblyDefinitionImporter:\n  externalObjects: {}\n"
        meta.write_text(text)


def check():
    resources = ASSETS / "TrucKhe/Resources"
    content = json.loads((resources / "Data/content.json").read_text())
    provenance = json.loads((resources / "Data/provenance.json").read_text())
    assert (UNITY / "Tools/export-web-save.js").read_bytes() == (ROOT / "tools/export-web-save.js").read_bytes(), "Missing/stale portable save exporter"
    for filename, expected in provenance["sources"].items():
        actual = hashlib.sha256((ROOT / filename).read_bytes()).hexdigest()
        assert actual == expected, f"Stale export: {filename}"
        prefix = "game/public/assets/production/"
        if filename.startswith(prefix):
            target = resources / "Art/Production" / filename[len(prefix):]
            assert hashlib.sha256(target.read_bytes()).hexdigest() == expected, f"Changed runtime copy: {target}"
    assets = [p for p in ASSETS.rglob("*") if p.suffix != ".meta"]
    guids = {}
    for path in assets:
        meta = path.with_name(path.name + ".meta")
        assert meta.exists(), f"Missing meta: {path}"
        match = re.search(r"^guid: ([0-9a-f]{32})$", meta.read_text(), re.M)
        assert match and match[1] not in guids, f"Invalid/duplicate GUID: {path}"
        guids[match[1]] = path
    for path in ASSETS.rglob("*.unity"):
        for reference in re.findall(r"guid: ([0-9a-f]{32})", path.read_text()):
            assert reference in guids, f"Missing scene reference: {reference}"
    sizes = {}
    for path in resources.rglob("*.png"):
        data = path.read_bytes()
        assert data[:8] == b"\x89PNG\r\n\x1a\n", str(path)
        width, height = struct.unpack(">II", data[16:24])
        assert width <= 8192 and height <= 8192, f"Import resize would invalidate frame coordinates: {path}"
        sizes[path.relative_to(resources / "Art").as_posix()] = (width, height)

    def rects(key, filename, values):
        width, height = sizes[filename]
        for rect in values:
            x, y, w, h = rect
            assert x >= 0 and y >= 0 and w > 0 and h > 0 and x + w <= width and y + h <= height, f"{key}: {rect} outside {filename}"

    for key, metadata in content["spriteFrames"].items():
        rects(key, "Production/" + key + ".png", metadata["frames"])
    for name in ("environment", "scenery"):
        rects(name, "Production/" + name + ".png", content["atlas"][name])
    rects("idle", "Production/forest/monsters-idle-v4.png", content["idleFrames"]["rects"])
    rects("effects", "Production/forest/skill-effects-v4.png", content["effectFrames"]["rects"])
    rects("combat", "Production/combat-actors.png", [r for row in content["combatFrames"]["rows"] for r in row])
    rects("forest objects", "Production/forest/objects.png", content["forestFrames"]["objects"]["rects"])
    rects("forest combat", "Production/forest/combat.png", content["forestFrames"]["combat"]["rects"])
    for kind, metadata in content["vegetation"].items():
        rects(kind, "Production/forest/" + kind + "-v3.png", [metadata["rect"]])
    for item in content["items"]:
        _, name, version = item["iconAssetId"].split(".")
        assert "Production/items/" + name + "-" + version + ".png" in sizes
    for scene in content["scenes"]:
        assert sizes["Baked/ground-" + scene + ".png"] == (1920, 1080)
        assert sizes["Baked/minimap-" + scene + ".png"] == (240, 135)
    names = {json.loads(p.read_text())["name"] for p in ASSETS.rglob("*.asmdef")}
    for p in ASSETS.rglob("*.asmdef"):
        for ref in json.loads(p.read_text()).get("references", []):
            assert ref in names or ref in {"UnityEngine.UI"}, f"Unresolved assembly name: {ref}"
    dependencies = json.loads((UNITY / "Packages/manifest.json").read_text())["dependencies"]
    version_text = (UNITY / "ProjectSettings/ProjectVersion.txt").read_text()
    editor = re.search(r"^m_EditorVersion: (6000\.3\.\d+f\d+)$", version_text, re.M)
    assert editor, "Project must target a Unity 6.3 LTS release"
    assert re.search(r"^m_EditorVersionWithRevision: " + re.escape(editor[1]) + r" \([0-9a-f]{12}\)$", version_text, re.M), "Missing Editor revision"
    editor_guard = (ASSETS / "TrucKhe/Editor/Unity6Project.cs").read_text()
    assert 'EditorVersion="' + editor[1] + '"' in editor_guard, "Editor guard version differs from project"
    assert dependencies.get("com.unity.ugui") == "2.0.0", "Use the Unity 6 uGUI core package"
    assert dependencies.get("com.unity.test-framework") == "1.6.0", "Use the Unity 6.3 Test Framework core package"
    assert dependencies.get("com.unity.modules.inputlegacy") == "1.0.0", "UnityEngine.Input needs the legacy input module"
    assert dependencies.get("com.unity.nuget.newtonsoft-json") == "3.2.1", "Keep the JSON AOT package"
    assert not any(name.startswith("com.unity.render-pipelines.") for name in dependencies), "This renderer requires Built-in, not SRP"
    settings = (UNITY / "ProjectSettings/ProjectSettings.asset").read_text()
    assert re.search(r"^  activeInputHandler: [02]$", settings, re.M), "Enable legacy Input Manager for touch and uGUI"
    literal_keys = set()
    for path in (ASSETS / "TrucKhe/Runtime").glob("*.cs"):
        literal_keys.update(re.findall(r'\bT\("([^"\n]+)"\s*[,)]', path.read_text()))
    for locale, strings in content["locales"].items():
        assert literal_keys <= strings.keys(), f"Missing {locale} UI strings: {literal_keys - strings.keys()}"
    mobile = json.loads((resources / "Data/mobile-ui.json").read_text())
    mobile_keys = set()
    for path in (ASSETS / "TrucKhe/Runtime").glob("*.cs"):
        mobile_keys.update(re.findall(r'\bM\("([^"\n]+)"\s*[,)]', path.read_text()))
    assert set(mobile) == {"vi", "en"} and set(mobile["vi"]) == set(mobile["en"]), "Mobile locale keys differ"
    for locale, strings in mobile.items():
        assert mobile_keys <= strings.keys() and all(isinstance(v,str) and v for v in strings.values()), f"Invalid {locale} mobile strings"
    assert (resources / "Fonts/NotoSans-Regular.ttf").is_file()
    assert (resources / "Art/Production/nam-linh-ambience.wav").is_file()
    print(f"PASS: {len(provenance['sources'])} source hashes, {len(sizes)} PNGs, measured sprite rectangles, {len(assets)} GUIDs, scenes and assembly references.")
    print("PASS: portable save exporter, literal vi/en UI keys, font and ambient audio present.")
    print(f"PASS: Unity {editor[1]} + revision, uGUI 2.0 / Test Framework 1.6 / input modules and Built-in pipeline configuration.")
    print("This check does not import, render, or build the project in Unity Editor.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--sync-meta", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.sync_meta:
        sync()
    if args.check:
        check()
