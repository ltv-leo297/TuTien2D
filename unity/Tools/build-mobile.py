#!/usr/bin/env python3
"""Run the project's real Unity mobile build entry points (requires Unity Editor)."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys

PROJECT = Path(__file__).resolve().parent.parent
TARGETS = {
    "android-apk": ("Android", "AndroidApk", "Builds/Android/TrucKhe-dev.apk"),
    "android-aab": ("Android", "AndroidAab", "Builds/Android/TrucKhe.aab"),
    "ios": ("iOS", "IOS", "Builds/iOS"),
}


def build_command(editor, target, output=None, log=None, project=PROJECT):
    platform, method, default_output = TARGETS[target]
    project = Path(project).resolve()
    output = Path(output or default_output).expanduser()
    if not output.is_absolute():
        output = project / output
    output = output.resolve()
    if output == project or any(output == project / d or project / d in output.parents for d in ("Assets", "Packages", "ProjectSettings")):
        raise ValueError("Output must be outside the project root, Assets, Packages and ProjectSettings.")
    suffix = {"android-apk": ".apk", "android-aab": ".aab"}.get(target)
    if suffix and output.suffix.lower() != suffix:
        raise ValueError("Output for this target must end in " + suffix)
    log = Path(log or (project / "Logs" / (target + ".log"))).expanduser().resolve()
    command = [str(editor), "-batchmode", "-quit", "-projectPath", str(project),
               "-buildTarget", platform, "-executeMethod", "TrucKhe.Editor.MobileBuilds." + method,
               "-logFile", str(log), "-trucKheBuildPath", str(output)]
    return command, output, log


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", choices=TARGETS)
    parser.add_argument("--unity", default=os.environ.get("UNITY_EDITOR"), help="Unity 2022.3.62f1 executable, or UNITY_EDITOR")
    parser.add_argument("--output", help="Output file/folder; relative paths resolve inside the Unity project")
    parser.add_argument("--log", help="Unity log file")
    parser.add_argument("--dry-run", action="store_true", help="Print arguments only; does not build")
    args = parser.parse_args(argv)
    if not args.unity and not args.dry_run:
        parser.error("Set --unity to the Unity executable or set UNITY_EDITOR. Unity is not bundled with this project.")
    editor = str(Path(args.unity).expanduser().resolve()) if args.unity else "Unity"
    try:
        command, output, log = build_command(editor, args.target, args.output, args.log)
    except ValueError as error:
        parser.error(str(error))
    if args.dry_run:
        print(json.dumps({"dryRun": True, "command": command, "output": str(output), "log": str(log)}, indent=2))
        return 0
    if not Path(editor).is_file():
        parser.error("Unity executable not found: " + editor)
    log.parent.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(command, cwd=PROJECT, check=False)
    if result.returncode:
        print("Unity build failed. See " + str(log), file=sys.stderr)
        return result.returncode
    artifact = output / "Unity-iPhone.xcodeproj/project.pbxproj" if args.target == "ios" else output
    if not artifact.is_file():
        print("Unity exited without the expected build artifact. See " + str(log), file=sys.stderr)
        return 1
    print("Build output: " + str(output))
    if args.target == "ios":
        print("Open the exported project in Xcode on macOS to sign, run on a device, or archive an IPA.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
