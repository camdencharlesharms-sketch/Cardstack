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
  if(targetAcc){
    targetAcc.owned = activeOwned.map(x => parseInt(x, 10)).filter(n => !isNaN(n));
    targetAcc.coins = coins;
    if(Array.isArray(targetAcc.unreleasedOwned)){
      targetAcc.unreleasedOwned = Array.from(new Set(targetAcc.unreleasedOwned));
    }
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    localStorage.setItem("cardCollectorCurrentUser", currentUser);
  } else if(currentUser && accounts) {
    accounts[currentUser] = {
      password: "",
      owned: activeOwned.map(x => parseInt(x, 10)).filter(n => !isNaN(n)),
      coins: coins,
      unreleasedOwned: [],
      hasPlayed: true,
      lastActive: Date.now()
    };
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    localStorage.setItem("cardCollectorCurrentUser", currentUser);
  } else {
    try {
      localStorage.setItem("cardCollectorGuestOwned", JSON.stringify(owned));
      localStorage.setItem("cardCollectorGuestCoins", coins.toString());
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
    coins = Number.isFinite(userAcc.coins) ? userAcc.coins : 100;
  } else {
    owned = [0];
    coins = 100;
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

    const headerEl = document.getElementById("adminHubHeader");
    if(headerEl) headerEl.textContent = "⚡ Supreme Admin Suite (Cam)";
    if(statusBanner) statusBanner.style.display = "none";
  } else if(isSub){
    if(permTabBtn) permTabBtn.style.display = "none";
    if(unreleasedTabBtn) unreleasedTabBtn.style.display = "none";
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

    // Reset tab if currently on disallowed or Cam-only tabs
    const activeTab = document.querySelector(".admin-tab-content.active");
    const isCurrentAllowed = activeTab && (
      (activeTab.id === "tabPlayers" && perms.players) ||
      (activeTab.id === "tabEconomy" && perms.economy) ||
      (activeTab.id === "tabStudio" && perms.studio) ||
      (activeTab.id === "tabCardManager" && perms.cardManager) ||
      (activeTab.id === "tabEvents" && perms.events) ||
      (activeTab.id === "tabBroadcast" && perms.broadcast)
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

  if(coins < actualCost){
    document.getElementById("message").textContent = `Insufficient coins: You need ${actualCost} 🪙 to open this pack! (You have: ${coins.toLocaleString()} 🪙)`;
    return;
  }

  coins -= actualCost;
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

      for(let i = 0; i < pack.count; i++){
        const guarantee = (i === 0 && pack.minRarity) ? pack.minRarity : null;
        let card;
        // Booster packs strictly drop public & studio cards. Unreleased vault cards can ONLY be gifted by Cam!
        card = chooseCardFromWeights(pack.weights, guarantee, false);

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
  document.getElementById("coins").textContent = coins.toLocaleString();
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

/* Auth Modals */
document.getElementById("accountBtn").onclick = ()=>{
  document.getElementById("accountModal").classList.add("show");
  document.getElementById("usernameInput").value = "";
  document.getElementById("passwordInput").value = "";
  document.getElementById("accountError").textContent = "";
};
document.getElementById("accountCancel").onclick = ()=>{
  document.getElementById("accountModal").classList.remove("show");
};

document.getElementById("accountSubmit").onclick = ()=>{
  const user = document.getElementById("usernameInput").value.trim();
  const pass = document.getElementById("passwordInput").value;
  const err = document.getElementById("accountError");

  if(user.length < 3 || pass.length < 4){
    err.textContent = "Credentials must meet minimum length criteria.";
    return;
  }

  // Reload accounts from localStorage to prevent stale data
  try {
    const saved = JSON.parse(localStorage.getItem("cardCollectorAccounts"));
    if(saved && typeof saved === "object") accounts = saved;
  } catch(e){}

  let isNewAccount = false;
  const matchKey = Object.keys(accounts).find(k => k.toLowerCase() === user.toLowerCase());
  const actualUser = matchKey || user;

  if(!accounts[actualUser]){
    isNewAccount = true;
    accounts[actualUser] = { password: pass, owned: [0], coins: 100, hasPlayed: true, lastActive: Date.now() };
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
  } else if(!accounts[actualUser].password){
    // Claiming account created via Admin Hub gifting
    accounts[actualUser].password = pass;
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
  } else if(actualUser.toLowerCase() === "cam" && (pass === "admin123" || pass === "password" || pass === "admin")){
    accounts[actualUser].password = pass;
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
  } else if(accounts[actualUser].password !== pass){
    err.textContent = "Invalid passcode supplied.";
    return;
  }

  loadAccount(actualUser);
  document.getElementById("accountModal").classList.remove("show");
  document.getElementById("message").textContent = `Loaded identity profile: ${actualUser}`;

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
    if(!isNaN(savedGuestCoins)) coins = savedGuestCoins;
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
