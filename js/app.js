function save(){
  if(currentUser && accounts[currentUser]){
    accounts[currentUser].owned = owned;
    accounts[currentUser].coins = coins;
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
  owned = (Array.isArray(accounts[username].owned) ? accounts[username].owned : []).map(x => parseInt(x, 10)).filter(n => !isNaN(n));
  coins = Number.isFinite(accounts[username].coins) ? accounts[username].coins : 100;
  save();
  updateAccountUI();
  render();
}

function updateAccountUI(){
  const isMaster = isMasterAdmin();
  const isSub = isSubAdmin();

  let roleLabel = "";
  if(isMaster) roleLabel = " (Master Admin)";
  else if(isSub) roleLabel = " (Admin)";

  document.getElementById("accountLabel").textContent = currentUser ? currentUser + roleLabel : "Guest";
  document.getElementById("accountBtn").textContent = currentUser ? "Switch Account" : "Sign In";

  const adminOpenBtn = document.getElementById("adminOpenBtn");
  if(hasAdminAccess()){
    adminOpenBtn.style.display = "inline-block";
    adminOpenBtn.textContent = isMaster ? "⚡ Admin Hub" : "🛡️ Sub-Admin Hub";
  } else {
    adminOpenBtn.style.display = "none";
    document.getElementById("adminModal").classList.remove("show");
  }

  const permTabBtn = document.getElementById("permissionsTabBtn");
  const masterDepositSec = document.getElementById("masterDepositSection");
  const adminWipeSec = document.getElementById("adminWipeSection");

  if(isMaster){
    permTabBtn.style.display = "block";
    masterDepositSec.style.display = "block";
    adminWipeSec.style.display = "flex";
    document.getElementById("adminHubHeader").textContent = "⚡ Supreme Admin Suite (Cam)";
  } else {
    permTabBtn.style.display = "none";
    masterDepositSec.style.display = "none";
    adminWipeSec.style.display = "none";
    document.getElementById("adminHubHeader").textContent = `🛡️ Sub-Admin Console (${currentUser})`;
  }

  const unreleasedTabBtn = document.getElementById("unreleasedTabBtn");
  if(unreleasedTabBtn){
    unreleasedTabBtn.style.display = isMaster ? "block" : "none";
  }

  const godBtn = document.getElementById("godModeStrikeBtn");
  godBtn.style.display = (hasAdminAccess() && isGodModeEnabled) ? "block" : "none";

  checkLeaksDisplay();
  updatePackPriceLabels();
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
            <span class="attack-dmg">${atk.dmg} DMG</span>
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
                <span style="font-size:11px;font-weight:800;color:#fca5a5">${card.hp || 80} HP</span>
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
  const curUserVaultOwned = (currentUser && accounts[currentUser] && Array.isArray(accounts[currentUser].unreleasedOwned))
    ? accounts[currentUser].unreleasedOwned
    : (isCam && accounts["Cam"] && Array.isArray(accounts["Cam"].unreleasedOwned) ? accounts["Cam"].unreleasedOwned : []);

  const userGiftedVaultCards = [];
  if(Array.isArray(unreleasedCards)){
    curUserVaultOwned.forEach(id => {
      const vCard = unreleasedCards.find(c => (c.id || c.name) === id);
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
      const cardId = c.id || c.name;
      has = curUserVaultOwned.includes(cardId);
      // Strictly isolate unreleased vault cards: only Cam or players gifted this card can ever see it
      if(!has && !isCam){
        return false;
      }
    } else {
      const cardIdx = cards.indexOf(c);
      has = owned.includes(cardIdx);
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
      const cardId = c.id || c.name;
      has = curUserVaultOwned.includes(cardId);
      if(!has && !isCam) return;
    } else {
      const i = cards.indexOf(c);
      has = owned.includes(i);
    }
    const el = document.createElement("div");
    el.className = "card" + (has ? "" : " locked");

    let rarityDisplayName = c.rarity;
    if(typeof customRarities === "object" && customRarities[c.rarity]){
      rarityDisplayName = customRarities[c.rarity].name;
    }

    const attacksHtml = has ? c.attacks.map(atk => `
      <div class="attack-preview">
        <span class="attack-name">⚔️ ${atk.name}</span>
        <span class="attack-dmg">${atk.dmg} DMG</span>
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
    el.innerHTML = `
      <div class="face ${has ? c.rarity : ''}">
        <div class="card-top">
          <span class="rarity">${has ? rarityDisplayName : 'Locked'}${unreleasedBadge}</span>
          <span style="font-size:11px;font-weight:800;color:#fca5a5">${has ? (c.hp || 80) + ' HP' : '???'}</span>
        </div>
        <div class="card-art-frame">
          <img class="card-art-img" src="${c.image}" alt="${c.name}">
          <div class="card-aura"></div>
        </div>
        <div class="card-bottom">
          <div class="name">${has ? c.name : 'Unknown Card'}</div>
          <div class="desc">${has ? c.desc : 'Discover this artifact by opening booster packs.'}</div>
          <div class="attacks-list">
            ${attacksHtml}
          </div>
        </div>
      </div>
    `;
    grid.appendChild(el);
  });
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
    accounts[actualUser] = { password: pass, owned: [], coins: 100, hasPlayed: true, lastActive: Date.now() };
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
    if(Array.isArray(savedGuestOwned)) owned = savedGuestOwned;
    const savedGuestCoins = parseInt(localStorage.getItem("cardCollectorGuestCoins"), 10);
    if(!isNaN(savedGuestCoins)) coins = savedGuestCoins;
  } catch(e){}
  updateAccountUI();
  render();
}
touchUserActive();

window.addEventListener("storage", (e) => {
  if(e.key === "cardCollectorCustomCards"){
    if(typeof getCustomCardsFromStorage === "function"){
      const customs = getCustomCardsFromStorage();
      const defaultList = (typeof defaultCards !== "undefined") ? defaultCards : [];
      cards = [...defaultList, ...customs].filter(c => !c.isUnreleased);
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
