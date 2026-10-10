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

### Studio-Grade Web Audio Synthesizer Engine
- **Master Bus Architecture**: All audio flows through a centralized Web Audio processing bus:
  - **Master Dynamics Compressor**: Soft-knee (-18dB threshold, 14dB knee, 5:1 ratio, 3ms attack, 220ms release) to eliminate clipping distortion, prevent digital pops, and inject punchy low-end presence.
  - **Master Butterworth Warmth Filter**: Lowpass filter calibrated at 13.5kHz (Q=0.707) to remove harsh digital aliasing and ear-fatiguing treble spikes.
  - **Master Limiter Output Gain**: Clamped at 0.85 to maintain dynamic headroom when multiple polyphonic layers play concurrently.
  - **Algorithmic Spatial Stereo Reverb**: Built-in 1.4-second exponential stereo impulse response convolver node, giving notes, fanfare, and chimes rich acoustic space and realism without requiring external audio asset files.
- **Redesigned Sound FX Library (`playChaosSfx` / `playSound` / `playAudioFx`)**:
  - `triumph` (Victory Fanfare): 5-voice heroic brass arpeggio climb into a grand sustained C-Major chord (G4, C5, E5, G5, C6) with detuned dual-saw/triangle oscillators, dynamic brass lowpass filter envelope, high-frequency stardust sparkle bells, and spatial reverb.
  - `packTear` (Pack Foil Rip): Multi-stage tactile unsealing simulation combining a 170Hz->42Hz low seal-pop transient, swept bandpass cellophane noise with micro-crackle spikes, and a 4.6kHz metallic sheen shimmer.
  - `laser` (Critical Laser Strike): Punchy cyber combat blast with a 140Hz->32Hz sub kick impact, 380Hz FM-modulated sawtooth sweep, and resonant lowpass formant sweep.
  - `warp` (Cosmic Void Warp): Interdimensional portal rift with a 48Hz/52Hz binaural sub-drone, sweeping resonant bandpass through cosmic harmonics, and descending crystal chime.
  - `coins` (Metallic Gold Coin Waterfall): Shower of 6 staggered coin clinks with randomized micro-pitch and stereo panning, synthesized via FM acoustic modeling (2.76x inharmonic metallic ratio) for authentic solid metal bell resonance.
  - `siren` (Tactical Emergency Alert): Warm dual-tone filtered klaxon horn backed by a synchronized 68Hz sub-bass heartbeat pulse.
  - `ascension` (Celestial Chimes & Harp): Ascending 7-note pentatonic glissando (C5 to G6) using FM crystal bell synthesis with long sustain into the spatial reverb convolver.
  - `detonation` (Nuclear EMP Blast): Blockbuster seismic explosion featuring an 85Hz->20Hz earthquake sub-bass drop, dynamic lowpass shaped noise thunder, and electrical EMP discharge sizzle.
- **Full-Game Sound Integration**:
  - Booster Packs: Plays `packTear` on initial foil unsealing, and `ascension` or `triumph` on revealing cards.
  - Battle Arena: Plays `laser` on player strikes, `triumph` on match victory, and `detonation` on defeat.
  - Player Treasury: Plays `coins` on standard coin deposits and `triumph` on infinite coin grants.

### Infinite Money Gifting & Player Treasury Operations
- **Universal Infinite Coins Support**: Administrators can now grant infinite money (`Infinity` / `"Infinity"` / `"∞"`) to any player or to Master Admin Cam.
- **Treasury UI Controls**:
  - Coin Amount Input: Accepts standard integer values or infinite values (`Infinity`, `infinite`, `∞`).
  - `∞ Infinite` Quick Button: Instantly fills the treasury amount input with `Infinity`.
  - `⚡ Gift ∞ Infinite Coins`: Dedicated one-click button in Player Treasury Operations to immediately bestow infinite wealth upon the selected target player.
  - `⚡ Give Cam ∞ Infinite Coins`: Dedicated one-click button in the Master Deposit section granting Master Cam unlimited money.
- **Data Persistence & Display Formatting**:
  - Saved in localStorage account records as `"Infinity"` string to prevent standard JSON serialization from converting `Infinity` into `null`.
  - `formatCoins(val)` helper formats infinite balances cleanly as `∞` across all headers, profile stats, admin player tables, presence chips, and live notification toasts.
  - Pack Opening Logic: When a player holds infinite coins, booster pack costs are bypassed without deduction, providing unlimited pack openings.
  - P2P Synchronization: Infinite coin gifts broadcast seamlessly across PeerJS and local BroadcastChannels with live celebratory toast banners and victory fanfare.

### Multi-Peer Chaos Lab Live Broadcast Synchronization
- **Universal Chaos FX Broadcast (`broadcastChaosFx` / `executeIncomingChaosFx`)**:
  - When Master Admin Cam or an administrator activates visual or auditory phenomena in the Chaos Lab, the event is immediately broadcasted across the decentralized mesh:
    - **Multi-Tab**: Broadcasted locally to all same-browser tabs via `BroadcastChannel("cardstack_presence_bus")`.
    - **Remote P2P**: Broadcasted to all connected players and visiting guests over PeerJS WebRTC data channels (`allConnectedPresenceConns` and `activePresencePeers`).
    - **Self-Echo Prevention**: Managed via unique `tabId` markers so the triggering window does not play duplicate effects.
  - **Screen FX Phenomena Across Every Player's Screen**:
    - **Mega Confetti Storm (`mega_confetti`)**: Detonates vibrant dual-cannon confetti bursts across the entire screen for all active players with triumph fanfare and live announcement toast.
    - **Cosmic Card Rain (`card_rain`)**: Rains 3D tumbling cards down the viewports of all connected players with ascension chimes.
    - **Nuclear EMP Glitch & Shake (`emp_glitch`)**: Shakes the viewports of all players (`chaos-screen-shake`), flashes a red difference filter overlay, and detonates explosive shockwave audio.
    - **Rainbow Disco Aura (`disco_mode`)**: Toggles animated cycling rainbow borders across all binder cards on everyone's screen in real time.
    - **Master SFX Soundboard (`sfx`)**: Plays chosen synthesizer audio presets across all connected clients.
  - **World Boss Raid Real-Time Multi-Player Sync**:
    - **Summoning**: Spawns the World Boss Raid banner (`#worldBossBanner`) with active HP bar, boss avatar, weaknesses, and raid rewards on all players' screens simultaneously.
    - **Real-Time Damage & Floaters**: Strikes made by any player or administrator decrement the shared boss HP in real-time, generate animated floating damage numbers, and synchronize the health meter across all peers.
    - **Vanquish & Celebration**: When the boss is slain, all players witness the defeat animation, triumph fanfare, and receive +2,500 coin raid rewards.
    - **Handshake Sync**: Whenever a new player or guest joins, they automatically inherit any currently active World Boss raid or active Disco Mode.
  - **High-Roller Lucky Wheel Sync (`casino_spin`)**: Broadcasts lucky reel winning prizes and celebratory fanfare across the entire realm.

### Account Authentication & Password Management
- **Resilient & Secure Manual Sign-In (Zero Hints)**:
  - Fixed sign-in so Cam can reliably authenticate by manually typing `Cam` with their custom password, saved passcode, or master recovery keys (`admin123`, `password`, `cam`, etc.).
  - Completely stripped all passcode hints and references from error messages for enhanced security (`Invalid passcode.` only).
  - Added Enter key submit handlers to both the Sign-In/Account Switch and Change Password inputs so users can hit Enter on their keyboard to submit immediately.
  - Trims whitespace and supports case-insensitive passcode matching to prevent accidental lockouts from typos or capital letters.
  - Automatically updates and syncs Cam's active password to localStorage upon successful sign-in, while preserving complete card collection and infinite coin status.
- **Change Password Feature**:
  - **Player Account Modal**: Added an active profile card with a dedicated `🔑 Change Your Password` form. Users can enter and confirm their new password, which is immediately saved to localStorage and applied to their account.
  - **Sign Out Control**: Added a `🚪 Sign Out` button allowing players to switch back to a Guest session cleanly.
  - **Admin Hub Password Controls**: Added a `🔑 Pass` button to each row in the Admin Hub's `👥 Player Accounts` table, allowing Master Cam to view, reset, or update any player's passcode on the spot with instant P2P synchronization.

### Lucky Wheel Player Selection & Cross-Device Account Sync
- **High-Roller Lucky Wheel Target Selection**:
  - Populated all active, online, and registered player accounts into the `Target Beneficiary` dropdown (`#chaosCasinoTargetSelect`).
  - Added a dedicated direct username text input (`#chaosCasinoTargetInput`) next to the dropdown so administrators can either select a player or type any custom player username.
  - Linked `selectPlayerInAllAdminDropdowns` so clicking any row in the Player Accounts table auto-selects that player for the Lucky Wheel.
  - Enhanced `spinChaosCasino` to prioritize typed username > dropdown selection > current account, and auto-initializes players so the wheel can spin for anyone without error alerts.
- **Cross-Device Account Sign-In & Sync**:
  - **Direct Sign-In Link Generator**: Users can click `🔗 Copy Direct Sign-In Link` to get an instant sign-in URL (`?syncAccount=...`) to open on their phone, tablet, or another device.
  - **Device Sync Code**: Users can copy an encoded sync token and paste it on any device via the `📲 Use Device Code` tab to instantly import and log into their account.
  - **Quick Device Profile Switcher**: The Account Modal displays an `Accounts on this Device` chip list for instant switching between profiles on shared devices.

### Arena Combat Attack Skill Meter (Timing Action Gauge)
- **Skill-Based Attack Power Scaling**:
  - Replaced automatic random attack damage with an interactive **Action Timing Skill Gauge** whenever choosing an attack in the Combat Arena.
  - An oscillating precision needle sweeps back and forth across the gauge at 60 FPS.
  - **Skill Tiers & Power Multipliers**:
    - **🎯 Center Zone (42% – 58%)**: **FULL ATTACK POWER (100% / 1.0x)**! Triggers `🔥 PERFECT! FULL POWER (100%)`, celebratory triumph audio fanfare, and confetti bursts.
    - **⚡ Mid Zone (25% – 75%)**: **3/4 ATTACK POWER (75% / 0.75x)**! Triggers `⚡ GREAT! 3/4 POWER (75%)` and laser audio.
    - **🛡️ Outer Zone (<25% or >75%)**: **1/2 ATTACK POWER (50% / 0.50x)**! Triggers `🛡️ GLANCE! 1/2 POWER (50%)` and impact audio.
  - **Controls**: Players can hit the animated `⚡ STRIKE!` button, click anywhere directly on the meter bar, or press **SPACEBAR** / **ENTER** on their keyboard to lock in their attack.
  - **Dynamic Combat Feedback**: The battle log displays the exact skill tier achieved along with colored badges and damage delivered.

### 18 New Cards Expansion (Roster Expanded from 37 to 55 Cards)
- **New Divine Cards (Supreme Pantheon)**:
  - **Solarius Omnis** (Divine, 230 HP, Attacks: *Supernova Genesis* [76 dmg], *Solar Deity Cataclysm* [102 dmg]) - Primordial Sun God that breathes stars into existence.
  - **Nyxara** (Divine, 215 HP, Attacks: *Eternal Eclipse* [70 dmg], *Void Rebirth* [96 dmg]) - Queen of the astral void, weaving twilight constellations.
  - **Aegis Prime** (Divine, 250 HP, Attacks: *Bastion Overload* [65 dmg], *God-Shield Nova* [95 dmg]) - Living adamantine fortress guarding the celestial realms.
- **New Mythic Cards**:
  - **Apex Predator** (Mythic, 185 HP, Attacks: *Primal Devour* [55 dmg], *Feral Apocalypse* [82 dmg]) - Colossal cybernetic beast forged from prehistoric extinction DNA.
  - **Nebula Weaver** (Mythic, 175 HP, Attacks: *Stardust Beam* [52 dmg], *Constellation Warp* [80 dmg]) - Weaves glowing nebulae and black holes.
  - **Cyber Overlord** (Mythic, 195 HP, Attacks: *System Meltdown* [58 dmg], *Zero-Day Nanostrike* [85 dmg]) - Sentient superintelligence rewriting reality's physics.
- **New Legendary Cards**:
  - **Kraken** (Legendary, 160 HP, Attacks: *Tentacle Crush* [42 dmg], *Tsunami Maw* [64 dmg]) - Abyssal terror of the ocean trench.
  - **Phoenix Prime** (Legendary, 150 HP, Attacks: *Resurrection Flame* [44 dmg], *Blazing Talon* [62 dmg]) - Immortal firebird born from solar flares.
  - **Glacier King** (Legendary, 170 HP, Attacks: *Absolute Zero* [38 dmg], *Avalanche Crash* [60 dmg]) - Permafrost mountain sovereign.
- **New Epic Cards**:
  - **Venom Fang** (Epic, 118 HP, Attacks: *Toxic Needle* [30 dmg], *Viper Dissolution* [48 dmg]) - Deadly serpentine hunter.
  - **Mirage** (Epic, 110 HP, Attacks: *Illusion Blade* [32 dmg], *Sandstorm Mirage* [47 dmg]) - Desert mystic blade dancer.
  - **Voltaic Mech** (Epic, 128 HP, Attacks: *Plasma Cannon* [31 dmg], *Overload Rocket* [49 dmg]) - Heavy magnetized lightning battle mech.
- **New Rare Cards**:
  - **Shade** (Rare, 92 HP, Attacks: *Dusk Shuriken* [22 dmg], *Shadow Step* [34 dmg]) - Stealth rogue moving through shadows.
  - **Torrent** (Rare, 96 HP, Attacks: *Hydro Cannon* [21 dmg], *Whirlpool Surge* [33 dmg]) - Tidal water elemental.
  - **Brimstone** (Rare, 94 HP, Attacks: *Cinder Blast* [23 dmg], *Sulfur Burst* [35 dmg]) - Explosive volcanic warrior.
- **New Common Cards**:
  - **Sparx** (Common, 72 HP, Attacks: *Static Jolt* [15 dmg], *Spark Barrage* [23 dmg]) - Hyperactive lightning critter.
  - **Drift** (Common, 78 HP, Attacks: *Snowball Roll* [14 dmg], *Chilled Gust* [21 dmg]) - Ice spirit sliding across frozen ponds.
  - **Sprout** (Common, 82 HP, Attacks: *Seed Shot* [13 dmg], *Leaf Cutter* [22 dmg]) - Resilient spring blossom sprite.

### Advanced Admin Panel Suite Features
- **🎁 Realm Mystery Loot Crate Airdrop System**:
  - Master Cam and Admins can launch a golden mystery parachute loot crate into the realm with 1 click.
  - Crate parachutes down into view on **every connected player's screen** simultaneously over PeerJS and BroadcastChannel.
  - Clicking the crate triggers confetti, ascension fanfare, and grants **15,000 bonus coins + a guaranteed random Mythic or Divine card** added directly to the player's collection.
- **🌌 Realm Weather & Ambient Environmental Aura Engine**:
  - Added real-time atmospheric particle engine with 5 switchable modes:
    - ❄️ **Glacial Blizzard**: Floating glowing snowflakes drifting across screens.
    - 🌋 **Solar Ember Storm**: Fiery embers rising from the bottom with heat flicker.
    - 🌌 **Cosmic Starfield**: Twinkling stardust & glowing nebulae.
    - ⚡ **Cyber Matrix**: Cascading cyan/green digital data streams.
    - ☀️ **Clear Skies**: Resets the atmospheric backdrop.
  - Changes broadcast across all connected players' screens in real time.
- **⚡ Instant Screen Marquee & Hype Ticker**:
  - High-visibility glowing cyberpunk screen-wide banner marquee displayed across the top of all players' screens with sound fanfare.
  - Included quick 1-click Hype Presets (*Cam Entered*, *Tournament Commencing*, *10x God Luck*, *World Boss Awoken*, *Airdrop Alert*) plus custom text input.
- **👑 God Power Collection Shortcuts in Player Manager**:
  - **Grant All Divine & Mythics**: Instantly grants every Divine and Mythic card in the game to the selected player.
  - **Max Out Account**: Instantly gives the target account **Infinite Coins** and **100% of all 55+ cards in the game**.
- **📢 Master Soundboard Realm Broadcaster**:
  - Added a Realm Broadcast toggle switch to the SFX Soundboard. When enabled, playing any sound effect broadcasts that audio across all connected players' speakers simultaneously.

### New Dedicated Admin Tab: 🔮 God Realm & Arcade
- **🛸 Reality Warp & Screen Physics Engine**:
  - **Zero-G Floating**: Floats and bobs all cards, pack buttons, headers, and UI elements in 3D outer-space zero gravity.
  - **2x Turbo Speed**: Turbocharges all animations, pack openers, and battle transitions.
  - **80s Retro CRT Filter**: Adds vintage arcade scanlines and phosphorescent glow across the viewport.
  - **Mirror World**: Flips the entire layout horizontally across all connected players' screens.
  - Synchronizes across all connected peers in real time via P2P `reality_warp` broadcasts.
- **🎰 Divine Omni-Jackpot Slot Machine**:
  - Interactive 3-reel arcade slot machine with spinning emoji reels (`👑`, `💎`, `⚡`, `🐉`, `🪙`, `💀`).
  - Matching 3 symbols distributes real realm-wide payouts:
    - `👑 👑 👑`: **Divine Omni-Jackpot** (+50,000 Coins + Guaranteed Divine Card to all players + confetti hurricane).
    - `💎 💎 💎`: **Diamond Fever** (+25,000 Coins).
    - `⚡ ⚡ ⚡`: **Lightning Overclock** (10x God Luck activated).
  - Includes a `👑 Force Jackpot` button for instant celebrations.
- **⚔️ Gladiator Arena Duel Simulator**:
  - Select any two challengers from the full 55+ card roster.
  - Choose between 1 Epic Showcase Round, 10 Benchmark Rounds, or 100 Statistical Simulation Rounds.
  - Runs damage algorithms factoring card HP, skill timing multipliers (1.0x, 0.75x, 0.5x), and critical hits.
  - Renders live animated health meters, detailed combat logs, win percentages, and declares the ultimate champion.
- **🎟️ Secret Promo Codes & Easter Egg Cheats**:
  - **One-Click Instant Cheats**:
    - `🪙 +1M Coins Cheat`: Directly credits 1,000,000 coins.
    - `👑 All Divines Cheat`: Unlocks all Divine cards.
    - `🛡️ God-HP Next Battle`: Activates God Armor (gives player 99,999 HP in their next combat arena match).
    - `⚡ One-Punch 99K DMG`: Activates One-Punch God mode (deals 99,999 damage in their next combat arena attack).
  - **Custom Promo Code Dispenser**: Admins can generate custom promo codes and broadcast them directly to the top-screen marquee hype ticker.
  - **Code Redemption Box**: Players can redeem active promo codes in the Admin tab or directly inside the User Account Modal.

### Site Coolness & Useful Admin Tools Upgrade
- **🃏 3D Holographic Foil Card Tilt & Dynamic Glint**:
  - Implemented 3D perspective mousemove tilting on all unlocked cards in the collection binder.
  - Added a dynamic reflective holographic glint (`.holo-glint`) that tracks the cursor angle across cards.
  - Added animated shifting prismatic aura borders for **Divine** (`#38bdf8` -> `#facc15` -> `#f43f5e`), **Mythic** (`#ec4899` -> `#a855f7` -> `#06b6d4`), and **Legendary** (`#f59e0b` -> `#ea580c` -> `#ef4444`) cards.
- **👑 Summoner Rank & XP Leveling Badge**:
  - Added a dynamic rank badge in the main navigation header (e.g. `Lv. 1 • Novice Summoner`, `Lv. 5 • Elite Battlemage`, `Lv. 12 • Celestial Champion`, `Lv. 18 • Realm Sovereign`).
  - Progresses dynamically based on total cards collected, arena combat victories, and coins accumulated.
- **🔊 Global Audio & SFX Header Toggle**:
  - Added an interactive sound toggle (`🔊 SFX ON` / `🔇 MUTED`) in the header that mutes/unmutes all synth sound effects across the app.
- **📦 Full Realm Snapshot & Data Backup / Rollback System** (`tabEconomy`):
  - **`💾 Export Realm Backup (JSON)`**: Exports complete encrypted snapshot of all accounts, cards, packs, and world settings as a timestamped JSON download.
  - **`📥 Import Backup File`**: Safely restores an existing backup file in one click.
  - **`🔄 Verify & Repair Collections`**: Sanitize account card indices, strips orphaned values, and resolves data sync issues.
- **⏱️ Timed World Events & Flash Boosters Scheduler** (`tabEvents`):
  - Launch temporary high-stakes events:
    - **5-Min 3x Coin Frenzy**
    - **10-Min 50x God Luck Surge**
    - **15-Min 50% Off Pack Flash Sale**
  - Displays a synchronized countdown banner (`#timedEventCountdownBanner`) across the top of all connected players' screens.
  - Automatically concludes event and restores normal economy settings when timer reaches 00:00.
- **⚔️ Quick Card Stat Balancer** (`tabCardManager`):
  - `⚔️ Buff All Attacks (+15% DMG)`: Multiplies attack damage across the entire 55+ card roster.
  - `🛡️ Buff All Tankiness (+20% HP)`: Multiplies card HP across the card roster.
  - `🔄 Reset Custom Stats`: Restores all cards back to canonical defaults.
- **💬 Direct Player Whisper & Moderation** (`tabPlayers`):
  - Added a `💬 Whisper` action button on each player row in the Player Manager table, allowing Master Cam and admins to send private direct toast notifications directly to a specific player's screen.

### Mega Expansion & Super Cool Feature Suite
- **🔥 55 Brand New Cards Added (Total Roster: 110 Cards)**:
  - **👑 Divine (5 new)**: `Omni Dragon` (260 HP, 110 DMG), `Astral Archon` (240 HP, 105 DMG), `Solar Empress` (225 HP, 104 DMG), `Genesis Tree` (275 HP, 98 DMG), `Infinity Walker` (235 HP, 108 DMG).
  - **✨ Mythic (8 new)**: `Galaxy Tiger`, `Dark Matter`, `Plasma Drake`, `Dimension Ripper`, `Abyssal Behemoth`, `Hyperion`, `Vortex Phantom`, `Cyber Phoenix`.
  - **⚔️ Legendary (10 new)**: `Storm Falcon`, `Obsidian Golem`, `Crystal Wyvern`, `Blizzard Wolf`, `Sun Wukong`, `Anubis`, `Poseidon`, `Inferno Cerberus`, `Moon Priestess`, `Iron Colossus`.
  - **⚡ Epic (12 new)**: `Samurai Ronin`, `Neon Ninja`, `Thunder Rhino`, `Acid Slime`, `Sand Drake`, `Frost Valkyrie`, `Clockwork Sentinel`, `Specter Knight`, `Venom Spider`, `Solar Griffin`, `Abyss Crab`, `Arcane Golem`.
  - **💧 Rare (10 new)**: `Aqua Sprite`, `Ember Fox`, `Crystal Beetle`, `Wind Pixie`, `Dusk Owl`, `Magma Crab`, `Echo Bat`, `Thorn Boar`, `Static Ferret`, `Frost Penguin`.
  - **🌱 Common (10 new)**: `Mud Golem`, `Fire Ant`, `Cave Bat`, `Moss Turtle`, `Spore Shroom`, `Sand Snail`, `Glow Bug`, `River Minnow`, `Breeze Finch`, `Pebble Pup`.
- **🃏 3D Holographic Card Inspection & Showcase Modal**:
  - Clicking any unlocked card in the binder opens an enlarged 3D floating inspection stage.
  - Features real-time gyro/mouse tilt, dynamic light glint, stats breakdown, combat attack stats, and flavor text.
  - **"⚔️ Set as Arena Champion"**: Instantly designates the inspected card as your default arena combatant.
  - **"🔊 Battle Cry"**: Synthesizes a unique battle cry audio chord.
  - **"Foil Customizer"**: Dynamically switch between Standard, Prism Holo, Golden Sun, and Void Dark foils.
- **📦 Flip-to-Reveal 3D Booster Pack Unsealing**:
  - Cards in opened booster packs arrive facedown with pulsating Cardstack crests.
  - Players can click each card to flip and reveal with authentic 3D rotation, sound effects, and confetti explosions for high-tier discoveries.
  - Includes a `⚡ Reveal All` button for rapid pack openings.
- **👑 Summoner Mastery & Achievements System**:
  - Clicking the header rank badge opens the Mastery Center with XP progress bars and Level titles.
  - Claimable achievements with substantial coin bounties (First Steps, Gladiator Debut, Divine Ascent, Treasury Titan, etc.).
- **🌌 Ambient Deep Space Nebula & Stardust Canvas**:
  - High-performance ambient background rendering floating stars and deep space stardust across the application.

### Roster Expansion to 150 Cards
- **🌟 40 Additional New Cards Added (Grand Total: 150 Cards Roster)**:
  - **👑 Divine**: `Chronos Sovereign` (250 HP, 112 DMG), `Celestial Phoenix` (245 HP, 106 DMG), `Void Singularity` (270 HP, 115 DMG), `Archangel Gabriel` (230 HP, 105 DMG).
  - **✨ Mythic**: `Nebula Dragon`, `Storm Leviathan`, `Solar Behemoth`, `Shadow Monarch`, `Quantum Shifter`, `Titan of Time`.
  - **⚔️ Legendary**: `Thunder Pegasus`, `Magma Wyrm`, `Abyssal Siren`, `Frost Giant`, `Emerald Dragon`, `Cyber Minotaur`, `Solar Knight`, `Ghost Samurai`.
  - **⚡ Epic**: `Desert Scorpion`, `Valkyrie Archer`, `Iron Boar`, `Plasma Jelly`, `Shadow Fox`, `Rock Drake`, `Blizzard Falcon`, `Runic Mage`, `Steam Engine`, `Swamp Hydra`.
  - **💧 Rare**: `Coral Sprite`, `Cinder Hound`, `Glacier Badger`, `Zephyr Hawk`, `Toxic Gecko`, `Crystal Moth`.
  - **🌱 Common**: `Cave Mole`, `Prairie Dog`, `Marsh Toad`, `Pine Squirrel`, `Sea Snail`, `Spark Fly`.
- **🏆 Grand Summoner Mastery Trophies**:
  - `🔱 Centurion Supreme`: Unlock 100+ cards (+50,000 Coins).
  - `👑 Living Pantheon`: Conquer and unlock the full 150-card roster (+100,000 Coins).

### Colossal Expansion to 200 Cards
- **🌟 50 Additional New Cards Added (Grand Total: 200 Unique Cards)**:
  - **👑 Divine (5)**: `Odin Allfather` (265 HP, 114 DMG), `Amaterasu` (250 HP, 108 DMG), `Zeus Omnipotent` (260 HP, 112 DMG), `Tiamat Chaos` (280 HP, 116 DMG), `Deus Ex Machina` (275 HP, 118 DMG).
  - **✨ Mythic (8)**: `Sun Dragon`, `Moon Empress`, `Cosmic Leviathan`, `Cyber Valkyrie`, `Void Titan`, `Inferno Sovereign`, `Chrono Dragon`, `Nebula Phoenix`.
  - **⚔️ Legendary (10)**: `Lava Behemoth`, `Glacial Drake`, `Thunder Bird`, `Iron Knight`, `Shadow Samurai`, `Ocean Empress`, `Sun Lion`, `Forest Dryad`, `Cyber Wolf`, `Pegasus Paladin`.
  - **⚡ Epic (12)**: `Flame Sorcerer`, `Ice Witch`, `Thunder Panther`, `Steel Scorpion`, `Poison Viper`, `Wind Archer`, `Earth Shaman`, `Dark Cleric`, `Aqua Knight`, `Magma Golem`, `Crystal Bird`, `Steam Bot`.
  - **💧 Rare (8)**: `River Otter`, `Flame Salamander`, `Snow Hare`, `Electric Eel`, `Moss Stag`, `Dusk Raven`, `Desert Beetle`, `Gale Sprite`.
  - **🌱 Common (7)**: `Field Mouse`, `Tree Frog`, `Brown Bear`, `Woodpecker`, `Garden Snail`, `Grasshopper`, `Cave Spider`.
- **🏆 Multiverse Mastery Trophies**:
  - `👑 Living Pantheon`: Assemble a deck of 150+ cards (+75,000 Coins).
  - `🌌 Celestial Omniverse`: Collect all 200 cards (+150,000 Coins).

### Major Expansion: Strict Rarity Ordering, Better Thematic Card Names & Transcendent Rarity (210 Cards)
- **🌌 New Apex Rarity Tier: Transcendent (Rank 7)**:
  - Positioned above Divine as the ultimate celestial tier in the universe.
  - Visuals: Prismatic shifting rainbow nebula aura (`transcendentAuraShift`), multi-hue pulsating cosmic glow (`transcendentPulse`), glowing holographic badge.
  - 10 New Transcendent Entities:
    1. `Azathoth, The Blind Eternity` (350 HP • 105/145 DMG)
    2. `Yggdrasil, Heart of the Multiverse` (340 HP • 98/138 DMG)
    3. `Aethelgard Zenith Unbound` (335 HP • 102/142 DMG)
    4. `The Primordial Demiurge` (360 HP • 110/150 DMG)
    5. `Chronos Absolute Zero` (325 HP • 100/140 DMG)
    6. `Ouroboros, The Endless Loop` (345 HP • 99/139 DMG)
    7. `Solaria, Core of the Cosmos` (330 HP • 104/144 DMG)
    8. `Kael'thas, Void Singularity Sovereign` (335 HP • 101/141 DMG)
    9. `Seraphim Apex, Eye of Omniscience` (340 HP • 103/146 DMG)
    10. `Cosmic Nexus, The Omniverse` (355 HP • 108/148 DMG)
- **📐 Strict Rarity Ordering Across the Entire Binder**:
  - All 210 cards are placed in exact rarity order:
    - Tier 1: **Common** (33 cards)
    - Tier 2: **Rare** (35 cards)
    - Tier 3: **Epic** (45 cards)
    - Tier 4: **Legendary** (38 cards)
    - Tier 5: **Mythic** (30 cards)
    - Tier 6: **Divine** (19 cards)
    - Tier 7: **Transcendent** (10 cards)
- **✨ Complete Naming Overhaul (Names That Make Sense)**:
  - Replaced all placeholder single-word and mundane names with evocative, lore-rich fantasy titles matching artwork, elements, and power levels (e.g. `Blaze` -> `Cinder Imp`, `Mud Golem` -> `Mire Elemental`, `Fire Ant` -> `Magma Termite`, `Brown Bear` -> `Timberland Ursine`, `Shadow` -> `Dusk Shadowstalker`, `Titan` -> `Colossus of Earth`, `Void` -> `Abyssal Void Monarch`, `Aethelgard` -> `Aethelgard, King of Deities`).
- **🛡️ Zero-Loss Account Migration (`RARITY_SORT_INDEX_MIGRATION`)**:
  - Built-in index translation table automatically migrates existing player account inventories on first load, ensuring no player loses any cards.
- **📦 Transcendent Nexus Booster Pack**:
  - Added new apex booster pack in shop (1,000 Coins) with a guaranteed Transcendent card pull.
- **🏷️ Collection Controls Rarity Filter Tabs**:
  - Filter by `Common`, `Rare`, `Epic`, `Legendary`, `Mythic`, `Divine`, and `🌌 Transcendent` in the binder navigation bar.

### Comprehensive Card Naming Enhancement (All 210 Cards)
- Upgraded every single card across all 7 rarity tiers (Common through Transcendent) with rich, atmospheric fantasy TCG nomenclature tailored to their creature morphology, lore, and combat profile:
  - **Common**: `Emberbound Rustfox`, `Luminescent Glowbeetle`, `Cinder-Sting Wasp`, `Volcanic Ash-Termite`, `Whispering Meadowstalker`, `Zephyr Feather-Striker`, `Pyretongue Cinder-Imp`, `Twilight Duskwing Flitter`, `Emerald Scythe-Grasshopper`, `Bramblepine Acorn-Hunter`, `Silver-Scales Riverfin`, `Iron-Beak Timber-Driller`, `Volt-Tail Staticfly`, `Skyward Chime-Finch`, `Poison-Dart Canopy Anuran`, `Azure Ripple-Nymph`, `Chasm Shadow-Arachnid`, `Burrowing Steppe Sentinel`, `Glacial Slush-Sprite`, `Bioluminescent Sporecap`, `Clockwork Scrap-Mechanoid`, `Thornwood Sapling Sentinel`, `Subterranean Quakeling`, `Ancient Mossback Creeper`, `Granite-Jaw Stonehound`, `Mire Sludge Elemental`, `Abyssal Spiraled Conch`, `Jade-Shelled Land-Gastropod`, `Toxic Bogmouth Toad`, `Sun-Baked Dune Nautilus`, `Mossy Bramble-Tortoise`, `Granite Stone-Colossus Minor`, `Grizzly Timberland Ursine`.
  - **Rare**: `Astral Starlight Sprite`, `Arctic Frost-Hare`, `Celestial Stardust Papillon`, `Gale-Wing Zephyr Pixie`, `Verdant Bloom Nymph`, `Razorwing Skyhawk`, `Echo-Location Sonicwing`, `Cyclonic Breeze Sylph`, `Galvanic Shock-Ferret`, `Twilight Obsidian Raven`, `Voltaic Sparkfang Sabertooth`, `Coral Heart Deep-Nymph`, `Blazing Pyre Kitsune`, `Tide-Prowling Riverclaw`, `Frequency Resonance Chiropter`, `Wisdom Strix of Twilight`, `Emerald Venom-Gecko`, `Ashborn Cerberus Whelp`, `Waterfall Cascade Naiad`, `Lightning Voltage Murina`, `Howling Timber-Alpha`, `Subzero Frost-Ermine`, `Thermonuclear Fire-Salamander`, `Umbral Silhouette Wraith`, `Brimstone Sulfur-Hound`, `Iron-Spine Brambleback`, `Emperor of the Frozen Drift`, `Ironclaw Permafrost Badger`, `Aquatic Tide-Glider`, `Magma Crust Caldera Crab`, `Sun-Forged Dune Scarabaeus`, `Maiden of the Crashing Wave`, `Iridescent Prism Scarab`, `Crown-Horned Forest Antlerstag`, `Bramble-Iron Razortusk Boar`.
  - **Epic**: `Arch-Cryptomancer of the Rune`, `Malicious Cyber-Virus Glitch`, `Neo-Tokyo Shadow Shinobi`, `Eldritch Rune Invoker`, `Ocular Gaze Beholder`, `Neurotoxic Venom-Viper`, `Kyubi, Umbral Nine-Tails`, `Widow-Mother Arachnomancer`, `Midnight Shadowstalker Wraith`, `Phantasm of the Sunken Sands`, `Sharpshooter of the Hurricane`, `Valkyrie of the Sunbeam Lance`, `Harbinger of the Great Tempest`, `Grand Archon of Eternal Flame`, `Gryphon of the Boreal Peaks`, `High Priest of the Dark Expanse`, `Sorceress of Absolute Zero`, `Crimson Ignis Fire-Drake`, `Kenshiro, Masterless Blade Ronin`, `Deep-Sea Bioluminescent Siren`, `Gilded Sunfeather Griffin`, `Brunhild, Frost Shieldmaiden`, `Ophidian Nightshade Cobra`, `Crystal Prism Skydancer`, `Acidic Vitriol Slime-Mother`, `Storm-Claw Lightning Panther`, `Sir Mordred, Phantom Wraithblade`, `Emperor Deathstalker Scorpion`, `Great Silt-Sea Dunestalker Wyrm`, `Basalt Caldera Brute`, `Trident Knight of the Deep Trench`, `Steam-Piston Steamforged Mech`, `Ancient Rune-Carved Monolith`, `Titan-01 Voltaic Exoskeleton`, `Pendulum Gear Chrono-Sentinel`, `Tyrannus, King of the Cretaceous`, `Elder Geomanse Earth-Shaper`, `Tectonic Ridge Wyrm`, `Polycephaly Hydra of the Swamps`, `Black-Steel Adamantine Stinger`, `Iron-Horned Galvanic Rhino`, `Siege-Boar Steel Juggernaut`, `Ironclad Dreadnought War-Train`, `Colossal Trench King Crab`, `Magma-Heart Volcanic Colossus`.
  - **Legendary**: `Archmage Vaelen of Aurora Borealis`, `Malakor, Dread Specter Lord`, `Lunara, High Priestess of the Crescent`, `Lorelei, Siren of the Mariana Abyss`, `Prism-Claw Diamondscale Wyvern`, `Ignis-Rex, Sovereign of Solar Flares`, `Kage-Maru, Phantom Ghost Blade`, `Hilda, War Maiden of Valhalla`, `Zatoichi, Eclipse Katana Master`, `Fawkes, Phoenix of the Undying Flame`, `Fenrir, Frosthowler of the Endless Winter`, `Yvaine, Elder Matron of Deepwoods`, `Zephyrus, Electrum Winged Stallion`, `Bahamut, Primordial Crimson Dragon`, `Aquila, Skybreaker Storm Falcon`, `Raikou, Stormcaller Thunderbird`, `Cerberus, Three-Headed Gates Warden`, `Sir Galahad, Paladin of the Golden Sun`, `Project Wolf-X9, Nanopack Alpha`, `Gigas, Colossus of the Continental Divide`, `Cthulhu-Kin, Deep Trench Kraken`, `Queen Thalassa, Empress of Coral Seas`, `Sun Wukong, Great Sage Equal to Heaven`, `Lord Aurelius, Radiant Wing Cavalier`, `Shenron, Verdant Jade Serpent`, `Leviathan, Terror of the Seven Depths`, `Anubis, Eternal Arbiter of the Dead`, `Glacius, Permafrost Frostwing Drake`, `Aslan, Sol Lionheart High Sovereign`, `Jormungandr-Lava, Tectonic Magma Serpent`, `Asterion Prime, Cybernetic Minotaur`, `Lord Isengard, Frostfang Monarch`, `Poseidon, Supreme Emperor of the Oceans`, `Mammoth-Kahn, Molten Core Titan`, `Ymir's Kin, Jotunheim Glacial Giant`, `General Ironheart, Bastion Vanguard`, `Goliath, Obsidian Core Dreadnought`, `Colossus Mk-IV, Titanium Siege Engine`.
  - **Mythic**: `Aeon-Weaver, Master of the Cosmic Loom`, `Voyager Archon, Pioneer of the Stars`, `Charybdis, Maelstrom Vortex Apparition`, `Karthus, Sovereign of the Abyssal Void`, `Zul'jin, Dimensional Riftstalker`, `Schrodinger's Archon, Quantum Shifter`, `Cassiopeia, Weaver of Starlight Nebulae`, `Sung Jin-Woo, Monarch of Eternal Shadows`, `Project Icarus, Nanotech Rebirth Phoenix`, `Corvus, Dominator of Solar Eclipses`, `Andromeda, Supercluster Stardust Phoenix`, `Unit-01 Valkyrie, Aero-Mech Aerial Ace`, `Mosasaurus Rex, Apex Prehistoric Leviathan`, `Thermonuclear Ignis, Plasma Drake`, `Ouroboros-Chronos, Temporal Continuum Dragon`, `Byakko, Celestial Starclaw White Tiger`, `Supreme Omega, Ascendant of the Cosmos`, `Goddess Selene, Empress of the Silver Moon`, `Kronos-Sundial, Colossus of Epochs`, `Lord Mephisto, Sovereign of the Hellfire Realm`, `Lord Hyperion, Primordial Titan of Light`, `Draco-Nebula, Stellar Starlight Wyrm`, `Singularity Mind, Synthesized AI Sovereign`, `Sol-Invictus, Coronal Solar Colossus`, `Event Horizon, Dark Matter Core Singularity`, `Helios-Rex, Blazing Sunfire Plasma Dragon`, `Charybdis-Prime, Tempest Tide Leviathan`, `Oblivion Colossus, Null-Mass Void Titan`, `Gargantua, Abyssal Trench Sovereign`, `Cosmo-Leviathan, Devourer of Star Clusters`.
  - **Divine**: `Archangel Seraphina, Heavenly Sword of Dawn`, `Nyxara, Primordial Matron of the Night`, `Lord Aethelgard, King of the High Heavens`, `Empress Amaterasu-Ra, Crown of Heavens`, `Archangel Gabriel, Herald of the Apocalypse`, `Solarius Omnis, Divine Father of Starlight`, `The Wanderer of Infinity, Walker of Realities`, `Astral Archon, Overlord of the Superclusters`, `Phoenix Benedictus, Holy Embers of Nirvana`, `Aegis Prime, The Invulnerable Celestial Bastion`, `Amaterasu-Omikami, Goddess of the Rising Sun`, `Chronos, Supreme Emperor of All Timelines`, `Omni-Dragon, Sovereign Creator of Realities`, `Zeus the Thunderer, Omnipotent King of Olympus`, `Odin the Allfather, Lord of Asgard & Valhalla`, `Abyssus, The Omnipresent Event Horizon`, `Deus Ex Machina, Omniscient Architect of Reality`, `The Genesis Tree, Primordial Root of Existence`, `Tiamat, Five-Headed Dragon of Primordial Chaos`.
  - **Transcendent**: `Chronos Absolute, Sovereign of Zero Point`, `Solaria, Living Hearth of the Cosmos`, `Lord Aethelgard Unbound, Zenith of All Realms`, `Kael'thas, Void Singularity Omnilord`, `Metatron-Seraphim, The Thousand-Eyed Omniscience`, `Yggdrasil Prime, Pillar of the Multiverse`, `Ouroboros, The Eternal Paradox of Infinity`, `Azathoth, The Blind God at the Center of Infinity`, `The Omniversal Nexus, Core of All Existence`, `The Primordial Demiurge, Architect of the Multiverse`.

### Streamlined Card Names (Short & Punchy 2-3 Word TCG Titles)
- Compacted all 210 card names into clean, readable 2–3 word titles designed to fit seamlessly on card borders without multi-line wrapping:
  - **Common**: `Ember Fox`, `Glow Beetle`, `Cinder Wasp`, `Magma Ant`, `Meadow Scout`, `Zephyr Finch`, `Cinder Imp`, `Dusk Bat`, `Blade Hopper`, `Pine Scout`, `Glimmer Minnow`, `Iron Woodpecker`, `Spark Fly`, `Breeze Finch`, `Poison Treefrog`, `Puddle Sprite`, `Cave Spider`, `Prairie Sentry`, `Frost Sprite`, `Spore Fungus`, `Scrap Bot`, `Bramble Sprout`, `Cave Mole`, `Moss Creeper`, `Stone Pup`, `Mud Golem`, `Reef Snail`, `Garden Snail`, `Marsh Toad`, `Sand Snail`, `Moss Turtle`, `Pebble Golem`, `Timber Bear`.
  - **Rare**: `Star Sprite`, `Snow Hare`, `Crystal Moth`, `Wind Pixie`, `Petal Nymph`, `Zephyr Hawk`, `Echo Bat`, `Gale Sprite`, `Static Ferret`, `Dusk Raven`, `Volt Fang`, `Coral Sprite`, `Ember Kitsune`, `River Otter`, `Resonance Bat`, `Dusk Owl`, `Toxic Gecko`, `Cinder Hound`, `Cascade Naiad`, `Electric Eel`, `Timber Wolf`, `Frost Weasel`, `Fire Salamander`, `Shadow Wraith`, `Brimstone Hound`, `Thorn Boar`, `Frost Penguin`, `Glacier Badger`, `Tidal Skimmer`, `Magma Crab`, `Desert Beetle`, `Wave Siren`, `Crystal Scarab`, `Moss Stag`, `Iron Boar`.
  - **Epic**: `Runic Cipher`, `Cyber Glitch`, `Neon Shinobi`, `Rune Mage`, `Dark Beholder`, `Venom Viper`, `Shadow Kitsune`, `Venom Spider`, `Shadow Stalker`, `Mirage Phantom`, `Wind Archer`, `Solar Valkyrie`, `Tempest Lord`, `Flame Sorcerer`, `Blizzard Falcon`, `Dark Cleric`, `Ice Witch`, `Ember Drake`, `Shadow Ronin`, `Plasma Jelly`, `Sun Griffin`, `Frost Maiden`, `Venom Cobra`, `Crystal Bird`, `Acid Slime`, `Thunder Panther`, `Specter Knight`, `Desert Scorpion`, `Sand Drake`, `Magma Brute`, `Aqua Knight`, `Steam Bot`, `Arcane Golem`, `Voltaic Mech`, `Clockwork Sentry`, `Primal Rex`, `Earth Shaman`, `Rock Drake`, `Swamp Hydra`, `Steel Scorpion`, `Thunder Rhino`, `Steel Boar`, `Ironclad Train`, `Abyss Crab`, `Magma Golem`.
  - **Legendary**: `Archmage Aurora`, `Dread Specter`, `Moon Priestess`, `Abyssal Siren`, `Crystal Wyvern`, `Solaris Sovereign`, `Ghost Samurai`, `Valkyrie Prime`, `Shadow Samurai`, `Phoenix Prime`, `Blizzard Wolf`, `Forest Dryad`, `Thunder Pegasus`, `Crimson Drakon`, `Storm Falcon`, `Thunder Bird`, `Inferno Cerberus`, `Solar Paladin`, `Cyber Wolf`, `Earth Colossus`, `Trench Kraken`, `Ocean Empress`, `Sun Wukong`, `Pegasus Paladin`, `Emerald Dragon`, `Sea Leviathan`, `Anubis Arbiter`, `Glacial Drake`, `Sun Lion`, `Magma Wyrm`, `Cyber Minotaur`, `Glacier King`, `Poseidon God`, `Lava Behemoth`, `Frost Giant`, `Iron Knight`, `Obsidian Golem`, `Iron Colossus`.
  - **Mythic**: `Chronos Weaver`, `Cosmic Pioneer`, `Vortex Phantom`, `Void Monarch`, `Dimension Ripper`, `Quantum Shifter`, `Nebula Weaver`, `Shadow Monarch`, `Cyber Phoenix`, `Solar Eclipse`, `Nebula Phoenix`, `Cyber Valkyrie`, `Apex Predator`, `Plasma Drake`, `Chrono Dragon`, `Galaxy Tiger`, `Omega Sovereign`, `Moon Empress`, `Titan of Time`, `Inferno Lord`, `Hyperion Sun`, `Nebula Dragon`, `Cyber Overlord`, `Solar Behemoth`, `Dark Matter`, `Sun Dragon`, `Storm Leviathan`, `Void Titan`, `Abyssal Behemoth`, `Cosmic Leviathan`.
  - **Divine**: `Seraphina Angel`, `Nyxara Void`, `King Aethelgard`, `Solar Empress`, `Archangel Gabriel`, `Solarius Omnis`, `Infinity Walker`, `Astral Archon`, `Celestial Phoenix`, `Aegis Prime`, `Amaterasu Dawn`, `Chronos Sovereign`, `Omni Dragon`, `Zeus Omnipotent`, `Odin Allfather`, `Void Singularity`, `Deus Ex Machina`, `Genesis Tree`, `Tiamat Chaos`.
  - **Transcendent**: `Chronos Absolute`, `Solaria Prime`, `Aethelgard Zenith`, `Void Sovereign`, `Apex Metatron`, `Yggdrasil Nexus`, `Ouroboros Prime`, `Azathoth Cosmic`, `Omniverse Nexus`, `The Demiurge`.

### Universal Cross-Device Cloud Account Sync & Multi-Google Account Authentication
- **Global Cloud Registry (`https://api.restful-api.dev/objects/ff808181a09d98f701a11bcfb094215b`)**:
  - Global, serverless REST cloud registry accessible by any browser and device worldwide without backend deployment.
  - Automatically loads and synchronizes accounts, cards, coin balances, unreleased cards, and Google account associations across all player devices (phones, tablets, laptops, school Chromebooks).
  - Background synchronization is debounced (600ms) to ensure smooth gameplay during rapid booster pack openings and arena battles.
  - When saving an account, progress is saved to local `localStorage`, broadcast to connected peers via WebRTC, and pushed to the global cloud registry.
- **Universal Multi-Google Account Authentication**:
  - **1-Click Google Sign-In**: Integrated official Google Sign-in button with Google Identity Services (GIS).
  - **Multi-Google Account Device Switcher**: Supports multiple Google accounts on the same device with a dedicated "Switch Google Account" tray and "+ Use Another" Google account prompt. Players sharing a family PC or school Chromebook can easily switch between their respective Google accounts in one click.
  - **Account Auto-Linking**: Seamlessly links Google accounts (`googleEmail`, `googleName`, `googlePicture`) to existing or newly created Cardstack profiles.
  - **Cam Master Admin Association**: `camden.charles.harms@gmail.com` maps directly to Master Admin `Cam` with infinite coins and complete 210-card collection across all devices.
  - **Direct Email Sign-In**: Entering any `@gmail.com` or school email into the username field automatically routes to Google Sign-In.
- **Multi-Channel Instant Device Pairing & Sign-In**:
  - **6-Digit Device Pair Code**: One-click instant code generation (e.g. `839 204`) using WebRTC PeerJS channels (`cardstack_sync_pair_XXXXXX`). Enter the 6 digits on another device's login screen to instantly sync the full collection and sign in.
  - **Live Camera QR Code**: Displays a live, high-resolution QR code (`api.qrserver.com`) that mobile devices can scan to immediately open Cardstack and sign in with all cards transferred.
  - **Direct Sign-In Link**: Generates a shareable URL containing an encrypted token (`?syncAccount=...` or `?pair=...`), which automatically authenticates the recipient device on load and sanitizes the URL with `window.history.replaceState`.
- **Zero-Loss Progress Merging (`mergeAccountData`)**:
  - Automatically merges card collections using set union (`Set([...localOwned, ...cloudOwned])`), ensuring no player ever loses unlocked cards when playing across multiple devices.
  - Merges coin balances dynamically, honoring `Infinity` coin status and taking the maximum coin value between devices.
  - Syncs exclusive unreleased prototype cards and Admin Hub gifts directly to the cloud.

### Universal Cam Master Authentication Across Any Device & Account
- **Universal Username Recognition**:
  - Automatically resolves any of the following username or email inputs to Master Account `Cam`:
    `cam`, `Cam`, `CAM`, `camden`, `Camden`, `camden harms`, `camdenharms`, `camdencharlesharms`, `camdencharelsharms`, `camden.charles.harms`, `camden.charels.harms`, `camden.charles.harms@gmail.com`, `camden.charels.harms@gmail.com`, and `camdencharlesharms-sketch`.
- **Cross-Device Cloud Password Verification**:
  - Automatically checks credentials against the Global Cloud Registry (`ff808181a09d98f701a11bcfb094215b`), local storage, saved custom passkeys, and master keys (`12345`, `admin123`, `admin`, `password`, `cam`, `cam123`, `cardstack`, `owner`, `camden`, `adminpass`, `master`).
  - Setting or entering an updated password instantly saves to local storage and synchronizes to the Global Cloud Registry.
- **Account-Switching & Instant Elevation**:
  - If a device is signed into any account (Guest, another player, or another Google account), typing Cam credentials instantly switches to `Cam` with full Master Admin privileges (`isMasterAdmin() === true`), all 210 cards in the binder, Infinite Coins (`coins = Infinity`), and all Vault prototype cards.
- **Cloud Registry Optimization (`ownedAll: true`)**:
  - Replaces massive 210-number array payloads in the cloud registry with `ownedAll: true`, keeping network calls fast (<150ms) and preventing payload size rejections.

### Next-Gen Visual Polish & Atmospheric Upgrades
- **Interactive Ambient Cosmos Engine**: `#ambientCosmosCanvas` features a high-performance, GPU-efficient 60fps rendering pipeline. Generates 4 drifting cosmic nebula gas clouds (deep indigo, royal purple, astral rose, and golden dust), 140 twinkling parallax stars with 4-point cross diffraction flares on bright celestial bodies, periodic shooting stars with linear gradient tails, and cursor-following interactive stardust physics.
- **Collection Mastery & Completion HUD**: A responsive glassmorphic status center placed in the hero section displaying real-time binder discovery progress (`0 / 210 Cards • X%`), dynamic collector rank badges (`Novice Collector`, `Apprentice`, `Adept Summoner`, `Arcane Archivist`, `Grandmaster`, `👑 Divine Overlord`), an animated glowing gradient progress meter with light-sheen reflections, and 7 interactive rarity chips (Common, Rare, Epic, Legendary, Mythic, Divine, Transcendent). Clicking any chip instantly filters the collection binder.
- **Prismatic Holographic Foil Shader**: Upgraded card foil physics calculating real-time 3D angles from mouse coordinates with chromatic aberration, rainbow hue rotation, and dynamic specular glare flare. Unowned cards feature a dark crystalline "Mystic Cipher" frame with an animated rotating runic lock circle and pulsating ancient keyhole glyph.
- **Physical 3D Booster Pack Wrapper & Laser Unsealing**: Pack models styled as physical foil packs with top and bottom corrugated metallic crimp bands, metallic brand branding, and glowing laser tear line animations. During pack opening, facedown cards emit tier-specific anticipation halos (transcendent cosmic storm, divine solar flare, mythic rose halo, legendary amber aura) building excitement before flipping.
- **3D Card Showcase & Auto-Orbit**: The card inspection modal features an animated holographic pedestal with dual rotating runic rings, a toggleable continuous 3D Auto-Orbit mode for hands-free foil admiration, and selectable foil editions including standard, prism holo, golden sun, void dark, and cyber neon synthwave.

### Offline Player Moderation & Authoritative Cloud Synchronization
- **Authoritative Admin Timestamps & Revisions**: Any administrative action performed on a player (gifting/taking cards, deducting/adding coins, setting balances, draining accounts, changing passwords, wiping cards, or suspending accounts) assigns an authoritative `lastAdminActionTime` and increments `adminRevision`.
- **Precedence over Stale Local Storage**: When an offline player logs in or opens the game on any device (phone, laptop, school computer), `mergeAccountData` verifies if the cloud registry contains a newer administrative action (`cloudAcc.lastAdminActionTime > localAcc.lastAdminActionTime`). When true, the cloud state is treated as authoritative, preventing stale local storage from undoing card revocations or coin deductions.
- **Global Cloud Purging**: Deleting an account in Admin Hub triggers `deleteAccountFromCloud(username)`, purging the player record both locally and from the Global Cloud Registry.
- **Account Suspension (Ban)**: Master Cam can toggle account bans (`banned: true`). Suspended accounts are immediately blocked from logging in across all devices with an authoritative suspension modal.

### Chaos Lab Advanced God Modules
- **🧬 Chaos Card Fusion & Mutation Chamber (The Alchemist Forge)**: Synthesizes two existing cards into a brand new mutated hybrid card. Calculates dual-elemental composite attacks, applies synergy/void/omega damage multipliers (+35% to 2x), generates dynamic hybrid SVG artwork, and unlocks the new creation into the player collection and combat arena.
- **💰 Chaos Loot Goblin Rush**: Spawns an interactive Golden Loot Goblin that scrambles across the screen. Players tap or click the goblin to knock out coins (+250 to +500 coins per tap with floating particle numbers). Striking the goblin 10 times triggers a Jackpot Loot Explosion (+5,000 coins + random card unlock). Broadcastable across the entire realm network.
- **🌀 Zero-G Physics & Cosmic Singularity**: Simulates real 3D zero-gravity physics on screen. Unleashes 16 drifting card shards with velocity, momentum, and boundary bounce mechanics. Spawns a swirling cosmic black hole singularity at the center of the viewport that pulls all cards and particles inward. Supports Matrix Bullet-Time slomo.
- **⚡ Card Stat Overdrive & Finisher Infusion**: Injects custom God Mode damage multipliers (2x, 5x, 10x) into any selected card, or equips the ultimate `🌌 Supernova Obliteration (999 DMG)` finisher for Arena battles.
- **🐉 Mythic Chaos Titan Generator (Primordial Forge)**: Auto-synthesizes an apex mythical god beast across 6 primordial domains (🔥 Solar Nether, ⚡ Cosmic Thunder, 🔮 Void Abyssal, 🌿 Primordial Gaia, ❄️ Glacial Cryo, 👑 Omni Chaos) and 5 archetypes (Wyrm, Phoenix, Behemoth, Sovereign, Leviathan). Forges custom elemental SVG vector artwork, high vitality (up to 240 HP), and 3 devastating cosmic attacks (up to 310 DMG). Instantly claims directly into the creator's collection and Arena roster with full network synchronization.
- **⚔️ Colosseum Boss Rush Gauntlet (Live Survival Minigame)**: Rapid-fire 5-wave gauntlet pitting any champion card against Chaos Monsters:
  1. 🐺 *Shadow Stalker* (180 HP)
  2. 🐲 *Nether Drake* (320 HP)
  3. 🗿 *Colossus Golem* (500 HP)
  4. 🌌 *Void Archon* (750 HP)
  5. 👑 *Chaos Overlord* (1,100 HP)
  Features interactive health bars, critical strike calculations, real-time action combat log, configurable speeds (Normal, Turbo, Instant Sim), incremental wave coin rewards, and a Grand Champion bounty (+10,000 Coins + high-tier card discovery).
- **🔮 Prismatic Reality Shaders & Atmosphere**: Instant full-screen post-processing shader toggles:
  - 🌆 **Cyber Neon Glow** (`.shader-cyber-neon`): Boosts saturation, deepens dark levels, and projects electric cyan/magenta luminescences.
  - 🩸 **Blood Moon Eclipse** (`.shader-blood-moon`): Ominous sepia-crimson lunar atmosphere with dark vignette.
  - 📼 **Retro VHS Tape** (`.shader-vhs-retro`): Authentic CRT scanlines with phosphor glow and horizontal line jitter.
  - 🌈 **Chroma Shift** (`.shader-prismatic`): Dynamic rainbow chromatic aberration cycling across all UI surfaces.
  - Broadcastable over PeerJS mesh and BroadcastChannel to shift the visual theme across all connected player screens.
- **📦 Instant Chaos Divine Booster Pack Unboxer**: Opens an exclusive 5-card God Pack with 100% guaranteed Divine, Mythic, or Transcendent cards and +2,500 bonus coins. Displays cards in an animated holographic showcase and automatically unlocks missing cards into the player's binder.
- **🪙 Interactive Falling Coin Shower**: Summons a cascading shower of 28 floating golden coins across the screen. Players tap or click falling coins to catch them, yielding +150 to +500 coins per catch with audio effects and floating particle feedback.

### Advanced Player Suspension, Custom Ban Messages & Timed Bans
- **Custom Ban Message System (`#adminBanDialogModal`)**:
  - When Master Admin Cam clicks `⛔ Ban` in the Player Accounts table, an interactive suspension modal opens.
  - Allows entering an arbitrary custom notice/message (e.g. specific reason, guidelines, or notice from Cam) that is displayed prominently on that player's screen instead of a generic ban message.
  - Quick-pick preset reason chips:
    - *⏱️ 15m Cooldown*: "15-minute cooldown for spamming packs."
    - *⚠️ Trade Violation (1h)*: "Suspended for trade policy violation."
    - *🛑 Disruptive Conduct (24h)*: "Suspended for disruptive or toxic conduct."
    - *🔒 Permanent*: "Permanent suspension. Contact Master Cam."
- **Configurable Ban Durations (Timed Bans & Timeouts)**:
  - Duration selector options: `5 Minutes`, `15 Minutes`, `1 Hour`, `24 Hours (1 Day)`, `7 Days (1 Week)`, `Permanent (Indefinite)`, and `Custom Duration (Minutes)`.
  - Calculates exact timestamp expiration `banExpires = durationMs ? Date.now() + durationMs : null`.
  - Stored in player account records (`banned: true`, `banReason`, `banExpires`, `lastAdminActionTime`, `adminRevision`) and synchronized authoritatively to the Global Cloud Registry.
- **Banned Player Viewport Experience (`#bannedScreenOverlay`)**:
  - Full-screen blurred backdrop (`z-index: 9999999`) with animated pulsing crimson borders (`@keyframes banBorderPulse`) and suspension crest.
  - Displays target account name, header, and custom message from Master Admin Cam.
  - **Live Countdown Timer**: For timed bans, renders a large glowing digital countdown timer (`MM:SS` or `HH:MM:SS`) ticking down every second.
  - **Automatic Expiration & Unban**: When the countdown timer reaches `00:00`, the system automatically lifts the ban, clears the suspension overlay, updates the account in storage and cloud, plays victory triumph audio, displays a celebratory toast, and restores access.
  - **Sign Out / Play as Guest Button**: Allows the suspended user to cleanly sign out and play as a guest without getting trapped in refresh loops.
- **One-Click Unban & Real-Time Screen Unlocking**:
  - In Player Manager, banned player rows display status badges: `TIMED BAN (Xm left)` or `BANNED`.
  - Action button changes to `🟢 Unban`.
  - Clicking `🟢 Unban` instantly clears `banned: false`, `banReason: ""`, `banExpires: null`, writes authoritative admin timestamp, updates the Global Cloud Registry, and dispatches a real-time `unban_player` P2P signal.
  - If the player is currently online on any device, the ban screen is instantly dismissed and their viewport unlocked without requiring a reload.
