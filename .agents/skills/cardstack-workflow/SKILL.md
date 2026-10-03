---
name: cardstack-workflow
description: Workflow preferences, git rules, and architecture for the Cardstack repository.
---

# Cardstack Repository Guidelines

## Git & Deployment Workflow
- **Branch & PR Policy**: Push directly to `main`. Do not create pull requests unless explicitly asked.
- **Hosting & CI/CD**: Connected directly to Vercel via GitHub. Pushes to `main` trigger production deployments automatically.
- **Routing**: Static clean URLs configured via `vercel.json` (`cleanUrls: true`, `trailingSlash: false`).
- **Entry point**: `index.html` is the primary application root. `cardstack.html` acts as a fallback redirect.

## Codebase Architecture
- `index.html`: Clean HTML structure referencing external CSS and JS modules.
- `css/styles.css`: Centralized styles, responsive layouts, theme tokens, animations.
- `js/cards-data.js`: Card catalogue, rarities, stats, attacks, descriptions.
- `js/app.js`: Core game loop, booster pack logic, inventory binder, audio/visual effects.
- `js/arena.js`: Turn-based combat engine, AI match logic, multiplayer P2P networking.
- `js/admin.js`: Master admin & sub-admin suite, card creator, god-mode controls.
