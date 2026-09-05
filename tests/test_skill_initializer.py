"""Exercise the initializer's file-safety and user-content handling without npm."""

import html
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


INITIALIZER = (
    Path(__file__).resolve().parents[1]
    / "skills/particle-showcase/scripts/create_showcase.py"
)


class SkillInitializerTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.skill = self.root / "particle-showcase"
        self.script = self.skill / "scripts/create_showcase.py"
        self.script.parent.mkdir(parents=True)
        shutil.copy2(INITIALIZER, self.script)
        self.starter = self.skill / "assets/starter"
        config_directory = self.starter / "src/config"
        config_directory.mkdir(parents=True)
        self.original_config = {
            "defaultVariant": "deepseek",
            "showVersionSwitch": True,
            "versions": {
                brand: {"modelName": brand.title()}
                for brand in ("astra", "deepseek", "kimi", "glm")
            },
        }
        self.config_path = config_directory / "showcase.json"
        self.config_path.write_text(json.dumps(self.original_config), encoding="utf-8")
        (self.starter / "index.html").write_text(
            "<!doctype html><title>\nDefault\n</title><main>Example</main>", encoding="utf-8"
        )

    def run_initializer(self, destination, *arguments):
        return subprocess.run(
            [sys.executable, str(self.script), "--dest", str(destination), *arguments],
            capture_output=True,
            text=True,
            check=False,
        )

    def test_custom_title_is_escaped_in_html_and_preserved_in_configuration(self):
        destination = self.root / "project with spaces"
        title = 'My </title><script>"& logo</script>\\1\n二号'
        result = self.run_initializer(
            destination, "--brand", "kimi", "--single-brand", "--title", title
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        config = json.loads((destination / "src/config/showcase.json").read_text())
        self.assertEqual(config["defaultVariant"], "kimi")
        self.assertFalse(config["showVersionSwitch"])
        self.assertEqual(config["versions"]["kimi"]["modelName"], title)
        entry = (destination / "index.html").read_text()
        self.assertIn(html.escape(title + " — Particle Constellation"), entry)
        self.assertNotIn("<script>", entry)
        self.assertIn("<main>Example</main>", entry)
        self.assertEqual(json.loads(self.config_path.read_text()), self.original_config)

    def test_existing_directory_is_unchanged(self):
        destination = self.root / "existing"
        destination.mkdir()
        sentinel = destination / "keep.txt"
        sentinel.write_text("existing user content", encoding="utf-8")
        result = self.run_initializer(destination)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(sentinel.read_text(), "existing user content")
        self.assertEqual(list(destination.iterdir()), [sentinel])

    def test_empty_directory_is_supported(self):
        destination = self.root / "empty"
        destination.mkdir()
        result = self.run_initializer(destination)
        self.assertEqual(result.returncode, 0, result.stderr)
        config = json.loads((destination / "src/config/showcase.json").read_text())
        self.assertEqual(config, self.original_config)

    def test_destination_inside_starter_is_rejected(self):
        destination = self.starter / "nested"
        result = self.run_initializer(destination)
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(destination.exists())

    def test_symbolic_link_destination_is_rejected(self):
        empty = self.root / "real-empty"
        empty.mkdir()
        destination = self.root / "link"
        destination.symlink_to(empty, target_is_directory=True)
        result = self.run_initializer(destination)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(list(empty.iterdir()), [])

    def test_blank_title_does_not_create_a_project(self):
        destination = self.root / "blank"
        result = self.run_initializer(destination, "--title", " \n\t")
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(destination.exists())

    def test_missing_starter_explains_whole_skill_is_required(self):
        self.config_path.unlink()
        destination = self.root / "missing"
        result = self.run_initializer(destination)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("entire skill folder", result.stderr)
        self.assertFalse(destination.exists())


if __name__ == "__main__":
    unittest.main()
