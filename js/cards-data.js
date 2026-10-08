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
  { name: "Rust Fox", rarity: "common", hp: 65, attacks: [{"name":"Quick Slash","dmg":15},{"name":"Shadow Shiv","dmg":26}], desc: "A clever rogue who always has a backup plan.", image: makeSvgArt("#ea580c", "#431407", "🦊", "#fed7aa") },
  { name: "Lantern Beetle", rarity: "common", hp: 66, attacks: [{"name":"Blink Flash","dmg":16},{"name":"Spark Zap","dmg":25}], desc: "Glows with a cozy amber warmth, lighting forest paths on moonless nights.", image: makeSvgArt("#eab308", "#713f12", "💡", "#fef08a") },
  { name: "Glowflare Wasp", rarity: "common", hp: 68, attacks: [{"name":"Electric Buzz","dmg":16},{"name":"Mini Shock","dmg":25}], desc: "A tiny insect that glows with a faint electric sparkle in the dark.", image: makeSvgArt("#eab308", "#713f12", "🪰", "#fef08a") },
  { name: "Magma Termite", rarity: "common", hp: 68, attacks: [{"name":"Bite","dmg":16},{"name":"Pincer Sting","dmg":24}], desc: "A tiny ant with a fiery temperament and a surprisingly ferocious bite.", image: makeSvgArt("#dc2626", "#450a0a", "🐜", "#fca5a5") },
  { name: "Wheatfield Stalker", rarity: "common", hp: 68, attacks: [{"name":"Chew","dmg":16},{"name":"Quick Scurry","dmg":24}], desc: "A tiny mouse that scampers through tall wheat fields at dawn.", image: makeSvgArt("#78350f", "#1c1917", "🐭", "#fde68a") },
  { name: "Zephyr Sparrow", rarity: "common", hp: 68, attacks: [{"name":"Wind Blade","dmg":15},{"name":"Gust Cutter","dmg":25}], desc: "A breezy spirit carrying ancient seeds across realms.", image: makeSvgArt("#10b981", "#064e3b", "🍃", "#a7f3d0") },
  { name: "Cinder Imp", rarity: "common", hp: 70, attacks: [{"name":"Flame Dash","dmg":16},{"name":"Fireball","dmg":24}], desc: "A fearless fire runner with a blazing attitude.", image: makeSvgArt("#f97316", "#7c2d12", "🔥", "#ffedd5") },
  { name: "Duskwing Chiropter", rarity: "common", hp: 70, attacks: [{"name":"Wing Flap","dmg":15},{"name":"Echo Bite","dmg":23}], desc: "A common dweller of rocky tunnels, hunting insects in nocturnal swarms.", image: makeSvgArt("#475569", "#0f172a", "🦇", "#94a3b8") },
  { name: "Meadow Orthopter", rarity: "common", hp: 70, attacks: [{"name":"Spring Kick","dmg":16},{"name":"Chirp Buzz","dmg":24}], desc: "Leaps twenty times its body length across sunny meadow grasses.", image: makeSvgArt("#22c55e", "#14532d", "🦗", "#bbf7d0") },
  { name: "Needlepine Scurrier", rarity: "common", hp: 70, attacks: [{"name":"Acorn Throw","dmg":16},{"name":"Branch Pounce","dmg":24}], desc: "Stores acorns high in evergreen trees, throwing them when startled.", image: makeSvgArt("#b45309", "#451a03", "🐿️", "#fed7aa") },
  { name: "Glimmerfin Minnow", rarity: "common", hp: 72, attacks: [{"name":"Splash Tail","dmg":15},{"name":"Water Dart","dmg":23}], desc: "A nimble freshwater fish that darts through crystal river currents.", image: makeSvgArt("#0284c7", "#075985", "🐟", "#7dd3fc") },
  { name: "Ironbill Woodpecker", rarity: "common", hp: 72, attacks: [{"name":"Rapid Peck","dmg":15},{"name":"Bark Drill","dmg":23}], desc: "Rhythmically drums on hollow tree trunks to hunt forest grubs.", image: makeSvgArt("#dc2626", "#450a0a", "🐦", "#fca5a5") },
  { name: "Static Sparkfly", rarity: "common", hp: 72, attacks: [{"name":"Static Jolt","dmg":15},{"name":"Spark Barrage","dmg":23}], desc: "An excitable critter buzzing with vibrant static electricity.", image: makeSvgArt("#eab308", "#713f12", "⚡", "#fef08a") },
  { name: "Aero Songbird", rarity: "common", hp: 74, attacks: [{"name":"Feather Gust","dmg":14},{"name":"Sky Peck","dmg":22}], desc: "A songbird whose chirps can summon gentle spring breezes.", image: makeSvgArt("#10b981", "#064e3b", "🐦", "#a7f3d0") },
  { name: "Canopy Treefrog", rarity: "common", hp: 74, attacks: [{"name":"Sticky Jump","dmg":15},{"name":"Croak Sound","dmg":23}], desc: "Clings to moist jungle leaves with sticky round suction pads.", image: makeSvgArt("#166534", "#052e16", "🐸", "#86efac") },
  { name: "Spring Tadpole", rarity: "common", hp: 75, attacks: [{"name":"Water Jet","dmg":14},{"name":"Aqua Spray","dmg":22}], desc: "A swift aquatic sprite with slippery movements.", image: makeSvgArt("#06b6d4", "#164e63", "💧", "#cffafe") },
  { name: "Shadow Webweaver", rarity: "common", hp: 76, attacks: [{"name":"Cobweb Drop","dmg":15},{"name":"Pincer Nip","dmg":23}], desc: "Spins delicate sticky webs across the ceilings of dark cavern passages.", image: makeSvgArt("#475569", "#0f172a", "🕷️", "#94a3b8") },
  { name: "Steppe Marmot", rarity: "common", hp: 76, attacks: [{"name":"Burrow Nip","dmg":15},{"name":"Dust Cloud","dmg":23}], desc: "A curious plains critter warning its pack with loud chirps.", image: makeSvgArt("#ca8a04", "#422006", "🐿️", "#fef08a") },
  { name: "Frost Puddlekin", rarity: "common", hp: 78, attacks: [{"name":"Snowball Roll","dmg":14},{"name":"Chilled Gust","dmg":21}], desc: "A cheerful snow creature sliding gracefully over ice sheets.", image: makeSvgArt("#38bdf8", "#0369a1", "⛄", "#e0f2fe") },
  { name: "Glowcap Fungoid", rarity: "common", hp: 80, attacks: [{"name":"Puff Spore","dmg":14},{"name":"Fungal Blast","dmg":22}], desc: "Releases miniature clouds of sleepy spores when stepped on.", image: makeSvgArt("#a855f7", "#3b0764", "🍄", "#e9d5ff") },
  { name: "Scrap Automaton", rarity: "common", hp: 80, attacks: [{"name":"Zap Spanner","dmg":14},{"name":"Overclock Shock","dmg":22}], desc: "A tiny robot with a giant collection of gadgets.", image: makeSvgArt("#0284c7", "#082f49", "🤖", "#bae6fd") },
  { name: "Bramble Sprout", rarity: "common", hp: 82, attacks: [{"name":"Seed Shot","dmg":13},{"name":"Leaf Cutter","dmg":22}], desc: "A lively green blossom with endless resilience and growth potential.", image: makeSvgArt("#22c55e", "#14532d", "🌱", "#bbf7d0") },
  { name: "Chasm Burrower", rarity: "common", hp: 84, attacks: [{"name":"Dirt Claws","dmg":14},{"name":"Tunnel Bash","dmg":22}], desc: "A blind underground dweller with sturdy claws built for digging.", image: makeSvgArt("#78350f", "#1c1917", "🦔", "#fde68a") },
  { name: "Mossling Creeper", rarity: "common", hp: 85, attacks: [{"name":"Vine Lash","dmg":13},{"name":"Bramble Whip","dmg":20}], desc: "A forest guardian who can disappear into leaves.", image: makeSvgArt("#16a34a", "#052e16", "🌿", "#bbf7d0") },
  { name: "Stonebark Hound", rarity: "common", hp: 86, attacks: [{"name":"Rock Nip","dmg":13},{"name":"Headbutt","dmg":21}], desc: "An adorable rocky canine who loves fetching round river stones.", image: makeSvgArt("#71717a", "#18181b", "🐕", "#e4e4e7") },
  { name: "Mire Elemental", rarity: "common", hp: 88, attacks: [{"name":"Mud Toss","dmg":13},{"name":"Clay Slam","dmg":21}], desc: "A resilient lump of marshland clay that absorbs physical blows effortlessly.", image: makeSvgArt("#78350f", "#1c1917", "🧱", "#fde68a") },
  { name: "Reef Conch", rarity: "common", hp: 88, attacks: [{"name":"Brine Slime","dmg":13},{"name":"Shell Slam","dmg":21}], desc: "Drifts on ocean waves, feeding on seaweed along rocky shores.", image: makeSvgArt("#0284c7", "#075985", "🐌", "#7dd3fc") },
  { name: "Verdant Gastropod", rarity: "common", hp: 88, attacks: [{"name":"Slime Trail","dmg":13},{"name":"Shell Guard","dmg":21}], desc: "Slow and steady snail with a sturdy spiral shell on its back.", image: makeSvgArt("#65a30d", "#14532d", "🐌", "#d9f99d") },
  { name: "Bog Anuran", rarity: "common", hp: 90, attacks: [{"name":"Tongue Lash","dmg":13},{"name":"Bog Hop","dmg":21}], desc: "Sits on lily pads, catching insects with a lightning-fast sticky tongue.", image: makeSvgArt("#166534", "#052e16", "🐸", "#86efac") },
  { name: "Dune Gastropod", rarity: "common", hp: 92, attacks: [{"name":"Grit Roll","dmg":12},{"name":"Sand Squirt","dmg":20}], desc: "Leaves a shimmering trail of golden glass sand wherever it slides.", image: makeSvgArt("#d97706", "#451a03", "🐚", "#fde68a") },
  { name: "Brambleback Tortoise", rarity: "common", hp: 95, attacks: [{"name":"Shell Guard","dmg":12},{"name":"Turtling Bash","dmg":19}], desc: "A peaceful swamp dweller carrying a small garden of moss on its hard shell.", image: makeSvgArt("#166534", "#052e16", "🐢", "#86efac") },
  { name: "Granite Pebblekin", rarity: "common", hp: 95, attacks: [{"name":"Rock Throw","dmg":12},{"name":"Boulder Bash","dmg":19}], desc: "A sturdy stone golem that absorbs heavy blows.", image: makeSvgArt("#78716c", "#1c1917", "🪨", "#e7e5e4") },
  { name: "Timberland Ursine", rarity: "common", hp: 98, attacks: [{"name":"Paw Swipe","dmg":12},{"name":"Heavy Hug","dmg":19}], desc: "A strong woodland bear catching salmon along rushing rivers.", image: makeSvgArt("#9a3412", "#451a03", "🐻", "#fdba74") },
  { name: "Starlight Sprite", rarity: "rare", hp: 80, attacks: [{"name":"Cosmic Flare","dmg":24},{"name":"Starfall Slash","dmg":36}], desc: "A cosmic traveler carrying a star-powered blade.", image: makeSvgArt("#6366f1", "#1e1b4b", "🌌", "#c7d2fe") },
  { name: "Blizzard Leaper", rarity: "rare", hp: 82, attacks: [{"name":"Blizzard Kick","dmg":25},{"name":"Ice Burrow","dmg":37}], desc: "Blends seamlessly into snowdrifts, kicking up clouds of powdery frost.", image: makeSvgArt("#38bdf8", "#0369a1", "🐇", "#e0f2fe") },
  { name: "Stardust Papillon", rarity: "rare", hp: 82, attacks: [{"name":"Stardust Wing","dmg":26},{"name":"Prism Flutter","dmg":38}], desc: "Spreads glittering dust that reflects rainbow colors under moonlight.", image: makeSvgArt("#a855f7", "#3b0764", "🦋", "#e9d5ff") },
  { name: "Zephyr Pixie", rarity: "rare", hp: 82, attacks: [{"name":"Zephyr Kick","dmg":25},{"name":"Cyclone Dust","dmg":37}], desc: "A fluttering sprite creating playful updrafts that lift rivals off their feet.", image: makeSvgArt("#10b981", "#064e3b", "🧚", "#a7f3d0") },
  { name: "Petal Nymph", rarity: "rare", hp: 84, attacks: [{"name":"Pollen Burst","dmg":23},{"name":"Petal Tempest","dmg":35}], desc: "A magical blossom dancer capable of charming beasts.", image: makeSvgArt("#ec4899", "#831843", "🌸", "#fbcfe8") },
  { name: "Skyrazor Hawk", rarity: "rare", hp: 84, attacks: [{"name":"Sky Slash","dmg":25},{"name":"Wind Whistle","dmg":37}], desc: "Slices through gales effortlessly with razor-sharp feathers.", image: makeSvgArt("#10b981", "#064e3b", "🦅", "#a7f3d0") },
  { name: "Sonic Chiropter", rarity: "rare", hp: 84, attacks: [{"name":"Sonic Shriek","dmg":24},{"name":"Echo Wing","dmg":36}], desc: "Navigates pitch black subterranean caves using ultra-precise supersonic pulses.", image: makeSvgArt("#7c3aed", "#2e1065", "🦇", "#c4b5fd") },
  { name: "Whirlwind Sylph", rarity: "rare", hp: 84, attacks: [{"name":"Mini Whirlwind","dmg":24},{"name":"Zephyr Dart","dmg":36}], desc: "Dances on spring breezes, playfully lifting hats and tossing autumn leaves.", image: makeSvgArt("#10b981", "#064e3b", "🍃", "#a7f3d0") },
  { name: "Galvanic Mustelid", rarity: "rare", hp: 85, attacks: [{"name":"Static Shock","dmg":25},{"name":"Quick Blitz","dmg":37}], desc: "A lightning-fast furry critter generating electrical sparks from its coat.", image: makeSvgArt("#eab308", "#713f12", "⚡", "#fef08a") },
  { name: "Nocturnal Corvid", rarity: "rare", hp: 85, attacks: [{"name":"Shadow Peck","dmg":24},{"name":"Night Flight","dmg":36}], desc: "Perches on castle battlements at twilight, watching travelers from above.", image: makeSvgArt("#334155", "#020617", "🦅", "#cbd5e1") },
  { name: "Volt Sparkfang", rarity: "rare", hp: 85, attacks: [{"name":"Spark Jolt","dmg":22},{"name":"Thunder Surge","dmg":34}], desc: "A lightning-powered speedster who never stands still.", image: makeSvgArt("#eab308", "#713f12", "⚡", "#fef08a") },
  { name: "Living Reef Nymph", rarity: "rare", hp: 86, attacks: [{"name":"Reef Dart","dmg":24},{"name":"Ocean Splash","dmg":36}], desc: "Protects living coral reefs using needle-sharp calcium spines.", image: makeSvgArt("#f43f5e", "#881337", "🪸", "#fecdd3") },
  { name: "Pyre Kitsune", rarity: "rare", hp: 86, attacks: [{"name":"Flame Dash","dmg":24},{"name":"Tail Ignition","dmg":36}], desc: "A nine-tailed fox whose fluffy fur sparks with playful crimson fireballs.", image: makeSvgArt("#ea580c", "#431407", "🦊", "#fed7aa") },
  { name: "Rapids Riverprowler", rarity: "rare", hp: 88, attacks: [{"name":"Pebble Juggle","dmg":23},{"name":"Swift Dive","dmg":35}], desc: "Playfully swims across river rapids, disorienting prey with quick dives.", image: makeSvgArt("#0284c7", "#075985", "🦦", "#7dd3fc") },
  { name: "Resonance Bat", rarity: "rare", hp: 88, attacks: [{"name":"Resonance","dmg":21},{"name":"Sonic Pulse","dmg":33}], desc: "A masked sound mage who controls waves of energy.", image: makeSvgArt("#8b5cf6", "#2e1065", "🎧", "#ddd6fe") },
  { name: "Twilight Strix", rarity: "rare", hp: 88, attacks: [{"name":"Silent Dive","dmg":23},{"name":"Moon Talon","dmg":35}], desc: "Perches atop ancient stone spires, observing midnight battlefields silently.", image: makeSvgArt("#334155", "#0f172a", "🦉", "#cbd5e1") },
  { name: "Venomous Treecrawler", rarity: "rare", hp: 88, attacks: [{"name":"Poison Spit","dmg":24},{"name":"Camouflage Strike","dmg":36}], desc: "Blends seamlessly into jungle tree trunks before striking with venom.", image: makeSvgArt("#16a34a", "#052e16", "🦎", "#bbf7d0") },
  { name: "Ashborn Cerberite", rarity: "rare", hp: 90, attacks: [{"name":"Bite of Ash","dmg":23},{"name":"Flame Bark","dmg":35}], desc: "Barks out clouds of hot ash that sting opponent eyes.", image: makeSvgArt("#dc2626", "#450a0a", "🐕", "#fca5a5") },
  { name: "Cascading Naiad", rarity: "rare", hp: 90, attacks: [{"name":"Bubble Volley","dmg":23},{"name":"Torrent Whip","dmg":35}], desc: "A mischievous water sprite dancing atop river cascades and waterfalls.", image: makeSvgArt("#06b6d4", "#164e63", "💧", "#cffafe") },
  { name: "Thunderbolt Anguilla", rarity: "rare", hp: 90, attacks: [{"name":"Volt Coil","dmg":23},{"name":"Shock Wave","dmg":35}], desc: "Coils through murky waters, discharging high-voltage static charges.", image: makeSvgArt("#eab308", "#713f12", "⚡", "#fef08a") },
  { name: "Timber Wolf Raider", rarity: "rare", hp: 90, attacks: [{"name":"Frost Fang","dmg":20},{"name":"Glacial Bite","dmg":32}], desc: "A mysterious wolf warrior from the frozen north.", image: makeSvgArt("#38bdf8", "#0c4a6e", "🐺", "#e0f2fe") },
  { name: "Glacial Weasel", rarity: "rare", hp: 92, attacks: [{"name":"Ice Shard","dmg":22},{"name":"Permafrost Lance","dmg":32}], desc: "An ice elemental creating shimmering permafrost walls.", image: makeSvgArt("#06b6d4", "#155e75", "❄️", "#e0f2fe") },
  { name: "Ignited Salamander", rarity: "rare", hp: 92, attacks: [{"name":"Ember Tongue","dmg":22},{"name":"Heat Wave","dmg":34}], desc: "Thrives in scorching desert heat, licking up stray embers with its tongue.", image: makeSvgArt("#ea580c", "#431407", "🦎", "#fed7aa") },
  { name: "Umbral Shadowkin", rarity: "rare", hp: 92, attacks: [{"name":"Dusk Shuriken","dmg":22},{"name":"Shadow Step","dmg":34}], desc: "A stealthy rogue who steps through dusk without making a whisper.", image: makeSvgArt("#334155", "#020617", "👤", "#cbd5e1") },
  { name: "Sulfur Hound", rarity: "rare", hp: 94, attacks: [{"name":"Cinder Blast","dmg":23},{"name":"Sulfur Burst","dmg":35}], desc: "A volatile warrior composed of explosive volcanic shards.", image: makeSvgArt("#b91c1c", "#450a0a", "🌋", "#fca5a5") },
  { name: "Thornback Porcupine", rarity: "rare", hp: 94, attacks: [{"name":"Pin Missile","dmg":20},{"name":"Needle Volley","dmg":32}], desc: "A spunky warrior covered in crystal quills.", image: makeSvgArt("#f59e0b", "#78350f", "🦔", "#fde68a") },
  { name: "Tundra Waddler", rarity: "rare", hp: 94, attacks: [{"name":"Belly Slide","dmg":22},{"name":"Ice Peck","dmg":34}], desc: "Slides across icy slopes at breakneck speeds to knock down opponents.", image: makeSvgArt("#0284c7", "#0c4a6e", "🐧", "#bae6fd") },
  { name: "Permafrost Badger", rarity: "rare", hp: 96, attacks: [{"name":"Frost Claws","dmg":21},{"name":"Tundra Dig","dmg":33}], desc: "Digs underground burrows beneath thick layers of permafrost.", image: makeSvgArt("#38bdf8", "#0369a1", "🦡", "#e0f2fe") },
  { name: "Tidal Skimmer", rarity: "rare", hp: 96, attacks: [{"name":"Hydro Cannon","dmg":21},{"name":"Whirlpool Surge","dmg":33}], desc: "A swift water elemental capable of summoning high-pressure tidal waves.", image: makeSvgArt("#0284c7", "#075985", "🌊", "#7dd3fc") },
  { name: "Caldera Decapod", rarity: "rare", hp: 98, attacks: [{"name":"Scorching Claw","dmg":21},{"name":"Molten Spray","dmg":33}], desc: "Scuttles across glowing magma rivers, unaffected by boiling temperatures.", image: makeSvgArt("#b91c1c", "#450a0a", "🌋", "#fca5a5") },
  { name: "Obsidian Dune Beetle", rarity: "rare", hp: 98, attacks: [{"name":"Sand Horn","dmg":21},{"name":"Dune Armor","dmg":33}], desc: "Thick chitinous shell reflects desert heat waves effortlessly.", image: makeSvgArt("#ca8a04", "#422006", "🪲", "#fef08a") },
  { name: "Torrent Siren", rarity: "rare", hp: 98, attacks: [{"name":"Wave Crash","dmg":19},{"name":"Abyssal Geyser","dmg":31}], desc: "A sea guardian wielding the crushing power of the ocean.", image: makeSvgArt("#0284c7", "#082f49", "🌊", "#7dd3fc") },
  { name: "Prismatic Scarab", rarity: "rare", hp: 100, attacks: [{"name":"Gem Shell","dmg":20},{"name":"Prism Horn","dmg":32}], desc: "A sturdy subterranean beetle with an iridescent carapace harder than granite.", image: makeSvgArt("#059669", "#064e3b", "🪲", "#6ee7b7") },
  { name: "Verdant Antlerstag", rarity: "rare", hp: 100, attacks: [{"name":"Bramble Antlers","dmg":20},{"name":"Forest Trample","dmg":32}], desc: "Stately forest stag whose antlers bloom with vibrant green moss and flora.", image: makeSvgArt("#15803d", "#052e16", "🦌", "#86efac") },
  { name: "Bramble Razortusk", rarity: "rare", hp: 102, attacks: [{"name":"Bramble Charge","dmg":19},{"name":"Thorn Tusk","dmg":31}], desc: "Fierce forest tusker covered in sharp bramble thorns that puncture armor.", image: makeSvgArt("#15803d", "#052e16", "🐗", "#86efac") },
  { name: "Arcane Cryptomancer", rarity: "epic", hp: 100, attacks: [{"name":"Rune Ray","dmg":33},{"name":"Eternity Hex","dmg":50}], desc: "An arcane scholar decoding the secrets of eternity.", image: makeSvgArt("#9333ea", "#3b0764", "🔮", "#d8b4fe") },
  { name: "Cyber Byte-Glitch", rarity: "epic", hp: 105, attacks: [{"name":"Pixel Hack","dmg":32},{"name":"Error Beam","dmg":48}], desc: "A digital outlaw who can bend the game itself.", image: makeSvgArt("#d946ef", "#4a044e", "👾", "#f5d0fe") },
  { name: "Cyber Neon Shinobi", rarity: "epic", hp: 105, attacks: [{"name":"Cyber Kunai","dmg":35},{"name":"Shadow Warp","dmg":52}], desc: "Cybernetic assassin vanishing in a cloud of pink neon smoke and holographic decoy.", image: makeSvgArt("#ec4899", "#831843", "🥷", "#fbcfe8") },
  { name: "Grand Rune Invoker", rarity: "epic", hp: 106, attacks: [{"name":"Glyph of Fire","dmg":35},{"name":"Arcane Cascade","dmg":53}], desc: "Inscribes ancient glyphs of power into the earth beneath battlefields.", image: makeSvgArt("#9333ea", "#3b0764", "📜", "#d8b4fe") },
  { name: "All-Seeing Beholder", rarity: "epic", hp: 108, attacks: [{"name":"Phantom Glare","dmg":31},{"name":"Astral Gaze","dmg":47}], desc: "An all-seeing astral eye that reveals hidden realms.", image: makeSvgArt("#7c3aed", "#2e1065", "👁️", "#c4b5fd") },
  { name: "Neurotoxin Serpent", rarity: "epic", hp: 108, attacks: [{"name":"Venom Spit","dmg":35},{"name":"Neurotoxin Bite","dmg":53}], desc: "Strikes faster than the blink of an eye, injecting paralyzing venom.", image: makeSvgArt("#16a34a", "#052e16", "🐍", "#86efac") },
  { name: "Umbral Nine-Tails", rarity: "epic", hp: 108, attacks: [{"name":"Nightshade Claw","dmg":34},{"name":"Twilight Dash","dmg":52}], desc: "Leaves shadow duplicates in its wake to disorient pursuing rivals.", image: makeSvgArt("#334155", "#020617", "🦊", "#cbd5e1") },
  { name: "Venomous Arachnomancer", rarity: "epic", hp: 108, attacks: [{"name":"Web Snare","dmg":34},{"name":"Fatal Venom","dmg":51}], desc: "Eight-legged arachnid weaver spinning steel-strength web snares drenched in venom.", image: makeSvgArt("#15803d", "#052e16", "🕷️", "#86efac") },
  { name: "Dusk Shadowstalker", rarity: "epic", hp: 110, attacks: [{"name":"Umbral Strike","dmg":30},{"name":"Nightfall Claw","dmg":46}], desc: "A silent night hunter who moves between shadows.", image: makeSvgArt("#475569", "#0f172a", "🦇", "#94a3b8") },
  { name: "Solar Mirage Illusionist", rarity: "epic", hp: 110, attacks: [{"name":"Illusion Blade","dmg":32},{"name":"Sandstorm Mirage","dmg":47}], desc: "A desert mystic shifting between shimmer and steel to deceive rivals.", image: makeSvgArt("#ca8a04", "#422006", "🏜️", "#fef08a") },
  { name: "Tempest Ranger", rarity: "epic", hp: 110, attacks: [{"name":"Gale Shot","dmg":34},{"name":"Hurricane Arrow","dmg":51}], desc: "Draws wind bowstrings that accelerate arrows past the speed of sound.", image: makeSvgArt("#10b981", "#064e3b", "🏹", "#a7f3d0") },
  { name: "Celestial Lightbow", rarity: "epic", hp: 112, attacks: [{"name":"Arrow of Light","dmg":33},{"name":"Rain of Feathers","dmg":51}], desc: "Fires luminous photon arrows that never miss their designated target.", image: makeSvgArt("#eab308", "#713f12", "🏹", "#fde68a") },
  { name: "Cyclone Harbinger", rarity: "epic", hp: 112, attacks: [{"name":"Cyclone Twist","dmg":30},{"name":"Vortex Rampage","dmg":46}], desc: "A chaotic cyclone berserker devastating battlefields.", image: makeSvgArt("#64748b", "#0f172a", "🌪️", "#cbd5e1") },
  { name: "Pyromancer Arcanist", rarity: "epic", hp: 112, attacks: [{"name":"Fireball Cascade","dmg":34},{"name":"Inferno Pillar","dmg":52}], desc: "Weaves spinning rings of fire around enemies to incinerate defenses.", image: makeSvgArt("#dc2626", "#450a0a", "🔥", "#fca5a5") },
  { name: "Frostbound Skyhunter", rarity: "epic", hp: 114, attacks: [{"name":"Frost Gust","dmg":32},{"name":"Ice Dive","dmg":50}], desc: "Dives through blinding whiteouts to snatch icy mountain prey.", image: makeSvgArt("#0284c7", "#0c4a6e", "🦅", "#bae6fd") },
  { name: "Void Hierophant", rarity: "epic", hp: 114, attacks: [{"name":"Shadow Ray","dmg":33},{"name":"Curse Wave","dmg":50}], desc: "Inflicts debilitating hexes that sap strength from opposing champions.", image: makeSvgArt("#6b21a8", "#3b0764", "🔮", "#d8b4fe") },
  { name: "Cryomancer Enchantress", rarity: "epic", hp: 115, attacks: [{"name":"Frost Shards","dmg":33},{"name":"Blizzard Ring","dmg":50}], desc: "Enchants snowflakes into razor-sharp crystals that hover in freezing mist.", image: makeSvgArt("#0284c7", "#0c4a6e", "❄️", "#bae6fd") },
  { name: "Ignis Drake", rarity: "epic", hp: 115, attacks: [{"name":"Searing Blade","dmg":29},{"name":"Dragon Inferno","dmg":45}], desc: "A young dragon knight with a burning sword.", image: makeSvgArt("#dc2626", "#450a0a", "🐉", "#fca5a5") },
  { name: "Wandering Blade Ronin", rarity: "epic", hp: 115, attacks: [{"name":"Iaido Slash","dmg":33},{"name":"Dragon Blade","dmg":50}], desc: "Master of the swift draw technique who carves steel like fresh paper.", image: makeSvgArt("#dc2626", "#450a0a", "🗡️", "#fca5a5") },
  { name: "Bioluminescent Medusa", rarity: "epic", hp: 116, attacks: [{"name":"Bio-Zap","dmg":32},{"name":"Electrified Tentacles","dmg":49}], desc: "Drifts lazily through the midnight zone, delivering high-voltage shocks.", image: makeSvgArt("#06b6d4", "#164e63", "🪼", "#cffafe") },
  { name: "Sunfeather Griffin", rarity: "epic", hp: 116, attacks: [{"name":"Sun Talon","dmg":32},{"name":"Sky Dive","dmg":49}], desc: "Half eagle and half lion, soaring high toward the sun to bless champions below.", image: makeSvgArt("#f59e0b", "#78350f", "🦅", "#fef08a") },
  { name: "Glacial Shieldmaiden", rarity: "epic", hp: 118, attacks: [{"name":"Ice Spear","dmg":32},{"name":"Blizzard Wing","dmg":49}], desc: "A winged maiden of the frozen peaks, carrying fallen warriors to permafrost hall.", image: makeSvgArt("#0284c7", "#0c4a6e", "❄️", "#bae6fd") },
  { name: "Nightshade Cobra", rarity: "epic", hp: 118, attacks: [{"name":"Toxic Needle","dmg":30},{"name":"Viper Dissolution","dmg":48}], desc: "A lethal serpentine hunter striking with armor-melting neurotoxins.", image: makeSvgArt("#15803d", "#052e16", "🐍", "#86efac") },
  { name: "Prismatic Skydancer", rarity: "epic", hp: 118, attacks: [{"name":"Prism Beak","dmg":32},{"name":"Refraction Flash","dmg":49}], desc: "Feathers made of translucent crystal prisms that dazzle rival fighters.", image: makeSvgArt("#06b6d4", "#164e63", "💎", "#cffafe") },
  { name: "Corrosive Vitriol Slime", rarity: "epic", hp: 120, attacks: [{"name":"Toxic Ooze","dmg":31},{"name":"Acidic Dissolve","dmg":48}], desc: "An amorphous blob of glowing green toxic acid that swallows heavy armor whole.", image: makeSvgArt("#16a34a", "#052e16", "🧪", "#86efac") },
  { name: "Lightning Strike Cougar", rarity: "epic", hp: 120, attacks: [{"name":"Electric Claw","dmg":32},{"name":"Lightning Pounce","dmg":49}], desc: "A sleek jungle feline with electric charges rippling across midnight fur.", image: makeSvgArt("#eab308", "#713f12", "🐆", "#fef08a") },
  { name: "Wraithblade Champion", rarity: "epic", hp: 122, attacks: [{"name":"Ghost Lance","dmg":31},{"name":"Spook Slash","dmg":48}], desc: "A headless horseman armed with a spectral lance that pierces spiritual barriers.", image: makeSvgArt("#6b21a8", "#3b0764", "👻", "#e9d5ff") },
  { name: "Deathstalker Scorpion", rarity: "epic", hp: 124, attacks: [{"name":"Stinger Strike","dmg":31},{"name":"Sand Pincer","dmg":48}], desc: "Stalks under shifting dunes, striking quickly with a venom-filled barb.", image: makeSvgArt("#ca8a04", "#422006", "🦂", "#fef08a") },
  { name: "Dunestalker Wyrm", rarity: "epic", hp: 125, attacks: [{"name":"Dune Swipe","dmg":30},{"name":"Quicksand Trap","dmg":47}], desc: "A reptilian sand swimmer that burrows under golden dunes to ambush prey.", image: makeSvgArt("#ca8a04", "#422006", "🏜️", "#fef08a") },
  { name: "Molten Core Brute", rarity: "epic", hp: 125, attacks: [{"name":"Lava Slag","dmg":28},{"name":"Volcanic Eruption","dmg":43}], desc: "A molten warrior born inside an active core.", image: makeSvgArt("#ea580c", "#431407", "🌋", "#fed7aa") },
  { name: "Abyssal Marine Cavalier", rarity: "epic", hp: 126, attacks: [{"name":"Tide Slash","dmg":31},{"name":"Hydro Shield Bash","dmg":48}], desc: "Commands tidal waves from inside reinforced coral-forged plate mail.", image: makeSvgArt("#0369a1", "#082f49", "🛡️", "#7dd3fc") },
  { name: "Clockwork Boiler Automaton", rarity: "epic", hp: 128, attacks: [{"name":"Boiler Blast","dmg":30},{"name":"Steam Cleave","dmg":47}], desc: "Pressurized boiler pipes whistle loudly as it swings heavy bronze axes.", image: makeSvgArt("#d97706", "#451a03", "⚙️", "#fde68a") },
  { name: "Rune-Forged Stonegolem", rarity: "epic", hp: 128, attacks: [{"name":"Mana Punch","dmg":29},{"name":"Arcane Blast","dmg":47}], desc: "Floating runic stones bonded together by pulsating violet arcane lightning.", image: makeSvgArt("#9333ea", "#3b0764", "🔮", "#d8b4fe") },
  { name: "Voltaic Exoskeleton", rarity: "epic", hp: 128, attacks: [{"name":"Plasma Cannon","dmg":31},{"name":"Overload Rocket","dmg":49}], desc: "A reinforced bipedal war machine powered by a magnetic lightning generator.", image: makeSvgArt("#475569", "#0f172a", "🦾", "#94a3b8") },
  { name: "Chrono Clockwork Guard", rarity: "epic", hp: 130, attacks: [{"name":"Cog Slicer","dmg":28},{"name":"Overwind Smash","dmg":45}], desc: "Precision gears and ticking pendulums powering an unyielding bronze guardian.", image: makeSvgArt("#d97706", "#451a03", "🕰️", "#fde68a") },
  { name: "Primal Tyrannosaur", rarity: "epic", hp: 130, attacks: [{"name":"Tail Sweep","dmg":28},{"name":"Primal Stomp","dmg":44}], desc: "A legendary dino fighter with a massive roar.", image: makeSvgArt("#15803d", "#052e16", "🦖", "#86efac") },
  { name: "Terran Geomanse", rarity: "epic", hp: 130, attacks: [{"name":"Stone Pillar","dmg":30},{"name":"Quake Stomp","dmg":47}], desc: "Channels subterranean tectonic energy to thrust stone pillars from the floor.", image: makeSvgArt("#78350f", "#1c1917", "🪨", "#fde68a") },
  { name: "Basalt Mountain Wyrm", rarity: "epic", hp: 132, attacks: [{"name":"Stone Wing","dmg":29},{"name":"Canyon Breath","dmg":46}], desc: "A flightless drake dwelling along jagged mountain cliffs.", image: makeSvgArt("#78716c", "#1c1917", "🦎", "#e7e5e4") },
  { name: "Three-Headed Marsh Hydra", rarity: "epic", hp: 134, attacks: [{"name":"Triple Fang","dmg":30},{"name":"Mud Acid","dmg":47}], desc: "Three serpent heads spitting corrosive venom across stagnant bogs.", image: makeSvgArt("#15803d", "#052e16", "🐍", "#86efac") },
  { name: "Adamantine Stinger", rarity: "epic", hp: 135, attacks: [{"name":"Metal Stinger","dmg":29},{"name":"Vice Grip","dmg":46}], desc: "Armored in heavy iron plating, crushing armor with hydraulic pincers.", image: makeSvgArt("#64748b", "#0f172a", "🦂", "#cbd5e1") },
  { name: "Galvanic Rhinoceros", rarity: "epic", hp: 135, attacks: [{"name":"Horn Charge","dmg":29},{"name":"Electric Stampede","dmg":46}], desc: "An armored horned titan channeling thousands of volts directly into its horn.", image: makeSvgArt("#eab308", "#713f12", "🦏", "#fef08a") },
  { name: "Steel-Plated Juggernaut", rarity: "epic", hp: 138, attacks: [{"name":"Steel Tusk","dmg":28},{"name":"Juggernaut Rush","dmg":45}], desc: "Plated in solid cold-rolled steel, crashing through heavy stone walls.", image: makeSvgArt("#64748b", "#0f172a", "🐗", "#cbd5e1") },
  { name: "Ironclad Dreadnought", rarity: "epic", hp: 140, attacks: [{"name":"Piston Strike","dmg":27},{"name":"Overheat Explosion","dmg":44}], desc: "A runaway locomotive construct generating boiling steam pressure.", image: makeSvgArt("#ea580c", "#431407", "🚂", "#fed7aa") },
  { name: "Trench Carapace Behemoth", rarity: "epic", hp: 140, attacks: [{"name":"Vise Pincer","dmg":27},{"name":"Deep Sea Clamp","dmg":44}], desc: "Armored crustacean dwelling near geothermal ocean vents with crushing hydraulic claws.", image: makeSvgArt("#0369a1", "#082f49", "🦀", "#7dd3fc") },
  { name: "Volcanic Colossus", rarity: "epic", hp: 140, attacks: [{"name":"Molten Fist","dmg":28},{"name":"Lava Slam","dmg":45}], desc: "Solid volcanic rock surrounding a core of bubbling liquid magma.", image: makeSvgArt("#b91c1c", "#450a0a", "🗿", "#fca5a5") },
  { name: "Archmage of Northern Lights", rarity: "legendary", hp: 135, attacks: [{"name":"Prismatic Flash","dmg":42},{"name":"Boreal Ray","dmg":62}], desc: "A sky mage who commands the northern lights.", image: makeSvgArt("#10b981", "#064e3b", "🧙", "#6ee7b7") },
  { name: "Dread Specter Sovereign", rarity: "legendary", hp: 140, attacks: [{"name":"Wraith Blade","dmg":40},{"name":"Nether Edge","dmg":60}], desc: "A legendary masked warrior from the forgotten realm.", image: makeSvgArt("#3b82f6", "#172554", "👻", "#bfdbfe") },
  { name: "Lunar High Priestess", rarity: "legendary", hp: 142, attacks: [{"name":"Crescent Beam","dmg":46},{"name":"Lunar Eclipse","dmg":68}], desc: "Chants serene celestial melodies that draw power from silver crescent moons.", image: makeSvgArt("#6366f1", "#1e1b4b", "🌙", "#c7d2fe") },
  { name: "Siren of the Drowned Trench", rarity: "legendary", hp: 144, attacks: [{"name":"Enchanting Song","dmg":45},{"name":"Drowning Wave","dmg":67}], desc: "Lures sailors and wandering warriors into bottomless whirlpools.", image: makeSvgArt("#0e7490", "#082f49", "🧜‍♀️", "#38bdf8") },
  { name: "Diamondscale Wyvern", rarity: "legendary", hp: 145, attacks: [{"name":"Prism Shard","dmg":45},{"name":"Diamond Breath","dmg":66}], desc: "A majestic scaled wyvern whose crystal wings refract sunlight into death rays.", image: makeSvgArt("#06b6d4", "#164e63", "💎", "#a5f3fc") },
  { name: "Solar Flare Sovereign", rarity: "legendary", hp: 145, attacks: [{"name":"Radiant Lance","dmg":41},{"name":"Solar Retribution","dmg":63}], desc: "An immortal solar angel wielding pure holy fire.", image: makeSvgArt("#f59e0b", "#78350f", "☀️", "#fef08a") },
  { name: "Phantom Blade Kage", rarity: "legendary", hp: 148, attacks: [{"name":"Spectral Slash","dmg":46},{"name":"Soul Cleaver","dmg":68}], desc: "An honorable phantom warrior whose katana slices through physical shields.", image: makeSvgArt("#6b21a8", "#3b0764", "⚔️", "#d8b4fe") },
  { name: "Valhalla War Maiden", rarity: "legendary", hp: 148, attacks: [{"name":"Valkyrie Thrust","dmg":40},{"name":"Heavenward Strike","dmg":61}], desc: "A divine warrior guiding champions to victory.", image: makeSvgArt("#eab308", "#713f12", "⚔", "#fef08a") },
  { name: "Eclipse Katana Bushido", rarity: "legendary", hp: 150, attacks: [{"name":"Dark Cut","dmg":47},{"name":"Night Stride","dmg":69}], desc: "A phantom swordsman striking through silhouettes before footsteps are heard.", image: makeSvgArt("#1e1b4b", "#020617", "🗡️", "#c7d2fe") },
  { name: "Eternal Rebirth Phoenix", rarity: "legendary", hp: 150, attacks: [{"name":"Resurrection Flame","dmg":44},{"name":"Blazing Talon","dmg":62}], desc: "An immortal firebird burning with the brilliant heat of a newborn solar core.", image: makeSvgArt("#ea580c", "#431407", "🪶", "#fdba74") },
  { name: "Fenrir Frosthowler", rarity: "legendary", hp: 150, attacks: [{"name":"Glacial Howl","dmg":42},{"name":"Frostfang Charge","dmg":64}], desc: "Alpha wolf of the eternal subzero taiga, freezing prey with each step.", image: makeSvgArt("#38bdf8", "#0c4a6e", "🐺", "#e0f2fe") },
  { name: "Elder Matron of Deepwoods", rarity: "legendary", hp: 152, attacks: [{"name":"Nature Wrath","dmg":44},{"name":"Verdant Tempest","dmg":66}], desc: "Ancient tree spirit commanding thorned roots and towering redwood branches.", image: makeSvgArt("#15803d", "#052e16", "🌿", "#86efac") },
  { name: "Electrum Winged Pegasus", rarity: "legendary", hp: 152, attacks: [{"name":"Lightning Wing","dmg":44},{"name":"Thunder Charge","dmg":66}], desc: "Winged steed galloping through stormclouds carrying celestial knights.", image: makeSvgArt("#0284c7", "#0c4a6e", "⚡", "#bae6fd") },
  { name: "Primordial Crimson Dragon", rarity: "legendary", hp: 155, attacks: [{"name":"Draco Claw","dmg":39},{"name":"Sovereign Breath","dmg":59}], desc: "The dragon king, feared across every kingdom.", image: makeSvgArt("#b91c1c", "#450a0a", "🐲", "#fca5a5") },
  { name: "Skybreaker Falcon", rarity: "legendary", hp: 155, attacks: [{"name":"Thunder Dive","dmg":43},{"name":"Lightning Vortex","dmg":65}], desc: "A razor-winged bird of prey riding thunderheads at supersonic velocities.", image: makeSvgArt("#0284c7", "#0f172a", "🦅", "#bae6fd") },
  { name: "Stormcaller Thunderbird", rarity: "legendary", hp: 155, attacks: [{"name":"Thunderbolt Plunge","dmg":45},{"name":"Storm Screech","dmg":67}], desc: "Its wingbeats summon electrical cloudbursts that illuminate nighttime skies.", image: makeSvgArt("#0284c7", "#082f49", "🦅", "#bae6fd") },
  { name: "Cerberus, Gates Warden", rarity: "legendary", hp: 158, attacks: [{"name":"Triple Bite","dmg":43},{"name":"Hellfire Roar","dmg":65}], desc: "Three-headed volcanic hound guarding the subterranean gates of the underworld.", image: makeSvgArt("#b91c1c", "#450a0a", "🐕", "#fca5a5") },
  { name: "Paladin of the Golden Sun", rarity: "legendary", hp: 158, attacks: [{"name":"Sunburst Blade","dmg":43},{"name":"Radiant Shield Bash","dmg":65}], desc: "Armored in pure gold, reflecting hostile sorcery back at opponents.", image: makeSvgArt("#f59e0b", "#78350f", "🛡️", "#fef08a") },
  { name: "Synthetic Nanopack Alpha", rarity: "legendary", hp: 158, attacks: [{"name":"Nanite Bite","dmg":43},{"name":"Pulse Dash","dmg":65}], desc: "A biomechanical pack hunter equipped with hydraulic legs and scanner eyes.", image: makeSvgArt("#0e7490", "#082f49", "🐺", "#38bdf8") },
  { name: "Colossus of Earth", rarity: "legendary", hp: 160, attacks: [{"name":"Iron Fist","dmg":38},{"name":"Colossus Smash","dmg":58}], desc: "An ancient champion covered in enchanted armor.", image: makeSvgArt("#d97706", "#451a03", "🗿", "#fde68a") },
  { name: "Deep Trench Kraken", rarity: "legendary", hp: 160, attacks: [{"name":"Tentacle Crush","dmg":42},{"name":"Tsunami Maw","dmg":64}], desc: "The mythic oceanic leviathan sleeping in the deepest abyssal midnight trench.", image: makeSvgArt("#1e3a8a", "#020617", "🦑", "#60a5fa") },
  { name: "Empress of Coral Seas", rarity: "legendary", hp: 160, attacks: [{"name":"Tsunami Wave","dmg":42},{"name":"Whirlpool Vortex","dmg":64}], desc: "Ruler of coral palaces who commands dolphins, orcas, and oceanic currents.", image: makeSvgArt("#0369a1", "#082f49", "👑", "#7dd3fc") },
  { name: "Sun Wukong, Monkey King", rarity: "legendary", hp: 160, attacks: [{"name":"Golden Staff","dmg":44},{"name":"Nimbus Strike","dmg":67}], desc: "The legendary monkey king soaring on a magic cloud with his size-shifting staff.", image: makeSvgArt("#eab308", "#713f12", "🐒", "#fef08a") },
  { name: "Radiant Wing Cavalier", rarity: "legendary", hp: 162, attacks: [{"name":"Holy Lance","dmg":42},{"name":"Heavenly Dive","dmg":64}], desc: "A divine knight mounted on a winged charger, bearing banners of victory.", image: makeSvgArt("#eab308", "#713f12", "🦄", "#fef08a") },
  { name: "Verdant Jade Wyrm", rarity: "legendary", hp: 162, attacks: [{"name":"Venomous Breath","dmg":42},{"name":"Jade Talon","dmg":64}], desc: "Scales of pure glowing jade protecting enchanted primordial forests.", image: makeSvgArt("#15803d", "#052e16", "🐲", "#86efac") },
  { name: "Abyssal Sea Leviathan", rarity: "legendary", hp: 165, attacks: [{"name":"Abyssal Slam","dmg":37},{"name":"Maelstrom Crush","dmg":56}], desc: "An ocean titan commanding the abyssal trench.", image: makeSvgArt("#0369a1", "#082f49", "🦑", "#7dd3fc") },
  { name: "Anubis, Arbiter of Souls", rarity: "legendary", hp: 165, attacks: [{"name":"Soul Judgement","dmg":41},{"name":"Underworld Staff","dmg":63}], desc: "Ancient jackal deity who weighs mortal spirits against the feather of truth.", image: makeSvgArt("#d97706", "#1c1917", "⚖️", "#fde68a") },
  { name: "Permafrost Frostwing", rarity: "legendary", hp: 165, attacks: [{"name":"Frost Breath","dmg":43},{"name":"Permafrost Lance","dmg":65}], desc: "Nests high in arctic crevasses, chilling air currents below freezing.", image: makeSvgArt("#38bdf8", "#0c4a6e", "🐲", "#e0f2fe") },
  { name: "Sol Lionheart Sovereign", rarity: "legendary", hp: 168, attacks: [{"name":"Solar Pounce","dmg":41},{"name":"Radiant Roar","dmg":63}], desc: "Golden mane shimmering like solar flares, roaring with blazing warmth.", image: makeSvgArt("#f59e0b", "#78350f", "🦁", "#fef08a") },
  { name: "Tectonic Magma Serpent", rarity: "legendary", hp: 168, attacks: [{"name":"Lava Breath","dmg":41},{"name":"Subterranean Slam","dmg":63}], desc: "Burrows through tectonic plates, surfacing only when volcanoes erupt.", image: makeSvgArt("#b91c1c", "#450a0a", "🌋", "#fca5a5") },
  { name: "Cybernetic Labyrinth Minotaur", rarity: "legendary", hp: 170, attacks: [{"name":"Overcharged Horn","dmg":39},{"name":"Hydraulic Cleave","dmg":61}], desc: "Heavy mechanical labyrinth guardian powered by a diesel plasma core.", image: makeSvgArt("#475569", "#0f172a", "🐂", "#cbd5e1") },
  { name: "Frostfang Monarch", rarity: "legendary", hp: 170, attacks: [{"name":"Absolute Zero","dmg":38},{"name":"Avalanche Crash","dmg":60}], desc: "Ancient frost sovereign wielding towering permafrost spires.", image: makeSvgArt("#0284c7", "#0f172a", "❄️", "#bae6fd") },
  { name: "Poseidon, Sea Emperor", rarity: "legendary", hp: 170, attacks: [{"name":"Trident Pierce","dmg":40},{"name":"Tidal Deluge","dmg":62}], desc: "Emperor of tempestuous oceans wielding an earth-shattering golden trident.", image: makeSvgArt("#0284c7", "#082f49", "🔱", "#7dd3fc") },
  { name: "Molten Core Mammut", rarity: "legendary", hp: 175, attacks: [{"name":"Magma Stomp","dmg":40},{"name":"Volcanic Burst","dmg":62}], desc: "A colossal beast whose footsteps melt bedrock into boiling magma pools.", image: makeSvgArt("#ea580c", "#431407", "🦣", "#fed7aa") },
  { name: "Jotunheim Glacial Giant", rarity: "legendary", hp: 176, attacks: [{"name":"Iceberg Toss","dmg":38},{"name":"Glacial Hammer","dmg":59}], desc: "Carves towering glaciers into weapons with ancestral ice magic.", image: makeSvgArt("#38bdf8", "#075985", "❄️", "#e0f2fe") },
  { name: "Bastion Armor Vanguard", rarity: "legendary", hp: 180, attacks: [{"name":"Heavy Cleave","dmg":38},{"name":"Fortress Bash","dmg":60}], desc: "A legendary champion wrapped in impenetrable layered iron plates.", image: makeSvgArt("#475569", "#0f172a", "🛡️", "#cbd5e1") },
  { name: "Obsidian Dreadnought", rarity: "legendary", hp: 180, attacks: [{"name":"Volcanic Punch","dmg":36},{"name":"Obsidian Slam","dmg":58}], desc: "Formed from cooled black volcanic glass, impervious to ordinary physical weaponry.", image: makeSvgArt("#1e293b", "#0f172a", "🗿", "#94a3b8") },
  { name: "Titanium Siege Titan", rarity: "legendary", hp: 185, attacks: [{"name":"Steam Hammer","dmg":35},{"name":"Megaton Crash","dmg":57}], desc: "A steam-powered iron juggernaut crushing defensive fortresses with bare hands.", image: makeSvgArt("#475569", "#0f172a", "⚙️", "#cbd5e1") },
  { name: "Chrono Weaver of Time", rarity: "mythic", hp: 165, attacks: [{"name":"Time Warp","dmg":56},{"name":"Timeline Rupture","dmg":84}], desc: "The master of timelines who weaves all realities together.", image: makeSvgArt("#e11d48", "#881337", "⏳", "#fda4af") },
  { name: "Cosmic Pioneer Archon", rarity: "mythic", hp: 170, attacks: [{"name":"Gamma Ray","dmg":54},{"name":"Hypernova Laser","dmg":80}], desc: "The space explorer infused with a cosmic hyper-core.", image: makeSvgArt("#4338ca", "#0f172a", "🚀", "#a5b4fc") },
  { name: "Maelstrom Vortex Apparition", rarity: "mythic", hp: 170, attacks: [{"name":"Spiral Haunt","dmg":60},{"name":"Vortex Annihilation","dmg":89}], desc: "Spiraling specter that feeds on the chaotic entropy of collapsing star cores.", image: makeSvgArt("#7c3aed", "#2e1065", "🌀", "#ddd6fe", "rgba(124, 58, 237, 0.5)") },
  { name: "Abyssal Void Monarch", rarity: "mythic", hp: 175, attacks: [{"name":"Dark Rift","dmg":52},{"name":"Singularity Collapse","dmg":78}], desc: "A mysterious entity wielding absolute spatial absence.", image: makeSvgArt("#1e1b4b", "#020617", "🕳", "#818cf8") },
  { name: "Dimensional Riftstalker", rarity: "mythic", hp: 175, attacks: [{"name":"Rift Cutter","dmg":59},{"name":"Dimensional Sever","dmg":88}], desc: "Dual-wields warp scythes that slice dimensional seams into jagged wormholes.", image: makeSvgArt("#be123c", "#4c0519", "⚔️", "#fda4af", "rgba(225, 29, 72, 0.5)") },
  { name: "Quantum Probability Shifter", rarity: "mythic", hp: 175, attacks: [{"name":"Entanglement Ray","dmg":62},{"name":"Phase Disruption","dmg":90}], desc: "Exists simultaneously in multiple locations until observed in combat.", image: makeSvgArt("#06b6d4", "#164e63", "⚛️", "#a5f3fc", "rgba(6, 182, 212, 0.5)") },
  { name: "Starlight Nebula Shaper", rarity: "mythic", hp: 175, attacks: [{"name":"Stardust Beam","dmg":52},{"name":"Constellation Warp","dmg":80}], desc: "Weaves spinning stardust nebulae into devastating interdimensional portals.", image: makeSvgArt("#701a75", "#1e1b4b", "🪐", "#f472b6", "rgba(244, 114, 182, 0.5)") },
  { name: "Monarch of Eternal Shadows", rarity: "mythic", hp: 180, attacks: [{"name":"Army of Shadows","dmg":60},{"name":"Monarch's Domain","dmg":88}], desc: "Lord of fallen warriors whose dark army obeys every whispered command.", image: makeSvgArt("#1e1b4b", "#020617", "👑", "#a855f7", "rgba(168, 85, 247, 0.5)") },
  { name: "Nanotech Rebirth Phoenix", rarity: "mythic", hp: 180, attacks: [{"name":"Digital Rebirth","dmg":58},{"name":"Nanite Inferno","dmg":86}], desc: "A mechanical avian reconstructed from quantum circuitry and self-replicating fire.", image: makeSvgArt("#e11d48", "#1e1b4b", "🪶", "#fecdd3", "rgba(225, 29, 72, 0.5)") },
  { name: "Solar Eclipse Dominator", rarity: "mythic", hp: 180, attacks: [{"name":"Shadow Corona","dmg":50},{"name":"Corona Annihilation","dmg":76}], desc: "A secret warrior born when the sun and moon collide.", image: makeSvgArt("#be185d", "#500724", "🌑", "#f472b6") },
  { name: "Supercluster Stardust Phoenix", rarity: "mythic", hp: 182, attacks: [{"name":"Cosmic Rebirth","dmg":63},{"name":"Supercluster Fire","dmg":92}], desc: "Reborn inside active planetary nebulae with feathers of ultraviolet flame.", image: makeSvgArt("#7c3aed", "#2e1065", "🪶", "#ddd6fe", "rgba(124, 58, 237, 0.5)") },
  { name: "Aero-Mech Valkyrie Prime", rarity: "mythic", hp: 185, attacks: [{"name":"Laser Spear","dmg":62},{"name":"Orbital Strike","dmg":91}], desc: "Equipped with hyper-propulsion wings and an orbital particle accelerator lance.", image: makeSvgArt("#ec4899", "#831843", "⚔️", "#fbcfe8", "rgba(236, 72, 153, 0.5)") },
  { name: "Apex Prehistoric Leviathan", rarity: "mythic", hp: 185, attacks: [{"name":"Primal Devour","dmg":55},{"name":"Feral Apocalypse","dmg":82}], desc: "A colossal beast fused with cybernetic armor from prehistoric extinction fossils.", image: makeSvgArt("#854d0e", "#1c1917", "🦖", "#fef08a", "rgba(234, 179, 8, 0.5)") },
  { name: "Superheated Plasma Drake", rarity: "mythic", hp: 185, attacks: [{"name":"Ionic Flame","dmg":57},{"name":"Plasma Megabomb","dmg":85}], desc: "A dragon forged entirely of pure superheated ionized fourth-state matter.", image: makeSvgArt("#0284c7", "#1e1b4b", "⚡", "#38bdf8", "rgba(56, 189, 248, 0.5)") },
  { name: "Temporal Continuum Dragon", rarity: "mythic", hp: 188, attacks: [{"name":"Temporal Breath","dmg":60},{"name":"Rift Fracture","dmg":90}], desc: "Breathes temporal anomalies that age opponent armor into brittle rust.", image: makeSvgArt("#e11d48", "#1e1b4b", "🐉", "#fda4af", "rgba(225, 29, 72, 0.5)") },
  { name: "Celestial Starclaw Tiger", rarity: "mythic", hp: 190, attacks: [{"name":"Stellar Pounce","dmg":56},{"name":"Nebula Claw","dmg":84}], desc: "A fierce cosmic predator stalking constellations across interplanetary dust.", image: makeSvgArt("#c026d3", "#4a044e", "🐅", "#f5d0fe", "rgba(192, 38, 211, 0.5)") },
  { name: "Omega Realm Ascendant", rarity: "mythic", hp: 190, attacks: [{"name":"Alpha Smite","dmg":48},{"name":"Genesis Decree","dmg":74}], desc: "The unknown final sovereign of the entire pantheon.", image: makeSvgArt("#f43f5e", "#4c0519", "👑", "#fecdd3") },
  { name: "Selene, Empress of Moons", rarity: "mythic", hp: 190, attacks: [{"name":"Silver Eclipse","dmg":61},{"name":"Tidal Pull","dmg":89}], desc: "Commands gravity and ocean tides using a silver scepter crowned with moon dust.", image: makeSvgArt("#6366f1", "#1e1b4b", "🌙", "#c7d2fe", "rgba(99, 102, 241, 0.5)") },
  { name: "Sundial Titan of Aeons", rarity: "mythic", hp: 190, attacks: [{"name":"Decay Beam","dmg":57},{"name":"Epoch Smash","dmg":84}], desc: "Wields heavy sundial pendulums that accelerate opponent aging.", image: makeSvgArt("#e11d48", "#4c0519", "⏰", "#fda4af", "rgba(225, 29, 72, 0.5)") },
  { name: "Hellfire Realm Sovereign", rarity: "mythic", hp: 195, attacks: [{"name":"Hellstorm Slash","dmg":59},{"name":"Molten Apocalypse","dmg":88}], desc: "Commands subterranean lava currents that breach faultlines during battle.", image: makeSvgArt("#b91c1c", "#450a0a", "🔥", "#fca5a5", "rgba(185, 28, 28, 0.5)") },
  { name: "Hyperion, Sun Titan", rarity: "mythic", hp: 195, attacks: [{"name":"Radiant Pillar","dmg":55},{"name":"Sunburst Cataclysm","dmg":83}], desc: "Ancient titan of supreme heavenly illumination with blinding photon blades.", image: makeSvgArt("#d97706", "#451a03", "☀️", "#fde68a", "rgba(217, 119, 6, 0.5)") },
  { name: "Nebula Stellar Dragon", rarity: "mythic", hp: 195, attacks: [{"name":"Stardust Inferno","dmg":58},{"name":"Galaxy Claw","dmg":86}], desc: "Wings spanning five light-years across vibrant deep-space star nurseries.", image: makeSvgArt("#7c3aed", "#2e1065", "🐉", "#e9d5ff", "rgba(124, 58, 237, 0.5)") },
  { name: "Synthesized AI Sovereign", rarity: "mythic", hp: 195, attacks: [{"name":"System Meltdown","dmg":58},{"name":"Zero-Day Nanostrike","dmg":85}], desc: "A sentient superintelligence that rewrites the physics and code of reality.", image: makeSvgArt("#0e7490", "#082f49", "👾", "#38bdf8", "rgba(56, 189, 248, 0.5)") },
  { name: "Coronal Solar Colossus", rarity: "mythic", hp: 200, attacks: [{"name":"Corona Blast","dmg":56},{"name":"Thermonuclear Stomp","dmg":85}], desc: "A four-legged sun titan that leaves glowing nuclear footprints in molten rock.", image: makeSvgArt("#d97706", "#451a03", "☀️", "#fde68a", "rgba(217, 119, 6, 0.5)") },
  { name: "Dark Matter Singularity", rarity: "mythic", hp: 200, attacks: [{"name":"Graviton Pull","dmg":54},{"name":"Singularity Crush","dmg":86}], desc: "Invisible matter holding galaxies together, crushing all light that dares approach.", image: makeSvgArt("#0f172a", "#020617", "🌑", "#94a3b8", "rgba(148, 163, 184, 0.5)") },
  { name: "Helios Plasma Dragon", rarity: "mythic", hp: 205, attacks: [{"name":"Solar Flare Breath","dmg":58},{"name":"Coronal Ejection","dmg":87}], desc: "A dragon orbiting stars, absorbing thermonuclear plasma into fiery scales.", image: makeSvgArt("#ea580c", "#431407", "🐲", "#fed7aa", "rgba(234, 88, 12, 0.5)") },
  { name: "Tempest Tide Leviathan", rarity: "mythic", hp: 205, attacks: [{"name":"Maelstrom Surge","dmg":54},{"name":"Ocean Tempest","dmg":82}], desc: "A titanic serpent residing in abyssal depths beneath raging typhoons.", image: makeSvgArt("#0369a1", "#082f49", "🌊", "#7dd3fc", "rgba(3, 105, 161, 0.5)") },
  { name: "Null-Mass Void Titan", rarity: "mythic", hp: 210, attacks: [{"name":"Abyssal Quake","dmg":55},{"name":"Null Sphere","dmg":85}], desc: "A giant carved from negative mass who creates gravitational sinkholes.", image: makeSvgArt("#0f172a", "#020617", "🗿", "#94a3b8", "rgba(148, 163, 184, 0.5)") },
  { name: "Trenches Abyssal Behemoth", rarity: "mythic", hp: 210, attacks: [{"name":"Trench Quake","dmg":51},{"name":"Oceanic Rupture","dmg":80}], desc: "A massive primeval sea creature dwelling thousands of fathoms below sunlight.", image: makeSvgArt("#0369a1", "#082f49", "🐋", "#7dd3fc", "rgba(3, 105, 161, 0.5)") },
  { name: "Interstellar Deep Space Leviathan", rarity: "mythic", hp: 215, attacks: [{"name":"Stardust Maw","dmg":53},{"name":"Event Horizon Crush","dmg":84}], desc: "Glides across interstellar voids, swallowing rogue asteroids and comets whole.", image: makeSvgArt("#1e1b4b", "#020617", "🐋", "#818cf8", "rgba(129, 140, 248, 0.5)") },
  { name: "Seraphina, Angelic Harbinger", rarity: "divine", hp: 205, attacks: [{"name":"Dawn's Radiance","dmg":72},{"name":"Heavenly Exorcism","dmg":94}], desc: "The archangel of creation radiating eternal divine light.", image: makeSvgArt("#065f46", "#022c22", "🕊️", "#fef08a", "rgba(250, 204, 21, 0.6)") },
  { name: "Nyxara, Goddess of the Void", rarity: "divine", hp: 215, attacks: [{"name":"Eternal Eclipse","dmg":70},{"name":"Void Rebirth","dmg":96}], desc: "Queen of the boundless astral abyss, weaving constellations in eternal twilight.", image: makeSvgArt("#4c1d95", "#020617", "🌌", "#c084fc", "rgba(192, 132, 252, 0.6)") },
  { name: "Aethelgard, King of Deities", rarity: "divine", hp: 220, attacks: [{"name":"Celestial Judgement","dmg":68},{"name":"Omnipresent Wrath","dmg":98}], desc: "The supreme cosmic creator presiding above galaxies.", image: makeSvgArt("#0284c7", "#1e1b4b", "👑", "#facc15", "rgba(56, 189, 248, 0.6)") },
  { name: "Solar Empress, Crown of Heavens", rarity: "divine", hp: 225, attacks: [{"name":"Crown of Corona","dmg":77},{"name":"Solar Flare Wrath","dmg":104}], desc: "Sovereign ruler of burning stellar crowns, commanding thermonuclear winds.", image: makeSvgArt("#f59e0b", "#7c2d12", "👑", "#fef08a", "rgba(245, 158, 11, 0.6)") },
  { name: "Archangel Gabriel, Trumpet of God", rarity: "divine", hp: 230, attacks: [{"name":"Horn of Zion","dmg":75},{"name":"Heavenly Retribution","dmg":105}], desc: "Messenger of eternal light carrying holy scriptures of creation and judgement.", image: makeSvgArt("#0284c7", "#1e1b4b", "📯", "#facc15", "rgba(56, 189, 248, 0.6)") },
  { name: "Solarius Omnis, God of Stars", rarity: "divine", hp: 230, attacks: [{"name":"Supernova Genesis","dmg":76},{"name":"Solar Deity Cataclysm","dmg":102}], desc: "The Primordial Sun God whose radiant heartbeat breathes stars into existence.", image: makeSvgArt("#f59e0b", "#7c2d12", "☀️", "#fef08a", "rgba(245, 158, 11, 0.6)") },
  { name: "Infinity Walker, Multiverse Wanderer", rarity: "divine", hp: 235, attacks: [{"name":"Paradox Step","dmg":74},{"name":"Zero Point Strike","dmg":108}], desc: "A wandering eternal wanderer who steps between parallel quantum dimensions.", image: makeSvgArt("#8b5cf6", "#3b0764", "🌌", "#e9d5ff", "rgba(139, 92, 246, 0.6)") },
  { name: "Astral Archon, Supercluster Lord", rarity: "divine", hp: 240, attacks: [{"name":"Archon Beam","dmg":75},{"name":"Supercluster Nova","dmg":105}], desc: "A colossal celestial custodian governing the alignment of galaxy clusters.", image: makeSvgArt("#6366f1", "#1e1b4b", "✨", "#c7d2fe", "rgba(99, 102, 241, 0.6)") },
  { name: "Phoenix of the Holy Embers", rarity: "divine", hp: 245, attacks: [{"name":"Solar Reincarnation","dmg":76},{"name":"Eternal Supernova","dmg":106}], desc: "Bathing in the light of exploding stars, rising eternally from holy embers.", image: makeSvgArt("#ea580c", "#450a0a", "🪶", "#fde047", "rgba(234, 88, 12, 0.6)") },
  { name: "Aegis Prime, Celestial Bastion", rarity: "divine", hp: 250, attacks: [{"name":"Bastion Overload","dmg":65},{"name":"God-Shield Nova","dmg":95}], desc: "An impenetrable living fortress of celestial adamantine guarding the heavens.", image: makeSvgArt("#0f766e", "#134e4a", "🛡️", "#2dd4bf", "rgba(45, 212, 191, 0.6)") },
  { name: "Amaterasu, Dawn Goddess of the Sun", rarity: "divine", hp: 250, attacks: [{"name":"Mirror of Dawn","dmg":78},{"name":"Solar Radiance","dmg":108}], desc: "The shining heavenly sun goddess illuminating heaven and banishing spiritual gloom.", image: makeSvgArt("#f59e0b", "#7c2d12", "🪞", "#fef08a", "rgba(245, 158, 11, 0.6)") },
  { name: "Chronos, Sovereign of Timelines", rarity: "divine", hp: 250, attacks: [{"name":"Temporal Fracture","dmg":80},{"name":"Timeless Paradox","dmg":112}], desc: "The supreme ruler of timelines who can rewind destiny itself.", image: makeSvgArt("#e11d48", "#1e1b4b", "⏳", "#fda4af", "rgba(225, 29, 72, 0.6)") },
  { name: "Omni Dragon, Creator of Realities", rarity: "divine", hp: 260, attacks: [{"name":"Cosmic Breath","dmg":78},{"name":"Reality Collapse","dmg":110}], desc: "The progenitor dragon who swallowed a supernova to ignite the universe.", image: makeSvgArt("#f43f5e", "#4c0519", "🐉", "#fef08a", "rgba(244, 63, 94, 0.6)") },
  { name: "Zeus Omnipotent, God of Olympus", rarity: "divine", hp: 260, attacks: [{"name":"Aegis Lightning","dmg":80},{"name":"Olympian Wrath","dmg":112}], desc: "Father of Olympus hurling thunderbolts crafted in subterranean cyclops forges.", image: makeSvgArt("#eab308", "#713f12", "⚡", "#fef08a", "rgba(234, 179, 8, 0.6)") },
  { name: "Odin Allfather, Lord of Valhalla", rarity: "divine", hp: 265, attacks: [{"name":"Gungnir Thrust","dmg":82},{"name":"Valhalla Decree","dmg":114}], desc: "Ruler of Asgard who sacrificed an eye at Mimir's well to perceive all cosmic fate.", image: makeSvgArt("#0284c7", "#1e1b4b", "👁️", "#facc15", "rgba(56, 189, 248, 0.6)") },
  { name: "Singularity, The Event Horizon", rarity: "divine", hp: 270, attacks: [{"name":"Gravity Well","dmg":72},{"name":"Universal Devour","dmg":115}], desc: "The point of infinite density where all known laws of physics cease to exist.", image: makeSvgArt("#09090b", "#020617", "🕳️", "#cbd5e1", "rgba(148, 163, 184, 0.6)") },
  { name: "Deus Ex Machina, The Grand Architect", rarity: "divine", hp: 275, attacks: [{"name":"Singularity Overwrite","dmg":85},{"name":"Cosmic Clockwork","dmg":118}], desc: "The ultimate sentient AI godhead governing reality through quantum code calculation.", image: makeSvgArt("#0e7490", "#082f49", "🤖", "#38bdf8", "rgba(56, 189, 248, 0.6)") },
  { name: "Genesis Tree, Root of Existence", rarity: "divine", hp: 275, attacks: [{"name":"Root of Eternity","dmg":62},{"name":"World Tree Bloom","dmg":98}], desc: "The cosmic Yggdrasil whose celestial roots anchor the multiverse into harmony.", image: makeSvgArt("#059669", "#064e3b", "🌳", "#6ee7b7", "rgba(16, 185, 129, 0.6)") },
  { name: "Tiamat, Primordial Dragon of Chaos", rarity: "divine", hp: 280, attacks: [{"name":"Primordial Tsunami","dmg":74},{"name":"Mother of Monsters","dmg":116}], desc: "The colossal salt-sea dragon of primeval chaos who gave birth to ancient pantheons.", image: makeSvgArt("#4c1d95", "#020617", "🐉", "#c084fc", "rgba(192, 132, 252, 0.6)") },
  { name: "Chronos Absolute Zero", rarity: "transcendent", hp: 325, attacks: [{"name":"Rewind Fate","dmg":100},{"name":"Infinite Timelines Strike","dmg":140}], desc: "Master of causality who commands all parallel pasts, presents, and futures simultaneously.", image: makeSvgArt("#e11d48", "#1e1b4b", "⏳", "#fda4af", "rgba(225, 29, 72, 0.75)") },
  { name: "Solaria, Core of the Cosmos", rarity: "transcendent", hp: 330, attacks: [{"name":"Hyper-Corona Ray","dmg":104},{"name":"Galactic Core Eruption","dmg":144}], desc: "The sentient primordial sun whose gravitational pulse beats like the heart of the universe.", image: makeSvgArt("#ea580c", "#7c2d12", "☀️", "#fde047", "rgba(234, 88, 12, 0.75)") },
  { name: "Aethelgard Zenith Unbound", rarity: "transcendent", hp: 335, attacks: [{"name":"Light of Genesis","dmg":102},{"name":"Transcendent Supernova","dmg":142}], desc: "The ultimate liberated celestial deity ascending beyond divine comprehension.", image: makeSvgArt("#f59e0b", "#451a03", "👑", "#fef08a", "rgba(245, 158, 11, 0.75)") },
  { name: "Kael'thas, Void Singularity Sovereign", rarity: "transcendent", hp: 335, attacks: [{"name":"Absolute Zero Void","dmg":101},{"name":"Singularity Cleave","dmg":141}], desc: "Lord of negative mass and collapsing dark matter who can shred dimensions at will.", image: makeSvgArt("#09090b", "#020617", "🕳️", "#cbd5e1", "rgba(148, 163, 184, 0.75)") },
  { name: "Seraphim Apex, Eye of Omniscience", rarity: "transcendent", hp: 340, attacks: [{"name":"Voice of the Infinite","dmg":103},{"name":"Divine Seal of Judgement","dmg":146}], desc: "A multi-winged celestial entity whose thousand eyes perceive every reality at once.", image: makeSvgArt("#06b6d4", "#1e1b4b", "👁️", "#a5f3fc", "rgba(6, 182, 212, 0.75)") },
  { name: "Yggdrasil, Heart of the Multiverse", rarity: "transcendent", hp: 340, attacks: [{"name":"Roots of Creation","dmg":98},{"name":"Nine Realms Convergence","dmg":138}], desc: "The holy ash tree sustaining nine entire cosmic realms within its eternal emerald branches.", image: makeSvgArt("#059669", "#022c22", "🌳", "#a7f3d0", "rgba(16, 185, 129, 0.75)") },
  { name: "Ouroboros, The Endless Loop", rarity: "transcendent", hp: 345, attacks: [{"name":"Eternal Cycle","dmg":99},{"name":"Endless Paradox Strike","dmg":139}], desc: "The cosmic serpent devouring its own tail, symbolizing infinite death and rebirth.", image: makeSvgArt("#7c3aed", "#09090b", "♾️", "#c4b5fd", "rgba(124, 58, 237, 0.75)") },
  { name: "Azathoth, The Blind Eternity", rarity: "transcendent", hp: 350, attacks: [{"name":"Dream of Cosmos","dmg":105},{"name":"Awakening of Nothingness","dmg":145}], desc: "The slumbering nuclear chaos at the center of infinity whose awakening undoes existence.", image: makeSvgArt("#4c1d95", "#020617", "🌌", "#e9d5ff", "rgba(168, 85, 247, 0.75)") },
  { name: "Cosmic Nexus, The Omniverse", rarity: "transcendent", hp: 355, attacks: [{"name":"Convergence Ray","dmg":108},{"name":"Omniversal Collapse","dmg":148}], desc: "The literal manifestation of all dimensions and alternate possibilities interwoven into one.", image: makeSvgArt("#ec4899", "#1e1b4b", "✨", "#fbcfe8", "rgba(236, 72, 153, 0.75)") },
  { name: "The Primordial Demiurge", rarity: "transcendent", hp: 360, attacks: [{"name":"Big Bang Edict","dmg":110},{"name":"Multiverse Sculpt","dmg":150}], desc: "Architect of cosmic physical matter and supreme shaper of galaxies.", image: makeSvgArt("#0284c7", "#1e1b4b", "🪐", "#38bdf8", "rgba(56, 189, 248, 0.75)") }
];

function getDeletedCardsFromStorage(){
  try {
    const saved = JSON.parse(localStorage.getItem("cardCollectorDeletedCards"));
    if(Array.isArray(saved)) return saved;
  } catch(e){}
  return [];
}
if(typeof window !== "undefined") window.getDeletedCardsFromStorage = getDeletedCardsFromStorage;

function getCardOverridesFromStorage(){
  try {
    const saved = JSON.parse(localStorage.getItem("cardCollectorCardOverrides"));
    if(saved && typeof saved === "object") return saved;
  } catch(e){}
  return {};
}
if(typeof window !== "undefined") window.getCardOverridesFromStorage = getCardOverridesFromStorage;

function saveDeletedCardsToStorage(list){
  try {
    localStorage.setItem("cardCollectorDeletedCards", JSON.stringify(list));
  } catch(e){}
}
if(typeof window !== "undefined") window.saveDeletedCardsToStorage = saveDeletedCardsToStorage;

function saveCardOverridesToStorage(overrides){
  try {
    localStorage.setItem("cardCollectorCardOverrides", JSON.stringify(overrides));
  } catch(e){}
}
if(typeof window !== "undefined") window.saveCardOverridesToStorage = saveCardOverridesToStorage;

function isInfiniteValue(val){
  return val === Infinity || val === "Infinity" || val === "infinite" || val === "∞" || val === 999999999 || val === "999999999";
}
if(typeof window !== "undefined") window.isInfiniteValue = isInfiniteValue;

function formatHp(val){
  return isInfiniteValue(val) ? "∞ HP" : (val !== undefined && val !== null ? val + " HP" : "80 HP");
}
if(typeof window !== "undefined") window.formatHp = formatHp;

function formatDmg(val){
  return isInfiniteValue(val) ? "∞ DMG" : (val !== undefined && val !== null ? val + " DMG" : "20 DMG");
}
if(typeof window !== "undefined") window.formatDmg = formatDmg;

function formatCoins(val){
  return isInfiniteValue(val) ? "∞" : (val !== undefined && val !== null && !isNaN(Number(val)) ? Number(val).toLocaleString() : "0");
}
if(typeof window !== "undefined") window.formatCoins = formatCoins;

function getRarityTheme(rarity){
  const r = (rarity || "common").toLowerCase().trim();
  switch(r){
    case "transcendent":
      return { bg: "rgba(244,63,94,0.25)", text: "#fda4af", border: "#f43f5e" };
    case "divine":
      return { bg: "rgba(56,189,248,0.2)", text: "#38bdf8", border: "#38bdf8" };
    case "mythic":
      return { bg: "rgba(236,72,153,0.2)", text: "#ec4899", border: "#ec4899" };
    case "legendary":
      return { bg: "rgba(245,158,11,0.2)", text: "#f59e0b", border: "#f59e0b" };
    case "epic":
      return { bg: "rgba(168,85,247,0.2)", text: "#a855f7", border: "#a855f7" };
    case "rare":
      return { bg: "rgba(59,130,246,0.2)", text: "#60a5fa", border: "#3b82f6" };
    case "common":
    default:
      return { bg: "rgba(148,163,184,0.15)", text: "#cbd5e1", border: "#64748b" };
  }
}
if(typeof window !== "undefined") window.getRarityTheme = getRarityTheme;

function normalizeCards(cardList){
  if(!Array.isArray(cardList)) return [];
  const deleted = getDeletedCardsFromStorage();
  const overrides = getCardOverridesFromStorage();

  return cardList
    .filter(c => {
      if(!c || !c.name) return false;
      const id = c.id || "card_" + c.name.toLowerCase().replace(/\s+/g, "_");
      c.id = id;
      if(deleted.includes(id) || deleted.includes(c.name.toLowerCase())) return false;
      return true;
    })
    .map(c => {
      const id = c.id || "card_" + c.name.toLowerCase().replace(/\s+/g, "_");
      c.id = id;
      const ov = overrides[id] || overrides[c.name.toLowerCase()];
      if(ov){
        if(Array.isArray(ov.attacks)) c.attacks = JSON.parse(JSON.stringify(ov.attacks));
        if(ov.hp !== undefined) c.hp = ov.hp;
        if(ov.desc) c.desc = ov.desc;
        if(ov.name) c.name = ov.name;
      }
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
  divine: { name: "Celestial Reliquary", baseCost: 600, count: 8, icon: "🌟", bg: "radial-gradient(circle, #0369a1, #1e1b4b)", border: "#38bdf8", weights: { common: 0, rare: 5, epic: 20, legendary: 35, mythic: 25, divine: 14, transcendent: 1 }, minRarity: "divine" },
  transcendent: { name: "Transcendent Nexus", baseCost: 1000, count: 8, icon: "🌌", bg: "radial-gradient(circle, #4c1d95, #020617)", border: "#f43f5e", weights: { common: 0, rare: 0, epic: 10, legendary: 25, mythic: 35, divine: 20, transcendent: 10 }, minRarity: "transcendent" }
};

const rarityRank = { common: 1, rare: 2, epic: 3, legendary: 4, mythic: 5, divine: 6, transcendent: 7 };

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
if(typeof window !== "undefined") window.subAdminRoles = subAdminRoles;
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
let owned = [0];
let coins = 100;
let filter = "all";
let adminLuckMultiplier = parseFloat(localStorage.getItem("cardCollectorLuck") || "1");

let eventCoinMultiplier = parseInt(localStorage.getItem("cardCollectorEventCoins") || "1");
let eventPackDiscount = parseInt(localStorage.getItem("cardCollectorEventDiscount") || "0");
let isMaintenanceMode = localStorage.getItem("cardCollectorMaintenance") === "true";
let isLockdownMode = localStorage.getItem("cardCollectorLockdown") === "true";
let isGodModeEnabled = localStorage.getItem("cardCollectorGodMode") !== "false";
if(typeof window !== "undefined"){
  window.owned = owned;
  window.cards = cards;
  window.currentUser = currentUser;
  window.accounts = accounts;
  window.defaultCards = defaultCards;
  window.isLockdownMode = isLockdownMode;
}

function getSubAdminRole(username){
  if(!username) return null;
  try {
    const saved = JSON.parse(localStorage.getItem("cardCollectorSubAdmins"));
    if(saved && typeof saved === "object") subAdminRoles = saved;
  } catch(e){}
  if(!subAdminRoles || typeof subAdminRoles !== "object") return null;
  if(subAdminRoles[username]) return subAdminRoles[username];
  const lower = username.toLowerCase().trim();
  const matchKey = Object.keys(subAdminRoles).find(k => k.toLowerCase().trim() === lower);
  return matchKey ? subAdminRoles[matchKey] : null;
}
if(typeof window !== "undefined") window.getSubAdminRole = getSubAdminRole;

function isMasterAdmin(){
  const user = (typeof window !== "undefined" && window.currentUser !== undefined) ? window.currentUser : (typeof currentUser !== "undefined" ? currentUser : null);
  return !!(user && user.toLowerCase().trim() === ADMIN_USERNAME.toLowerCase().trim());
}
if(typeof window !== "undefined") window.isMasterAdmin = isMasterAdmin;

function getSubAdminPermissions(role){
  if(!role) return { players: false, studio: false, cardManager: false, economy: false, events: false, broadcast: false };
  if(role.permissions && typeof role.permissions === "object"){
    return {
      players: role.permissions.players !== false,
      studio: !!role.permissions.studio,
      cardManager: !!role.permissions.cardManager,
      economy: !!role.permissions.economy,
      events: !!role.permissions.events,
      broadcast: !!role.permissions.broadcast,
      chaosLab: !!role.permissions.chaosLab
    };
  }
  return {
    players: true,
    studio: false,
    cardManager: false,
    economy: false,
    events: false,
    broadcast: false,
    chaosLab: false
  };
}
if(typeof window !== "undefined") window.getSubAdminPermissions = getSubAdminPermissions;

function canSubAdminPerform(feature){
  if(isMasterAdmin()) return true;
  if(!isSubAdmin()) return false;
  const user = (typeof window !== "undefined" && window.currentUser !== undefined) ? window.currentUser : (typeof currentUser !== "undefined" ? currentUser : null);
  const role = getSubAdminRole(user);
  if(!role || !role.active) return false;
  const perms = getSubAdminPermissions(role);
  return !!perms[feature];
}
if(typeof window !== "undefined") window.canSubAdminPerform = canSubAdminPerform;

function isSubAdmin(){
  const user = (typeof window !== "undefined" && window.currentUser !== undefined) ? window.currentUser : (typeof currentUser !== "undefined" ? currentUser : null);
  if(!user) return false;
  if(isMasterAdmin()) return false;
  const role = getSubAdminRole(user);
  return !!(role && role.active);
}
if(typeof window !== "undefined") window.isSubAdmin = isSubAdmin;

function hasAdminAccess(){
  return isMasterAdmin() || isSubAdmin();
}
if(typeof window !== "undefined") window.hasAdminAccess = hasAdminAccess;

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


// Universal Account & Vault Card Lookup Helpers
function getUserAccount(username){
  if(!username || typeof accounts !== "object" || !accounts) return null;
  if(accounts[username]) return accounts[username];
  const lower = username.toLowerCase();
  const matchK = Object.keys(accounts).find(k => k.toLowerCase() === lower);
  return matchK ? accounts[matchK] : null;
}
if(typeof window !== "undefined") window.getUserAccount = getUserAccount;

function findVaultCardByIdOrName(id){
  if(!id || typeof unreleasedCards === "undefined" || !Array.isArray(unreleasedCards)) return null;
  const idStr = String(id).toLowerCase().trim();
  return unreleasedCards.find(c => {
    if(!c) return false;
    const cId = c.id ? String(c.id).toLowerCase().trim() : "";
    const cName = c.name ? String(c.name).toLowerCase().trim() : "";
    return cId === idStr || cName === idStr;
  }) || null;
}
if(typeof window !== "undefined") window.findVaultCardByIdOrName = findVaultCardByIdOrName;

function isVaultCardOwnedByUser(vCard, unreleasedOwnedList){
  if(!vCard || !Array.isArray(unreleasedOwnedList)) return false;
  const vId = vCard.id ? String(vCard.id).toLowerCase().trim() : "";
  const vName = vCard.name ? String(vCard.name).toLowerCase().trim() : "";
  return unreleasedOwnedList.some(item => {
    if(!item) return false;
    const itemStr = String(item).toLowerCase().trim();
    return (vId && itemStr === vId) || (vName && itemStr === vName);
  });
}
if(typeof window !== "undefined") window.isVaultCardOwnedByUser = isVaultCardOwnedByUser;

if(typeof window !== "undefined"){
  window.cards = cards;
  window.defaultCards = defaultCards;
  window.customCards = customCards;
  window.unreleasedCards = unreleasedCards;
}

// ========================================================
// AUTOMATIC ACCOUNT MIGRATION FOR RARITY SORTING & NAMES
// ========================================================
const RARITY_SORT_INDEX_MIGRATION = {"0":6,"1":0,"2":20,"3":23,"4":31,"5":15,"6":5,"7":43,"8":53,"9":33,"10":47,"11":64,"12":54,"13":37,"14":58,"15":76,"16":103,"17":69,"18":85,"19":72,"20":97,"21":68,"22":80,"23":132,"24":113,"25":114,"26":126,"27":118,"28":120,"29":138,"30":154,"31":152,"32":160,"33":167,"34":151,"35":183,"36":181,"37":186,"38":182,"39":190,"40":163,"41":157,"42":173,"43":133,"44":122,"45":144,"46":90,"47":77,"48":101,"49":56,"50":61,"51":57,"52":12,"53":18,"54":21,"55":193,"56":188,"57":184,"58":198,"59":187,"60":166,"61":175,"62":164,"63":155,"64":179,"65":171,"66":153,"67":159,"68":127,"69":149,"70":117,"71":123,"72":135,"73":139,"74":145,"75":129,"76":115,"77":150,"78":86,"79":70,"80":108,"81":92,"82":96,"83":89,"84":102,"85":94,"86":75,"87":88,"88":111,"89":100,"90":51,"91":45,"92":65,"93":36,"94":48,"95":62,"96":39,"97":67,"98":41,"99":59,"100":25,"101":3,"102":7,"103":30,"104":19,"105":29,"106":1,"107":10,"108":13,"109":24,"110":192,"111":189,"112":196,"113":185,"114":172,"115":177,"116":174,"117":158,"118":156,"119":169,"120":125,"121":142,"122":116,"123":147,"124":137,"125":143,"126":130,"127":119,"128":95,"129":79,"130":109,"131":87,"132":74,"133":105,"134":82,"135":71,"136":110,"137":106,"138":44,"139":50,"140":60,"141":38,"142":49,"143":35,"144":22,"145":17,"146":28,"147":9,"148":26,"149":2,"150":195,"151":191,"152":194,"153":199,"154":197,"155":176,"156":168,"157":180,"158":162,"159":178,"160":170,"161":165,"162":161,"163":146,"164":140,"165":128,"166":148,"167":121,"168":134,"169":141,"170":124,"171":131,"172":136,"173":81,"174":84,"175":93,"176":107,"177":73,"178":78,"179":104,"180":83,"181":98,"182":112,"183":91,"184":99,"185":46,"186":55,"187":34,"188":52,"189":66,"190":42,"191":63,"192":40,"193":4,"194":14,"195":32,"196":11,"197":27,"198":8,"199":16};

(function migrateRarityOrderAccounts(){
  try {
    const isMigrated = localStorage.getItem("cardCollectorRarityOrderMigratedV3");
    if(!isMigrated){
      const accs = JSON.parse(localStorage.getItem("cardCollectorAccounts")) || {};
      Object.keys(accs).forEach(user => {
        if(accs[user] && Array.isArray(accs[user].owned)){
          accs[user].owned = Array.from(new Set(
            accs[user].owned.map(oldIdx => {
              const newIdx = RARITY_SORT_INDEX_MIGRATION[oldIdx];
              return (newIdx !== undefined) ? newIdx : oldIdx;
            })
          ));
        }
      });
      localStorage.setItem("cardCollectorAccounts", JSON.stringify(accs));
      localStorage.setItem("cardCollectorRarityOrderMigratedV3", "true");
    }
  } catch(e){}
})();
