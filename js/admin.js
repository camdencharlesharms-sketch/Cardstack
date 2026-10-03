function updatePackPriceLabels(){
  Object.keys(packTiers).forEach(key => {
    const tier = packTiers[key];
    const actual = getActualPackCost(tier.baseCost);
    const label = document.getElementById("price-" + key);
    if(label){
      if(eventPackDiscount > 0){
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

function initCardSelect(){
  const select = document.getElementById("skinSelect");
  select.innerHTML = '<option value="">Select Card to Grant / Edit...</option>';
  cards.forEach((c, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    const atkNames = c.attacks.map(a => `${a.name} (${a.dmg})`).join(" / ");
    opt.textContent = `${c.name} (${c.rarity}) - ATK: ${atkNames}`;
    select.appendChild(opt);
  });
  document.getElementById("totalCardsCount").textContent = cards.length;
  renderSubAdminSkinChecklist();
}

function renderSubAdminSkinChecklist(){
  const container = document.getElementById("subAdminSkinsChecklist");
  container.innerHTML = "";
  cards.forEach((c, idx) => {
    const label = document.createElement("label");
    label.className = "skin-check-item";
    label.innerHTML = `
      <input type="checkbox" value="${idx}" class="subadmin-skin-check" checked>
      <span>${c.name} (${c.rarity})</span>
    `;
    container.appendChild(label);
  });
}
initCardSelect();

document.querySelectorAll(".admin-tab-btn").forEach(btn => {
  btn.onclick = ()=>{
    document.querySelectorAll(".admin-tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.remove("active"));

    btn.classList.add("active");
    const targetId = btn.getAttribute("data-tab");
    document.getElementById(targetId).classList.add("active");
  };
});

function refreshAdminPlayerData(){
  const playerSelect = document.getElementById("skinPlayerSelect");
  const subAdminSelect = document.getElementById("subAdminTargetSelect");
  const ecoPlayerSelect = document.getElementById("economyPlayerSelect");
  const tableBody = document.getElementById("playerTableBody");

  playerSelect.innerHTML = '<option value="">Select Target Player...</option>';
  subAdminSelect.innerHTML = '<option value="">Select Player...</option>';
  ecoPlayerSelect.innerHTML = '<option value="">Select Target Player...</option>';
  tableBody.innerHTML = "";

  const allNames = Object.keys(accounts);
  if(allNames.length === 0){
    tableBody.innerHTML = '<tr><td colspan="5" style="color:#64748b;padding:8px">No registered player accounts.</td></tr>';
    return;
  }

  allNames.forEach(name => {
    const data = accounts[name];
    const isCurrent = currentUser && currentUser.toLowerCase() === name.toLowerCase();
    const isMaster = name.toLowerCase() === ADMIN_USERNAME.toLowerCase();
    const isSub = subAdminRoles[name] && subAdminRoles[name].active;

    let roleText = "Player";
    if(isMaster) roleText = "Master";
    else if(isSub) roleText = "Sub-Admin";

    // Player Skins selector
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name + (isCurrent ? " (You)" : "");
    playerSelect.appendChild(opt);

    // Economy Target selector
    const ecoOpt = document.createElement("option");
    ecoOpt.value = name;
    ecoOpt.textContent = name + (isCurrent ? " (You)" : "");
    ecoPlayerSelect.appendChild(ecoOpt);

    // Sub-Admin role assignment selector
    if(!isMaster){
      const opt2 = document.createElement("option");
      opt2.value = name;
      opt2.textContent = name;
      subAdminSelect.appendChild(opt2);
    }

    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
    tr.innerHTML = `
      <td style="padding:8px 6px"><b>${name}</b></td>
      <td><span style="color:${isMaster ? '#f43f5e' : (isSub ? '#38bdf8' : '#64748b')}">${roleText}</span></td>
      <td>🪙 ${(data.coins || 0).toLocaleString()}</td>
      <td>${(data.owned || []).length} / ${cards.length}</td>
      <td>
        ${!isMaster ? `<button class="accountBtn" style="padding:4px 8px;font-size:11px;color:#f87171" onclick="adminDeleteSingleAccount('${name}')">Delete</button>` : '<span style="color:#94a3b8;font-size:11px">Owner</span>'}
      </td>
    `;
    tableBody.appendChild(tr);
  });

  renderSubAdminRolesList();
}

function renderSubAdminRolesList(){
  const listEl = document.getElementById("subAdminRolesList");
  listEl.innerHTML = "";
  const subAdminKeys = Object.keys(subAdminRoles);

  if(subAdminKeys.length === 0){
    listEl.innerHTML = '<span style="color:#64748b;font-size:13px">No sub-admins appointed yet.</span>';
    return;
  }

  subAdminKeys.forEach(user => {
    const role = subAdminRoles[user];
    if(!role.active) return;

    const div = document.createElement("div");
    div.style = "background:rgba(0,0,0,0.35);padding:10px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center";
    div.innerHTML = `
      <div>
        <b style="color:#38bdf8">${user}</b>
        <div style="font-size:12px;color:#cbd5e1">Daily Coin Cap: <b>${role.dailyCap || 0} 🪙</b> | Gifted Today: ${role.giftedToday || 0}</div>
        <div style="font-size:11px;color:#94a3b8">Can Gift Skins: <b>${role.canGiftSkins ? 'Yes' : 'No'}</b> (${(role.allowedSkinIds || []).length} allowed)</div>
      </div>
      <button class="accountBtn" style="background:#dc2626;padding:6px 12px;font-size:12px" onclick="revokeSubAdminRole('${user}')">Revoke</button>
    `;
    listEl.appendChild(div);
  });
}

function checkLeaksDisplay(){
  const currentLeak = localStorage.getItem("cardCollectorLeak");
  const leakSection = document.getElementById("leaksSection");
  const leakContent = document.getElementById("leaksContent");
  if(currentLeak && currentLeak.trim().length > 0){
    leakContent.textContent = currentLeak;
    leakSection.style.display = "block";
  } else {
    leakSection.style.display = "none";
  }
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


/* Admin Controls & Actions */
document.getElementById("adminOpenBtn").onclick = ()=>{
  refreshAdminPlayerData();
  renderUnreleasedAdminUI();
  document.getElementById("adminLeakInput").value = localStorage.getItem("cardCollectorLeak") || "";
  document.getElementById("adminLuckSelect").value = adminLuckMultiplier.toString();
  document.getElementById("eventCoinMultiplierSelect").value = eventCoinMultiplier.toString();
  document.getElementById("eventPackDiscountSelect").value = eventPackDiscount.toString();
  document.getElementById("toggleMaintenanceBtn").textContent = isMaintenanceMode ? "ON" : "OFF";
  document.getElementById("toggleGodModeBtn").textContent = isGodModeEnabled ? "ENABLED" : "DISABLED";
  document.getElementById("adminModal").classList.add("show");
};
document.getElementById("adminCloseBtn").onclick = ()=>{
  document.getElementById("adminModal").classList.remove("show");
};

// Event modifiers handler
document.getElementById("applyServerEventsBtn").onclick = ()=>{
  if(!isMasterAdmin()) return alert("Only master admin Cam can alter world events.");

  eventCoinMultiplier = parseInt(document.getElementById("eventCoinMultiplierSelect").value);
  eventPackDiscount = parseInt(document.getElementById("eventPackDiscountSelect").value);

  localStorage.setItem("cardCollectorEventCoins", eventCoinMultiplier.toString());
  localStorage.setItem("cardCollectorEventDiscount", eventPackDiscount.toString());

  updatePackPriceLabels();
  alert("World event settings broadcasted and saved!");
};

document.getElementById("toggleMaintenanceBtn").onclick = ()=>{
  if(!isMasterAdmin()) return alert("Only Cam can toggle maintenance mode.");
  isMaintenanceMode = !isMaintenanceMode;
  localStorage.setItem("cardCollectorMaintenance", isMaintenanceMode.toString());
  document.getElementById("toggleMaintenanceBtn").textContent = isMaintenanceMode ? "ON" : "OFF";
  updatePackPriceLabels();
};

document.getElementById("toggleGodModeBtn").onclick = ()=>{
  isGodModeEnabled = !isGodModeEnabled;
  localStorage.setItem("cardCollectorGodMode", isGodModeEnabled.toString());
  document.getElementById("toggleGodModeBtn").textContent = isGodModeEnabled ? "ENABLED" : "DISABLED";
  document.getElementById("godModeStrikeBtn").style.display = (hasAdminAccess() && isGodModeEnabled) ? "block" : "none";
};

document.getElementById("saveSubAdminRoleBtn").onclick = ()=>{
  if(!isMasterAdmin()) return alert("Only Cam can configure admin privileges.");

  const target = document.getElementById("subAdminTargetSelect").value;
  if(!target) return alert("Select a player to assign privileges to.");

  const dailyCap = parseInt(document.getElementById("subAdminDailyCapInput").value, 10) || 0;
  const canGiftSkins = document.getElementById("subAdminAllowSkinsCheck").checked;

  const allowedSkinIds = [];
  document.querySelectorAll(".subadmin-skin-check:checked").forEach(cb => {
    allowedSkinIds.push(parseInt(cb.value, 10));
  });

  subAdminRoles[target] = {
    active: true,
    dailyCap: dailyCap,
    giftedToday: 0,
    lastGiftDate: new Date().toDateString(),
    canGiftSkins: canGiftSkins,
    allowedSkinIds: allowedSkinIds
  };

  localStorage.setItem("cardCollectorSubAdmins", JSON.stringify(subAdminRoles));
  refreshAdminPlayerData();
  alert(`Granted Sub-Admin privileges to ${target}!`);
};

window.revokeSubAdminRole = function(user){
  if(!isMasterAdmin()) return alert("Only Cam can revoke sub-admin roles.");
  if(confirm(`Revoke admin privileges from ${user}?`)){
    delete subAdminRoles[user];
    localStorage.setItem("cardCollectorSubAdmins", JSON.stringify(subAdminRoles));
    refreshAdminPlayerData();
    alert(`Revoked admin role from ${user}.`);
  }
};

document.getElementById("adminCreateCardBtn").onclick = ()=>{
  const name = document.getElementById("newCardName").value.trim();
  const rarity = document.getElementById("newCardRarity").value;
  const desc = document.getElementById("newCardDesc").value.trim();
  
  const atk1Name = document.getElementById("newCardAttack1Name").value.trim() || "Light Strike";
  const atk1Dmg = parseInt(document.getElementById("newCardAttack1Dmg").value, 10) || 18;
  const atk2Name = document.getElementById("newCardAttack2Name").value.trim() || "Heavy Strike";
  const atk2Dmg = parseInt(document.getElementById("newCardAttack2Dmg").value, 10) || 32;

  const image = getFinalArtworkSrc();

  if(!name || !desc) return alert("Please specify card name and description.");

  const hpByRarity = { common: 75, rare: 90, epic: 115, legendary: 150, mythic: 180, divine: 210 };
  const newCard = { 
    name, 
    image, 
    rarity, 
    desc, 
    hp: hpByRarity[rarity] || 100,
    attacks: [
      { name: atk1Name, dmg: atk1Dmg },
      { name: atk2Name, dmg: atk2Dmg }
    ]
  };
  cards.push(newCard);
  localStorage.setItem("cardCollectorCustomCards", JSON.stringify(cards));

  initCardSelect();
  render();
  document.getElementById("newCardName").value = "";
  document.getElementById("newCardDesc").value = "";
  document.getElementById("newCardAttack1Name").value = "";
  document.getElementById("newCardAttack2Name").value = "";
  document.getElementById("newCardImageUrl").value = "";
  clearCanvas();
  alert(`Created combat card "${name}" with multiple attacks!`);
};

document.getElementById("adminUpdateCardArtBtn").onclick = ()=>{
  const idx = parseInt(document.getElementById("skinSelect").value, 10);
  if(isNaN(idx)) return alert("Select an existing card from the dropdown to update.");

  const image = getFinalArtworkSrc();
  cards[idx].image = image;
  localStorage.setItem("cardCollectorCustomCards", JSON.stringify(cards));

  render();
  alert(`Updated picture for card "${cards[idx].name}"!`);
};

document.getElementById("adminGiveSkinBtn").onclick = ()=>{
  const target = document.getElementById("skinPlayerSelect").value;
  const idx = parseInt(document.getElementById("skinSelect").value, 10);
  if(!target || isNaN(idx)) return alert("Select recipient and valid card.");

  if(isSubAdmin() && !isMasterAdmin()){
    const role = subAdminRoles[currentUser];
    if(!role.canGiftSkins){
      return alert("Permission Denied: Your sub-admin role is not authorized to gift skins.");
    }
    if(!role.allowedSkinIds || !role.allowedSkinIds.includes(idx)){
      return alert(`Permission Denied: You are not authorized to gift the skin "${cards[idx].name}".`);
    }
  }

  if(!accounts[target].owned) accounts[target].owned = [];
  if(!accounts[target].owned.includes(idx)){
    accounts[target].owned.push(idx);
    if(target.toLowerCase() === currentUser.toLowerCase()) owned = accounts[target].owned;
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    refreshAdminPlayerData();
    render();
    alert(`Card granted to ${target}.`);
  } else {
    alert(`${target} already possesses this card.`);
  }
};

document.getElementById("adminTakeSkinBtn").onclick = ()=>{
  if(!isMasterAdmin()) return alert("Only master admin Cam can revoke cards.");

  const target = document.getElementById("skinPlayerSelect").value;
  const idx = parseInt(document.getElementById("skinSelect").value, 10);
  if(!target || isNaN(idx)) return alert("Select recipient and valid card.");

  if(accounts[target] && accounts[target].owned){
    accounts[target].owned = accounts[target].owned.filter(x => x !== idx);
    if(target.toLowerCase() === currentUser.toLowerCase()) owned = accounts[target].owned;
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    refreshAdminPlayerData();
    render();
    alert(`Card revoked from ${target}.`);
  }
};

document.getElementById("adminUnlockAllPlayerBtn").onclick = ()=>{
  if(!isMasterAdmin()) return alert("Only master admin Cam can unlock all cards.");

  const target = document.getElementById("skinPlayerSelect").value;
  if(!target) return alert("Select a target player first.");
  accounts[target].owned = cards.map((_, i) => i);
  if(target.toLowerCase() === currentUser.toLowerCase()) owned = accounts[target].owned;
  localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
  refreshAdminPlayerData();
  render();
  alert(`Unlocked all ${cards.length} cards for ${target}!`);
};

document.getElementById("adminWipePlayerBtn").onclick = ()=>{
  if(!isMasterAdmin()) return alert("Only master admin Cam can wipe accounts.");

  const target = document.getElementById("skinPlayerSelect").value;
  if(!target) return alert("Select a target player first.");
  if(confirm(`Wipe all unlocked cards for ${target}?`)){
    accounts[target].owned = [];
    if(target.toLowerCase() === currentUser.toLowerCase()) owned = [];
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    refreshAdminPlayerData();
    render();
    alert(`Inventory cleared for ${target}.`);
  }
};

// Target-Specific Coin Gifting
document.getElementById("adminAddPlayerCoinsBtn").onclick = ()=>{
  const target = document.getElementById("economyPlayerSelect").value;
  const amt = parseInt(document.getElementById("adminPlayerCoinsAmount").value, 10);
  if(!target) return alert("Please select a target player from the dropdown.");
  if(isNaN(amt) || amt <= 0) return alert("Enter a valid positive number.");

  if(isSubAdmin() && !isMasterAdmin()){
    const role = subAdminRoles[currentUser];
    const today = new Date().toDateString();
    if(role.lastGiftDate !== today){
      role.lastGiftDate = today;
      role.giftedToday = 0;
    }

    if((role.giftedToday + amt) > role.dailyCap){
      const remaining = Math.max(0, role.dailyCap - role.giftedToday);
      return alert(`Daily Limit Exceeded: You can only gift ${remaining} more coins today (Daily Cap: ${role.dailyCap}).`);
    }

    role.giftedToday += amt;
    localStorage.setItem("cardCollectorSubAdmins", JSON.stringify(subAdminRoles));
  }

  accounts[target].coins = (accounts[target].coins || 0) + amt;
  if(target.toLowerCase() === currentUser.toLowerCase()) coins = accounts[target].coins;
  localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
  refreshAdminPlayerData();
  render();
  alert(`Added ${amt.toLocaleString()} coins to ${target}.`);
};

document.getElementById("adminSetPlayerCoinsBtn").onclick = ()=>{
  if(!isMasterAdmin()) return alert("Only master admin Cam can set exact treasury balances.");
  const target = document.getElementById("economyPlayerSelect").value;
  const amt = parseInt(document.getElementById("adminPlayerCoinsAmount").value, 10);
  if(!target) return alert("Please select a target player from the dropdown.");
  if(isNaN(amt) || amt < 0) return alert("Enter a valid non-negative number.");
  accounts[target].coins = amt;
  if(target.toLowerCase() === currentUser.toLowerCase()) coins = accounts[target].coins;
  localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
  refreshAdminPlayerData();
  render();
  alert(`Set ${target}'s treasury balance to ${amt.toLocaleString()} coins.`);
};

document.getElementById("adminDrainPlayerCoinsBtn").onclick = ()=>{
  if(!isMasterAdmin()) return alert("Only master admin Cam can drain accounts.");
  const target = document.getElementById("economyPlayerSelect").value;
  if(!target) return alert("Please select a target player from the dropdown.");
  accounts[target].coins = 0;
  if(target.toLowerCase() === currentUser.toLowerCase()) coins = 0;
  localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
  refreshAdminPlayerData();
  render();
  alert(`Emptied treasury balance for ${target}.`);
};

document.getElementById("adminAddSelfCoinsBtn").onclick = ()=>{
  coins += 10000;
  save();
  render();
  refreshAdminPlayerData();
  alert("Deposited 10,000 coins to Cam.");
};

document.getElementById("adminSaveLuckBtn").onclick = ()=>{
  if(!isMasterAdmin()) return alert("Only master admin Cam can adjust RNG drop luck.");
  adminLuckMultiplier = parseFloat(document.getElementById("adminLuckSelect").value);
  localStorage.setItem("cardCollectorLuck", adminLuckMultiplier.toString());
  alert(`Pack opening luck multiplier set to ${adminLuckMultiplier}x!`);
};

document.getElementById("adminPostLeakBtn").onclick = ()=>{
  const txt = document.getElementById("adminLeakInput").value.trim();
  localStorage.setItem("cardCollectorLeak", txt);
  checkLeaksDisplay();
  alert("Broadcast transmitted.");
};
document.getElementById("adminClearLeakBtn").onclick = ()=>{
  localStorage.removeItem("cardCollectorLeak");
  document.getElementById("adminLeakInput").value = "";
  checkLeaksDisplay();
};

document.getElementById("adminUnlockAllCamBtn").onclick = ()=>{
  owned = cards.map((_, i) => i);
  save();
  render();
  refreshAdminPlayerData();
  alert("All cards unlocked for Cam!");
};

window.adminDeleteSingleAccount = function(username){
  if(!isMasterAdmin()) return alert("Only master admin Cam can delete accounts.");
  if(confirm(`Permanently remove account "${username}"?`)){
    delete accounts[username];
    delete subAdminRoles[username];
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    localStorage.setItem("cardCollectorSubAdmins", JSON.stringify(subAdminRoles));
    refreshAdminPlayerData();
  }
};

document.getElementById("adminWipeOtherAccountsBtn").onclick = ()=>{
  if(!isMasterAdmin()) return alert("Only master admin Cam can delete accounts.");
  if(confirm("Permanently wipe all accounts except Cam?")){
    const camData = accounts[currentUser];
    accounts = { [currentUser]: camData };
    subAdminRoles = {};
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    localStorage.setItem("cardCollectorSubAdmins", JSON.stringify(subAdminRoles));
    refreshAdminPlayerData();
    alert("Purged all player accounts except Cam.");
  }
};

/* Unreleased Content Controls (Master Cam Only) */

function populateRarityDropdowns(){
  const cardRaritySelect = document.getElementById("unreleasedCardRarity");
  const packMinRaritySelect = document.getElementById("unreleasedPackMinRarity");
  if(!cardRaritySelect || !packMinRaritySelect) return;

  const standardRarities = [
    { id: "common", name: "Common", rank: 1 },
    { id: "rare", name: "Rare", rank: 2 },
    { id: "epic", name: "Epic", rank: 3 },
    { id: "legendary", name: "Legendary", rank: 4 },
    { id: "mythic", name: "Mythic", rank: 5 },
    { id: "divine", name: "Divine", rank: 6 }
  ];

  let customList = [];
  if(typeof customRarities === "object"){
    Object.keys(customRarities).forEach(k => {
      customList.push({ id: k, name: customRarities[k].name + " (Custom)", rank: customRarities[k].rank || 7 });
    });
  }

  const allRarities = [...standardRarities, ...customList];

  // Populate Card Rarity select
  const currentCardVal = cardRaritySelect.value || (customList.length ? customList[0].id : "mythic");
  cardRaritySelect.innerHTML = "";
  allRarities.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r.id;
    opt.textContent = `${r.name} [Rank ${r.rank}]`;
    cardRaritySelect.appendChild(opt);
  });
  if(allRarities.some(r => r.id === currentCardVal)){
    cardRaritySelect.value = currentCardVal;
  }

  // Populate Pack Min Rarity select
  const currentPackVal = packMinRaritySelect.value || "rare";
  packMinRaritySelect.innerHTML = `<option value="">None (Pure Odds)</option>`;
  allRarities.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r.id;
    opt.textContent = `Guaranteed ${r.name}`;
    packMinRaritySelect.appendChild(opt);
  });
  if(allRarities.some(r => r.id === currentPackVal)){
    packMinRaritySelect.value = currentPackVal;
  }
}

function renderCustomRaritiesList(){
  const listEl = document.getElementById("customRaritiesList");
  if(!listEl) return;
  listEl.innerHTML = "";

  const keys = Object.keys(customRarities || {});
  if(keys.length === 0){
    listEl.innerHTML = "<div style=\"color:#64748b;font-size:12px;padding:4px\">No custom rarities designed yet.</div>";
    return;
  }

  keys.forEach(k => {
    const r = customRarities[k];
    const badge = document.createElement("div");
    badge.style.cssText = `display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;border:1px solid ${r.border};color:${r.color};background:rgba(0,0,0,0.5);box-shadow:0 0 10px ${r.glow}`;
    badge.innerHTML = `
      <span>✦ ${r.name} (Rank ${r.rank || 7})</span>
      <button type="button" style="background:none;border:none;color:#ef4444;font-size:11px;cursor:pointer;padding:0 2px" onclick="deleteCustomRarity('${k}')" title="Delete Rarity">✕</button>
    `;
    listEl.appendChild(badge);
  });
}

window.deleteCustomRarity = function(rarityId){
  if(!customRarities[rarityId]) return;
  if(!confirm(`Delete custom rarity "${customRarities[rarityId].name}"?`)) return;

  delete customRarities[rarityId];
  delete rarityRank[rarityId];
  localStorage.setItem("cardCollectorCustomRarities", JSON.stringify(customRarities));

  applyCustomRarities();
  populateRarityDropdowns();
  renderCustomRaritiesList();
  render();
};

// Rarity Custom Color & Preview Handlers
const rarityColorInput = document.getElementById("customRarityColor");
const rarityHexInput = document.getElementById("customRarityHex");
const rarityPreviewBox = document.getElementById("customRarityColorPreview");
const rarityPresetSelect = document.getElementById("customRarityPreset");

function updateRarityColorPreview(hex){
  if(!hex || !hex.startsWith("#")) hex = "#ec4899";
  if(rarityColorInput) rarityColorInput.value = hex;
  if(rarityHexInput && rarityHexInput.value !== hex) rarityHexInput.value = hex.toUpperCase();
  if(rarityPreviewBox){
    rarityPreviewBox.style.borderColor = hex;
    rarityPreviewBox.style.color = hex;
    rarityPreviewBox.style.background = `radial-gradient(ellipse at 50% 15%, ${hex}55 0%, #030712 100%)`;
    rarityPreviewBox.style.boxShadow = `0 0 14px ${hex}88`;
  }
}

if(rarityColorInput){
  rarityColorInput.oninput = ()=>{
    updateRarityColorPreview(rarityColorInput.value);
    if(rarityPresetSelect) rarityPresetSelect.value = "custom";
  };
}

if(rarityHexInput){
  rarityHexInput.oninput = ()=>{
    let val = rarityHexInput.value.trim();
    if(!val.startsWith("#")) val = "#" + val;
    if(/^#[0-9a-fA-F]{6}$/.test(val)){
      updateRarityColorPreview(val);
      if(rarityPresetSelect) rarityPresetSelect.value = "custom";
    }
  };
}

if(rarityPresetSelect){
  rarityPresetSelect.onchange = ()=>{
    const p = rarityPresetSelect.value;
    if(p === "prismatic") updateRarityColorPreview("#38bdf8");
    else if(p === "void") updateRarityColorPreview("#f43f5e");
    else if(p === "nebula") updateRarityColorPreview("#c084fc");
    else if(p === "solar") updateRarityColorPreview("#fbbf24");
    else if(p === "cyber") updateRarityColorPreview("#10b981");
  };
}

const createRarityBtn = document.getElementById("createCustomRarityBtn");
if(createRarityBtn){
  createRarityBtn.onclick = ()=>{
    const name = document.getElementById("customRarityName").value.trim();
    const hexVal = (document.getElementById("customRarityHex") ? document.getElementById("customRarityHex").value.trim() : "") || document.getElementById("customRarityColor").value || "#ec4899";
    const customColor = hexVal.startsWith("#") ? hexVal : ("#" + hexVal);
    const preset = document.getElementById("customRarityPreset").value;
    const rank = parseInt(document.getElementById("customRarityRank").value, 10) || 7;

    if(!name) return alert("Please type a name for the new rarity.");

    const rarityId = name.toLowerCase().replace(/[^a-z0-9]/g, "_");

    let color = customColor;
    let border = customColor;
    let bg = `radial-gradient(ellipse at 50% 15%, ${customColor}55 0%, #030712 100%)`;
    let glow = `${customColor}aa`;

    if(preset === "prismatic"){
      color = "#38bdf8";
      border = "#38bdf8";
      bg = "radial-gradient(ellipse at 50% 15%, #0369a1 0%, #1e1b4b 50%, #020617 100%)";
      glow = "rgba(56, 189, 248, 0.8)";
    } else if(preset === "void"){
      color = "#fb7185";
      border = "#f43f5e";
      bg = "radial-gradient(ellipse at 50% 15%, #4c0519 0%, #000000 100%)";
      glow = "rgba(244, 63, 94, 0.8)";
    } else if(preset === "nebula"){
      color = "#f472b6";
      border = "#c084fc";
      bg = "radial-gradient(ellipse at 50% 15%, #581c87 0%, #09090b 100%)";
      glow = "rgba(192, 132, 252, 0.8)";
    } else if(preset === "solar"){
      color = "#fef08a";
      border = "#fbbf24";
      bg = "radial-gradient(ellipse at 50% 15%, #b45309 0%, #1c1917 100%)";
      glow = "rgba(251, 191, 36, 0.85)";
    } else if(preset === "cyber"){
      color = "#6ee7b7";
      border = "#10b981";
      bg = "radial-gradient(ellipse at 50% 15%, #064e3b 0%, #022c22 100%)";
      glow = "rgba(16, 185, 129, 0.85)";
    }

    customRarities[rarityId] = {
      id: rarityId,
      name,
      color,
      border,
      bg,
      glow,
      rank
    };

    localStorage.setItem("cardCollectorCustomRarities", JSON.stringify(customRarities));
    applyCustomRarities();
    populateRarityDropdowns();
    renderCustomRaritiesList();

    document.getElementById("customRarityName").value = "";
    alert(`Created custom rarity "${name}" with color ${color} (Rank ${rank})!`);
  };
}

function renderUnreleasedAdminUI(){
  const cardListEl = document.getElementById("unreleasedCardsList");
  const packListEl = document.getElementById("unreleasedPacksList");
  const binderCheck = document.getElementById("toggleShowUnreleasedInBinderCheck");

  if(binderCheck){
    binderCheck.checked = (localStorage.getItem("cardCollectorShowUnreleasedInBinder") === "true");
    binderCheck.onchange = ()=>{
      localStorage.setItem("cardCollectorShowUnreleasedInBinder", binderCheck.checked ? "true" : "false");
      render();
    };
  }

  populateRarityDropdowns();
  renderCustomRaritiesList();

  if(!cardListEl || !packListEl) return;

  // 1. Render Unreleased Cards List
  cardListEl.innerHTML = "";
  if(!Array.isArray(unreleasedCards) || unreleasedCards.length === 0){
    cardListEl.innerHTML = "<div style=\"color:#64748b;font-size:12px;padding:8px\">No private cards created yet.</div>";
  } else {
    unreleasedCards.forEach((c, idx) => {
      const cardId = c.id || c.name;
      const isOwnedByCam = !!(currentUser && accounts[currentUser] && accounts[currentUser].unreleasedOwned && accounts[currentUser].unreleasedOwned.includes(cardId));
      
      const item = document.createElement("div");
      item.style.cssText = "display:flex;align-items:center;justify-content:space-between;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.1);padding:10px 12px;border-radius:12px";
      item.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px">
          <img src="${c.image}" style="width:36px;height:48px;border-radius:6px;object-fit:cover;border:1px solid rgba(255,255,255,0.15)">
          <div>
            <div style="font-size:13px;font-weight:700;color:#f1f5f9">${c.name} <span style="font-size:10px;text-transform:uppercase;color:#f43f5e;font-weight:800;background:rgba(244,63,94,0.15);padding:1px 5px;border-radius:4px">${c.rarity}</span></div>
            <div style="font-size:11px;color:#94a3b8">${c.hp} HP • ${c.attacks ? c.attacks.map(a => a.name + " (" + a.dmg + ")").join(", ") : ""}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px">
          <button type="button" class="accountBtn" style="padding:5px 9px;font-size:11px;background:${isOwnedByCam ? "rgba(16,185,129,0.2)" : "rgba(56,189,248,0.2)"};border-color:${isOwnedByCam ? "#10b981" : "#38bdf8"};color:${isOwnedByCam ? "#6ee7b7" : "#38bdf8"}" onclick="toggleUnreleasedCardOwnership('${cardId}')">
            ${isOwnedByCam ? "✓ In Vault" : "+ Add to Vault"}
          </button>
          <button type="button" class="accountBtn" style="padding:5px 8px;font-size:11px;background:rgba(239,68,68,0.2);border-color:#ef4444;color:#fca5a5" onclick="deleteUnreleasedCard(${idx})">
            ✕
          </button>
        </div>
      `;
      cardListEl.appendChild(item);
    });
  }

  // 2. Render Unreleased Packs List
  packListEl.innerHTML = "";
  const packKeys = Object.keys(unreleasedPacks || {});
  if(packKeys.length === 0){
    packListEl.innerHTML = "<div style=\"color:#64748b;font-size:12px;padding:8px;grid-column:1/-1\">No private packs created yet.</div>";
  } else {
    packKeys.forEach(k => {
      const p = unreleasedPacks[k];
      const actualCost = getActualPackCost(p.baseCost);
      const item = document.createElement("div");
      item.style.cssText = `background:rgba(0,0,0,0.4);border:1.5px solid ${p.border || "#f43f5e"};padding:12px 14px;border-radius:14px;display:flex;flex-direction:column;justify-content:space-between;gap:10px;box-shadow:0 8px 24px rgba(0,0,0,0.4)`;
      item.innerHTML = `
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:22px">${p.icon || "🔒"}</span>
            <span style="font-size:11px;font-weight:800;color:#fda4af;background:rgba(244,63,94,0.2);padding:2px 8px;border-radius:12px">${p.count} Cards</span>
          </div>
          <div style="font-size:14px;font-weight:800;color:#fb7185;margin-top:6px">${p.name}</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px">${p.desc || ""}</div>
          <div style="font-size:11px;color:#cbd5e1;margin-top:6px"><b>Drop Mode:</b> ${p.dropMode || "unreleased"}</div>
        </div>
        <div style="display:flex;gap:6px;margin-top:4px">
          <button type="button" class="accountBtn" style="flex:1;padding:7px;font-size:12px;background:linear-gradient(135deg,#f43f5e,#be123c);border:none;color:#fff;font-weight:800" onclick="document.getElementById('adminModal').classList.remove('show'); startPackOpening('${k}');">
            ✨ Open • ${actualCost} 🪙
          </button>
          <button type="button" class="accountBtn" style="padding:7px 10px;font-size:11px;background:rgba(239,68,68,0.2);border-color:#ef4444;color:#fca5a5" onclick="deleteUnreleasedPack('${k}')">
            ✕
          </button>
        </div>
      `;
      packListEl.appendChild(item);
    });
  }
}

window.toggleUnreleasedCardOwnership = function(cardId){
  if(!currentUser || !accounts[currentUser]) return;
  if(!accounts[currentUser].unreleasedOwned) accounts[currentUser].unreleasedOwned = [];
  const ownedList = accounts[currentUser].unreleasedOwned;
  const pos = ownedList.indexOf(cardId);
  if(pos > -1){
    ownedList.splice(pos, 1);
  } else {
    ownedList.push(cardId);
  }
  localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
  render();
  renderUnreleasedAdminUI();
};

window.deleteUnreleasedCard = function(idx){
  if(idx < 0 || idx >= unreleasedCards.length) return;
  const cardToDelete = unreleasedCards[idx];
  if(!confirm(`Delete private card "${cardToDelete.name}"?`)) return;

  const cardId = cardToDelete.id || cardToDelete.name;
  unreleasedCards.splice(idx, 1);
  localStorage.setItem("cardCollectorUnreleasedCards", JSON.stringify(unreleasedCards));

  Object.keys(accounts).forEach(u => {
    if(accounts[u] && accounts[u].unreleasedOwned){
      accounts[u].unreleasedOwned = accounts[u].unreleasedOwned.filter(id => id !== cardId);
    }
  });
  localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));

  render();
  renderUnreleasedAdminUI();
};

window.deleteUnreleasedPack = function(packKey){
  if(!unreleasedPacks[packKey]) return;
  if(!confirm(`Delete unreleased pack "${unreleasedPacks[packKey].name}"?`)) return;

  delete unreleasedPacks[packKey];
  delete packTiers[packKey];
  localStorage.setItem("cardCollectorUnreleasedPacks", JSON.stringify(unreleasedPacks));

  renderUnreleasedAdminUI();
};

const createCardBtn = document.getElementById("createUnreleasedCardBtn");
if(createCardBtn){
  createCardBtn.onclick = ()=>{
    const name = document.getElementById("unreleasedCardName").value.trim();
    const rarity = document.getElementById("unreleasedCardRarity").value;
    const hp = parseInt(document.getElementById("unreleasedCardHp").value, 10) || 180;
    const atk1Name = document.getElementById("unreleasedCardAtk1Name").value.trim() || "Void Strike";
    const atk1Dmg = parseInt(document.getElementById("unreleasedCardAtk1Dmg").value, 10) || 45;
    const atk2Name = document.getElementById("unreleasedCardAtk2Name").value.trim() || "Cataclysm";
    const atk2Dmg = parseInt(document.getElementById("unreleasedCardAtk2Dmg").value, 10) || 85;
    const emoji = document.getElementById("unreleasedCardEmoji").value.trim() || "🗝️";
    const theme = document.getElementById("unreleasedCardTheme").value;
    const desc = document.getElementById("unreleasedCardDesc").value.trim() || "A classified unreleased prototype card.";

    if(!name) return alert("Please specify card name.");

    let c1 = "#4c0519", c2 = "#0f172a", textC = "#fda4af", glowC = "rgba(244, 63, 94, 0.6)";
    if(theme === "glitch"){ c1 = "#064e3b"; c2 = "#022c22"; textC = "#6ee7b7"; glowC = "rgba(16, 185, 129, 0.6)"; }
    else if(theme === "abyss"){ c1 = "#1e1b4b"; c2 = "#09090b"; textC = "#c084fc"; glowC = "rgba(168, 85, 247, 0.6)"; }
    else if(theme === "celestial"){ c1 = "#78350f"; c2 = "#1c0901"; textC = "#fde047"; glowC = "rgba(250, 204, 21, 0.6)"; }
    else if(theme === "emerald"){ c1 = "#065f46"; c2 = "#022c22"; textC = "#a7f3d0"; glowC = "rgba(52, 211, 153, 0.6)"; }

    const image = makeSvgArt(c1, c2, emoji, textC, glowC);

    const newCard = {
      id: "unreleased_" + Date.now(),
      name,
      rarity,
      hp,
      attacks: [
        { name: atk1Name, dmg: atk1Dmg },
        { name: atk2Name, dmg: atk2Dmg }
      ],
      desc,
      image,
      isUnreleased: true
    };

    unreleasedCards.push(newCard);
    localStorage.setItem("cardCollectorUnreleasedCards", JSON.stringify(unreleasedCards));

    render();
    renderUnreleasedAdminUI();

    document.getElementById("unreleasedCardName").value = "";
    document.getElementById("unreleasedCardDesc").value = "";
    alert(`Created unreleased card "${name}" with rarity "${rarity}"!`);
  };
}

const createPackBtn = document.getElementById("createUnreleasedPackBtn");
if(createPackBtn){
  createPackBtn.onclick = ()=>{
    const name = document.getElementById("unreleasedPackName").value.trim();
    const cost = parseInt(document.getElementById("unreleasedPackCost").value, 10) || 100;
    const count = parseInt(document.getElementById("unreleasedPackCardCount").value, 10) || 5;
    const icon = document.getElementById("unreleasedPackIcon").value.trim() || "🔒";
    const visual = document.getElementById("unreleasedPackVisual").value;
    const minRarity = document.getElementById("unreleasedPackMinRarity").value || null;
    const dropMode = document.getElementById("unreleasedPackDropMode").value;
    const desc = document.getElementById("unreleasedPackDesc").value.trim() || "Experimental booster pack.";

    if(!name) return alert("Please specify pack name.");

    let bg = "radial-gradient(circle, #881337, #0f172a)";
    let border = "#f43f5e";
    if(visual === "violet"){ bg = "radial-gradient(circle, #581c87, #0f172a)"; border = "#a855f7"; }
    else if(visual === "gold"){ bg = "radial-gradient(circle, #78350f, #1c0901)"; border = "#f59e0b"; }
    else if(visual === "cyber"){ bg = "radial-gradient(circle, #065f46, #022c22)"; border = "#10b981"; }
    else if(visual === "prismatic"){ bg = "radial-gradient(circle, #0284c7, #1e1b4b)"; border = "#38bdf8"; }

    const packId = "unreleased_pack_" + Date.now();
    const newPack = {
      id: packId,
      name,
      baseCost: cost,
      count,
      icon,
      bg,
      border,
      weights: { common: 0, rare: 10, epic: 25, legendary: 35, mythic: 20, divine: 10 },
      minRarity,
      dropMode,
      isUnreleased: true,
      desc
    };

    unreleasedPacks[packId] = newPack;
    packTiers[packId] = newPack;
    localStorage.setItem("cardCollectorUnreleasedPacks", JSON.stringify(unreleasedPacks));

    renderUnreleasedAdminUI();

    document.getElementById("unreleasedPackName").value = "";
    alert(`Created booster pack "${name}"!`);
  };
}
