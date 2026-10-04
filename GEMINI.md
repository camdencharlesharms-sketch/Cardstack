# Card Stack (Cardstack) – Project Guide & Architecture

Welcome to **Cardstack** (branded as **Card Stack**). This document serves as the persistent system overview, architectural guide, and operational runbook for future development sessions.

---

## 1. Project Overview

Cardstack is a zero-build, client-side web collectible card game (CCG) and tactical battle arena featuring:
- **Collectible Card Binder**: 37 default collectible cards spanning 6 rarity tiers with procedural SVG artwork, individual health pools, and distinct battle attack sets.
- **Booster Pack Opening Engine**: 6 booster pack tiers (Standard, Arcane, Aether, Gilded Vault, Cosmic Archive, and Celestial Divine Reliquary) featuring physics-inspired 3D pack opening animations and duplicate-to-coin conversion.
- **Battle Arena**: Turn-based combat engine supporting both local solo AI duels and serverless peer-to-peer (P2P) multiplayer matches powered by PeerJS WebRTC.
- **Card Studio**: In-browser card creator with an interactive canvas drawing tool, local image file upload, and custom attack/stat configuration.
- **Supreme Admin Suite & Hub**: Master Admin controls (`Cam`), World Event broadcasting (coin multipliers & pack sales), God Mode Arena Strike, maintenance lock, player inventory manager, and appointed Sub-Admin roles.

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
├── .gemini/skills/cardstack-workflow/
│   └── SKILL.md                # Mirrored workflow skill
├── css/
│   └── styles.css              # Centralized stylesheet (exact original theme, layouts, animations)
└── js/
    ├── cards-data.js           # Card database, SVG art generator, pack odds & global state
    ├── admin.js                # Admin Suite tabs, Card Studio canvas, and Sub-Admin controls
    ├── arena.js                # AI & P2P Multiplayer combat engine (PeerJS WebRTC)
    └── app.js                  # Main app loop, booster opening, accounts & initialization
```

### Script Execution Order in `index.html`
1. `https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js` (External WebRTC library for P2P Arena)
2. `js/cards-data.js` (Declares default cards, pack definitions, and global game state variables)
3. `js/admin.js` (Defines Admin functions, Canvas studio, and sub-admin management)
4. `js/arena.js` (Initializes battle arena, turn logic, and P2P connection handlers)
5. `js/app.js` (Core game loop, booster opening, account auth, and bootstrap initialization)

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
- **Multiplayer P2P Mode**: Uses PeerJS for zero-server room matchmaking. Hosts generate a 6-digit code; guests join with the code. State is synchronized over WebRTC data channels (`init`, `init_reply`, `attack`, `forfeit`).
- **God Strike**: Admin-only test cheat button (`godModeStrikeBtn`) dealing 9,999 instant damage.

### C. Live Player Presence & Real-Time Synchronization (`js/presence.js`)
- **Live Online Presence Bar**: Displayed prominently at the top of the Admin Hub and in the header button (`⚡ Admin Hub 🟢 X`). Features pulsating indicators and interactive player chips showing active users, roles, and treasury balances.
- **Instant Account Discovery**: When any player registers or signs in on any device or tab, their identity is announced instantly over `BroadcastChannel` (same-device multi-tab) and PeerJS WebRTC beacon (`cardstack_hub_presence_cam_v1`). Cam's Admin Hub immediately registers them into `accounts`, populates them into `#skinPlayerSelect`, `#economyPlayerSelect`, and `#subAdminTargetSelect`, updates the active player table, and displays a celebratory toast: `🎉 New Player Registered: [Username]`.
- **1-Click Autofill Gifting**: Clicking any online player chip or table row autofills that player's username into all admin gifting fields with glowing visual confirmation.
- **Real-Time Remote Gifting**: When Cam grants coins, skins, or unlocks in the Admin Hub, actions are dispatched over the live data channel directly to the recipient's device. The recipient's balance and collection update dynamically on screen with an animated celebratory banner without needing a page refresh.
- **Active Refresh Daemon**: While the Admin Hub is open, a 2.5s daemon keeps online status labels (🟢 Online Now, 🟡 Away, ⚪ Offline) and treasury counts synchronized in real time.

### D. Admin Hub & Permissions (`js/admin.js`)
- **Authentication**: Master Admin is defined by `ADMIN_USERNAME = "Cam"`.
- **Admin Hub Tabs**:
  1. `👥 Player Manager`: Grant/revoke card skins, unlock all cards, wipe player cards, and manage registered accounts via dropdown or typed username.
  2. `🪙 Economy & RNG`: Gift coins, set exact coin balances, drain accounts, deposit master coins, and adjust pack luck RNG multipliers (1x–10x) via dropdown or typed username.
  3. `🎨 Card Studio`: In-browser card designer and publisher:
     - **Canvas & Art Tools**: Draw custom art on canvas, upload local image file, or provide an image URL. If no art is provided, a procedural SVG is automatically generated matching the chosen rarity theme.
     - **Multi-Attack & Stats Builder**: Configure custom HP and 2 unique attacks with customizable DMG yields.
     - **Home Page & Pack Availability**: Cards created in Card Studio are instantly pushed to the public game deck (`cards`). They appear immediately in the home page binder for all players (in locked mystery frame if not yet owned, increasing the total set count) and enter the booster pack drop tables matching their rarity weight.
     - **Pack Unlocking & Arena Playability**: Pulling the card from any booster pack unlocks it in the binder with full art, HP, and attacks, and makes it immediately available in the Battle Arena champion picker.
     - **Live Custom Cards Manager**: Displays all live studio cards with 1-click "👁️ Binder" navigation, "📋 Code" export (for pasting directly into `defaultCards`), and "✕" deletion.
     - **P2P Decentralized Sync**: When players battle via WebRTC P2P codes, custom cards are exchanged during handshake so opponents automatically receive and integrate them into their local binders and booster pack drop tables.
  4. `🌪️ World Events`: Broadcast global coin multipliers (1x, 2x, 3x) and pack discounts (0%, 25%, 50%).
  5. `📢 Broadcast & Leaks`: Transmit announcements or patch notes to the top banner.
  6. `🛡 Sub-Admin Roles` *(Master Cam only)*: Appoint sub-admins with daily coin gifting caps and skin gifting allowances. Includes an active player roster and direct username selector.
  7. `🔒 Creator Vault` *(Master Cam only)*: Private studio located strictly inside the Admin Hub. Allows Cam to:
     - **Design New Rarities**: Invent brand new rarity tiers with custom visual presets (Prismatic Hologram, Abyssal Void, Cosmic Nebula, Solar Radiance, Cyber Matrix) or custom color accents, glowing foil borders, and power rank values.
     - **Design New Cards**: Build private cards with custom picture upload from file or image URL, custom HP, dual attacks with DMG values, lore, custom emoji art fallback, and assign them to any standard or custom rarity.
     - **Design New Packs**: Build private booster packs with custom coin costs, card counts (1-12), icons, visual foil themes, guaranteed minimum rarities (including custom rarities), and test-open them right inside the Admin Hub with authentic unsealing animations.
     - **Strict Vault Isolation & Exclusive Gift-Only Rules**: When Cam creates an unreleased card in the Creator Vault:
       - **Zero Pack Drops**: Unreleased vault cards NEVER drop in any booster packs for anyone. They can strictly and exclusively be obtained through Master Cam gifting.
       - **Card Page Visibility**: Unreleased vault cards are 100% invisible to regular players (no locked placeholder, no counter increase) unless Cam specifically gifts the card to that player.
       - **Cam's Gifting Powers**: Cam can gift any unreleased vault card to any player either via the Player Skins Dispatcher (`#skinSelect` dropdown under `🔒 Unreleased Vault Cards (Gift Only)`) or directly in the Creator Vault by clicking `🎁 Gift` on the card.
       - **Gift Recipient Experience**: Once gifted, the recipient receives the card into their collection (`unreleasedOwned`). It renders in their binder as an unlocked, fully playable artifact with an exclusive `🔒 GIFTED VAULT` badge, custom stats, and artwork, and can be selected as a champion in the Battle Arena.
       - **Revocation**: Cam can revoke gifted vault cards at any time via the Player Skins Dispatcher.
       - **1-Click Public Release**: If Cam decides to make an unreleased vault card accessible in packs for everyone, Cam can click `🚀 Release Public`, which moves the card to the public deck (`cards`), displaying it in the binder for everyone and adding it to booster pack drop tables.

---

## 4. LocalStorage Schema

All application state is persisted client-side in the browser's `localStorage`:

| Key | Type | Description |
| :--- | :--- | :--- |
| `cardCollectorAccounts` | `Object` | Keyed by username: `{ password, owned: number[], coins: number, hasPlayed?: boolean, lastActive?: number }`. Contains only real accounts that have logged in, played, or connected via P2P. No made-up bot names. |
| `cardCollectorCurrentUser` | `string` | Currently active session username |
| `cardCollectorCustomCards` | `Array` | Custom cards created via Card Studio |
| `cardCollectorSubAdmins` | `Object` | Sub-admin configurations: `{ active, dailyCap, canGiftSkins, allowedSkinIds, giftedToday, lastGiftDate }` |
| `cardCollectorMaintenance` | `string` | `"true"` or `"false"` |
| `cardCollectorGodMode` | `string` | `"true"` or `"false"` |
| `cardCollectorEventCoins` | `string` | Coin multiplier (`"1"`, `"2"`, `"3"`) |
| `cardCollectorEventDiscount`| `string` | Pack discount percentage (`"0"`, `"25"`, `"50"`) |
| `cardCollectorLuck` | `string` | Opening luck multiplier (`"1"`, `"2"`, `"5"`, `"10"`) |
| `cardCollectorLeak` | `string` | Active broadcast text |
| `cardCollectorUnreleasedCards` | `Array` | Unreleased prototype cards visible exclusively to Master Admin (`Cam`) |
| `cardCollectorUnreleasedPacks` | `Object` | Unreleased prototype booster packs openable exclusively by Master Admin (`Cam`) |
| `cardCollectorCustomRarities` | `Object` | Custom designed rarity tiers with background gradients, border colors, and glow effects |
| `cardCollectorShowUnreleasedInBinder` | `string` | `"true"` or `"false"` (Cam's optional toggle to view private cards in their main binder) |

---

## 5. Development & Git Workflow Guidelines

As defined in `.agents/skills/cardstack-workflow/SKILL.md`:

### Git & Deployment Rules
1. **Direct to `main`**: All changes should be committed and pushed directly to `origin main`. Do not create pull requests unless explicitly requested.
2. **Automatic Deployment on Changes**: Whenever changes are made and the user wants to test or see the changes, automatically stage, commit, and push directly to `origin main` so Vercel deploys immediately.
3. **Faithful Codebase Preservation**: Do not invent or introduce unrequested UI features, buttons, or workflows.
4. **Keep `GEMINI.md` Up to Date**: Any change in architecture, files, or schema must be documented here in the same commit.
5. **GitHub CLI**: `gh` is installed at `~/.local/bin/gh`.
6. **Zero-Build Vercel Hosting**: Static web project. Pushing to `origin main` automatically deploys updates to production immediately.

### Gifting & Card Synchronization Mechanics
- **Dropdown & Manual Target Resolution**: `getTargetPlayer` prioritizes chosen select elements when populated, synchronizes two-way changes between text inputs and selects, and resolves accounts case-insensitively.
- **Auto Account Stubs & Password Claiming**: Accounts registered through Admin Hub gifting (`password: ""`) allow users to smoothly claim their accounts on first login without "Invalid passcode" failures.
- **Heartbeat Merge Protection**: Heartbeats received via PeerJS or BroadcastChannel merge into existing card collections instead of overwriting, preventing real-time heartbeats from wiping freshly granted gifts.
- **Cross-Tab & Real-Time Sync**: Storage events and incoming admin dispatch payloads automatically sync newly granted cards and update binder displays across open tabs and peer sessions.
- **Dropdown State Preservation**: `refreshAdminPlayerData` and `initCardSelect` preserve current user and card selections across 2.5-second polling intervals, preventing UI input wipes during gifting.
- **Active Players Table Quick Gift Action**: The Active Players table includes a quick `🎁 Gift` button to instantly target any player, focus the card selection dropdown, and streamline card distribution.
- **Full Player State Sync on Connect**: Connected players automatically receive their latest account status, gifted cards, unreleased vault unlocks, coin balances, and studio cards upon handshake or reconnection.
- **Vault Card Arena Readiness**: Gifted exclusive vault cards are recognized as owned battle-eligible cards, permitting arena entry even before standard packs are opened.
- **Resilient Vault & Skin Identifier Matching**: Unreleased vault cards are matched across both card `id` and `name` (case-insensitive) using `findVaultCardByIdOrName` and `isVaultCardOwnedByUser`. This guarantees gifted vault cards and custom skins always show as unlocked in the recipient's binder grid and combat arena, irrespective of whether the identifier was saved by ID or by card name.
- **Account State Freshness on Sign-in**: `loadAccount` re-reads fresh `accounts`, `unreleasedCards`, and `customCards` directly from `localStorage` upon login, ensuring any cards or coins granted to the player while logged out or in another tab are instantly loaded and never overwritten by stale memory.
- **Case-Insensitive Account Lookup**: `getUserAccount` safely resolves player records regardless of case mismatches (e.g., `playertwo` vs `PlayerTwo`), keeping ownership lists, balances, and gift dispatches synchronized.
- **Instant Account Presence & Beacon Re-alignment**: Switching accounts or signing in triggers `window.onUserAccountSwitched`, transitioning the peer connection to Host (`Cam`) or Client (players) and immediately announcing presence, so gifts dispatch over WebRTC and BroadcastChannel in real time without refresh.
