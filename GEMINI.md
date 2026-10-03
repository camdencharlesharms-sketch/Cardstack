# Cardstack (Aetheria Cards) – Project Guide & Architecture

Welcome to **Cardstack** (also titled **Aetheria Cards: Season One - Genesis**). This document serves as the persistent system overview, architectural guide, and operational runbook for future development sessions.

---

## 1. Project Overview

Cardstack is a zero-build, client-side web collectible card game (CCG) and tactical battle arena featuring:
- **Collectible Card Binder**: 37 default collectible cards spanning 6 rarity tiers with procedural SVG artwork, individual health pools, and distinct battle attack sets.
- **Booster Pack Opening Engine**: 6 booster pack tiers (Standard, Arcane, Aether, Gilded Vault, Cosmic Archive, and Celestial Divine Reliquary) featuring physics-inspired 3D pack opening animations and duplicate-to-coin conversion.
- **Battle Arena**: Turn-based combat engine supporting both local solo AI duels and serverless peer-to-peer (P2P) multiplayer matches powered by PeerJS WebRTC.
- **Card Studio**: In-browser card creator with an interactive canvas drawing tool, local image file upload, and custom attack/stat configuration.
- **Supreme Admin Suite & Hub**: Master Admin controls, World Event broadcasting (coin multiplier & pack sales), God Mode Arena Strike, maintenance lock, and account management.
- **🎁 Gifting Station**: Comprehensive gifting hub inside the Admin Hub supporting direct player gifting (coins, cards, packs, bundles), voucher codes generator & redemption, gift claims inbox, and role-based sub-admin permissions with daily coin caps.

---

## 2. Directory Structure & File Map

```
Cardstack/
├── index.html                  # Primary HTML5 application entry point
├── cardstack.html              # Fallback redirect to index.html (backward compatibility)
├── vercel.json                 # Vercel static routing configuration
├── GEMINI.md                   # This project guide and architectural manual
├── .agents/skills/cardstack-workflow/
│   └── SKILL.md                # Git workflow, Vercel CI/CD and deployment rules
├── css/
│   └── styles.css              # Centralized stylesheet (theme tokens, layouts, animations)
└── js/
    ├── cards-data.js           # Card database, SVG art generator, pack odds & global state
    ├── admin.js                # Admin Suite, Gifting Station & Sub-Admin controls
    ├── arena.js                # AI & P2P Multiplayer combat engine (PeerJS WebRTC)
    └── app.js                  # Main app loop, booster opening, accounts & gift claims
```

### Script Execution Order in `index.html`
1. `https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js` (External WebRTC library for P2P Arena)
2. `js/cards-data.js` (Declares default cards, pack definitions, and global game state variables)
3. `js/admin.js` (Defines Admin functions, Gifting Station handlers, and sub-admin restrictions)
4. `js/arena.js` (Initializes battle arena, turn logic, and P2P connection handlers)
5. `js/app.js` (Core game loop, booster opening, gift claim modal, and bootstrap initialization)

---

## 3. Core Systems & Architecture

### A. Card & Pack Mechanics (`js/cards-data.js`)
- **Rarity Hierarchy**: `common` (1) < `rare` (2) < `epic` (3) < `legendary` (4) < `mythic` (5) < `divine` (6).
- **Procedural SVG Generator (`makeSvgArt`)**: Dynamically renders high-resolution card artwork via SVG data URIs, minimizing external asset dependencies.
- **Pack Tiers (`packTiers`)**:
  - `common` (Standard Booster, 25 🪙, 3 cards)
  - `rare` (Arcane Booster, 60 🪙, 4 cards)
  - `epic` (Aether Booster, 120 🪙, 5 cards)
  - `legendary` (Gilded Vault, 220 🪙, 6 cards)
  - `mythic` (Cosmic Archive, 400 🪙, 7 cards, 1 guaranteed Mythic)
  - `divine` (Celestial Reliquary, 600 🪙, 8 cards, 1 guaranteed Divine)
- **Pack Cost Calculation**: Dynamic discount via `getActualPackCost(baseCost)` supporting server-wide sales (25% or 50% off).

### B. Battle Arena & Combat Engine (`js/arena.js`)
- **Solo AI Mode**: Simulates opponent attacks with randomized timing and damage variance.
- **Multiplayer P2P Mode**: Uses PeerJS for zero-server room matchmaking. Hosts generate a room code; guests join with the code. State is synchronized over WebRTC data channels (`pickCard`, `attack`, `chat`, `rematch`).
- **God Strike**: Admin-only test cheat button (`godModeStrikeBtn`) dealing 9,999 instant damage.

### C. Admin Hub & Permissions (`js/admin.js`)
- **Authentication**: Master Admin is defined by `ADMIN_USERNAME = "Cam"`.
- **Sub-Admin System**:
  - Appointed by Master Admin with configurable daily coin caps (`dailyCap`), card skin gifting permissions (`canGiftSkins`, `allowedSkinIds`), and booster pack gifting toggles (`canGiftPacks`).
  - Case-insensitive username matching via `getSubAdminRole(username)`.
- **World Events**: Broadcast coin multipliers (e.g. 2x, 3x) and pack discounts (25%, 50%).
- **Security**: Maintenance mode lock (`isMaintenanceMode`) restricts non-admin access to packs and the arena.

### D. 🎁 Gifting Station (`js/admin.js` & `js/app.js`)
1. **Direct Player Gifting**:
   - Dispatches coins, cards, booster packs, or bundles directly into a player's inbox (`giftsInbox[username]`).
   - Supports selecting from existing accounts or typing a custom recipient username for offline or new players.
2. **Gift Voucher Codes**:
   - Codes generated with custom rewards (coins, cards, packs) and usage limits (`maxUses`).
   - Stored in `giftCodes[code]`.
   - Players redeem codes via the **🎁 Redeem Code** button in the header modal (`redeemGiftCode(codeStr)`).
3. **Gift Inbox & Claim Modal**:
   - Prominently displays unclaimed gift count badge in the header (`#giftInboxBtn`).
   - Automatically prompts the recipient with the celebratory unboxing modal (`#giftClaimModal`) upon logging in.
   - Clicking **Claim All Items Now 🚀** deposits coins, cards into binder, and booster packs into `accounts[user].freePacks[tier]`.
4. **Free Booster Packs**:
   - Gifted packs are displayed on the shop booster cards as **`🎁 FREE GIFT PACK (N left)`** and open without deducting coins.

---

## 4. LocalStorage Schema

All application state is persisted client-side in the browser's `localStorage`:

| Key | Type | Description |
| :--- | :--- | :--- |
| `cardCollectorAccounts` | `Object` | Keyed by username: `{ password, owned: number[], coins: number, freePacks: { [tier]: number } }` |
| `cardCollectorCurrentUser` | `string` | Currently active session username |
| `cardCollectorCustomCards` | `Array` | Custom cards created via Card Studio |
| `cardCollectorSubAdmins` | `Object` | Sub-admin configurations: `{ active, dailyCap, canGiftSkins, canGiftPacks, allowedSkinIds, giftedToday, lastGiftDate }` |
| `cardCollectorGifts` | `Object` | Inboxes keyed by lowercase username: `Array<{ id, from, to, coins, cardIdx, packTier, packCount, note, date, claimed }>` |
| `cardCollectorGiftCodes` | `Object` | Active voucher codes: `{ coins, cardIdx, packTier, packCount, maxUses, usedBy: string[], createdBy, createdAt }` |
| `cardCollectorGiftLog` | `Array` | Recent 50 dispatched gifts for auditing |
| `cardCollectorMaintenance` | `string` | `"true"` or `"false"` |
| `cardCollectorGodMode` | `string` | `"true"` or `"false"` |
| `cardCollectorEventCoins` | `string` | Coin multiplier (e.g. `"1"`, `"2"`, `"3"`) |
| `cardCollectorEventDiscount`| `string` | Pack discount percentage (e.g. `"0"`, `"25"`, `"50"`) |

---

## 5. Development & Git Workflow Guidelines

As defined in `.agents/skills/cardstack-workflow/SKILL.md`:

### Git & Deployment Rules
1. **Direct to `main`**: All changes should be committed and pushed directly to `origin main`. Do not create pull requests unless explicitly requested.
2. **GitHub CLI**: `gh` is installed at `~/.local/bin/gh`.
3. **Authenticated Push**: Always prefix `PATH` when running git push:
   ```bash
   PATH="$HOME/.local/bin:$PATH" git push origin main
   ```
4. **Zero-Build Vercel Hosting**: Hosted on Vercel as a static web project. Pushing to `origin main` automatically deploys updates to production immediately.

### Verification & Testing
To test the JavaScript codebase without a browser, run the headless validation suite via macOS JavaScriptCore:
```bash
osascript -l JavaScript scratch/test_runner.js
```
To run a local web server:
```bash
python3 -m http.server 8000
# or
npx serve .
```
Then navigate to `http://localhost:8000` to interact with the game.
