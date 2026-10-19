import contextlib
import importlib.util
import io
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('mobile_build',Path(__file__).resolve().parents[1]/'Tools/build-mobile.py')
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class MobileBuildTests(unittest.TestCase):
    def test_three_targets_select_platform_method_and_output(self):
        for target,platform,method,suffix in [('android-apk','Android','AndroidApk','.apk'),('android-aab','Android','AndroidAab','.aab'),('ios','iOS','IOS','iOS')]:
            command,output,log=module.build_command('/Unity Hub/Editor/Unity',target,project='/tmp/Project With Spaces')
            self.assertEqual(command[0],'/Unity Hub/Editor/Unity')
            self.assertEqual(command[command.index('-buildTarget')+1],platform)
            self.assertEqual(command[command.index('-executeMethod')+1],'TrucKhe.Editor.MobileBuilds.'+method)
            self.assertTrue(str(output).endswith(suffix))
            self.assertIn('/tmp/Project With Spaces',command)

    def test_build_cannot_overwrite_source_or_use_wrong_extension(self):
        for output in ['.','Assets','Assets/TrucKhe','Packages/build','ProjectSettings/result']:
            with self.assertRaises(ValueError):module.build_command('Unity','ios',output,project='/tmp/game')
        with self.assertRaises(ValueError):module.build_command('Unity','android-aab','Builds/game.apk')

    def test_dry_run_does_not_start_unity(self):
        with patch.object(module.subprocess,'run') as run,contextlib.redirect_stdout(io.StringIO()) as out:
            self.assertEqual(module.main(['android-apk','--dry-run']),0)
        run.assert_not_called()
        self.assertIn('"dryRun": true',out.getvalue())

    def test_nonzero_unity_exit_is_reported_as_failure(self):
        with tempfile.TemporaryDirectory() as d:
            executable=Path(d)/'Unity';executable.touch()
            with patch.object(module.subprocess,'run',return_value=subprocess.CompletedProcess([],7)),contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(module.main(['ios','--unity',str(executable),'--output',str(Path(d)/'export'),'--log',str(Path(d)/'build.log')]),7)

    def test_zero_exit_without_artifact_is_not_success(self):
        with tempfile.TemporaryDirectory() as d:
            executable=Path(d)/'Unity';executable.touch()
            with patch.object(module.subprocess,'run',return_value=subprocess.CompletedProcess([],0)),contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(module.main(['android-apk','--unity',str(executable),'--output',str(Path(d)/'game.apk'),'--log',str(Path(d)/'build.log')]),1)


if __name__=='__main__':unittest.main()
