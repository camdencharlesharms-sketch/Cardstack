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

### Card Studio Custom Cards Lifecycle
- **Standard First-Class Artifacts**: Cards forged in the Card Studio (`#tabStudio`) become standard first-class artifacts in the game deck (`cards`), persisted in `cardCollectorCustomCards`.
- **Booster Pack Integration & Discovery**: Studio cards automatically roll from booster packs based on their assigned rarity tier (`chooseCardFromWeights`).
- **Locked Binder Presentation**: Like all default cards, unowned studio cards appear locked in the collection binder (`card locked`, "Unknown Card", "??? HP", locked placeholder attacks) until discovered.
- **Natural Discovery vs. Instant Claim**: Card Studio features a checkbox `#newCardAutoUnlock` ("Instant claim to my collection"), unchecked by default so players can pull the new card naturally from booster packs as a new discovery.
- **Studio Card Manager Controls**: In the Admin Hub Studio list, administrators can toggle any custom card between `🔄 Return to Packs` (un-claims so it can be rolled from packs) and `🎁 Instant Claim` (immediately grants ownership).
- **Arena Combat Usability**: Once unlocked (whether pulled from a booster pack or claimed), custom cards appear in the Arena champion carousel deck picker (`renderArenaCardPicker`), can be chosen as battle champions, and used in AI solo battles and real-time P2P multiplayer duels with their custom attacks and stats.

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
8. `⚡ Chaos Lab & God Tools`: Advanced sandbox suite for visual phenomena, economy simulations, audio synthesis, and live community raids:
   - **Screen FX & Particle Cannons**:
     - *🌧️ Cosmic Card Rain*: Rains down dozens of floating, 3D rotating mini-card sprites of rare/mythic/divine cards cascading down the screen with glowing neon borders.
     - *🎉 Mega Confetti Storm*: Launches continuous dual-cannon confetti particle bursts using `canvas-confetti`.
     - *💥 Nuclear EMP Screen Shake & Glitch*: Shakes the entire viewport with an RGB chromatic aberration glitch effect and sub-bass laser rumble.
     - *🌈 Rainbow Disco Aura*: Toggles an animated chromatic rainbow glow border across all binder cards, packs, and header.
   - **🎰 High-Roller Lucky Wheel**:
     - Live animated casino reel rewarding 10k–50k Coins, guaranteed Mythic & Divine drops, or 5x God Luck boosts to any selected player or self with celebratory fanfare.
   - **🌪️ 100x Speed Pack Buster & Drop Matrix Benchmark**:
     - Benchmarks booster pack odds by opening 10, 25, 50, or 100 packs instantly in background simulation.
     - Displays comprehensive statistical analytics (cards drawn, rarity distribution % breakdown, and top high-tier discoveries).
     - Includes a toggleable "Keep Pulled Cards in Collection" mode to mass-claim packs directly into inventory.
   - **🔊 Master SFX Synth Soundboard**:
     - Zero-dependency browser Web Audio API synthesizer producing 8 retro arcade sound effects: Victory Fanfare, Pack Foil Tear, Critical Laser Zap, Cosmic Void Warp, Coin Chimes, Alert Siren, Celestial Ascension, and Nuclear Blast, with a live master volume slider.
   - **👾 World Boss Raid Summoner**:
     - Spawns a global raid boss banner right on the main page above the binder (`#worldBossBanner`).
     - Choose from *🔥 Ignis, The Solar Behemoth* (10k HP), *🌑 Umbra, The Void Leviathan* (25k HP), *⚡ Chronos, The Time Devourer* (50k HP), or build a *✨ Custom World Boss*.
     - Players can click "⚔️ STRIKE BOSS!" using their active champion card to deal real damage with floating damage numbers and critical strike multipliers.
     - Defeating the boss triggers screen shake, confetti, and awards +2,500 Coins to the victor.
     - Full Admin Hub controls: Full Boss HP Restore, Admin 5,000 DMG True Strike, and Raid Dismissal.

---

## 4. LocalStorage Schema

All application state is persisted client-side in the browser's `localStorage`:

| Key | Type | Description |
| :--- | :--- | :--- |
| `cardCollectorAccounts` | `Object` | Keyed by username: `{ password, owned: number[], coins: number, hasPlayed?: boolean, lastActive?: number }`. Contains only real accounts that have logged in, played, or connected via P2P. No made-up bot names. |
| `cardCollectorCurrentUser` | `string` | Currently active session username |
| `cardCollectorCustomCards` | `Array` | Custom cards created via Card Studio |
| `cardCollectorSubAdmins` | `Object` | Sub-admin configurations: `{ active, dailyCap, canGiftSkins, allowedSkinIds, giftedToday, lastGiftDate }` |
| `cardCollectorWorldBoss` | `Object` | Active World Boss Raid state: `{ id, name, element, hp, maxHp, icon, weakness, desc }` |
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
| `cardCollectorDeletedCards` | `Array` | List of permanently deleted card IDs and lowercase card names filtered out of all packs, binders, and arena battles |
| `cardCollectorCardOverrides` | `Object` | Map of card ID/name to customized attack lists and stats |

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


### Master Card Manager Architecture
- **Universal Game Card Inspection**: A dedicated "🃏 Card Manager" tab in Admin Hub aggregates and displays **every card in Cardstack** across all 37 base cards, custom Card Studio cards, and unreleased Vault prototypes. Cards previously removed from booster packs remain visible with an active `🔄 Restore to Packs` button. Real-time text search, live counters (`Showing X of Y Cards`), and quick filters (including `❤️ Infinite HP Cards` and `⚡ Infinite DMG Cards`) make browsing immediate.
- **Bidirectional Health (HP) Customization**: Administrators can set the health of any card to any custom number (e.g. 50, 100, 250, 500) or toggle it to **Infinite HP** (`"Infinity"`). Cards with Infinite HP display a glowing radiant cyan badge `❤️ ∞ INFINITE HP` in Card Manager and Binders. In the Combat Arena, infinite HP champions render `∞ / ∞ HP` and absorb normal attacks with 0 damage. Quick preset chips (`80`, `150`, `250`, `500`, `∞ Inf`) and pressing Enter allow instant editing back and forth.
- **Bidirectional Attack Damage Customization**: Every attack features inline editable Name and DMG fields, allowing damage to be adjusted to any number (e.g. 25, 50, 100) or set to **Infinite Damage** (`"Infinity"`). Quick presets (`25`, `50`, `100`, `∞ Inf`), `⚡ Set ∞ DMG`, and `⚡ All Attacks ∞ DMG` allow one-click changes. In the Combat Arena, infinite attacks deal `⚡ ∞ INFINITE DAMAGE` and inflict an Instant Knockout (Instant KO).
- **Safe JSON Serialization for Infinite Values**: String representation (`"Infinity"`) is used in `cardCollectorCardOverrides` and network dispatch payloads to prevent native JS `JSON.stringify(Infinity)` nullification, supported by `isInfiniteValue()`, `formatHp()`, and `formatDmg()` across all views.
- **Permanent Card Deletion with Index Sanitization**: Deleting a card permanently purges it from `cards`, `unreleasedCards`, and `customCards`, records the ID in `cardCollectorDeletedCards`, and sanitizes `owned` card indices across all player accounts (shifting higher indices down and preventing orphan index drift).
- **Instant Peer & Tab Synchronization**: Card attack changes, HP updates, and card deletions broadcast via PeerJS and `BroadcastChannel` (`sync_card_attacks`, `sync_card_hp`, and `sync_card_deleted`), keeping all connected multiplayer tabs and opponents synchronized in real-time.

### Combat Arena Accessibility & Network Resilience
- **Starter Champion Auto-Provisioning**: Every new player, guest, or account starts with Card 0 ("Blaze") in `owned: [0]`, ensuring immediate access to the arena without lockouts.
- **Universal Arena Availability**: Safe admin checking eliminates runtime `ReferenceError` crashes, allowing guests, newly signed up players, and regular users across all devices to open the arena instantly.
- **WebRTC STUN NAT Traversal**: Google STUN servers (`stun:stun.l.google.com:19302`) ensure reliable P2P matchmaking across separate Wi-Fi, cellular, and remote networks.
- **Hybrid Local BroadcastChannel Fallback**: Same-machine or multi-tab multiplayer duels connect instantly with 0 latency over `BroadcastChannel("cardstack_arena_local_bridge")`.
- **Match Life-Cycle & Error Handling**: Explicit connection timeouts, clear lobby status indicators, graceful disconnect/forfeit banners, and rematch negotiation in multiplayer.

### Sub-Admin Role System & Distributed Authority
- **Dynamic Header Button (`🛡️ Sub Admin`)**: When a user with Sub-Admin status logs in, the navigation button where Cam has Admin dynamically displays `🛡️ Sub Admin` accompanied by the live presence badge (`<span id="homeOnlineBadge">`) with custom oceanic cyan styling (`linear-gradient(135deg, #0284c7, #0369a1)`). Regular players and guests see no admin button (`display: none`).
- **Granular Powers & Features Configurator**: In `tabPermissions`, Master Cam can appoint sub-admins and selectively toggle exactly what features they are permitted to use:
  - `👥 Player Manager`: Daily coin gifting (enforced daily cap) and card/skin gifting (allowed skins whitelist).
  - `🎨 Card Studio`: Create new custom cards or update existing card art.
  - `🃏 Card Manager`: Delete cards, add/delete attacks, modify card health, and configure Infinite HP/DMG.
  - `🪙 Economy & RNG`: Adjust pack luck multipliers and pack pricing.
  - `🌪️ World Events`: Server Lockdown mode and event multipliers.
  - `📢 Broadcast & Leaks`: Send global announcements and secret game leaks.
- **Console Feature Enforcement & Tab Scoping**: Tabs that Master Cam has not granted to a sub-admin are hidden from the console navigation. If the console is opened, it automatically selects their first authorized tab. Actions on unpermitted features are strictly guarded by `canSubAdminPerform(feature)`. Master-only tabs (`tabPermissions`, `tabUnreleased`) remain 100% private to Cam.
- **Sub-Admin Console Status Banner**: A dedicated top banner inside the Sub-Admin Console displays their remaining daily coin budget and explicitly highlights their active granted powers.
- **Sub-Admin Role Editing**: Master Cam can click `✏️ Edit` on any appointed sub-admin in the Active Appointed Admins list to reload their configuration, modify their coin caps, skin permissions, and console powers, and re-save with instant network synchronization.
- **Universal Case-Insensitive Role Resolution**: `getSubAdminRole(username)` resolves sub-admin permissions case-insensitively with automatic `localStorage` hydration.
- **P2P Role Synchronization & Broadcast**: When Master Cam assigns or revokes a sub-admin, the updated role definitions are broadcasted in real-time across `BroadcastChannel` (local tabs) and all active PeerJS connections (`broadcastToAllPresencePeers`). Connected clients automatically store the updated permissions and trigger `updateAccountUI()`.
- **Sub-Admin Action Relay Protocol**: When a Sub-Admin performs an action, the action is dispatched via `subadmin_action_relay` through `presenceConnToCam` to Master Cam. The host validates permissions, applies master records, and forwards dispatches to players.

### Studio Card Public Visibility & Instant Multi-Peer Distribution
- **Instant Automatic Page Showcase**: When a card is spawned in the Card Studio ("Spawn Brand New Card with Art"), the Admin Hub closes automatically, switches the filter to "Full Binder", executes a fresh render, and smoothly scrolls to the newly created card with a radiant glow animation (`boxShadow: 0 0 35px #a855f7`).
- **Immediate Creator Ownership**: The creator automatically receives standard ownership of the new studio card in `owned` and their user account record, enabling instant collection viewing and battle in the Arena.
- **Universal Unlocked Visibility for All Players & Guests**: Studio cards (`isStudioCard`) are strictly exempt from `.locked` blackout shading and "Unknown Card" masking. Even when unowned by a player or guest visiting the page, studio cards display their vibrant colorful face, artwork, card name, HP, and attacks, augmented with a `🎨 STUDIO` tag and a `📦 Available in Booster Packs` badge.
- **Universal Booster Pack Integration**: Studio cards are registered directly into the active cards pool and pack tiers matching their rarity (from Standard Booster up through Celestial Reliquary), allowing anyone to pull them from packs.
- **Instant P2P Network Propagation**: Newly forged studio cards are immediately broadcasted to all connected peers and tabs via `broadcastStudioCardCreated`. When sub-admins create studio cards, the creation is relayed to Master Cam, who re-broadcasts to all connected players.
- **Connection Handshake Studio Card Sync**: When any player or guest connects to Master Cam, all custom studio cards in storage are instantly pushed via `sync_studio_cards` on peer connection open, ensuring the cards section on their page is populated immediately without requiring page refreshes.

### World Events: High-Alert Server Lockdown Mode
- **Dedicated World Events Console**: Located under `🌪️ World Events` (`#tabEvents`) in the Admin Hub. Master Cam can toggle high-alert lockdown on and off with a single click.
- **Strict Booster Pack Freeze**: While Lockdown Mode is active (`isLockdownMode`), all non-master-admin players and visiting guests are strictly prohibited from opening any booster packs (`startPackOpening`). Pack buttons display `🚨 LOCKED DOWN`.
- **Complete Combat Match Lockout**: While Lockdown Mode is active, non-master-admin players are prohibited from:
  - Entering the battle arena modal (`arenaBtn.onclick`).
  - Starting solo AI matches (`startSoloBattle`).
  - Hosting multiplayer matches with room codes (`hostMatchBtn.onclick`).
  - Joining multiplayer rooms via battle codes (`confirmJoinCodeBtn.onclick`).
  - Initiating rematch duels or clicking play again (`battlePlayAgainBtn.onclick`).
- **Real-Time P2P & Tab Broadcast**: Toggling lockdown immediately broadcasts `sync_lockdown_mode` across all connected PeerJS sessions (`allConnectedPresenceConns` and `activePresencePeers`) and `BroadcastChannel("cardstack_presence_bus")`.
- **Connection Handshake Sync**: When any player or guest connects to Master Cam, the current lockdown state is synchronized immediately on peer connection open.
- **High-Alert Visual Banner**: When active, a prominent sticky high-alert banner (`#lockdownBanner`) pulses across the top of the screen: *"🚨 HIGH-ALERT SERVER LOCKDOWN IN EFFECT — Arena Matches and Booster Packs are Temporarily Prohibited 🚨"*.
