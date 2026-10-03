function save(){
  if(currentUser && accounts[currentUser]){
    accounts[currentUser].owned = owned;
    accounts[currentUser].coins = coins;
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    localStorage.setItem("cardCollectorCurrentUser", currentUser);
  }
}

function loadAccount(username){
  currentUser = username;
  owned = Array.isArray(accounts[username].owned) ? accounts[username].owned : [];
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
  const unreleasedShelf = document.getElementById("unreleasedPacksShelf");
  if(unreleasedShelf){
    unreleasedShelf.style.display = isMaster ? "block" : "none";
    if(isMaster && typeof renderUnreleasedPacksShelf === "function"){
      renderUnreleasedPacksShelf();
    }
  }

  const godBtn = document.getElementById("godModeStrikeBtn");
  godBtn.style.display = (hasAdminAccess() && isGodModeEnabled) ? "block" : "none";

  checkLeaksDisplay();
  updatePackPriceLabels();
}

function chooseCardFromWeights(weightMap, minRarityFilter = null, allowUnreleased = false){
  let pool = cards.filter(c => {
    if(!allowUnreleased && c.isUnreleased) return false;
    return !minRarityFilter || rarityRank[c.rarity] >= rarityRank[minRarityFilter];
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
        if(pack.dropMode === "unreleased_only"){
          const unreleasedPool = cards.filter(c => c.isUnreleased);
          if(unreleasedPool.length > 0){
            card = unreleasedPool[Math.floor(Math.random() * unreleasedPool.length)];
          } else {
            card = chooseCardFromWeights(pack.weights, guarantee, true);
          }
        } else if(pack.dropMode === "unreleased_guaranteed" && i === 0){
          const unreleasedPool = cards.filter(c => c.isUnreleased);
          if(unreleasedPool.length > 0){
            card = unreleasedPool[Math.floor(Math.random() * unreleasedPool.length)];
          } else {
            card = chooseCardFromWeights(pack.weights, guarantee, true);
          }
        } else {
          card = chooseCardFromWeights(pack.weights, guarantee, !!pack.isUnreleased);
        }
        const cardIndex = cards.indexOf(card);
        const isNew = !owned.includes(cardIndex);

        if(isNew){
          owned.push(cardIndex);
          newCards++;
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
  const isMaster = isMasterAdmin();

  const visible = cards.filter((c,i)=>{
    if(c.isUnreleased && !isMaster) return false;
    const has = owned.includes(i);
    return filter === "all" || (filter === "collected" && has) || (filter === "missing" && !has);
  });

  const totalCount = cards.filter(c => !c.isUnreleased || isMaster).length;
  const totalCountEl = document.getElementById("totalCardsCount");
  if(totalCountEl) totalCountEl.textContent = totalCount;
  
  const ownedCount = owned.filter(idx => cards[idx] && (!cards[idx].isUnreleased || isMaster)).length;
  document.getElementById("count").textContent = ownedCount;

  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  
  if(!visible.length){
    grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:40px;color:#64748b">No artifacts match your active filter.</div>';
    return;
  }

  visible.forEach(c=>{
    const i = cards.indexOf(c), has = owned.includes(i);
    const el = document.createElement("div");
    el.className = "card" + (has ? "" : " locked");

    const attacksHtml = has ? c.attacks.map(atk => `
      <div class="attack-preview">
        <span class="attack-name">⚔️ ${atk.name}</span>
        <span class="attack-dmg">${atk.dmg} DMG</span>
      </div>
    `).join("") : `
      <div class="attack-preview"><span class="attack-name">⚔️ ???</span><span class="attack-dmg">?? DMG</span></div>
      <div class="attack-preview"><span class="attack-name">⚔️ ???</span><span class="attack-dmg">?? DMG</span></div>
    `;

    const unreleasedBadge = (c.isUnreleased && has) ? '<span style="background:#dc2626;color:#fff;font-size:9px;padding:2px 5px;border-radius:4px;font-weight:800;margin-left:4px">🔒 UNRELEASED</span>' : "";
    el.innerHTML = `
      <div class="face ${has ? c.rarity : ''}">
        <div class="card-top">
          <span class="rarity">${has ? c.rarity : 'Locked'}${unreleasedBadge}</span>
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

  if(!accounts[user]){
    accounts[user] = { password: pass, owned: [], coins: 100 };
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
  } else if(accounts[user].password !== pass){
    err.textContent = "Invalid passcode supplied.";
    return;
  }

  loadAccount(user);
  document.getElementById("accountModal").classList.remove("show");
  document.getElementById("message").textContent = `Loaded identity profile: ${user}`;
};



if(currentUser && accounts[currentUser]){loadAccount(currentUser)}else{updateAccountUI();render()}

function renderUnreleasedPacksShelf(){
  const shelf = document.getElementById("unreleasedPacksShelf");
  const grid = document.getElementById("unreleasedPackGrid");
  if(!shelf || !grid) return;

  if(!isMasterAdmin()){
    shelf.style.display = "none";
    return;
  }

  const packKeys = Object.keys(unreleasedPacks || {});
  if(packKeys.length === 0){
    shelf.style.display = "none";
    return;
  }

  shelf.style.display = "block";
  grid.innerHTML = "";

  packKeys.forEach(k => {
    const p = unreleasedPacks[k];
    const actualCost = getActualPackCost(p.baseCost);
    const cardEl = document.createElement("div");
    cardEl.className = "pack-card pack-unreleased";
    cardEl.style.borderColor = p.border || "#f43f5e";
    cardEl.style.boxShadow = "0 10px 30px rgba(244,63,94,0.25)";

    let dropLabel = "Classified Pool";
    if(p.dropMode === "unreleased_only") dropLabel = "Unreleased Cards Only";
    else if(p.dropMode === "unreleased_guaranteed") dropLabel = "Guaranteed Unreleased";
    else if(p.dropMode === "high_tier") dropLabel = "High-Tier Focus";

    cardEl.innerHTML = `
      <div>
        <div class="pack-title" style="color:#fb7185">
          <span>${p.icon || "🔒"}</span>
          <span>${p.name}</span>
        </div>
        <p class="pack-info">${p.desc || "Classified experimental prototype booster pack."}</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
          <span class="pack-badge" style="background:rgba(244,63,94,0.2);color:#fda4af;border-color:rgba(244,63,94,0.3)">${p.count} Cards</span>
          <span class="pack-badge" style="background:rgba(168,85,247,0.2);color:#e9d5ff;border-color:rgba(168,85,247,0.3)">${dropLabel}</span>
        </div>
      </div>
      <button class="pack-btn" style="background:linear-gradient(135deg,#f43f5e,#be123c);font-weight:800" onclick="startPackOpening('${k}')">
        <span>Open • ${actualCost} 🪙</span>
      </button>
    `;
    grid.appendChild(cardEl);
  });
}
window.renderUnreleasedPacksShelf = renderUnreleasedPacksShelf;

