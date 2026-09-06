"""Exercise the initializer's file-safety and user-content handling without npm."""

import html
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


REPOSITORY = Path(__file__).resolve().parents[1]
INITIALIZER = REPOSITORY / "skills/particle-showcase/scripts/create_showcase.py"


class SkillInitializerTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.skill = self.root / "particle-showcase"
        self.script = self.skill / "scripts/create_showcase.py"
        self.script.parent.mkdir(parents=True)
        shutil.copy2(INITIALIZER, self.script)
        self.source = self.root / "source repository"
        self.source.mkdir()
        for name in ("src", "public", "tests/fixtures", "tests/helpers"):
            shutil.copytree(REPOSITORY / name, self.source / name)
        for name in (
            "index.html", "vite.config.ts", "eslint.config.js", ".prettierrc.json",
            ".prettierignore", ".editorconfig", ".gitignore", ".nvmrc", "LICENSE.md",
            "THIRD_PARTY_NOTICES.md", "package.json", "package-lock.json", "tsconfig.json",
        ):
            shutil.copy2(REPOSITORY / name, self.source / name)
        for item in (REPOSITORY / "tests").glob("*.test.ts"):
            shutil.copy2(item, self.source / "tests" / item.name)
        self.config_path = self.source / "src/config/showcase.json"
        self.original_config = json.loads(self.config_path.read_text())
        (self.source / "index.html").write_text(
            "<!doctype html><title>\nDefault\n</title><main>Example</main>", encoding="utf-8"
        )

    def run_initializer(self, destination, *arguments):
        return subprocess.run(
            [sys.executable, str(self.script), "--source", str(self.source), "--dest", str(destination), *arguments],
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

    def test_destination_inside_source_is_rejected(self):
        destination = self.source / "nested"
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

    def test_incomplete_source_is_rejected_before_writing(self):
        self.config_path.unlink()
        destination = self.root / "missing"
        result = self.run_initializer(destination)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("incomplete", result.stderr)
        self.assertFalse(destination.exists())

    def test_installed_skill_without_source_explains_requirement(self):
        destination = self.root / "no source"
        result = subprocess.run(
            [sys.executable, str(self.script), "--dest", str(destination)],
            capture_output=True, text=True, check=False,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("--source", result.stderr)
        self.assertFalse(destination.exists())

    def test_repository_skill_auto_locates_source(self):
        script = self.source / "skills/particle-showcase/scripts/create_showcase.py"
        script.parent.mkdir(parents=True)
        shutil.copy2(INITIALIZER, script)
        destination = self.root / "auto source"
        result = subprocess.run(
            [sys.executable, str(script), "--dest", str(destination)],
            capture_output=True, text=True, check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue((destination / "src/particles/core/renderer.ts").is_file())

    def test_export_is_complete_and_excludes_repository_only_content(self):
        for relative in (".git/config", ".openai/hosting.json", "node_modules/package/index.js",
                         "dist/index.html", "scripts/prepare-sites-build.mjs", "src/.env.local"):
            item = self.source / relative
            item.parent.mkdir(parents=True, exist_ok=True)
            item.write_text("excluded", encoding="utf-8")
        destination = self.root / "portable"
        result = self.run_initializer(destination)
        self.assertEqual(result.returncode, 0, result.stderr)
        for relative in ("src", "public/assets", "tests/fixtures", "tests/helpers"):
            for item in (self.source / relative).rglob("*"):
                if item.is_file() and item.name != ".env.local":
                    exported = destination / item.relative_to(self.source)
                    # The default configuration is reserialized, so compare it as JSON.
                    if item == self.config_path:
                        self.assertEqual(json.loads(exported.read_bytes()), self.original_config)
                    else:
                        self.assertEqual(exported.read_bytes(), item.read_bytes())
        for relative in (".git", ".openai", "node_modules", "dist", "scripts", "skills", "src/.env.local"):
            self.assertFalse((destination / relative).exists(), relative)
        for relative in ("LICENSE.md", "THIRD_PARTY_NOTICES.md"):
            self.assertEqual((destination / relative).read_bytes(), (self.source / relative).read_bytes())
        manifest = json.loads((destination / "package.json").read_bytes())
        lock = json.loads((destination / "package-lock.json").read_bytes())
        self.assertEqual(manifest["name"], lock["packages"][""]["name"])
        self.assertNotIn("build:sites", manifest["scripts"])
        self.assertFalse(any(name.startswith("skill:") for name in manifest["scripts"]))
        self.assertEqual(manifest["dependencies"], json.loads((self.source / "package.json").read_bytes())["dependencies"])

    def test_symbolic_link_source_file_is_rejected_before_writing(self):
        (self.source / "src/outside.ts").symlink_to(self.config_path)
        destination = self.root / "linked source"
        result = self.run_initializer(destination)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("symbolic link", result.stderr)
        self.assertFalse(destination.exists())


if __name__ == "__main__":
    unittest.main()
