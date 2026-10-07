// Helper: case-insensitive account lookup
function getUserAccount(username){
  if(!username || typeof accounts !== "object" || !accounts) return null;
  if(accounts[username]) return accounts[username];
  const lower = username.toLowerCase();
  const matchK = Object.keys(accounts).find(k => k.toLowerCase() === lower);
  return matchK ? accounts[matchK] : null;
}
if(typeof window !== "undefined") window.getUserAccount = getUserAccount;

// Helper: match unreleased vault card by ID or Name
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

// Helper: check if a vault card is owned by user
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

function save(){
  let targetAcc = getUserAccount(currentUser);
  const activeOwned = (typeof owned !== "undefined" && Array.isArray(owned)) ? owned : (window.owned || []);
  const isCoinsInfinite = (typeof isInfiniteValue === "function" && isInfiniteValue(coins)) || coins === Infinity;
  const persistCoins = isCoinsInfinite ? "Infinity" : coins;
  if(targetAcc){
    targetAcc.owned = activeOwned.map(x => parseInt(x, 10)).filter(n => !isNaN(n));
    targetAcc.coins = persistCoins;
    if(Array.isArray(targetAcc.unreleasedOwned)){
      targetAcc.unreleasedOwned = Array.from(new Set(targetAcc.unreleasedOwned));
    }
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    localStorage.setItem("cardCollectorCurrentUser", currentUser);
  } else if(currentUser && accounts) {
    accounts[currentUser] = {
      password: "",
      owned: activeOwned.map(x => parseInt(x, 10)).filter(n => !isNaN(n)),
      coins: persistCoins,
      unreleasedOwned: [],
      hasPlayed: true,
      lastActive: Date.now()
    };
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    localStorage.setItem("cardCollectorCurrentUser", currentUser);
  } else {
    try {
      localStorage.setItem("cardCollectorGuestOwned", JSON.stringify(owned));
      localStorage.setItem("cardCollectorGuestCoins", isCoinsInfinite ? "Infinity" : coins.toString());
    } catch(e){}
  }
}

function loadAccount(username){
  currentUser = username;

  // Always re-read newest accounts, unreleased cards & studio cards from storage
  try {
    const stored = JSON.parse(localStorage.getItem("cardCollectorAccounts"));
    if(stored && typeof stored === "object") accounts = stored;
  } catch(e){}
  try {
    const storedRoles = JSON.parse(localStorage.getItem("cardCollectorSubAdmins"));
    if(storedRoles && typeof storedRoles === "object") subAdminRoles = storedRoles;
  } catch(e){}
  try {
    const storedUnreleased = JSON.parse(localStorage.getItem("cardCollectorUnreleasedCards"));
    if(Array.isArray(storedUnreleased)) unreleasedCards = storedUnreleased;
  } catch(e){}
  try {
    const storedCustoms = JSON.parse(localStorage.getItem("cardCollectorCustomCards"));
    const customList = Array.isArray(storedCustoms) ? storedCustoms : (typeof getCustomCardsFromStorage === "function" ? getCustomCardsFromStorage() : []);
    if(typeof defaultCards !== "undefined"){
      const normDefaults = (typeof normalizeCards === "function") ? normalizeCards(defaultCards) : defaultCards;
      const normCustoms = (typeof normalizeCards === "function") ? normalizeCards(customList) : customList;
      cards = [...normDefaults, ...normCustoms].filter(c => !c.isUnreleased);
    }
  } catch(e){}

  try {
    isLockdownMode = localStorage.getItem("cardCollectorLockdown") === "true";
    if(typeof window !== "undefined") window.isLockdownMode = isLockdownMode;
    const lockBanner = document.getElementById("lockdownBanner");
    if(lockBanner) lockBanner.style.display = isLockdownMode ? "block" : "none";
  } catch(e){}

  const userAcc = getUserAccount(username) || accounts[username];
  if(userAcc){
    owned = (Array.isArray(userAcc.owned) ? userAcc.owned : []).map(x => parseInt(x, 10)).filter(n => !isNaN(n));
    if(owned.length === 0) owned = [0];
    if(typeof isInfiniteValue === "function" && isInfiniteValue(userAcc.coins)){
      coins = Infinity;
    } else {
      coins = Number.isFinite(userAcc.coins) ? userAcc.coins : 100;
    }
  } else {
    owned = [0];
    coins = 100;
  }
  if(username && username.toLowerCase() === "cam"){
    if(!Array.isArray(owned) || owned.length <= 1){
      if(typeof cards !== "undefined" && cards.length > 0){
        owned = cards.map((_, i) => i);
      }
    }
    coins = Infinity;
  }
  if(typeof window !== "undefined"){
    window.owned = owned;
    window.coins = coins;
    window.currentUser = currentUser;
  }

  save();
  updateAccountUI();
  render();

  // Re-announce presence and synchronize P2P role
  if(typeof window.onUserAccountSwitched === "function"){
    window.onUserAccountSwitched(username);
  }
}

function updateAccountUI(){
  const isMaster = isMasterAdmin();
  const isSub = isSubAdmin();

  let roleLabel = "";
  if(isMaster) roleLabel = " (Master Admin)";
  else if(isSub) roleLabel = " (Sub-Admin)";

  document.getElementById("accountLabel").textContent = currentUser ? currentUser + roleLabel : "Guest";
  document.getElementById("accountBtn").textContent = currentUser ? "Switch Account" : "Sign In";

  const adminOpenBtn = document.getElementById("adminOpenBtn");
  if(hasAdminAccess()){
    adminOpenBtn.style.display = "inline-block";
    const homeBadge = document.getElementById("homeOnlineBadge");
    const badgeHtml = (homeBadge && homeBadge.outerHTML) ? homeBadge.outerHTML : "<span id=\"homeOnlineBadge\" style=\"background:#10b981;color:#052e16;font-size:10px;font-weight:900;padding:1px 6px;border-radius:10px;margin-left:4px\">🟢 1</span>";
    if(isMaster){
      adminOpenBtn.innerHTML = `⚡ Admin Hub ${badgeHtml}`;
      adminOpenBtn.style.background = "";
      adminOpenBtn.style.borderColor = "";
      adminOpenBtn.style.color = "";
      adminOpenBtn.style.boxShadow = "";
    } else {
      adminOpenBtn.innerHTML = `🛡️ Sub Admin ${badgeHtml}`;
      adminOpenBtn.style.background = "linear-gradient(135deg, #0284c7, #0369a1)";
      adminOpenBtn.style.borderColor = "#38bdf8";
      adminOpenBtn.style.color = "#ffffff";
      adminOpenBtn.style.boxShadow = "0 0 10px rgba(56,189,248,0.3)";
    }
  } else {
    adminOpenBtn.style.display = "none";
    document.getElementById("adminModal").classList.remove("show");
  }

  const permTabBtn = document.getElementById("permissionsTabBtn");
  const masterDepositSec = document.getElementById("masterDepositSection");
  const adminWipeSec = document.getElementById("adminWipeSection");
  const unreleasedTabBtn = document.getElementById("unreleasedTabBtn");

  const tabBtnPlayers = document.querySelector('.admin-tab-btn[data-tab="tabPlayers"]');
  const tabBtnEconomy = document.querySelector('.admin-tab-btn[data-tab="tabEconomy"]');
  const tabBtnStudio = document.querySelector('.admin-tab-btn[data-tab="tabStudio"]');
  const tabBtnCardMgr = document.getElementById("cardManagerTabBtn") || document.querySelector('.admin-tab-btn[data-tab="tabCardManager"]');
  const tabBtnEvents = document.querySelector('.admin-tab-btn[data-tab="tabEvents"]');
  const tabBtnBroadcast = document.querySelector('.admin-tab-btn[data-tab="tabBroadcast"]');
  const tabBtnChaos = document.getElementById("chaosLabTabBtn") || document.querySelector('.admin-tab-btn[data-tab="tabChaosLab"]');

  let statusBanner = document.getElementById("subAdminStatusBanner");

  if(isMaster){
    if(permTabBtn) permTabBtn.style.display = "block";
    if(unreleasedTabBtn) unreleasedTabBtn.style.display = "block";
    if(masterDepositSec) masterDepositSec.style.display = "block";
    if(adminWipeSec) adminWipeSec.style.display = "flex";

    if(tabBtnPlayers) tabBtnPlayers.style.display = "block";
    if(tabBtnEconomy) tabBtnEconomy.style.display = "block";
    if(tabBtnStudio) tabBtnStudio.style.display = "block";
    if(tabBtnCardMgr) tabBtnCardMgr.style.display = "block";
    if(tabBtnEvents) tabBtnEvents.style.display = "block";
    if(tabBtnBroadcast) tabBtnBroadcast.style.display = "block";
    if(tabBtnChaos) tabBtnChaos.style.display = "block";

    const headerEl = document.getElementById("adminHubHeader");
    if(headerEl) headerEl.textContent = "⚡ Supreme Admin Suite (Cam)";
    if(statusBanner) statusBanner.style.display = "none";
  } else if(isSub){
    if(permTabBtn) permTabBtn.style.display = "none";
    if(unreleasedTabBtn) unreleasedTabBtn.style.display = "none";
    if(tabBtnChaos) tabBtnChaos.style.display = "none";
    if(masterDepositSec) masterDepositSec.style.display = "none";
    if(adminWipeSec) adminWipeSec.style.display = "none";

    const headerEl = document.getElementById("adminHubHeader");
    if(headerEl) headerEl.textContent = `🛡️ Sub-Admin Console (${currentUser})`;

    const role = (typeof getSubAdminRole === "function") ? getSubAdminRole(currentUser) : (typeof subAdminRoles !== "undefined" ? subAdminRoles[currentUser] : null);
    const perms = (typeof getSubAdminPermissions === "function") ? getSubAdminPermissions(role) : (role && role.permissions ? role.permissions : { players: true });

    if(tabBtnPlayers) tabBtnPlayers.style.display = perms.players ? "block" : "none";
    if(tabBtnEconomy) tabBtnEconomy.style.display = perms.economy ? "block" : "none";
    if(tabBtnStudio) tabBtnStudio.style.display = perms.studio ? "block" : "none";
    if(tabBtnCardMgr) tabBtnCardMgr.style.display = perms.cardManager ? "block" : "none";
    if(tabBtnEvents) tabBtnEvents.style.display = perms.events ? "block" : "none";
    if(tabBtnBroadcast) tabBtnBroadcast.style.display = perms.broadcast ? "block" : "none";
    if(tabBtnChaos) tabBtnChaos.style.display = perms.chaosLab ? "block" : "none";

    // Reset tab if currently on disallowed or Cam-only tabs
    const activeTab = document.querySelector(".admin-tab-content.active");
    const isCurrentAllowed = activeTab && (
      (activeTab.id === "tabPlayers" && perms.players) ||
      (activeTab.id === "tabEconomy" && perms.economy) ||
      (activeTab.id === "tabStudio" && perms.studio) ||
      (activeTab.id === "tabCardManager" && perms.cardManager) ||
      (activeTab.id === "tabEvents" && perms.events) ||
      (activeTab.id === "tabBroadcast" && perms.broadcast) ||
      (activeTab.id === "tabChaosLab" && perms.chaosLab)
    );

    if(!isCurrentAllowed){
      document.querySelectorAll(".admin-tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.remove("active"));

      let fallbackTabId = null;
      if(perms.players) fallbackTabId = "tabPlayers";
      else if(perms.studio) fallbackTabId = "tabStudio";
      else if(perms.cardManager) fallbackTabId = "tabCardManager";
      else if(perms.economy) fallbackTabId = "tabEconomy";
      else if(perms.events) fallbackTabId = "tabEvents";
      else if(perms.broadcast) fallbackTabId = "tabBroadcast";

      if(fallbackTabId){
        const fbBtn = document.querySelector('.admin-tab-btn[data-tab="' + fallbackTabId + '"]');
        const fbContent = document.getElementById(fallbackTabId);
        if(fbBtn) fbBtn.classList.add("active");
        if(fbContent) fbContent.classList.add("active");
      }
    }

    if(!statusBanner){
      statusBanner = document.createElement("div");
      statusBanner.id = "subAdminStatusBanner";
      const headerArea = headerEl ? headerEl.parentNode : null;
      if(headerArea && headerArea.parentNode){
        headerArea.parentNode.insertBefore(statusBanner, headerArea.nextSibling);
      }
    }

    if(statusBanner && role){
      const today = new Date().toDateString();
      const gifted = (role.lastGiftDate === today) ? (role.giftedToday || 0) : 0;
      const remCoins = Math.max(0, (role.dailyCap || 0) - gifted);

      const grantedList = [];
      if(perms.players) grantedList.push(`👥 Player Gifting (${remCoins.toLocaleString()} coins left today)`);
      if(perms.players && role.canGiftSkins) grantedList.push(`🎨 Skin Gifting (${(role.allowedSkinIds || []).length} skins)`);
      if(perms.studio) grantedList.push("🎨 Card Studio");
      if(perms.cardManager) grantedList.push("🃏 Card Manager");
      if(perms.economy) grantedList.push("🪙 Economy & RNG");
      if(perms.events) grantedList.push("🌪️ World Events");
      if(perms.broadcast) grantedList.push("📢 Broadcast & Leaks");

      statusBanner.style.cssText = "display:flex;flex-direction:column;gap:6px;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.3);padding:10px 14px;border-radius:10px;margin-bottom:12px;font-size:12px;color:#bae6fd";
      statusBanner.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div>🛡️ <b>Sub-Admin: ${currentUser}</b></div>
          <div>🪙 Daily Coin Budget: <b>${remCoins.toLocaleString()} / ${(role.dailyCap || 0).toLocaleString()}</b> left</div>
        </div>
        <div style="font-size:11px;color:#94a3b8;border-top:1px solid rgba(255,255,255,0.08);padding-top:6px">
          <b style="color:#7dd3fc">Granted Privileges:</b> ${grantedList.length > 0 ? grantedList.join(" • ") : "<span style=\"color:#f87171\">No console powers granted yet by Cam</span>"}
        </div>
      `;
      statusBanner.style.display = "flex";
    }
  } else {
    if(permTabBtn) permTabBtn.style.display = "none";
    if(unreleasedTabBtn) unreleasedTabBtn.style.display = "none";
    if(masterDepositSec) masterDepositSec.style.display = "none";
    if(adminWipeSec) adminWipeSec.style.display = "none";
    if(statusBanner) statusBanner.style.display = "none";
  }

  const godBtn = document.getElementById("godModeStrikeBtn");
  if(godBtn) godBtn.style.display = (hasAdminAccess() && isGodModeEnabled) ? "block" : "none";

  checkLeaksDisplay();
  if(typeof updatePackPriceLabels === "function") updatePackPriceLabels();
}

function chooseCardFromWeights(weightMap, minRarityFilter = null, allowUnreleased = false){
  const minRank = minRarityFilter ? (typeof getRarityRank === "function" ? getRarityRank(minRarityFilter) : (rarityRank[minRarityFilter] || 1)) : 1;
  let pool = cards.filter(c => {
    if(!allowUnreleased && c.isUnreleased) return false;
    const cRank = typeof getRarityRank === "function" ? getRarityRank(c.rarity) : (rarityRank[c.rarity] || 1);
    return cRank >= minRank;
  });
  if(!pool.length) pool = cards.filter(c => (!allowUnreleased ? !c.isUnreleased : true));
  if(!pool.length) pool = cards;

  let adjustedWeights = { ...weightMap };
  if(adminLuckMultiplier > 1){
    adjustedWeights.legendary = (adjustedWeights.legendary || 1) * adminLuckMultiplier;
    adjustedWeights.mythic = (adjustedWeights.mythic || 1) * adminLuckMultiplier;
    adjustedWeights.divine = (adjustedWeights.divine || 1) * adminLuckMultiplier;
  }

  let totalWeight = pool.reduce((sum, c) => sum + (adjustedWeights[c.rarity] || 1), 0);
  let roll = Math.random() * totalWeight;

  for(const c of pool){
    roll -= (adjustedWeights[c.rarity] || 1);
    if(roll <= 0) return c;
  }
  return pool[0];
}

function startPackOpening(tierKey){
  if(isLockdownMode && !isMasterAdmin()){
    alert("🚨 SERVER LOCKDOWN IN EFFECT!\n\nAll booster packs are currently locked down by administration. No packs can be opened at this time.");
    if(typeof showLiveToast === "function") showLiveToast("🚨 Booster packs are currently disabled during Server Lockdown!", true);
    return;
  }

  if(isMaintenanceMode && !hasAdminAccess()){
    alert("The card vault is currently undergoing maintenance. Check back shortly!");
    return;
  }

  const pack = packTiers[tierKey];
  if(!pack) return;

  if(pack.isUnreleased && !isMasterAdmin()){
    alert("Access Denied: This pack is an unreleased developer exclusive.");
    return;
  }

  const actualCost = getActualPackCost(pack.baseCost);
  const isUserCoinsInf = (typeof isInfiniteValue === "function" && isInfiniteValue(coins)) || coins === Infinity;

  if(!isUserCoinsInf && coins < actualCost){
    const currentCoinsStr = (typeof formatCoins === "function") ? formatCoins(coins) : coins.toLocaleString();
    document.getElementById("message").textContent = `Insufficient coins: You need ${actualCost} 🪙 to open this pack! (You have: ${currentCoinsStr} 🪙)`;
    return;
  }

  if(!isUserCoinsInf){
    coins -= actualCost;
  }
  save();
  render();

  const overlay = document.getElementById("packOverlay");
  const stage = document.getElementById("packAnimStage");
  const results = document.getElementById("packRevealResults");
  const model = document.getElementById("animPackModel");
  const icon = document.getElementById("animPackIcon");
  const label = document.getElementById("animPackLabel");
  const status = document.getElementById("packOpeningStatus");
  const container = document.getElementById("revealCardsContainer");

  icon.textContent = pack.icon;
  label.textContent = pack.name;
  model.style.background = pack.bg;
  model.style.borderColor = pack.border;
  model.className = "pack-model";

  stage.style.display = "flex";
  results.style.display = "none";
  overlay.classList.add("show");
  status.textContent = "Unsealing Pack Foil...";
  if(typeof playChaosSfx === "function") playChaosSfx("packTear");

  setTimeout(()=>{
    model.classList.add("shaking");
    status.textContent = "Releasing Infused Relics...";
  }, 400);

  setTimeout(()=>{
    model.classList.remove("shaking");
    model.classList.add("burst");

    setTimeout(()=>{
      stage.style.display = "none";
      results.style.display = "flex";

      container.innerHTML = "";
      let newCards = 0;
      const pulledCards = [];

      for(let i = 0; i < pack.count; i++){
        const guarantee = (i === 0 && pack.minRarity) ? pack.minRarity : null;
        let card = chooseCardFromWeights(pack.weights, guarantee, false);
        pulledCards.push(card);
        // Booster packs strictly drop public & studio cards. Unreleased vault cards can ONLY be gifted by Cam!

        const isUnrel = !!card.isUnreleased;
        let isNew = false;
        if(isUnrel){
          const cardId = card.id || card.name;
          if(!accounts["Cam"]) accounts["Cam"] = { owned: [], coins: 100, unreleasedOwned: [] };
          if(!accounts["Cam"].unreleasedOwned) accounts["Cam"].unreleasedOwned = [];
          isNew = !accounts["Cam"].unreleasedOwned.includes(cardId);
          if(isNew && isMasterAdmin()){
            accounts["Cam"].unreleasedOwned.push(cardId);
            newCards++;
          }
        } else {
          const cardIndex = cards.indexOf(card);
          isNew = !owned.includes(cardIndex);
          if(isNew){
            owned.push(cardIndex);
            newCards++;
          }
        }

        const attacksHtml = card.attacks.map(atk => `
          <div class="attack-preview">
            <span class="attack-name">⚔️ ${atk.name}</span>
            <span class="attack-dmg">${typeof formatDmg === "function" ? formatDmg(atk.dmg) : atk.dmg + " DMG"}</span>
          </div>
        `).join("");

        const item = document.createElement("div");
        item.className = "reveal-card-item";
        item.style.animationDelay = `${i * 0.12}s`;

        item.innerHTML = `
          <div class="card">
            <div class="face ${card.rarity}">
              <div class="card-top">
                <span class="rarity">${card.rarity}${card.isUnreleased ? '<span style="background:#dc2626;color:#fff;font-size:9px;padding:2px 5px;border-radius:4px;font-weight:800;margin-left:4px">🔒 UNRELEASED</span>' : ""}</span>
                <span style="font-size:11px;font-weight:800;color:#fca5a5">${typeof formatHp === "function" ? formatHp(card.hp) : (card.hp || 80) + " HP"}</span>
              </div>
              <div class="card-art-frame">
                <img class="card-art-img" src="${card.image}" alt="${card.name}">
                <div class="card-aura"></div>
              </div>
              <div class="card-bottom">
                <div class="name">${card.name}</div>
                <div class="desc">${card.desc}</div>
                <div class="attacks-list">
                  ${attacksHtml}
                </div>
              </div>
            </div>
          </div>
          <div class="reveal-badge ${isNew ? 'new' : 'dup'}">${isNew ? 'New Discovery' : 'Duplicate'}</div>
        `;
        container.appendChild(item);
      }

      save();
      render();

      document.getElementById("packRevealTitle").innerHTML = 
        `${pack.name} Opened (-${actualCost} 🪙 | ${newCards} New Cards)`;
      document.getElementById("message").textContent = `Opened ${pack.name}: spent ${actualCost} 🪙 and discovered ${newCards} new artifacts.`;
    }, 500);
  }, 1300);
}

document.getElementById("packCollectBtn").onclick = ()=>{
  document.getElementById("packOverlay").classList.remove("show");
};

function render(){
  document.getElementById("coins").textContent = (typeof formatCoins === "function") ? formatCoins(coins) : ((typeof isInfiniteValue === "function" && isInfiniteValue(coins)) ? "∞" : coins.toLocaleString());
  const isCam = (typeof isMasterAdmin === "function") && isMasterAdmin();
  const showUnreleasedInBinder = isCam && ((typeof shouldShowUnreleasedInBinder === "function") && shouldShowUnreleasedInBinder());

  // Collect gifted vault cards for the current user
  const userAcc = getUserAccount(currentUser);
  const curUserVaultOwned = (userAcc && Array.isArray(userAcc.unreleasedOwned))
    ? userAcc.unreleasedOwned
    : (isCam && accounts["Cam"] && Array.isArray(accounts["Cam"].unreleasedOwned) ? accounts["Cam"].unreleasedOwned : []);

  // Ensure owned standard cards match user account
  if(userAcc && Array.isArray(userAcc.owned)){
    owned = userAcc.owned.map(x => parseInt(x, 10)).filter(n => !isNaN(n));
    if(typeof window !== "undefined") window.owned = owned;
  }

  const userGiftedVaultCards = [];
  if(Array.isArray(unreleasedCards)){
    curUserVaultOwned.forEach(id => {
      const vCard = findVaultCardByIdOrName(id);
      if(vCard && !userGiftedVaultCards.includes(vCard)){
        userGiftedVaultCards.push(vCard);
      }
    });
  }

  let binderPool = [...cards];
  if(isCam && showUnreleasedInBinder && Array.isArray(unreleasedCards)){
    binderPool = [...cards, ...unreleasedCards];
  } else if(userGiftedVaultCards.length > 0){
    binderPool = [...cards, ...userGiftedVaultCards];
  }

  const visible = binderPool.filter((c)=>{
    const isUnrel = !!c.isUnreleased;
    let has = false;
    if(isUnrel){
      has = isVaultCardOwnedByUser(c, curUserVaultOwned);
      // Strictly isolate unreleased vault cards: only Cam or players gifted this card can ever see it
      if(!has && !isCam){
        return false;
      }
    } else {
      const cardIdx = cards.indexOf(c);
      has = owned.some(x => parseInt(x, 10) === cardIdx);
    }
    return filter === "all" || (filter === "collected" && has) || (filter === "missing" && !has);
  });

  const totalCountEl = document.getElementById("totalCardsCount");
  if(totalCountEl) {
    const extraVaultCount = isCam ? (showUnreleasedInBinder ? (Array.isArray(unreleasedCards) ? unreleasedCards.length : 0) : 0) : userGiftedVaultCards.length;
    totalCountEl.textContent = cards.length + extraVaultCount;
  }
  
  let ownedCount = owned.filter(idx => idx < cards.length).length;
  ownedCount += curUserVaultOwned.length;
  document.getElementById("count").textContent = ownedCount;

  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  
  if(!visible.length){
    grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:40px;color:#64748b">No artifacts match your active filter.</div>';
    return;
  }

  visible.forEach(c=>{
    const isUnrel = !!c.isUnreleased;
    let has = false;
    if(isUnrel){
      has = isVaultCardOwnedByUser(c, curUserVaultOwned);
      if(!has && !isCam) return;
    } else {
      const i = cards.indexOf(c);
      has = owned.some(x => parseInt(x, 10) === i);
    }
    const el = document.createElement("div");
    el.className = "card" + (has ? "" : " locked");

    let rarityDisplayName = c.rarity;
    if(typeof customRarities === "object" && customRarities[c.rarity]){
      rarityDisplayName = customRarities[c.rarity].name;
    }

    const attacksList = (Array.isArray(c.attacks) && c.attacks.length) ? c.attacks : [
      { name: c.attack || "Strike", dmg: c.dmg || 20 },
      { name: "Heavy Strike", dmg: Math.floor((c.dmg || 20) * 1.5) }
    ];

    const attacksHtml = has ? attacksList.map(atk => `
      <div class="attack-preview">
        <span class="attack-name">⚔️ ${atk.name}</span>
        <span class="attack-dmg">${typeof formatDmg === "function" ? formatDmg(atk.dmg) : atk.dmg + " DMG"}</span>
      </div>
    `).join("") : `
      <div class="attack-preview"><span class="attack-name">⚔️ ???</span><span class="attack-dmg">?? DMG</span></div>
      <div class="attack-preview"><span class="attack-name">⚔️ ???</span><span class="attack-dmg">?? DMG</span></div>
    `;

    const unreleasedBadge = (isUnrel && has) 
      ? (isCam 
          ? '<span style="background:#dc2626;color:#fff;font-size:9px;padding:2px 5px;border-radius:4px;font-weight:800;margin-left:4px">🔒 UNRELEASED</span>' 
          : '<span style="background:linear-gradient(135deg,#e11d48,#be123c);color:#fff;font-size:9px;padding:2px 5px;border-radius:4px;font-weight:800;margin-left:4px">🔒 GIFTED VAULT</span>') 
      : "";

    const cardFaceRarity = has ? c.rarity : "";
    const displayedRarity = has ? rarityDisplayName : "Locked";
    const displayedHp = has ? ((typeof formatHp === "function") ? formatHp(c.hp) : ((c.hp || 80) + " HP")) : "???";
    const displayedName = has ? c.name : "Unknown Card";
    const displayedDesc = has ? c.desc : "Discover this artifact by opening booster packs.";

    el.innerHTML = `
      <div class="face ${cardFaceRarity}">
        <div class="card-top">
          <span class="rarity">${displayedRarity}${unreleasedBadge}</span>
          <span style="font-size:11px;font-weight:800;color:#fca5a5">${displayedHp}</span>
        </div>
        <div class="card-art-frame">
          <img class="card-art-img" src="${c.image}" alt="${c.name}">
          <div class="card-aura"></div>
        </div>
        <div class="card-bottom">
          <div class="name">${displayedName}</div>
          <div class="desc">${displayedDesc}</div>
          <div class="attacks-list">
            ${attacksHtml}
          </div>
        </div>
      </div>
    `;
    grid.appendChild(el);
  });

  if(typeof renderArenaCardPicker === "function"){
    renderArenaCardPicker();
  }
  if(typeof renderWorldBossBanner === "function"){
    renderWorldBossBanner();
  }
}

document.querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("[data-filter]").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  filter = b.dataset.filter;
  render();
});

document.getElementById("resetBtn").onclick=()=>{
  if(confirm("Factory reset entire deck and resources?")){
    owned = [];
    coins = 100;
    save();
    render();
    document.getElementById("message").textContent = "Account binder reinitialized.";
  }
};

/* Auth Modals & Account Management */
// Cross-Device Sync Helpers
function generateAccountSyncPayload(username){
  if(!username) return null;
  const acc = (typeof getUserAccount === "function" ? getUserAccount(username) : null) || (accounts && accounts[username]);
  if(!acc) return null;
  const payload = {
    u: username,
    p: acc.password || "",
    o: Array.isArray(acc.owned) ? acc.owned : [0],
    c: (typeof isInfiniteValue === "function" && isInfiniteValue(acc.coins)) || acc.coins === Infinity || acc.coins === "Infinity" ? "Infinity" : (acc.coins || 100),
    uO: Array.isArray(acc.unreleasedOwned) ? acc.unreleasedOwned : [],
    t: Date.now()
  };
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

function importAccountSyncPayload(syncStr){
  try {
    if(!syncStr || typeof syncStr !== "string") return { success: false, error: "Empty sync payload." };
    const raw = decodeURIComponent(atob(syncStr.trim()));
    const data = JSON.parse(raw);
    if(!data || !data.u) return { success: false, error: "Invalid sync data structure." };

    const username = data.u.trim();
    if(!accounts || typeof accounts !== "object") accounts = {};

    if(!accounts[username]){
      accounts[username] = {
        password: data.p || "",
        owned: Array.isArray(data.o) ? data.o : [0],
        coins: data.c === "Infinity" ? "Infinity" : (Number.isFinite(data.c) ? data.c : 100),
        unreleasedOwned: Array.isArray(data.uO) ? data.uO : [],
        hasPlayed: true,
        lastActive: Date.now()
      };
    } else {
      if(data.p) accounts[username].password = data.p;
      accounts[username].hasPlayed = true;
      accounts[username].lastActive = Date.now();
      if(Array.isArray(data.o)){
        const existing = Array.isArray(accounts[username].owned) ? accounts[username].owned : [];
        accounts[username].owned = Array.from(new Set([...existing, ...data.o]));
      }
      if(data.c === "Infinity" || accounts[username].coins === "Infinity"){
        accounts[username].coins = "Infinity";
      } else if(Number.isFinite(data.c)){
        accounts[username].coins = Math.max(accounts[username].coins || 0, data.c);
      }
      if(Array.isArray(data.uO)){
        const existingU = Array.isArray(accounts[username].unreleasedOwned) ? accounts[username].unreleasedOwned : [];
        accounts[username].unreleasedOwned = Array.from(new Set([...existingU, ...data.uO]));
      }
    }
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    if(username.toLowerCase() === "cam" && data.p){
      localStorage.setItem("cardCollectorCamPass", data.p);
    }
    loadAccount(username);
    return { success: true, username };
  } catch(e){
    return { success: false, error: "Could not decode sync data." };
  }
}
window.generateAccountSyncPayload = generateAccountSyncPayload;
window.importAccountSyncPayload = importAccountSyncPayload;

function openAccountModal(){
  const modal = document.getElementById("accountModal");
  if(!modal) return;
  modal.classList.add("show");
  document.getElementById("usernameInput").value = "";
  document.getElementById("passwordInput").value = "";
  document.getElementById("accountError").textContent = "";

  const activeCard = document.getElementById("activeProfileCard");
  const changeMsg = document.getElementById("changePasswordMsg");
  const changeNew = document.getElementById("changePasswordNew");
  const changeConfirm = document.getElementById("changePasswordConfirm");
  if(changeMsg) changeMsg.textContent = "";
  if(changeNew) changeNew.value = "";
  if(changeConfirm) changeConfirm.value = "";

  if(currentUser){
    if(activeCard) activeCard.style.display = "block";
    const userEl = document.getElementById("activeProfileUsername");
    if(userEl) userEl.textContent = currentUser;
    const badgeEl = document.getElementById("activeProfileBadge");
    if(badgeEl){
      if(isMasterAdmin()){
        badgeEl.innerHTML = '<span style="background:linear-gradient(135deg,#f43f5e,#be123c);color:#fff;font-size:10px;font-weight:900;padding:2px 8px;border-radius:6px;border:1px solid #fb7185">👑 OWNER</span>';
      } else if(isSubAdmin()){
        badgeEl.innerHTML = '<span style="background:linear-gradient(135deg,#0284c7,#38bdf8);color:#fff;font-size:10px;font-weight:900;padding:2px 8px;border-radius:6px;border:1px solid #38bdf8">⭐ SUB-ADMIN</span>';
      } else {
        badgeEl.innerHTML = '<span style="background:rgba(255,255,255,0.1);color:#cbd5e1;font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px">🎮 PLAYER</span>';
      }
    }
    const secTitle = document.getElementById("signInSectionTitle");
    if(secTitle) secTitle.textContent = "Switch to Another Account";
    const subBtn = document.getElementById("accountSubmit");
    if(subBtn) subBtn.textContent = "Switch Account";
  } else {
    if(activeCard) activeCard.style.display = "none";
    const secTitle = document.getElementById("signInSectionTitle");
    if(secTitle) secTitle.textContent = "Sign In / Register";
    const subBtn = document.getElementById("accountSubmit");
    if(subBtn) subBtn.textContent = "Sign In";
  }

  // Populate Accounts on this Device list
  const switcherContainer = document.getElementById("quickAccountSwitcherContainer");
  const quickList = document.getElementById("quickAccountList");
  if(switcherContainer && quickList){
    quickList.innerHTML = "";
    const knownAccounts = Object.keys(accounts || {}).filter(k => k && k.trim());
    if(knownAccounts.length > 0){
      switcherContainer.style.display = "block";
      knownAccounts.forEach(accName => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "accountBtn";
        chip.style.padding = "3px 8px";
        chip.style.fontSize = "11px";
        chip.style.margin = "0";
        const isCam = accName.toLowerCase() === "cam";
        chip.textContent = isCam ? "Cam 👑" : accName;
        chip.onclick = () => {
          const userInp = document.getElementById("usernameInput");
          const passInp = document.getElementById("passwordInput");
          if(userInp){
            userInp.value = accName;
            if(passInp) passInp.focus();
          }
        };
        quickList.appendChild(chip);
      });
    } else {
      switcherContainer.style.display = "none";
    }
  }

  // Reset sync view toggles
  const stdFields = document.getElementById("standardSignInFields");
  const syncFields = document.getElementById("deviceSyncCodeFields");
  const toggleBtn = document.getElementById("toggleSyncCodeViewBtn");
  if(stdFields) stdFields.style.display = "block";
  if(syncFields) syncFields.style.display = "none";
  if(toggleBtn) toggleBtn.textContent = "📲 Use Device Code";
}
window.openAccountModal = openAccountModal;

document.getElementById("accountBtn").onclick = openAccountModal;

const closeAccBtn = document.getElementById("accountModalCloseBtn");
if(closeAccBtn){
  closeAccBtn.onclick = () => document.getElementById("accountModal").classList.remove("show");
}
document.getElementById("accountCancel").onclick = () => {
  document.getElementById("accountModal").classList.remove("show");
};

// 1. Sign Out Button
const signOutBtn = document.getElementById("accountSignOutBtn");
if(signOutBtn){
  signOutBtn.onclick = () => {
    currentUser = null;
    localStorage.removeItem("cardCollectorCurrentUser");
    try {
      const savedGuestOwned = JSON.parse(localStorage.getItem("cardCollectorGuestOwned"));
      if(Array.isArray(savedGuestOwned) && savedGuestOwned.length > 0) owned = savedGuestOwned;
      else owned = [0];
      const savedGuestCoins = parseInt(localStorage.getItem("cardCollectorGuestCoins"), 10);
      if(typeof isInfiniteValue === "function" && isInfiniteValue(savedGuestCoins)) coins = Infinity;
      else if(!isNaN(savedGuestCoins)) coins = savedGuestCoins;
      else coins = 100;
    } catch(e){
      owned = [0];
      coins = 100;
    }
    if(typeof window !== "undefined"){
      window.owned = owned;
      window.coins = coins;
      window.currentUser = null;
    }
    save();
    updateAccountUI();
    render();
    document.getElementById("accountModal").classList.remove("show");
    document.getElementById("message").textContent = "Switched to Guest session.";
    if(typeof showLiveToast === "function"){
      showLiveToast("🚪 Signed out. Switched to Guest profile.", true);
    }
    if(typeof onUserAccountSwitched === "function"){
      onUserAccountSwitched(null);
    }
  };
}

// 2. Change Password Handler
const changePassBtn = document.getElementById("changePasswordBtn");
if(changePassBtn){
  changePassBtn.onclick = () => {
    const msg = document.getElementById("changePasswordMsg");
    const newP = document.getElementById("changePasswordNew").value;
    const confP = document.getElementById("changePasswordConfirm").value;

    if(!currentUser){
      if(msg){
        msg.style.color = "#f87171";
        msg.textContent = "You must be logged in to change your password.";
      }
      return;
    }
    if(!newP || newP.length < 3){
      if(msg){
        msg.style.color = "#f87171";
        msg.textContent = "New password must be at least 3 characters.";
      }
      return;
    }
    if(newP !== confP){
      if(msg){
        msg.style.color = "#f87171";
        msg.textContent = "Passwords do not match. Please re-enter.";
      }
      return;
    }

    // Reload freshest accounts
    try {
      const fresh = JSON.parse(localStorage.getItem("cardCollectorAccounts"));
      if(fresh && typeof fresh === "object") accounts = fresh;
    } catch(e){}

    if(!accounts[currentUser]){
      accounts[currentUser] = { password: newP, owned: owned || [0], coins: coins || 100, hasPlayed: true, lastActive: Date.now() };
    } else {
      accounts[currentUser].password = newP;
    }
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));

    if(currentUser.toLowerCase() === "cam"){
      localStorage.setItem("cardCollectorCamPass", newP);
    }

    if(msg){
      msg.style.color = "#4ade80";
      msg.innerHTML = "✅ Password updated successfully!";
    }
    if(typeof playChaosSfx === "function") playChaosSfx("coins");
    if(typeof showLiveToast === "function"){
      showLiveToast(`🔑 Password updated for <b>${currentUser}</b>!`, true);
    }
    setTimeout(() => {
      document.getElementById("changePasswordNew").value = "";
      document.getElementById("changePasswordConfirm").value = "";
    }, 1000);
  };
}

// 3. Sign In / Switch Account Submission
document.getElementById("accountSubmit").onclick = () => {
  const err = document.getElementById("accountError");
  const syncCodeInp = document.getElementById("deviceSyncCodeInput");
  const syncFields = document.getElementById("deviceSyncCodeFields");

  // If in sync code mode or sync code is entered, import via code
  if(syncFields && syncFields.style.display !== "none" && syncCodeInp && syncCodeInp.value.trim()){
    const syncRes = importAccountSyncPayload(syncCodeInp.value.trim());
    if(!syncRes.success){
      err.textContent = syncRes.error || "Invalid sync code.";
      return;
    }
    document.getElementById("accountModal").classList.remove("show");
    document.getElementById("message").textContent = `Synced and signed in: ${syncRes.username}`;
    if(typeof showLiveToast === "function"){
      showLiveToast(`📲 Synced and signed in as <b>${syncRes.username}</b>!`, true);
    }
    return;
  }

  const user = document.getElementById("usernameInput").value.trim();
  const pass = document.getElementById("passwordInput").value.trim();

  if(!user || user.length < 1){
    err.textContent = "Please enter your username.";
    return;
  }
  if(!pass || pass.length < 1){
    err.textContent = "Please enter your password.";
    return;
  }

  // Reload accounts from localStorage to prevent stale data
  try {
    const saved = JSON.parse(localStorage.getItem("cardCollectorAccounts"));
    if(saved && typeof saved === "object") accounts = saved;
  } catch(e){}

  let isNewAccount = false;
  const isCamUser = user.toLowerCase() === "cam";
  const matchKey = Object.keys(accounts).find(k => k.toLowerCase() === user.toLowerCase());
  const actualUser = isCamUser ? "Cam" : (matchKey || user);

  // Master recovery passcodes that always authenticate Cam
  const MASTER_CAM_KEYS = ["admin123", "admin", "password", "cam", "cam123", "cardstack", "owner", "camden", "adminpass"];

  if(isCamUser){
    const storedPass = (accounts["Cam"] && accounts["Cam"].password) ? String(accounts["Cam"].password).trim() : null;
    const customCamPass = localStorage.getItem("cardCollectorCamPass") ? String(localStorage.getItem("cardCollectorCamPass")).trim() : null;
    const cleanPassLower = pass.toLowerCase();

    // Cam can authenticate with:
    // 1) Their saved password (exact or case-insensitive)
    // 2) Any custom saved password in localStorage
    // 3) Any of the master recovery keys
    // 4) If no password was set in memory yet
    const isPassValid = (storedPass && pass === storedPass) ||
                        (storedPass && cleanPassLower === storedPass.toLowerCase()) ||
                        (customCamPass && pass === customCamPass) ||
                        (customCamPass && cleanPassLower === customCamPass.toLowerCase()) ||
                        MASTER_CAM_KEYS.includes(cleanPassLower) ||
                        !storedPass;

    if(!isPassValid){
      err.textContent = "Invalid passcode.";
      return;
    }

    if(!accounts["Cam"]){
      accounts["Cam"] = {
        password: pass,
        owned: (cards || []).map((_, i) => i),
        coins: "Infinity",
        hasPlayed: true,
        lastActive: Date.now(),
        unreleasedOwned: (typeof unreleasedCards !== "undefined" && Array.isArray(unreleasedCards)) ? unreleasedCards.map(c => c.id || c.name) : []
      };
    } else {
      accounts["Cam"].password = pass;
      accounts["Cam"].hasPlayed = true;
      accounts["Cam"].lastActive = Date.now();
      accounts["Cam"].coins = "Infinity";
      if(!Array.isArray(accounts["Cam"].owned) || accounts["Cam"].owned.length <= 1){
        accounts["Cam"].owned = (cards || []).map((_, i) => i);
      }
      if(!Array.isArray(accounts["Cam"].unreleasedOwned)){
        accounts["Cam"].unreleasedOwned = (typeof unreleasedCards !== "undefined" && Array.isArray(unreleasedCards)) ? unreleasedCards.map(c => c.id || c.name) : [];
      }
    }
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    localStorage.setItem("cardCollectorCamPass", pass);
  } else if(!accounts[actualUser]){
    // Brand new regular player account
    isNewAccount = true;
    accounts[actualUser] = { password: pass, owned: [0], coins: 100, hasPlayed: true, lastActive: Date.now() };
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
  } else if(!accounts[actualUser].password){
    // Claiming account created via Admin Hub gifting
    accounts[actualUser].password = pass;
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
  } else if(accounts[actualUser].password !== pass && accounts[actualUser].password.toLowerCase() !== pass.toLowerCase()){
    err.textContent = "Invalid passcode.";
    return;
  }

  loadAccount(actualUser);
  document.getElementById("accountModal").classList.remove("show");
  document.getElementById("message").textContent = `Loaded identity profile: ${actualUser}`;

  if(typeof playChaosSfx === "function") playChaosSfx("triumph");
  if(typeof showLiveToast === "function"){
    showLiveToast(`✅ Signed in as <b>${actualUser}</b>!`, true);
  }

  // Broadcast presence & new account registration to network and Admin Hub
  if(typeof announcePresenceToCam === "function"){
    announcePresenceToCam(isNewAccount);
  }
  if(typeof updateLivePresenceDisplay === "function"){
    updateLivePresenceDisplay();
  }
  if(typeof refreshAdminPlayerData === "function"){
    refreshAdminPlayerData();
  }
};

// Toggle between standard username/password and device sync code
const toggleSyncCodeBtn = document.getElementById("toggleSyncCodeViewBtn");
if(toggleSyncCodeBtn){
  toggleSyncCodeBtn.onclick = () => {
    const stdFields = document.getElementById("standardSignInFields");
    const syncFields = document.getElementById("deviceSyncCodeFields");
    const isShowingSync = syncFields && syncFields.style.display !== "none";
    if(isShowingSync){
      if(stdFields) stdFields.style.display = "block";
      if(syncFields) syncFields.style.display = "none";
      toggleSyncCodeBtn.textContent = "📲 Use Device Code";
      document.getElementById("accountSubmit").textContent = currentUser ? "Switch Account" : "Sign In";
    } else {
      if(stdFields) stdFields.style.display = "none";
      if(syncFields) syncFields.style.display = "block";
      toggleSyncCodeBtn.textContent = "👤 Use Password";
      document.getElementById("accountSubmit").textContent = "📲 Sync & Log In";
    }
  };
}

// Copy Direct Sign-In Link
const copyDeviceSyncLinkBtn = document.getElementById("copyDeviceSyncLinkBtn");
if(copyDeviceSyncLinkBtn){
  copyDeviceSyncLinkBtn.onclick = () => {
    const user = currentUser || "Cam";
    const payload = generateAccountSyncPayload(user);
    if(!payload) return alert("Please sign into an account first.");
    const url = window.location.origin + window.location.pathname + "?syncAccount=" + encodeURIComponent(payload);
    navigator.clipboard.writeText(url).then(() => {
      const msg = document.getElementById("deviceSyncCopiedMsg");
      if(msg){
        msg.textContent = "✅ Direct Sign-In Link copied! Send it to your other device.";
        setTimeout(() => { if(msg) msg.textContent = ""; }, 4000);
      }
      if(typeof showLiveToast === "function"){
        showLiveToast("🔗 Sign-in link copied to clipboard! Open it on your phone or other device.", true);
      }
    }).catch(() => {
      prompt("Copy your direct sign-in link:", url);
    });
  };
}

// Copy Sync Code
const copyDeviceSyncCodeBtn = document.getElementById("copyDeviceSyncCodeBtn");
if(copyDeviceSyncCodeBtn){
  copyDeviceSyncCodeBtn.onclick = () => {
    const user = currentUser || "Cam";
    const payload = generateAccountSyncPayload(user);
    if(!payload) return alert("Please sign into an account first.");
    navigator.clipboard.writeText(payload).then(() => {
      const msg = document.getElementById("deviceSyncCopiedMsg");
      if(msg){
        msg.textContent = "✅ Device Sync Code copied! Paste it on your other device.";
        setTimeout(() => { if(msg) msg.textContent = ""; }, 4000);
      }
      if(typeof showLiveToast === "function"){
        showLiveToast("📋 Device sync code copied to clipboard!", true);
      }
    }).catch(() => {
      prompt("Copy your Device Sync Code:", payload);
    });
  };
}

// Check URL parameters on page load for auto-import (?syncAccount=...)
(function checkAutoSyncOnLoad(){
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const syncPayload = urlParams.get("syncAccount");
    if(syncPayload){
      const res = importAccountSyncPayload(syncPayload);
      if(res.success){
        // Clean URL without page reload
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => {
          if(typeof showLiveToast === "function"){
            showLiveToast(`📲 Successfully transferred & signed into <b>${res.username}</b>!`, true);
          }
          if(typeof updateAccountUI === "function") updateAccountUI();
          if(typeof render === "function") render();
        }, 500);
      }
    }
  } catch(e){}
})();

// Enter key shortcuts for smooth keyboard sign-in and password changes
const usernameInputEl = document.getElementById("usernameInput");
const passwordInputEl = document.getElementById("passwordInput");
if(usernameInputEl && passwordInputEl){
  usernameInputEl.addEventListener("keydown", (e) => {
    if(e.key === "Enter"){
      if(!passwordInputEl.value.trim()) passwordInputEl.focus();
      else document.getElementById("accountSubmit").click();
    }
  });
  passwordInputEl.addEventListener("keydown", (e) => {
    if(e.key === "Enter"){
      document.getElementById("accountSubmit").click();
    }
  });
}

const changeNewEl = document.getElementById("changePasswordNew");
const changeConfEl = document.getElementById("changePasswordConfirm");
if(changeNewEl && changeConfEl){
  changeNewEl.addEventListener("keydown", (e) => {
    if(e.key === "Enter"){
      if(!changeConfEl.value.trim()) changeConfEl.focus();
      else document.getElementById("changePasswordBtn").click();
    }
  });
  changeConfEl.addEventListener("keydown", (e) => {
    if(e.key === "Enter"){
      document.getElementById("changePasswordBtn").click();
    }
  });
}



function touchUserActive(){
  if(currentUser && accounts[currentUser]){
    accounts[currentUser].lastActive = Date.now();
    accounts[currentUser].hasPlayed = true;
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    if(typeof announcePresenceToCam === "function"){
      announcePresenceToCam(false);
    }
    if(typeof updateLivePresenceDisplay === "function"){
      updateLivePresenceDisplay();
    }
  }
}

setInterval(touchUserActive, 15000);
window.addEventListener("pointerdown", touchUserActive);
window.addEventListener("keydown", touchUserActive);

if(currentUser && accounts[currentUser]){
  loadAccount(currentUser);
} else {
  try {
    const savedGuestOwned = JSON.parse(localStorage.getItem("cardCollectorGuestOwned"));
    if(Array.isArray(savedGuestOwned) && savedGuestOwned.length > 0) owned = savedGuestOwned;
    else owned = [0];
    const savedGuestCoins = parseInt(localStorage.getItem("cardCollectorGuestCoins"), 10);
    if(typeof isInfiniteValue === "function" && isInfiniteValue(savedGuestCoins)) coins = Infinity;
    else if(!isNaN(savedGuestCoins)) coins = savedGuestCoins;
  } catch(e){
    owned = [0];
  }
  updateAccountUI();
  render();
}
touchUserActive();

window.addEventListener("storage", (e) => {
  if(e.key === "cardCollectorCustomCards"){
    if(typeof getCustomCardsFromStorage === "function"){
      const customs = getCustomCardsFromStorage();
      const defaultList = (typeof defaultCards !== "undefined") ? defaultCards : [];
      const normDefaults = (typeof normalizeCards === "function") ? normalizeCards(defaultList) : defaultList;
      const normCustoms = (typeof normalizeCards === "function") ? normalizeCards(customs) : customs;
      cards = [...normDefaults, ...normCustoms].filter(c => !c.isUnreleased);
      if(typeof initCardSelect === "function") initCardSelect();
      render();
    }
  } else if(e.key === "cardCollectorUnreleasedCards"){
    try {
      unreleasedCards = JSON.parse(e.newValue) || [];
      if(typeof initCardSelect === "function") initCardSelect();
      render();
    } catch(err){}
  }
});
