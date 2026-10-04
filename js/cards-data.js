const ADMIN_USERNAME = "Cam";

function makeSvgArt(c1, c2, symbol, accent = "#ffffff", glow = "rgba(255,255,255,0.4)") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280" width="100%" height="100%">
    <defs>
      <radialGradient id="bg" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <circle cx="200" cy="140" r="110" fill="none" stroke="${accent}" stroke-opacity="0.15" stroke-width="4"/>
    <circle cx="200" cy="140" r="85" fill="none" stroke="${accent}" stroke-opacity="0.3" stroke-width="2" stroke-dasharray="6,6"/>
    <circle cx="200" cy="140" r="70" fill="${glow}"/>
    <text x="200" y="165" font-size="82" text-anchor="middle" dominant-baseline="middle" filter="drop-shadow(0 10px 20px rgba(0,0,0,0.8))">${symbol}</text>
    <path d="M0,280 Q200,240 400,280 L400,280 L0,280 Z" fill="${c2}" opacity="0.6"/>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// 37 Cards populated with MULTIPLE unique attacks and varying damage tiers + DIVINE CARDS
const defaultCards = [
  // COMMON
  { name: "Blaze", rarity: "common", hp: 70, attacks: [{name:"Flame Dash", dmg:16}, {name:"Fireball", dmg:24}], desc: "A fearless fire runner with a blazing attitude.", image: makeSvgArt("#f97316", "#7c2d12", "🔥", "#ffedd5") },
  { name: "Rook", rarity: "common", hp: 65, attacks: [{name:"Quick Slash", dmg:15}, {name:"Shadow Shiv", dmg:26}], desc: "A clever rogue who always has a backup plan.", image: makeSvgArt("#ea580c", "#431407", "🦊", "#fed7aa") },
  { name: "Byte", rarity: "common", hp: 80, attacks: [{name:"Zap Spanner", dmg:14}, {name:"Overclock Shock", dmg:22}], desc: "A tiny robot with a giant collection of gadgets.", image: makeSvgArt("#0284c7", "#082f49", "🤖", "#bae6fd") },
  { name: "Moss", rarity: "common", hp: 85, attacks: [{name:"Vine Lash", dmg:13}, {name:"Bramble Whip", dmg:20}], desc: "A forest guardian who can disappear into leaves.", image: makeSvgArt("#16a34a", "#052e16", "🌿", "#bbf7d0") },
  { name: "Pebble", rarity: "common", hp: 95, attacks: [{name:"Rock Throw", dmg:12}, {name:"Boulder Bash", dmg:19}], desc: "A sturdy stone golem that absorbs heavy blows.", image: makeSvgArt("#78716c", "#1c1917", "🪨", "#e7e5e4") },
  { name: "Splash", rarity: "common", hp: 75, attacks: [{name:"Water Jet", dmg:14}, {name:"Aqua Spray", dmg:22}], desc: "A swift aquatic sprite with slippery movements.", image: makeSvgArt("#06b6d4", "#164e63", "💧", "#cffafe") },
  { name: "Gale", rarity: "common", hp: 68, attacks: [{name:"Wind Blade", dmg:15}, {name:"Gust Cutter", dmg:25}], desc: "A breezy spirit carrying ancient seeds across realms.", image: makeSvgArt("#10b981", "#064e3b", "🍃", "#a7f3d0") },

  // RARE
  { name: "Volt", rarity: "rare", hp: 85, attacks: [{name:"Spark Jolt", dmg:22}, {name:"Thunder Surge", dmg:34}], desc: "A lightning-powered speedster who never stands still.", image: makeSvgArt("#eab308", "#713f12", "⚡", "#fef08a") },
  { name: "Fang", rarity: "rare", hp: 90, attacks: [{name:"Frost Fang", dmg:20}, {name:"Glacial Bite", dmg:32}], desc: "A mysterious wolf warrior from the frozen north.", image: makeSvgArt("#38bdf8", "#0c4a6e", "🐺", "#e0f2fe") },
  { name: "Nova", rarity: "rare", hp: 80, attacks: [{name:"Cosmic Flare", dmg:24}, {name:"Starfall Slash", dmg:36}], desc: "A cosmic traveler carrying a star-powered blade.", image: makeSvgArt("#6366f1", "#1e1b4b", "🌌", "#c7d2fe") },
  { name: "Echo", rarity: "rare", hp: 88, attacks: [{name:"Resonance", dmg:21}, {name:"Sonic Pulse", dmg:33}], desc: "A masked sound mage who controls waves of energy.", image: makeSvgArt("#8b5cf6", "#2e1065", "🎧", "#ddd6fe") },
  { name: "Tide", rarity: "rare", hp: 98, attacks: [{name:"Wave Crash", dmg:19}, {name:"Abyssal Geyser", dmg:31}], desc: "A sea guardian wielding the crushing power of the ocean.", image: makeSvgArt("#0284c7", "#082f49", "🌊", "#7dd3fc") },
  { name: "Frost", rarity: "rare", hp: 92, attacks: [{name:"Ice Shard", dmg:22}, {name:"Permafrost Lance", dmg:32}], desc: "An ice elemental creating shimmering permafrost walls.", image: makeSvgArt("#06b6d4", "#155e75", "❄️", "#e0f2fe") },
  { name: "Flora", rarity: "rare", hp: 84, attacks: [{name:"Pollen Burst", dmg:23}, {name:"Petal Tempest", dmg:35}], desc: "A magical blossom dancer capable of charming beasts.", image: makeSvgArt("#ec4899", "#831843", "🌸", "#fbcfe8") },
  { name: "Spike", rarity: "rare", hp: 94, attacks: [{name:"Pin Missile", dmg:20}, {name:"Needle Volley", dmg:32}], desc: "A spunky warrior covered in crystal quills.", image: makeSvgArt("#f59e0b", "#78350f", "🦔", "#fde68a") },

  // EPIC
  { name: "Shadow", rarity: "epic", hp: 110, attacks: [{name:"Umbral Strike", dmg:30}, {name:"Nightfall Claw", dmg:46}], desc: "A silent night hunter who moves between shadows.", image: makeSvgArt("#475569", "#0f172a", "🦇", "#94a3b8") },
  { name: "Rex", rarity: "epic", hp: 130, attacks: [{name:"Tail Sweep", dmg:28}, {name:"Primal Stomp", dmg:44}], desc: "A legendary dino fighter with a massive roar.", image: makeSvgArt("#15803d", "#052e16", "🦖", "#86efac") },
  { name: "Glitch", rarity: "epic", hp: 105, attacks: [{name:"Pixel Hack", dmg:32}, {name:"Error Beam", dmg:48}], desc: "A digital outlaw who can bend the game itself.", image: makeSvgArt("#d946ef", "#4a044e", "👾", "#f5d0fe") },
  { name: "Ember", rarity: "epic", hp: 115, attacks: [{name:"Searing Blade", dmg:29}, {name:"Dragon Inferno", dmg:45}], desc: "A young dragon knight with a burning sword.", image: makeSvgArt("#dc2626", "#450a0a", "🐉", "#fca5a5") },
  { name: "Specter", rarity: "epic", hp: 108, attacks: [{name:"Phantom Glare", dmg:31}, {name:"Astral Gaze", dmg:47}], desc: "An all-seeing astral eye that reveals hidden realms.", image: makeSvgArt("#7c3aed", "#2e1065", "👁️", "#c4b5fd") },
  { name: "Magma", rarity: "epic", hp: 125, attacks: [{name:"Lava Slag", dmg:28}, {name:"Volcanic Eruption", dmg:43}], desc: "A molten warrior born inside an active core.", image: makeSvgArt("#ea580c", "#431407", "🌋", "#fed7aa") },
  { name: "Cipher", rarity: "epic", hp: 100, attacks: [{name:"Rune Ray", dmg:33}, {name:"Eternity Hex", dmg:50}], desc: "An arcane scholar decoding the secrets of eternity.", image: makeSvgArt("#9333ea", "#3b0764", "🔮", "#d8b4fe") },
  { name: "Tempest", rarity: "epic", hp: 112, attacks: [{name:"Cyclone Twist", dmg:30}, {name:"Vortex Rampage", dmg:46}], desc: "A chaotic cyclone berserker devastating battlefields.", image: makeSvgArt("#64748b", "#0f172a", "🌪️", "#cbd5e1") },

  // LEGENDARY
  { name: "Titan", rarity: "legendary", hp: 160, attacks: [{name:"Iron Fist", dmg:38}, {name:"Colossus Smash", dmg:58}], desc: "An ancient champion covered in enchanted armor.", image: makeSvgArt("#d97706", "#451a03", "🗿", "#fde68a") },
  { name: "Aurora", rarity: "legendary", hp: 135, attacks: [{name:"Prismatic Flash", dmg:42}, {name:"Boreal Ray", dmg:62}], desc: "A sky mage who commands the northern lights.", image: makeSvgArt("#10b981", "#064e3b", "🧙", "#6ee7b7") },
  { name: "Phantom", rarity: "legendary", hp: 140, attacks: [{name:"Wraith Blade", dmg:40}, {name:"Nether Edge", dmg:60}], desc: "A legendary masked warrior from the forgotten realm.", image: makeSvgArt("#3b82f6", "#172554", "👻", "#bfdbfe") },
  { name: "Drakon", rarity: "legendary", hp: 155, attacks: [{name:"Draco Claw", dmg:39}, {name:"Sovereign Breath", dmg:59}], desc: "The dragon king, feared across every kingdom.", image: makeSvgArt("#b91c1c", "#450a0a", "🐲", "#fca5a5") },
  { name: "Solaris", rarity: "legendary", hp: 145, attacks: [{name:"Radiant Lance", dmg:41}, {name:"Solar Retribution", dmg:63}], desc: "An immortal solar angel wielding pure holy fire.", image: makeSvgArt("#f59e0b", "#78350f", "☀️", "#fef08a") },
  { name: "Valkyrie", rarity: "legendary", hp: 148, attacks: [{name:"Valkyrie Thrust", dmg:40}, {name:"Heavenward Strike", dmg:61}], desc: "A divine warrior guiding champions to victory.", image: makeSvgArt("#eab308", "#713f12", "⚔", "#fef08a") },
  { name: "Leviathan", rarity: "legendary", hp: 165, attacks: [{name:"Abyssal Slam", dmg:37}, {name:"Maelstrom Crush", dmg:56}], desc: "An ocean titan commanding the abyssal trench.", image: makeSvgArt("#0369a1", "#082f49", "🦑", "#7dd3fc") },

  // MYTHIC
  { name: "Void", rarity: "mythic", hp: 175, attacks: [{name:"Dark Rift", dmg:52}, {name:"Singularity Collapse", dmg:78}], desc: "A mysterious entity wielding absolute spatial absence.", image: makeSvgArt("#1e1b4b", "#020617", "🕳", "#818cf8") },
  { name: "Cosmo", rarity: "mythic", hp: 170, attacks: [{name:"Gamma Ray", dmg:54}, {name:"Hypernova Laser", dmg:80}], desc: "The space explorer infused with a cosmic hyper-core.", image: makeSvgArt("#4338ca", "#0f172a", "🚀", "#a5b4fc") },
  { name: "Eclipse", rarity: "mythic", hp: 180, attacks: [{name:"Shadow Corona", dmg:50}, {name:"Corona Annihilation", dmg:76}], desc: "A secret warrior born when the sun and moon collide.", image: makeSvgArt("#be185d", "#500724", "🌑", "#f472b6") },
  { name: "Omega", rarity: "mythic", hp: 190, attacks: [{name:"Alpha Smite", dmg:48}, {name:"Genesis Decree", dmg:74}], desc: "The unknown final sovereign of the entire pantheon.", image: makeSvgArt("#f43f5e", "#4c0519", "👑", "#fecdd3") },
  { name: "Chronos", rarity: "mythic", hp: 165, attacks: [{name:"Time Warp", dmg:56}, {name:"Timeline Rupture", dmg:84}], desc: "The master of timelines who weaves all realities together.", image: makeSvgArt("#e11d48", "#881337", "⏳", "#fda4af") },

  // DIVINE
  { name: "Aethelgard", rarity: "divine", hp: 220, attacks: [{name:"Celestial Judgement", dmg:68}, {name:"Omnipresent Wrath", dmg:98}], desc: "The supreme cosmic creator presiding above galaxies.", image: makeSvgArt("#0284c7", "#1e1b4b", "👑", "#facc15", "rgba(56, 189, 248, 0.6)") },
  { name: "Seraphina", rarity: "divine", hp: 205, attacks: [{name:"Dawn's Radiance", dmg:72}, {name:"Heavenly Exorcism", dmg:94}], desc: "The archangel of creation radiating eternal divine light.", image: makeSvgArt("#065f46", "#022c22", "🕊️", "#fef08a", "rgba(250, 204, 21, 0.6)") }
];

function normalizeCards(cardList){
  return cardList.map(c => {
    if(!Array.isArray(c.attacks) || c.attacks.length === 0){
      c.attacks = [
        { name: c.attack || "Strike", dmg: c.dmg || 20 },
        { name: "Heavy Strike", dmg: Math.floor((c.dmg || 20) * 1.5) }
      ];
    }
    return c;
  });
}

function getCustomCardsFromStorage(){
  try {
    const saved = JSON.parse(localStorage.getItem("cardCollectorCustomCards"));
    if (Array.isArray(saved) && saved.length > 0) {
      return saved.filter(sc => sc && sc.name && !sc.isUnreleased && !defaultCards.some(dc => dc.name.toLowerCase() === sc.name.toLowerCase()));
    }
  } catch (e) {}
  return [];
}

function saveCustomCardsToStorage(){
  try {
    const customs = cards.filter(c => !c.isUnreleased && !defaultCards.some(dc => dc.name.toLowerCase() === c.name.toLowerCase()));
    localStorage.setItem("cardCollectorCustomCards", JSON.stringify(customs));
  } catch(e){}
}

let customCards = getCustomCardsFromStorage();
let cards = [...normalizeCards(defaultCards), ...normalizeCards(customCards)].filter(c => !c.isUnreleased);

// PACK TIERS: Both Cosmic Archive (Mythic) & Celestial Reliquary (Divine) are active!
const packTiers = {
  common: { name: "Standard Booster", baseCost: 25, count: 3, icon: "⚪", bg: "radial-gradient(circle, #334155, #0f172a)", border: "#64748b", weights: { common: 70, rare: 22, epic: 6.5, legendary: 1.3, mythic: 0.19, divine: 0.01 }, minRarity: null },
  rare: { name: "Arcane Booster", baseCost: 60, count: 4, icon: "🔵", bg: "radial-gradient(circle, #1e3a8a, #0b132b)", border: "#3b82f6", weights: { common: 40, rare: 42, epic: 14, legendary: 3.5, mythic: 0.45, divine: 0.05 }, minRarity: "rare" },
  epic: { name: "Aether Booster", baseCost: 120, count: 5, icon: "🟣", bg: "radial-gradient(circle, #581c87, #150624)", border: "#a855f7", weights: { common: 20, rare: 35, epic: 32, legendary: 11, mythic: 1.8, divine: 0.2 }, minRarity: "epic" },
  legendary: { name: "Gilded Vault", baseCost: 220, count: 6, icon: "🟠", bg: "radial-gradient(circle, #78350f, #1c0901)", border: "#f59e0b", weights: { common: 5, rare: 20, epic: 35, legendary: 32, mythic: 7, divine: 1.0 }, minRarity: "legendary" },
  mythic: { name: "Cosmic Archive", baseCost: 400, count: 7, icon: "🔴", bg: "radial-gradient(circle, #831843, #1f040e)", border: "#ec4899", weights: { common: 0, rare: 10, epic: 30, legendary: 35, mythic: 22, divine: 3 }, minRarity: "mythic" },
  divine: { name: "Celestial Reliquary", baseCost: 600, count: 8, icon: "🌟", bg: "radial-gradient(circle, #0369a1, #1e1b4b)", border: "#38bdf8", weights: { common: 0, rare: 5, epic: 20, legendary: 35, mythic: 25, divine: 15 }, minRarity: "divine" }
};

const rarityRank = { common: 1, rare: 2, epic: 3, legendary: 4, mythic: 5, divine: 6 };

function getRarityRank(r){
  if(rarityRank && rarityRank[r]) return rarityRank[r];
  if(typeof customRarities === "object" && customRarities[r] && customRarities[r].rank){
    return customRarities[r].rank;
  }
  return 4;
}

let accounts = {};
try {
  accounts = JSON.parse(localStorage.getItem("cardCollectorAccounts")) || {};
} catch(e) {
  accounts = {};
}

// Purge any fake / made-up names
const fakeNames = ["Alex", "Jordan", "Elena", "Kai", "Morgan", "Sam", "Taylor", "Riley", "Aria", "Leo", "Zane", "Maya", "Finn", "Chloe", "Noah", "Liam", "Sophia"];
fakeNames.forEach(fn => {
  delete accounts[fn];
});

// Purge any unreleasedOwned from any non-Cam accounts so vault cards never leak to other profiles
Object.keys(accounts).forEach(u => {
  if(u.toLowerCase() !== ADMIN_USERNAME.toLowerCase() && accounts[u].unreleasedOwned){
    delete accounts[u].unreleasedOwned;
  }
});

let subAdminRoles = {};
try {
  subAdminRoles = JSON.parse(localStorage.getItem("cardCollectorSubAdmins")) || {};
} catch(e) {
  subAdminRoles = {};
}
fakeNames.forEach(fn => {
  delete subAdminRoles[fn];
});

// Master account Cam
if(!accounts["Cam"]){
  accounts["Cam"] = {
    password: "admin123",
    owned: Array.from({length: 37}, (_, i) => i),
    coins: 10000,
    hasPlayed: true,
    lastActive: Date.now(),
    unreleasedOwned: []
  };
} else {
  accounts["Cam"].hasPlayed = true;
  if(!accounts["Cam"].lastActive) accounts["Cam"].lastActive = Date.now();
  if(!accounts["Cam"].unreleasedOwned) accounts["Cam"].unreleasedOwned = [];
}

localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
localStorage.setItem("cardCollectorSubAdmins", JSON.stringify(subAdminRoles));

let currentUser = localStorage.getItem("cardCollectorCurrentUser") || null;
let owned = [];
let coins = 100;
let filter = "all";
let adminLuckMultiplier = parseFloat(localStorage.getItem("cardCollectorLuck") || "1");

let eventCoinMultiplier = parseInt(localStorage.getItem("cardCollectorEventCoins") || "1");
let eventPackDiscount = parseInt(localStorage.getItem("cardCollectorEventDiscount") || "0");
let isMaintenanceMode = localStorage.getItem("cardCollectorMaintenance") === "true";
let isGodModeEnabled = localStorage.getItem("cardCollectorGodMode") !== "false";

function isMasterAdmin(){
  return currentUser && currentUser.toLowerCase() === ADMIN_USERNAME.toLowerCase();
}
function isSubAdmin(){
  return currentUser && subAdminRoles[currentUser] && subAdminRoles[currentUser].active;
}
function hasAdminAccess(){
  return isMasterAdmin() || isSubAdmin();
}

function getActualPackCost(baseCost){
  if(eventPackDiscount <= 0) return baseCost;
  return Math.max(1, Math.floor(baseCost * (1 - eventPackDiscount / 100)));
}

// Custom Designed Rarities (Master Cam Exclusive)
let customRarities = {};
try {
  const savedRarities = JSON.parse(localStorage.getItem("cardCollectorCustomRarities"));
  if (savedRarities && typeof savedRarities === "object" && Object.keys(savedRarities).length > 0) {
    customRarities = savedRarities;
  } else {
    customRarities = {
      transcendent: {
        id: "transcendent",
        name: "Transcendent",
        color: "#c084fc",
        border: "#c084fc",
        bg: "radial-gradient(ellipse at 50% 15%, #4c1d95 0%, #09090b 100%)",
        glow: "rgba(192, 132, 252, 0.75)",
        rank: 7
      },
      void: {
        id: "void",
        name: "Void",
        color: "#fb7185",
        border: "#f43f5e",
        bg: "radial-gradient(ellipse at 50% 15%, #18181b 0%, #000000 100%)",
        glow: "rgba(244, 63, 94, 0.75)",
        rank: 8
      }
    };
    localStorage.setItem("cardCollectorCustomRarities", JSON.stringify(customRarities));
  }
} catch(e) {}

function applyCustomRarities(){
  Object.keys(customRarities).forEach(k => {
    const r = customRarities[k];
    rarityRank[r.id] = r.rank || 7;
  });

  if (typeof document !== "undefined") {
    let styleEl = document.getElementById("customRarityStyles");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "customRarityStyles";
      if (document.head) document.head.appendChild(styleEl);
    }

    let cssStr = "";
    Object.keys(customRarities).forEach(k => {
      const r = customRarities[k];
      cssStr += `
        .face.${r.id} {
          background: ${r.bg} !important;
          border-color: ${r.border} !important;
          box-shadow: 0 0 35px ${r.glow} !important;
        }
        .face.${r.id} .rarity {
          color: ${r.color} !important;
          border-color: ${r.color}88 !important;
          background: rgba(0,0,0,0.5) !important;
        }
        .reveal-card-item .face.${r.id} {
          border-color: ${r.border} !important;
          box-shadow: 0 0 40px ${r.glow} !important;
        }
      `;
    });
    if (styleEl) styleEl.textContent = cssStr;
  }
}
applyCustomRarities();

// Unreleased / Classified Cards & Packs (Master Cam Exclusive)
let unreleasedCards = [];
try {
  const savedUnreleased = JSON.parse(localStorage.getItem("cardCollectorUnreleasedCards"));
  if (Array.isArray(savedUnreleased) && savedUnreleased.length > 0) {
    unreleasedCards = savedUnreleased;
  } else {
    unreleasedCards = [
      {
        id: "unreleased_cipher",
        name: "Cipher",
        rarity: "mythic",
        hp: 185,
        attacks: [{ name: "Encryption Wave", dmg: 48 }, { name: "Zero-Day Breaker", dmg: 92 }],
        desc: "A classified prototype card locked in the creator vault. Unreleased to public sets.",
        image: makeSvgArt("#4c0519", "#0f172a", "🔐", "#fda4af", "rgba(244, 63, 94, 0.6)"),
        isUnreleased: true
      },
      {
        id: "unreleased_spectra",
        name: "Spectra",
        rarity: "divine",
        hp: 215,
        attacks: [{ name: "Phantom Phase", dmg: 65 }, { name: "Dimensional Tear", dmg: 105 }],
        desc: "An unreleased phantom entity visible only to the creator. Hidden from public sets.",
        image: makeSvgArt("#1e1b4b", "#09090b", "🫥", "#c084fc", "rgba(168, 85, 247, 0.6)"),
        isUnreleased: true
      }
    ];
    localStorage.setItem("cardCollectorUnreleasedCards", JSON.stringify(unreleasedCards));
  }
} catch(e) {}

let unreleasedPacks = {};
try {
  const savedPacks = JSON.parse(localStorage.getItem("cardCollectorUnreleasedPacks"));
  if (savedPacks && typeof savedPacks === "object" && Object.keys(savedPacks).length > 0) {
    unreleasedPacks = savedPacks;
  } else {
    unreleasedPacks = {
      unreleased_proto_pack: {
        id: "unreleased_proto_pack",
        name: "Creator Prototype Pack",
        baseCost: 50,
        count: 4,
        icon: "🔒",
        bg: "radial-gradient(circle, #881337, #0f172a)",
        border: "#f43f5e",
        weights: { common: 0, rare: 5, epic: 25, legendary: 35, mythic: 25, divine: 10 },
        minRarity: "epic",
        dropMode: "unreleased_guaranteed",
        isUnreleased: true,
        desc: "Classified developer booster pack. Drops unreleased prototypes."
      }
    };
    localStorage.setItem("cardCollectorUnreleasedPacks", JSON.stringify(unreleasedPacks));
  }
} catch(e) {}

// Mark isUnreleased flag on cards and automatically sync to Cam collection so they show on Cam home page
unreleasedCards.forEach(c => {
  c.isUnreleased = true;
  const cId = c.id || c.name;
  if(accounts["Cam"]){
    if(!accounts["Cam"].unreleasedOwned) accounts["Cam"].unreleasedOwned = [];
    if(!accounts["Cam"].unreleasedOwned.includes(cId)) accounts["Cam"].unreleasedOwned.push(cId);
  }
});
try { localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts)); } catch(e){}

// Helper to check if Cam enabled binder display (Default true for Master Cam, strictly false for everyone else)
function shouldShowUnreleasedInBinder(){
  if(!isMasterAdmin()) return false;
  return localStorage.getItem("cardCollectorShowUnreleasedInBinder") !== "false";
}

// Keep unreleased packs accessible to pack engine
Object.assign(packTiers, unreleasedPacks);

