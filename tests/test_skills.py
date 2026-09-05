"""Offline documentation checks; these do not certify Blender or browser visuals."""
import ast
import re
import textwrap
import unittest
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT=Path(__file__).resolve().parents[1]
FOCUSED=('blender_modeling.md','blender_animation.md','web_walkthrough.md')


def public_files():
    roots=[ROOT/'README.md',ROOT/'AGENTS.md',ROOT/'.gitignore',ROOT/'.env.example']
    for directory in ('skills','docs','tests','.github'):
        roots.extend(p for p in (ROOT/directory).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
    return roots


def headings(text):
    return {re.sub(r'[^\w\- ]','',line.strip('# ').lower()).replace(' ','-')
            for line in text.splitlines() if line.startswith('#')}


class SkillContractTests(unittest.TestCase):
    def test_scaffold_files_exist(self):
        for file in ['README.md','AGENTS.md','.gitignore','.env.example','docs/prd.md',
                     'docs/rfc.md','docs/test.md','docs/working.md','.github/workflows/ci.yml']:
            with self.subTest(file=file):
                self.assertTrue((ROOT/file).is_file())

    def test_exactly_one_router_and_three_focused_skills(self):
        self.assertEqual({p.name for p in (ROOT/'skills').glob('*.md')},
                         {'skill_gpt_3d.md',*FOCUSED})
        text=(ROOT/'skills'/'skill_gpt_3d.md').read_text()
        for name in FOCUSED:
            self.assertIn(']('+name+')',text)

    def test_focused_skills_define_outcomes_and_boundaries(self):
        for name in FOCUSED:
            with self.subTest(skill=name):
                text=(ROOT/'skills'/name).read_text()
                for heading in ('Goal','Boundaries','Acceptance Criteria','Resources','Output Specification','Observed Pitfalls'):
                    self.assertIn('## '+heading,text)
                self.assertIn('Type: Workflow',text)

    def test_relative_links_and_anchors_resolve(self):
        for file in public_files():
            if file.suffix!='.md':
                continue
            text=file.read_text()
            for target in re.findall(r'\[[^\]]*\]\(([^\s)]+)\)',text):
                parsed=urlsplit(target)
                if parsed.scheme or parsed.netloc:
                    continue
                destination=(file.parent/unquote(parsed.path)).resolve() if parsed.path else file
                with self.subTest(file=file.name,target=target):
                    self.assertTrue(destination.is_relative_to(ROOT))
                    self.assertTrue(destination.is_file())
                    if parsed.fragment:
                        self.assertIn(parsed.fragment,headings(destination.read_text()))

    def test_python_examples_parse(self):
        for file in (ROOT/'skills').glob('*.md'):
            for code in re.findall(r'```python\n(.*?)```',file.read_text(),re.S):
                with self.subTest(file=file.name):
                    ast.parse(textwrap.dedent(code))

    def test_public_files_have_no_private_data_or_binary_outputs(self):
        patterns=[r'/Users/[A-Za-z0-9_\-]+/',r'/home/[A-Za-z0-9_\-]+/',
                  r'\b192\.168\.\d{1,3}\.\d{1,3}\b',r'\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b',
                  r'\b172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b',
                  r'-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----',
                  r'\b(?:tvly|sk)-[A-Za-z0-9_\-]{20,}\b']
        for file in public_files():
            with self.subTest(file=str(file.relative_to(ROOT))):
                self.assertNotIn(file.suffix,{'.blend','.blend1','.glb','.mp4','.png','.jpg','.exr'})
                text=file.read_text()
                for pattern in patterns:
                    self.assertIsNone(re.search(pattern,text),pattern)
                for address in re.findall(r'[\w.+-]+@([\w.-]+\.[A-Za-z]{2,})',text):
                    self.assertIn(address,{'example.com','example.org','example.net'})

    def test_repository_contains_no_task_assets(self):
        allowed={'skills','docs','tests','.github','.git','.local','.venv'}
        for child in ROOT.iterdir():
            if child.is_dir():
                self.assertIn(child.name,allowed)
            else:
                self.assertNotIn(child.suffix,{'.blend','.blend1','.glb','.mp4','.png','.jpg','.exr'})

    def test_working_log_has_required_sections(self):
        text=(ROOT/'docs'/'working.md').read_text()
        self.assertIn('## Changelog',text)
        self.assertIn('## Lessons Learned',text)

    def test_hygiene_matchers_detect_synthetic_leaks(self):
        pattern=r'/Users/[A-Za-z0-9_\-]+/'
        self.assertIsNotNone(re.search(pattern,'/Users/'+'example-user'+'/project'))
        self.assertIsNone(re.search(pattern,'./task_workspace/project'))


if __name__=='__main__':
    unittest.main()
