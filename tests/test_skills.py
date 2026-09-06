"""Offline documentation checks; these do not certify Blender or browser visuals."""
import ast
import os
import re
import textwrap
import unittest
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT=Path(__file__).resolve().parents[1]
FOCUSED=('blender_modeling.md','blender_animation.md','web_walkthrough.md','character_rigging_mocap.md')
ASSET_SUFFIXES={'.blend','.blend1','.glb','.gltf','.bin','.fbx','.obj','.stl',
                '.mp4','.mov','.webm','.mkv','.png','.jpg','.jpeg','.webp','.exr','.hdr','.tif','.tiff'}


def public_files():
    roots=[]
    excluded={'.git','.local','.venv','__pycache__','node_modules','dist','build','test-results','playwright-report'}
    for parent,dirs,files in os.walk(ROOT):
        dirs[:]=[d for d in dirs if d not in excluded]
        for name in dirs+files:
            if name in {'.git','.DS_Store'} or ((name=='.env' or name.startswith('.env.')) and name!='.env.example'):
                continue
            path=Path(parent)/name
            if path.is_symlink():
                raise ValueError('Publication path is a symlink: '+str(path.relative_to(ROOT)))
            if path.is_file():
                roots.append(path)
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

    def test_exactly_one_router_and_four_focused_skills(self):
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

    def test_character_routing_and_evidence_contract(self):
        router=(ROOT/'skills'/'skill_gpt_3d.md').read_text()
        for contract in ('### Dynamic Character Branch','generator-plus-rig configuration',
                         'Preserve skins','complete static architectural pipeline'):
            self.assertIn(contract,router)
        skill=(ROOT/'skills'/'character_rigging_mocap.md').read_text()
        for contract in ('**Motion Model Before Bone Count**','**Privacy and Authorization**',
                         '**Bind and Skin Integrity**','**Capture Lifecycle**',
                         '### Verification Methodology and Evidence Tiers'):
            self.assertIn(contract,skill)
        evidence=skill.split('### Verification Methodology and Evidence Tiers',1)[1].split('## Observed Pitfalls',1)[0]
        for tier in ('Documentation integrity','inverse-bind recovery','Synthetic landmark replay',
                     'Mock permission/capture','empty-frame smoke','positive fixture',
                     'Authorized live-person','User approval'):
            self.assertIn(tier,evidence)

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
                  r'\b(?:tvly|sk)-[A-Za-z0-9_\-]{20,}\b',
                  r'\bgh[pousr]_[A-Za-z0-9]{30,}\b',r'\bgithub_pat_[A-Za-z0-9_]{30,}\b',
                  r'\bAKIA[0-9A-Z]{16}\b',r'op://[A-Za-z0-9_-]+/[A-Za-z0-9_-]+/']
        for file in public_files():
            with self.subTest(file=str(file.relative_to(ROOT))):
                self.assertNotIn(file.suffix,ASSET_SUFFIXES)
                self.assertFalse(file.is_symlink())
                text=file.read_text()
                for pattern in patterns:
                    self.assertIsNone(re.search(pattern,text),pattern)
                for address in re.findall(r'[\w.+-]+@([\w.-]+\.[A-Za-z]{2,})',text):
                    self.assertIn(address,{'example.com','example.org','example.net'})

    def test_repository_contains_no_task_assets(self):
        allowed={'skills','docs','tests','templates','.github','.git','.local','.venv'}
        for child in ROOT.iterdir():
            if child.is_dir():
                self.assertIn(child.name,allowed)
            else:
                self.assertNotIn(child.suffix,ASSET_SUFFIXES)

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
