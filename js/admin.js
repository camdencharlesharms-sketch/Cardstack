




function getSubAdminRole(username){
  if(!username) return null;
  const targetLower = username.toLowerCase();
  const match = Object.keys(subAdminRoles).find(k => k.toLowerCase() === targetLower);
  return match ? subAdminRoles[match] : null;
}

function isMasterAdmin(){
  return !!(currentUser && currentUser.toLowerCase() === ADMIN_USERNAME.toLowerCase());
}
function isSubAdmin(){
  if(!currentUser) return false;
  const role = getSubAdminRole(currentUser);
  return !!(role && role.active);
}
function hasAdminAccess(){
  return isMasterAdmin() || isSubAdmin();
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
  renderGiftingCardSelect();
}

function renderGiftingCardSelect(){
  const giftCardSelect = document.getElementById("giftCardSelect");
  const bundleCardSelect = document.getElementById("giftBundleCardSelect");
  const codeCardSelect = document.getElementById("giftCodeCardSelect");
  if(!giftCardSelect) return;

  giftCardSelect.innerHTML = '<option value="">Select Card to Gift...</option>';
  if(bundleCardSelect) bundleCardSelect.innerHTML = '<option value="">(None in Bundle)</option>';
  if(codeCardSelect) codeCardSelect.innerHTML = '<option value="">(None in Code)</option>';

  const isSub = isSubAdmin() && !isMasterAdmin();
  const role = isSub ? getSubAdminRole(currentUser) : null;

  cards.forEach((c, idx) => {
    const isAllowed = !isSub || (role && role.canGiftSkins && role.allowedSkinIds && role.allowedSkinIds.includes(idx));
    
    if(isAllowed){
      const opt = document.createElement("option");
      opt.value = idx;
      opt.textContent = `${c.name} (${c.rarity.toUpperCase()}) - ${c.hp || 80} HP`;
      giftCardSelect.appendChild(opt);

      if(bundleCardSelect){
        const optB = document.createElement("option");
        optB.value = idx;
        optB.textContent = `${c.name} (${c.rarity})`;
        bundleCardSelect.appendChild(optB);
      }
    }

    if(codeCardSelect){
      const optC = document.createElement("option");
      optC.value = idx;
      optC.textContent = `${c.name} (${c.rarity})`;
      codeCardSelect.appendChild(optC);
    }
  });

  if(isSub && role && !role.canGiftSkins){
    giftCardSelect.innerHTML = '<option value="">(Card Gifting Disabled for Sub-Admin Role)</option>';
  }
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
  const giftTargetSelect = document.getElementById("giftTargetSelect");
  const tableBody = document.getElementById("playerTableBody");

  playerSelect.innerHTML = '<option value="">Select Target Player...</option>';
  subAdminSelect.innerHTML = '<option value="">Select Player...</option>';
  ecoPlayerSelect.innerHTML = '<option value="">Select Target Player...</option>';
  if(giftTargetSelect) giftTargetSelect.innerHTML = '<option value="">Select Registered Player...</option>';
  tableBody.innerHTML = "";

  const allNames = Object.keys(accounts);
  if(allNames.length === 0){
    tableBody.innerHTML = '<tr><td colspan="5" style="color:#64748b;padding:8px">No registered player accounts.</td></tr>';
  } else {
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

      // Gifting Station Target selector
      if(giftTargetSelect){
        const giftOpt = document.createElement("option");
        giftOpt.value = name;
        giftOpt.textContent = name + (isCurrent ? " (You)" : "");
        giftTargetSelect.appendChild(giftOpt);
      }

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
  }

  renderSubAdminRolesList();
  renderGiftingCardSelect();
  renderActiveGiftCodes();
  renderGiftLog();
  updateSubAdminBudgetBadge();
}

function updateSubAdminBudgetBadge(){
  const badge = document.getElementById("subAdminGiftingBudgetBadge");
  if(!badge) return;
  const isSub = isSubAdmin() && !isMasterAdmin();
  if(!isSub){
    badge.style.display = "none";
    return;
  }
  const role = getSubAdminRole(currentUser);
  if(!role){
    badge.style.display = "none";
    return;
  }
  const today = new Date().toDateString();
  if(role.lastGiftDate !== today){
    role.lastGiftDate = today;
    role.giftedToday = 0;
    localStorage.setItem("cardCollectorSubAdmins", JSON.stringify(subAdminRoles));
  }
  const rem = Math.max(0, (role.dailyCap || 0) - (role.giftedToday || 0));
  badge.style.display = "inline-block";
  badge.textContent = `Daily Budget: ${role.giftedToday || 0} / ${role.dailyCap || 0} (Left: ${rem} 🪙)`;
}

function renderActiveGiftCodes(){
  const listEl = document.getElementById("activeGiftCodesList");
  if(!listEl) return;
  listEl.innerHTML = "";
  const codeKeys = Object.keys(giftCodes);
  if(codeKeys.length === 0){
    listEl.innerHTML = '<span style="font-size:12px;color:#64748b">No active gift codes generated yet.</span>';
    return;
  }

  codeKeys.forEach(code => {
    const data = giftCodes[code];
    const usedCount = (data.usedBy || []).length;
    const maxUses = data.maxUses || 1;
    let rewardParts = [];
    if(data.coins) rewardParts.push(`${data.coins}🪙`);
    if(data.cardIdx !== null && data.cardIdx !== undefined && cards[data.cardIdx]) rewardParts.push(cards[data.cardIdx].name);
    if(data.packTier) rewardParts.push(`${packTiers[data.packTier] ? packTiers[data.packTier].name : data.packTier} Pack`);

    const div = document.createElement("div");
    div.style = "background:rgba(0,0,0,0.3);padding:6px 10px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;font-size:12px;border:1px solid rgba(255,255,255,0.06)";
    div.innerHTML = `
      <div>
        <b style="color:#38bdf8;letter-spacing:1px">${code}</b>: ${rewardParts.join(", ")}
        <span style="color:#94a3b8;font-size:11px">(${usedCount}/${maxUses} claims)</span>
      </div>
      <div style="display:flex;gap:4px">
        <button class="accountBtn" style="padding:2px 6px;font-size:10px" onclick="navigator.clipboard.writeText('${code}');alert('Copied code ${code} to clipboard!')">Copy</button>
        <button class="accountBtn" style="padding:2px 6px;font-size:10px;color:#f87171" onclick="deleteGiftCode('${code}')">✕</button>
      </div>
    `;
    listEl.appendChild(div);
  });
}

window.deleteGiftCode = function(code){
  if(confirm(`Revoke gift voucher code "${code}"?`)){
    delete giftCodes[code];
    localStorage.setItem("cardCollectorGiftCodes", JSON.stringify(giftCodes));
    renderActiveGiftCodes();
  }
};

function renderGiftLog(){
  const tbody = document.getElementById("giftLogTableBody");
  if(!tbody) return;
  tbody.innerHTML = "";
  if(!giftLog || giftLog.length === 0){
    tbody.innerHTML = '<tr><td colspan="5" style="color:#64748b;padding:8px">No gift records found.</td></tr>';
    return;
  }

  giftLog.slice(0, 15).forEach(item => {
    let summaryParts = [];
    if(item.coins) summaryParts.push(`${item.coins.toLocaleString()} 🪙`);
    if(item.cardIdx !== null && item.cardIdx !== undefined && cards[item.cardIdx]) summaryParts.push(cards[item.cardIdx].name);
    if(item.packTier) summaryParts.push(`${item.packCount || 1}x ${item.packTier}`);

    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
    tr.innerHTML = `
      <td style="padding:4px"><b>${item.to}</b></td>
      <td style="color:#fbbf24">${summaryParts.join(" + ")}</td>
      <td style="color:#38bdf8">${item.from || "Admin"}</td>
      <td style="color:#94a3b8;font-size:11px">${item.date || "Recent"}</td>
      <td><span style="color:${item.claimed ? '#4ade80' : '#f59e0b'};font-size:11px">${item.claimed ? 'Claimed' : 'Pending'}</span></td>
    `;
    tbody.appendChild(tr);
  });
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
        <div style="font-size:11px;color:#94a3b8">Can Gift Cards: <b>${role.canGiftSkins ? 'Yes' : 'No'}</b> (${(role.allowedSkinIds || []).length} allowed) | Can Gift Packs: <b>${role.canGiftPacks !== false ? 'Yes' : 'No'}</b></div>
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
  const canGiftPacks = document.getElementById("subAdminAllowPacksCheck") ? document.getElementById("subAdminAllowPacksCheck").checked : true;

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
    canGiftPacks: canGiftPacks,
    allowedSkinIds: allowedSkinIds
  };

  localStorage.setItem("cardCollectorSubAdmins", JSON.stringify(subAdminRoles));
  refreshAdminPlayerData();
  alert(`Granted Sub-Admin privileges to ${target}!`);
};

window.revokeSubAdminRole = function(user){
  if(!isMasterAdmin()) return alert("Only Cam can revoke sub-admin roles.");
  if(confirm(`Revoke admin privileges from ${user}?`)){
    const match = Object.keys(subAdminRoles).find(k => k.toLowerCase() === user.toLowerCase());
    if(match) delete subAdminRoles[match];
    else delete subAdminRoles[user];
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
    const role = getSubAdminRole(currentUser);
    if(!role || !role.canGiftSkins){
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

    const giftItem = {
      id: "gift_" + Date.now(),
      from: currentUser || "Admin",
      to: target,
      coins: 0,
      cardIdx: idx,
      packTier: null,
      packCount: 0,
      note: "Granted via Player Manager",
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
      claimed: target.toLowerCase() === currentUser.toLowerCase()
    };
    const targetKey = target.toLowerCase();
    if(!giftsInbox[targetKey]) giftsInbox[targetKey] = [];
    giftsInbox[targetKey].push(giftItem);
    localStorage.setItem("cardCollectorGifts", JSON.stringify(giftsInbox));

    giftLog.unshift(giftItem);
    if(giftLog.length > 50) giftLog.pop();
    localStorage.setItem("cardCollectorGiftLog", JSON.stringify(giftLog));

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
    const role = getSubAdminRole(currentUser);
    if(!role) return alert("Sub-admin role not found.");
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

  const giftItem = {
    id: "gift_" + Date.now(),
    from: currentUser || "Admin",
    to: target,
    coins: amt,
    cardIdx: null,
    packTier: null,
    packCount: 0,
    note: "Treasury Deposit",
    date: new Date().toLocaleDateString(),
    timestamp: Date.now(),
    claimed: target.toLowerCase() === currentUser.toLowerCase()
  };
  const targetKey = target.toLowerCase();
  if(!giftsInbox[targetKey]) giftsInbox[targetKey] = [];
  giftsInbox[targetKey].push(giftItem);
  localStorage.setItem("cardCollectorGifts", JSON.stringify(giftsInbox));

  giftLog.unshift(giftItem);
  if(giftLog.length > 50) giftLog.pop();
  localStorage.setItem("cardCollectorGiftLog", JSON.stringify(giftLog));

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

/* Gifting Station Controls & Dispatcher */
document.querySelectorAll("#giftTypePills button").forEach(btn => {
  btn.onclick = ()=>{
    document.querySelectorAll("#giftTypePills button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const type = btn.getAttribute("data-gifttype");
    document.getElementById("giftCardSection").style.display = type === "card" ? "block" : "none";
    document.getElementById("giftCoinsSection").style.display = type === "coins" ? "block" : "none";
    document.getElementById("giftPackSection").style.display = type === "pack" ? "block" : "none";
    document.getElementById("giftBundleSection").style.display = type === "bundle" ? "flex" : "none";
  };
});

document.getElementById("giftToggleCustomUserBtn").onclick = ()=>{
  const customInput = document.getElementById("giftTargetCustomInput");
  const selectBox = document.getElementById("giftTargetSelect");
  const isCustom = customInput.style.display !== "none";
  if(isCustom){
    customInput.style.display = "none";
    selectBox.style.display = "block";
    document.getElementById("giftToggleCustomUserBtn").textContent = "Type Username";
  } else {
    customInput.style.display = "block";
    selectBox.style.display = "none";
    document.getElementById("giftToggleCustomUserBtn").textContent = "Select Player";
  }
};

document.getElementById("adminSendGiftBtn").onclick = sendAdminGift;

function sendAdminGift(){
  if(!hasAdminAccess()) return alert("Permission Denied: Admin access required.");

  let target = "";
  const customInput = document.getElementById("giftTargetCustomInput");
  const selectBox = document.getElementById("giftTargetSelect");

  if(customInput.style.display !== "none" && customInput.value.trim()){
    target = customInput.value.trim();
  } else {
    target = selectBox.value;
  }

  if(!target){
    return alert("Please select a registered player or enter a recipient username.");
  }

  const activeTypeBtn = document.querySelector("#giftTypePills .admin-tab-btn.active");
  const giftType = activeTypeBtn ? activeTypeBtn.getAttribute("data-gifttype") : "card";

  let coinsAmt = 0;
  let cardIdx = null;
  let packTier = null;
  let packCount = 0;
  const note = document.getElementById("giftNoteInput").value.trim();

  const isSub = isSubAdmin() && !isMasterAdmin();
  const role = isSub ? getSubAdminRole(currentUser) : null;

  if(giftType === "card"){
    const val = document.getElementById("giftCardSelect").value;
    if(val === "" || isNaN(parseInt(val, 10))){
      return alert("Please select a valid card to gift.");
    }
    cardIdx = parseInt(val, 10);

    if(isSub){
      if(!role || !role.canGiftSkins){
        return alert("Permission Denied: Your sub-admin role is not authorized to gift cards.");
      }
      if(!role.allowedSkinIds || !role.allowedSkinIds.includes(cardIdx)){
        return alert(`Permission Denied: You are not authorized to gift the card "${cards[cardIdx].name}".`);
      }
    }
  } else if(giftType === "coins"){
    coinsAmt = parseInt(document.getElementById("giftCoinsAmount").value, 10);
    if(isNaN(coinsAmt) || coinsAmt <= 0){
      return alert("Enter a valid positive number of coins.");
    }

    if(isSub){
      if(!role) return alert("Sub-admin role not found.");
      const today = new Date().toDateString();
      if(role.lastGiftDate !== today){
        role.lastGiftDate = today;
        role.giftedToday = 0;
      }
      if((role.giftedToday + coinsAmt) > (role.dailyCap || 0)){
        const rem = Math.max(0, (role.dailyCap || 0) - role.giftedToday);
        return alert(`Daily Limit Exceeded: You can only gift ${rem} more coins today (Daily Cap: ${role.dailyCap || 0}).`);
      }
      role.giftedToday += coinsAmt;
      localStorage.setItem("cardCollectorSubAdmins", JSON.stringify(subAdminRoles));
    }
  } else if(giftType === "pack"){
    if(isSub && role && role.canGiftPacks === false){
      return alert("Permission Denied: Your sub-admin role is not authorized to gift booster packs.");
    }
    packTier = document.getElementById("giftPackTierSelect").value;
    packCount = parseInt(document.getElementById("giftPackQuantity").value, 10) || 1;
  } else if(giftType === "bundle"){
    coinsAmt = parseInt(document.getElementById("giftBundleCoins").value, 10) || 0;
    const cardVal = document.getElementById("giftBundleCardSelect").value;
    if(cardVal !== "" && !isNaN(parseInt(cardVal, 10))){
      cardIdx = parseInt(cardVal, 10);
    }
    const packVal = document.getElementById("giftBundlePackSelect").value;
    if(packVal && packVal !== "none"){
      packTier = packVal;
      packCount = 1;
    }

    if(coinsAmt === 0 && cardIdx === null && !packTier){
      return alert("Please configure at least one component (coins, card, or pack) in the bundle.");
    }

    if(isSub){
      if(coinsAmt > 0){
        const today = new Date().toDateString();
        if(role.lastGiftDate !== today){
          role.lastGiftDate = today;
          role.giftedToday = 0;
        }
        if((role.giftedToday + coinsAmt) > (role.dailyCap || 0)){
          const rem = Math.max(0, (role.dailyCap || 0) - role.giftedToday);
          return alert(`Daily Limit Exceeded: You can only gift ${rem} more coins today.`);
        }
        role.giftedToday += coinsAmt;
        localStorage.setItem("cardCollectorSubAdmins", JSON.stringify(subAdminRoles));
      }
      if(cardIdx !== null){
        if(!role.canGiftSkins || !role.allowedSkinIds || !role.allowedSkinIds.includes(cardIdx)){
          return alert("Permission Denied: You cannot gift this card.");
        }
      }
      if(packTier && role.canGiftPacks === false){
        return alert("Permission Denied: You cannot gift booster packs.");
      }
    }
  }

  const giftItem = {
    id: "gift_" + Date.now() + "_" + Math.floor(Math.random()*1000),
    from: currentUser || "Admin",
    to: target,
    coins: coinsAmt,
    cardIdx: cardIdx,
    packTier: packTier,
    packCount: packCount,
    note: note,
    date: new Date().toLocaleDateString(),
    timestamp: Date.now(),
    claimed: false
  };

  const targetKey = target.toLowerCase();
  if(!giftsInbox[targetKey]) giftsInbox[targetKey] = [];
  giftsInbox[targetKey].push(giftItem);
  localStorage.setItem("cardCollectorGifts", JSON.stringify(giftsInbox));

  giftLog.unshift(giftItem);
  if(giftLog.length > 50) giftLog.pop();
  localStorage.setItem("cardCollectorGiftLog", JSON.stringify(giftLog));

  document.getElementById("giftNoteInput").value = "";
  if(customInput.style.display !== "none"){
    customInput.value = "";
  }

  refreshAdminPlayerData();

  if(currentUser && target.toLowerCase() === currentUser.toLowerCase()){
    checkUserGiftsInbox();
  }

  let desc = [];
  if(coinsAmt > 0) desc.push(`${coinsAmt.toLocaleString()} Coins 🪙`);
  if(cardIdx !== null) desc.push(`Card "${cards[cardIdx].name}" 🃏`);
  if(packTier) desc.push(`${packCount}x ${packTiers[packTier] ? packTiers[packTier].name : packTier} 📦`);

  alert(`🎁 Gift successfully dispatched to ${target}!\nContents: ${desc.join(", ")}`);
}

document.getElementById("giftCodeRandomBtn").onclick = ()=>{
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomCode = "GIFT";
  for(let i=0; i<4; i++){
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  document.getElementById("giftCodeCustomInput").value = randomCode;
};

document.getElementById("adminGenerateCodeBtn").onclick = ()=>{
  if(!hasAdminAccess()) return alert("Admin privileges required.");
  let code = document.getElementById("giftCodeCustomInput").value.trim().toUpperCase();
  if(!code){
    document.getElementById("giftCodeRandomBtn").click();
    code = document.getElementById("giftCodeCustomInput").value.trim().toUpperCase();
  }
  const coins = parseInt(document.getElementById("giftCodeCoinsInput").value, 10) || 0;
  const maxUses = parseInt(document.getElementById("giftCodeMaxUses").value, 10) || 1;
  const cardVal = document.getElementById("giftCodeCardSelect").value;
  const cardIdx = (cardVal !== "" && !isNaN(parseInt(cardVal, 10))) ? parseInt(cardVal, 10) : null;
  const packTier = document.getElementById("giftCodePackSelect").value || null;

  if(coins <= 0 && cardIdx === null && !packTier){
    return alert("Voucher code must include at least one reward (coins, card, or pack).");
  }

  giftCodes[code] = {
    coins,
    cardIdx,
    packTier,
    packCount: packTier ? 1 : 0,
    maxUses,
    createdBy: currentUser,
    createdAt: new Date().toLocaleDateString(),
    usedBy: []
  };

  localStorage.setItem("cardCollectorGiftCodes", JSON.stringify(giftCodes));
  renderActiveGiftCodes();
  document.getElementById("giftCodeCustomInput").value = "";
  alert(`🎟️ Gift Voucher Code "${code}" created successfully!\nShare this code with players so they can redeem rewards.`);
};

document.getElementById("clearGiftLogBtn").onclick = ()=>{
  if(confirm("Clear gifting audit log?")){
    giftLog = [];
    localStorage.removeItem("cardCollectorGiftLog");
    renderGiftLog();
  }
};
