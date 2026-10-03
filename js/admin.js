
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
