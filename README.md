# gpt_3d_skill

A vendor-agnostic collection of skills for procedural 3D modeling, animation and interactive WebGL walkthroughs, with a reusable mobile viewer template.

## Capabilities

- **Procedural 3D Modeling (`blender_modeling`)**: Deterministic geometry generation in Blender, procedural material assignment, structured scene hierarchies, geometry and normal checks, and self-contained asset packaging.
- **Cinematic Architectural Animation (`blender_animation`)**: Multi-stage choreographies (orbit showcases, exploded architectural views, assembly sequences, staged object entry), matrix transform synchronization, and frame-accurate FFmpeg video encoding.
- **Interactive Web Walkthroughs (`web_walkthrough`)**: Static high-fidelity WebGL delivery via texture baking, glTF/GLB export, pre-batch collision boundaries, desktop pointer-lock fallback, and responsive mobile touch navigation.

## Installation

This repository provides loose Markdown skill definitions designed for direct integration by coding agents (such as Codex, Claude Code, Cursor, OpenCode) and human developers.

## Reuse the Viewer

Start from [`templates/mobile_walkthrough/`](templates/mobile_walkthrough/README.md) instead of rewriting the controls. Copy that directory into a task workspace, supply your baked GLB and collider file, run `npm ci`, then `npm run dev`. No runtime demo or user model is bundled.

Configure `public/scene.json` with asset paths, background, spawn point, walk bounds and overview pose. The template keeps touch/keyboard movement, collision, reset/overview and one baked-unlit rendering path. There are no renderer modes or broad camera/quality knobs. `BASE_PATH` supports a website subpath. Existing unit and browser tests remain.

### Agent-Assisted Installation

You can provide this repository location to your coding agent and request installation:

1. The installer agent inspects the target workspace agent configuration files (such as `AGENTS.md`, `CLAUDE.md`, workspace router instructions, or skills index).
2. The agent registers a reference pointer exclusively to the root router skill:
   - Root Skill: [`skills/skill_gpt_3d.md`](skills/skill_gpt_3d.md)
3. Specialized domain skills (`skills/blender_modeling.md`, `skills/blender_animation.md`, `skills/web_walkthrough.md`) remain local to this repository and are navigated dynamically via the root router.

Give the agent the repository's GitHub URL or local checkout path. It should start from the target workspace's `AGENTS.md` or `CLAUDE.md`, follow `WORKSPACE.md` if present, and update `rules/skills/INDEX.md` or `skills/INDEX.md`. If no index exists, add one short root-skill pointer to the agent instructions instead. Register only the router, not every focused skill globally.

### Local Usage

To use these skills locally, reference the root router:
- Root router: [`skills/skill_gpt_3d.md`](skills/skill_gpt_3d.md)

When invoking 3D modeling, animation, or web walkthrough tasks, direct your assistant to consult `skills/skill_gpt_3d.md`. The router identifies task requirements, enforces workspace boundaries, and dispatches the appropriate specialized skill.

## Artifact and Workspace Boundaries

User models, references, renders, deployment settings and builds belong in task workspaces outside this repository. The repository includes reusable template source and code-generated test fixtures, but generated browser outputs and dependencies remain ignored. No analytics or remote asset CDN is enabled by default.

## Verification

Repository integrity is verified using standard Python unit testing:

```bash
uv venv
source .venv/bin/activate
python -m unittest discover -s tests -v
```

These tests validate Markdown links, document structure and repository hygiene, including template source. Run the template's `npm test` and `npm run test:e2e` for configuration, collision and browser checks. CI runs all three suites. They do not certify arbitrary user models or physical-phone performance.
