# GEMINI.md - Card Stack Project Documentation & Architecture

## 1. Project Overview

**Card Stack (Card Collector Pro & Arena)** is a modern, responsive web application for collecting trading cards, opening booster packs, designing custom cards and rarity tiers, managing an in-depth administration hub, and dueling in combat arenas against AI or other players via real-time WebRTC peer-to-peer networking.

- **Technology Stack**: Pure client-side vanilla JavaScript (ES6+), HTML5, CSS3.
- **External Libraries**: `canvas-confetti` (for celebratory pack unsealing), `peerjs` (for decentralized P2P multiplayer arena and presence mesh).
- **Hosting & Deployment**: Static hosting on Vercel with continuous deployment via `git push origin main`. Zero build tools, bundlers, or server-side dependencies.

---

## 2. File Structure

```
Cardstack/
├── index.html            # Main markup for header, binder grid, pack opener, admin hub, and combat arena
├── css/
│   └── styles.css        # Visual styles, rarity glow animations, 3D card tilts, modal layouts, and battle animations
├── js/
│   ├── cards-data.js     # Default card sets, rarity configurations, drop tables, account initialization, and shared helpers
│   ├── admin.js          # Admin suite: player management, economy, card studio, creator vault, events, and sub-admins
│   ├── arena.js          # Combat arena: champion selector, AI matches, P2P multiplayer dueling, and combat animations
│   ├── presence.js       # Real-time player presence tracking, heartbeat mesh, and remote session synchronization
│   └── app.js            # Main application controller: collection rendering, pack mechanics, audio, and auth persistence
└── GEMINI.md             # Architecture, design rules, localStorage schema, and workflow guidelines
```

---

## 3. Core Subsystems

### A. Card Collection & Booster Packs
- **Card Tiers & Rarities**: Common, Uncommon, Rare, Epic, Legendary, Mythic, Divine, Transcendent, Void, plus any user-created custom rarities.
- **Booster Pack Tiers**: Common, Rare, Legendary, God, Custom, and private Creator Vault Packs.
- **Opening Animation**: Authentic 3D card tear/foil unsealing effects with particle confetti for high-rarity pulls.
- **Duplicate Protection**: Pulling duplicate cards awards coin compensation based on rarity.

### B. Battle Arena & Combat Engine
- **Champion Selection**: Players select any unlocked card from their collection or gifted vault skins to champion them into battle.
- **Starter Champion Fallback**: If a player or guest owns 0 cards, Card 0 ("Blaze") is provided as a free Starter Champion so anyone can enter and battle immediately.
- **Dual Combat Modes**:
  1. **Battle AI Champion**: Fight offline against automated AI cards equipped with unique attacks. Rewards coins upon victory. Includes "Play Again" with guaranteed new opponent rotation and "Back to Cards" smooth navigation.
  2. **Custom Match (PVP)**: Decentralized 1v1 multiplayer using a 6-digit room code over WebRTC via PeerJS, supported by Google STUN servers (`stun:stun.l.google.com:19302`) and a local `BroadcastChannel` bridge for same-machine/multi-tab instantaneous dueling. Supports attack sync, live HP updates, animations, forfeit detection, disconnect handling, and rematch negotiation.

### C. Admin Hub Suite & Creator Studio
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

### Combat Arena Accessibility & Network Resilience
- **Starter Champion Auto-Provisioning**: Every new player, guest, or account starts with Card 0 ("Blaze") in `owned: [0]`, ensuring immediate access to the arena without lockouts.
- **Universal Arena Availability**: Safe admin checking eliminates runtime `ReferenceError` crashes, allowing guests, newly signed up players, and regular users across all devices to open the arena instantly.
- **WebRTC STUN NAT Traversal**: Google STUN servers (`stun:stun.l.google.com:19302`) ensure reliable P2P matchmaking across separate Wi-Fi, cellular, and remote networks.
- **Hybrid Local BroadcastChannel Fallback**: Same-machine or multi-tab multiplayer duels connect instantly with 0 latency over `BroadcastChannel("cardstack_arena_local_bridge")`.
- **Match Life-Cycle & Error Handling**: Explicit connection timeouts, clear lobby status indicators, graceful disconnect/forfeit banners, and rematch negotiation in multiplayer.

### Sub-Admin Role System & Distributed Authority
- **Universal Case-Insensitive Role Resolution**: `getSubAdminRole(username)` resolves sub-admin permissions case-insensitively with automatic `localStorage` hydration. This prevents role lookups from failing due to capitalization differences between Master Cam's input and player login credentials.
- **P2P Role Synchronization & Broadcast**: When Master Cam assigns or revokes a sub-admin, the updated role definitions are broadcasted in real-time across `BroadcastChannel` (local tabs) and all active PeerJS connections (`broadcastToAllPresencePeers`). Connected clients automatically store the updated permissions and trigger `updateAccountUI()`.
- **Sub-Admin Action Relay Protocol**: When a Sub-Admin gifts coins or an allowed skin, the action is dispatched via `subadmin_action_relay` through `presenceConnToCam` to Master Cam. The host validates the sub-admin's permissions and daily limit, applies the change to master records in `accounts`, triggers live toasts on Cam's screen, and forwards the action dispatch to the recipient player.
- **Header Badge Preservation**: `updateAccountUI()` safely updates the button text to `"🛡️ Sub-Admin Hub"` without destroying or removing the live presence count badge (`<span id="homeOnlineBadge">`).
- **Scoped Console UI & Daily Cap Guardrails**: Sub-Admins have restricted access within the Admin Hub. Master-only tabs (`tabPermissions`, `tabUnreleased`) and destructive controls (Delete account, Master Treasury Deposit, Wipe) are hidden from sub-admins. An interactive status banner shows sub-admins their remaining daily coin allowance and skin gifting status.

### Studio Card Public Visibility & Instant Multi-Peer Distribution
- **Instant Automatic Page Showcase**: When a card is spawned in the Card Studio ("Spawn Brand New Card with Art"), the Admin Hub closes automatically, switches the filter to "Full Binder", executes a fresh render, and smoothly scrolls to the newly created card with a radiant glow animation (`boxShadow: 0 0 35px #a855f7`).
- **Immediate Creator Ownership**: The creator automatically receives standard ownership of the new studio card in `owned` and their user account record, enabling instant collection viewing and battle in the Arena.
- **Universal Unlocked Visibility for All Players & Guests**: Studio cards (`isStudioCard`) are strictly exempt from `.locked` blackout shading and "Unknown Card" masking. Even when unowned by a player or guest visiting the page, studio cards display their vibrant colorful face, artwork, card name, HP, and attacks, augmented with a `🎨 STUDIO` tag and a `📦 Available in Booster Packs` badge.
- **Universal Booster Pack Integration**: Studio cards are registered directly into the active cards pool and pack tiers matching their rarity (from Standard Booster up through Celestial Reliquary), allowing anyone to pull them from packs.
- **Instant P2P Network Propagation**: Newly forged studio cards are immediately broadcasted to all connected peers and tabs via `broadcastStudioCardCreated`. When sub-admins create studio cards, the creation is relayed to Master Cam, who re-broadcasts to all connected players.
- **Connection Handshake Studio Card Sync**: When any player or guest connects to Master Cam, all custom studio cards in storage are instantly pushed via `sync_studio_cards` on peer connection open, ensuring the cards section on their page is populated immediately without requiring page refreshes.
