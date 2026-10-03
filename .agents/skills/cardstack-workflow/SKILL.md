---
name: cardstack-workflow
description: Workflow preferences, git rules, and architecture for the Cardstack repository.
---

# Cardstack Repository Guidelines

## Git & Deployment Workflow
- **Branch & PR Policy**: Push directly to `main`. Do not create pull requests unless explicitly asked.
- **Automatic Deployment on Changes**: Whenever changes are made and the user wants to test or see the changes, automatically stage, commit, and push directly to `origin main` so Vercel deploys immediately.
- **GitHub CLI & Credentials**:
  - `gh` is installed locally at `~/.local/bin/gh`.
  - Authentication is already configured via `gh auth setup-git`.
  - Always run git push commands with PATH including `~/.local/bin`: `PATH="$HOME/.local/bin:$PATH" git push origin main`.
- **Hosting & CI/CD**: Connected directly to Vercel via GitHub. Pushes to `main` trigger production deployments automatically.
- **Routing**: Static clean URLs configured via `vercel.json` (`cleanUrls: true`, `trailingSlash: false`).
- **Entry point**: `index.html` is the primary application root. `cardstack.html` acts as a fallback redirect.

## Persistent Documentation Maintenance
- **Keep `GEMINI.md` Up to Date**: Whenever new features are built, architectural decisions are made, files are added or restructured, or data/`localStorage` schemas change, **always update `GEMINI.md`** to reflect those changes in the same commit before pushing.

## Codebase Architecture
- `index.html`: Clean HTML structure referencing external CSS and JS modules.
- `css/styles.css`: Centralized styles, responsive layouts, theme tokens, animations.
- `js/cards-data.js`: Card catalogue, rarities, stats, attacks, descriptions.
- `js/app.js`: Core game loop, booster pack logic, inventory binder, audio/visual effects.
- `js/arena.js`: Turn-based combat engine, AI match logic, multiplayer P2P networking.
- `js/admin.js`: Master admin & sub-admin suite, card creator, god-mode controls.
