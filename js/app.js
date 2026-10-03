











function updatePackPriceLabels(){
  const userPacks = (currentUser && accounts[currentUser] && accounts[currentUser].freePacks) ? accounts[currentUser].freePacks : {};
  Object.keys(packTiers).forEach(key => {
    const tier = packTiers[key];
    const actual = getActualPackCost(tier.baseCost);
    const label = document.getElementById("price-" + key);
    if(label){
      if((userPacks[key] || 0) > 0){
        label.innerHTML = `🎁 <b style="color:#38bdf8">FREE GIFT PACK (${userPacks[key]} left)</b>`;
      } else if(eventPackDiscount > 0){
        label.innerHTML = `Open • <s style="opacity:0.6">${tier.baseCost}</s> <b style="color:#4ade80">${actual} 🪙</b>`;
      } else {
        label.textContent = `Open • ${actual} 🪙`;
      }
    }
  });

  const eventBanner = document.getElementById("serverEventBanner");
  if(eventCoinMultiplier > 1 || eventPackDiscount > 0){
    eventBanner.style.display = "block";
    let desc = [];
    if(eventCoinMultiplier > 1) desc.push(`${eventCoinMultiplier}X COINS ACTIVE`);
    if(eventPackDiscount > 0) desc.push(`${eventPackDiscount}% OFF PACK SALE`);
    eventBanner.textContent = `🎉 SPECIAL EVENT: ${desc.join(" + ")}!`;
  } else {
    eventBanner.style.display = "none";
  }

  const maintBanner = document.getElementById("maintenanceBanner");
  maintBanner.style.display = isMaintenanceMode ? "block" : "none";
}

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
  if(!accounts[username]){
    accounts[username] = { password: "password", owned: [], coins: 100, freePacks: {} };
  }
  if(!accounts[username].freePacks) accounts[username].freePacks = {};
  owned = Array.isArray(accounts[username].owned) ? accounts[username].owned : [];
  coins = Number.isFinite(accounts[username].coins) ? accounts[username].coins : 100;
  save();
  updateAccountUI();
  render();
  checkUserGiftsInbox();
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

  const godBtn = document.getElementById("godModeStrikeBtn");
  godBtn.style.display = (hasAdminAccess() && isGodModeEnabled) ? "block" : "none";

  checkLeaksDisplay();
  updatePackPriceLabels();
}

function chooseCardFromWeights(weightMap, minRarityFilter = null){
  let pool = cards.filter(c => !minRarityFilter || rarityRank[c.rarity] >= rarityRank[minRarityFilter]);
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

  const userPacks = (currentUser && accounts[currentUser] && accounts[currentUser].freePacks) ? accounts[currentUser].freePacks : {};
  const hasFreeGiftPack = (userPacks[tierKey] || 0) > 0;

  if(!hasFreeGiftPack){
    const actualCost = getActualPackCost(pack.baseCost);
    if(coins < actualCost){
      document.getElementById("message").textContent = `Insufficient coins: You need ${actualCost} 🪙 to open this pack! (You have: ${coins.toLocaleString()} 🪙)`;
      return;
    }
    coins -= actualCost;
  } else {
    userPacks[tierKey]--;
    accounts[currentUser].freePacks = userPacks;
    document.getElementById("message").textContent = `Opened free gift ${pack.name}! (${userPacks[tierKey]} free remaining)`;
  }

  save();
  render();
  updatePackPriceLabels();

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
        const card = chooseCardFromWeights(pack.weights, guarantee);
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
                <span class="rarity">${card.rarity}</span>
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
  document.getElementById("count").textContent = owned.length;
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  
  const visible = cards.filter((c,i)=>{
    const has = owned.includes(i);
    return filter === "all" || (filter === "collected" && has) || (filter === "missing" && !has);
  });

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

    el.innerHTML = `
      <div class="face ${has ? c.rarity : ''}">
        <div class="card-top">
          <span class="rarity">${has ? c.rarity : 'Locked'}</span>
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
    accounts[user] = { password: pass, owned: [], coins: 100, freePacks: {} };
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
  } else if(accounts[user].password !== pass){
    err.textContent = "Invalid passcode supplied.";
    return;
  }

  loadAccount(user);
  document.getElementById("accountModal").classList.remove("show");
  document.getElementById("message").textContent = `Loaded identity profile: ${user}`;
};

/* Gift Voucher Redeem & Claim Logic */
const rCodeBtn = document.getElementById("redeemCodeBtn");
if(rCodeBtn){
  rCodeBtn.onclick = ()=>{
    const input = document.getElementById("redeemCodeInput");
    const err = document.getElementById("redeemModalError");
    if(input) input.value = "";
    if(err) err.textContent = "";
    const modal = document.getElementById("redeemModal");
    if(modal) modal.classList.add("show");
  };
}
const rCancelBtn = document.getElementById("redeemCancelBtn");
if(rCancelBtn){
  rCancelBtn.onclick = ()=>{
    const modal = document.getElementById("redeemModal");
    if(modal) modal.classList.remove("show");
  };
}
const rSubmitBtn = document.getElementById("redeemSubmitBtn");
if(rSubmitBtn){
  rSubmitBtn.onclick = ()=>{
    const input = document.getElementById("redeemCodeInput");
    const code = input ? input.value.trim() : "";
    const res = redeemGiftCode(code);
    const err = document.getElementById("redeemModalError");
    if(!res.success){
      if(err) err.textContent = res.msg;
    } else {
      const modal = document.getElementById("redeemModal");
      if(modal) modal.classList.remove("show");
      alert("🎉 Code successfully redeemed!");
    }
  };
}
document.getElementById("giftInboxBtn").onclick = ()=>{
  checkUserGiftsInbox(true);
};

function redeemGiftCode(codeStr){
  if(!codeStr) return { success: false, msg: "Please enter a code." };
  const cleanCode = codeStr.trim().toUpperCase();
  const codeData = giftCodes[cleanCode];
  if(!codeData){
    return { success: false, msg: "Invalid or expired gift voucher code." };
  }

  const userKey = (currentUser || "Guest").toLowerCase();
  if(!codeData.usedBy) codeData.usedBy = [];

  if(codeData.usedBy.map(u => u.toLowerCase()).includes(userKey)){
    return { success: false, msg: "You have already redeemed this gift code!" };
  }

  if(codeData.usedBy.length >= (codeData.maxUses || 1)){
    return { success: false, msg: "This voucher code has reached its maximum redemptions limit." };
  }

  codeData.usedBy.push(currentUser || "Guest");
  localStorage.setItem("cardCollectorGiftCodes", JSON.stringify(giftCodes));

  const giftItem = {
    id: "code_" + Date.now(),
    from: `Promo Code: ${cleanCode}`,
    to: currentUser || "Guest",
    coins: codeData.coins || 0,
    cardIdx: (codeData.cardIdx !== undefined && codeData.cardIdx !== null && codeData.cardIdx !== "") ? parseInt(codeData.cardIdx, 10) : null,
    packTier: codeData.packTier || null,
    packCount: codeData.packCount || (codeData.packTier ? 1 : 0),
    note: `Redeemed voucher code: ${cleanCode}`,
    date: new Date().toLocaleDateString(),
    timestamp: Date.now(),
    claimed: false
  };

  const targetKey = (currentUser || "Guest").toLowerCase();
  if(!giftsInbox[targetKey]) giftsInbox[targetKey] = [];
  giftsInbox[targetKey].push(giftItem);
  localStorage.setItem("cardCollectorGifts", JSON.stringify(giftsInbox));

  checkUserGiftsInbox(true);
  refreshAdminPlayerData();
  return { success: true, msg: "Code redeemed!" };
}

function checkUserGiftsInbox(forceOpen = false){
  const userKey = (currentUser || "Guest").toLowerCase();
  const inbox = giftsInbox[userKey] || [];
  const pending = inbox.filter(g => !g.claimed);

  const inboxBtn = document.getElementById("giftInboxBtn");
  const inboxCount = document.getElementById("giftInboxCount");

  if(pending.length > 0){
    if(inboxBtn) inboxBtn.style.display = "inline-block";
    if(inboxCount) inboxCount.textContent = pending.length;
    showGiftClaimModal(pending);
  } else {
    if(inboxBtn) inboxBtn.style.display = "none";
    if(forceOpen){
      alert("No pending gifts found in your inbox right now.");
    }
  }
}

function showGiftClaimModal(pendingGifts){
  const modal = document.getElementById("giftClaimModal");
  if(!modal) return;
  const senderLabel = document.getElementById("giftClaimSenderLabel");
  const msgBox = document.getElementById("giftClaimMessage");
  const container = document.getElementById("giftClaimItemsContainer");

  container.innerHTML = "";

  const senders = [...new Set(pendingGifts.map(g => g.from))].join(", ");
  senderLabel.textContent = `From: ${senders || "Master Admin"}`;

  const notes = pendingGifts.map(g => g.note).filter(Boolean);
  if(notes.length > 0){
    msgBox.style.display = "block";
    msgBox.textContent = `"${notes.join(' • ')}"`;
  } else {
    msgBox.style.display = "none";
  }

  let totalCoins = 0;
  let allCards = [];
  let allPacks = {};

  pendingGifts.forEach(g => {
    if(g.coins) totalCoins += g.coins;
    if(g.cardIdx !== null && g.cardIdx !== undefined && cards[g.cardIdx]){
      allCards.push(cards[g.cardIdx]);
    }
    if(g.packTier && (g.packCount || 1)){
      allPacks[g.packTier] = (allPacks[g.packTier] || 0) + (g.packCount || 1);
    }
  });

  if(totalCoins > 0){
    const d = document.createElement("div");
    d.style = "background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.3);padding:12px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:16px;font-weight:800;color:#fbbf24";
    d.innerHTML = `🪙 +${totalCoins.toLocaleString()} Coins`;
    container.appendChild(d);
  }

  allCards.forEach(c => {
    const d = document.createElement("div");
    d.style = "background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.3);padding:10px 14px;border-radius:12px;display:flex;align-items:center;gap:12px;text-align:left";
    d.innerHTML = `
      <img src="${c.image}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;border:1px solid rgba(255,255,255,0.2)">
      <div>
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;color:#38bdf8">${c.rarity} Card</div>
        <b style="font-size:15px;color:#fff">${c.name}</b>
      </div>
    `;
    container.appendChild(d);
  });

  Object.keys(allPacks).forEach(tier => {
    const tierInfo = packTiers[tier] || { name: tier, icon: "📦" };
    const d = document.createElement("div");
    d.style = "background:rgba(168,85,247,0.15);border:1px solid rgba(168,85,247,0.3);padding:12px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:15px;font-weight:800;color:#e9d5ff";
    d.innerHTML = `${tierInfo.icon} ${allPacks[tier]}x ${tierInfo.name}`;
    container.appendChild(d);
  });

  modal.classList.add("show");

  document.getElementById("giftClaimConfirmBtn").onclick = ()=>{
    if(totalCoins > 0){
      coins += totalCoins;
    }
    allCards.forEach(c => {
      const idx = cards.indexOf(c);
      if(idx !== -1 && !owned.includes(idx)){
        owned.push(idx);
      }
    });

    if(currentUser && accounts[currentUser]){
      if(!accounts[currentUser].freePacks) accounts[currentUser].freePacks = {};
      Object.keys(allPacks).forEach(t => {
        accounts[currentUser].freePacks[t] = (accounts[currentUser].freePacks[t] || 0) + allPacks[t];
      });
      accounts[currentUser].coins = coins;
      accounts[currentUser].owned = owned;
    }

    pendingGifts.forEach(g => {
      g.claimed = true;
    });

    localStorage.setItem("cardCollectorGifts", JSON.stringify(giftsInbox));
    save();
    render();
    updatePackPriceLabels();
    checkUserGiftsInbox();

    modal.classList.remove("show");
    alert("🎉 All gifts successfully claimed and added to your collection!");
  };
}

/* Canvas Drawing Logic */
const canvas = document.getElementById("artCanvas");
const ctx = canvas.getContext("2d");
let isDrawing = false;
let uploadedImageData = null;

function clearCanvas(){
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
clearCanvas();

canvas.addEventListener("mousedown", (e)=>{
  isDrawing = true;
  draw(e);
});
canvas.addEventListener("mousemove", draw);
window.addEventListener("mouseup", ()=>isDrawing = false);

function draw(e){
  if(!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  ctx.lineWidth = document.getElementById("brushSize").value;
  ctx.lineCap = "round";
  ctx.strokeStyle = document.getElementById("brushColor").value;

  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
}

document.getElementById("clearCanvasBtn").onclick = clearCanvas;

document.getElementById("imageFileInput").addEventListener("change", (e)=>{
  const file = e.target.files[0];
  if(file){
    const reader = new FileReader();
    reader.onload = (event)=>{
      uploadedImageData = event.target.result;
      const img = new Image();
      img.onload = ()=>ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = uploadedImageData;
    };
    reader.readAsDataURL(file);
  }
});

function getFinalArtworkSrc(){
  const urlVal = document.getElementById("newCardImageUrl").value.trim();
  if(urlVal) return urlVal;
  if(uploadedImageData) return uploadedImageData;
  return canvas.toDataURL("image/png");
}

// Bootstrap Game Initialization
initCardSelect();
if(currentUser && accounts[currentUser]){
  loadAccount(currentUser);
} else {
  updateAccountUI();
  render();
  checkUserGiftsInbox();
}
