# Agent Guidelines for gpt_3d_skill

## Project Role and Overview
`gpt_3d_skill` is an open, modular repository of agent-executable loose Markdown skills designed for 3D procedural modeling, cinematic architectural animation, and interactive WebGL walkthroughs using Blender and modern browser tooling. The skill pack is vendor-agnostic and usable by humans and coding agents alike.

## Repository Structure
- `AGENTS.md`: Operational policies, workspace rules, and test contracts for coding agents.
- `README.md`: Public-facing project value, capabilities, and installation instructions.
- `docs/`: Design documents, specifications, and project history:
  - `docs/prd.md`: Product requirements, skill breakdown, and acceptance criteria.
  - `docs/rfc.md`: Architecture design, root router pattern, artifact boundaries, and baking decisions.
  - `docs/test.md`: Verification strategy distinguishing offline document integrity from external execution tests.
  - `docs/working.md`: Running changelog and observed lessons learned from actual pipeline runs.
- `skills/`: Loose Markdown skill definitions:
  - `skills/skill_gpt_3d.md`: Sole root router skill exposed to agents.
  - `skills/blender_modeling.md`: Focused procedural modeling capability.
  - `skills/blender_animation.md`: Focused architectural animation and video encoding capability.
  - `skills/web_walkthrough.md`: Focused WebGL/Three.js walkthrough capability with baked fidelity.
- `tests/`: Offline document integrity and repository hygiene checks.

## Operational Rules for Agents

### Working Log and Lessons
- Keep `docs/working.md` updated whenever new capabilities, conventions, or verified facts emerge.
- Never record hypothetical benchmarks or unverified test claims. Distinguish empirically verified facts from planned workflows.

### Git, Remote, and Deployment Restrictions
- Do not commit, push, alter remotes, or discard work without explicit user instruction. Read-only Git inspection is permitted.
- Do not publish, deploy, or upload repository contents or generated assets without explicit user request.
- Do not bind public network interfaces or share URLs without explicit authorization.

### Python Environment and uv Policy
- Check for a default `.venv` virtual environment in the repository root.
- If `.venv` does not exist, create it using `uv venv`.
- Whenever installing Python dependencies, always use `uv pip install` instead of standard `pip install`.
- Always activate the virtual environment (`source .venv/bin/activate`) before running Python commands or tools.

### Artifact Boundary Policy
- This repository contains only skills, documentation, and structural verification tests.
- Never store runtime user artifacts, temporary build output, `.blend` project files, rendered PNG sequences, MP4 video files, or exported GLB models inside this repository.
- All task-specific generation scripts, reference images, source 3D files, render outputs, and web builds must be stored in dedicated task workspaces external to this repository.

### Testing Contract
- Repository tests are executed with:
  ```bash
  python -m unittest discover -s tests -v
  ```
- These tests verify document integrity, relative reference links, and hygiene (e.g., absence of local paths, secrets, or broken relative links).
- Maintain the tests when changing the document contracts.
- Document integrity tests do not certify visual or rendering output. 3D visual certification occurs via opt-in checks in external task workspaces.

### Scope and Minimal Dependencies
- This initial pack provides loose Markdown skill instructions only.
- Do not introduce runtime CLI frameworks, React/frontend application code, or heavy dependency packages into this repository.
