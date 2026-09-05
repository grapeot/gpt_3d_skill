# gpt_3d_skill

A vendor-agnostic collection of modular, agent-executable skills for procedural 3D modeling, cinematic architectural animation, and interactive WebGL walkthroughs.

## Capabilities

- **Procedural 3D Modeling (`blender_modeling`)**: Deterministic geometry generation in Blender, procedural material assignment, structured scene hierarchies, geometry and normal checks, and self-contained asset packaging.
- **Cinematic Architectural Animation (`blender_animation`)**: Multi-stage choreographies (orbit showcases, exploded architectural views, assembly sequences, staged object entry), matrix transform synchronization, and frame-accurate FFmpeg video encoding.
- **Interactive Web Walkthroughs (`web_walkthrough`)**: Static high-fidelity WebGL delivery via texture baking, glTF/GLB export, pre-batch collision boundaries, desktop pointer-lock fallback, and responsive mobile touch navigation.

## Installation

This repository provides loose Markdown skill definitions designed for direct integration by coding agents (such as Codex, Claude Code, Cursor, OpenCode) and human developers.

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

All runtime outputs generated during task execution—including `.blend` project files, rendered PNG image sequences, encoded MP4 videos, exported GLB assets, and web build bundles—belong strictly in task-specific workspaces external to this skill repository. This repository remains a clean, lightweight catalog of instructions and structural integrity checks.

## Verification

Repository integrity is verified using standard Python unit testing:

```bash
uv venv
source .venv/bin/activate
python -m unittest discover -s tests -v
```

These automated tests validate Markdown links, document structure, and repository hygiene. They serve as document integrity checks and do not represent visual rendering certification. Visual and interactive fidelity is verified via dedicated inspection procedures in external task workspaces.
