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
  if(!select) return;
  const prevVal = select.value;
  select.innerHTML = '<option value="">Select Card to Grant / Edit...</option>';

  const isSub = (typeof isSubAdmin === "function" && isSubAdmin()) && !(typeof isMasterAdmin === "function" && isMasterAdmin());
  const subRole = isSub ? ((typeof getSubAdminRole === "function") ? getSubAdminRole(currentUser) : subAdminRoles[currentUser]) : null;

  const publicGroup = document.createElement("optgroup");
  publicGroup.label = "✨ Public & Studio Cards (Drop in Packs)";
  let allowedCount = 0;
  cards.forEach((c, idx) => {
    if(isSub){
      if(!subRole || !subRole.canGiftSkins) return;
      if(subRole.allowedSkinIds && subRole.allowedSkinIds.length > 0 && !subRole.allowedSkinIds.some(id => parseInt(id, 10) === idx)){
        return;
      }
    }
    allowedCount++;
    const opt = document.createElement("option");
    opt.value = idx.toString();
    const atkNames = (c.attacks || []).map(a => `${a.name} (${a.dmg})`).join(" / ");
    opt.textContent = `${c.name} (${c.rarity}) - ATK: ${atkNames}`;
    publicGroup.appendChild(opt);
  });

  if(isSub && allowedCount === 0){
    const opt = document.createElement("option");
    opt.value = "";
    opt.disabled = true;
    opt.textContent = (subRole && !subRole.canGiftSkins) ? "(Skin gifting disabled for your role)" : "(No skins currently assigned to your role)";
    publicGroup.appendChild(opt);
  }
  select.appendChild(publicGroup);

  if((typeof isMasterAdmin === "function" && isMasterAdmin()) && Array.isArray(unreleasedCards) && unreleasedCards.length > 0){
    const vaultGroup = document.createElement("optgroup");
    vaultGroup.label = "🔒 Unreleased Vault Cards (Gift Only - Never In Packs)";
    unreleasedCards.forEach((c) => {
      const opt = document.createElement("option");
      const cId = c.id || c.name;
      opt.value = "vault_" + cId;
      const atkNames = (c.attacks || []).map(a => `${a.name} (${a.dmg})`).join(" / ");
      opt.textContent = `🔒 [Vault Gift] ${c.name} (${c.rarity}) - ATK: ${atkNames}`;
      vaultGroup.appendChild(opt);
    });
    select.appendChild(vaultGroup);
  }

  const totalEl = document.getElementById("totalCardsCount");
  if(totalEl) totalEl.textContent = cards.length;
  if(prevVal && Array.from(select.options).some(o => o.value === prevVal)){
    select.value = prevVal;
  }
  if(typeof isMasterAdmin === "function" && isMasterAdmin()){
    renderSubAdminSkinChecklist();
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

function isAccountOnline(name){
  if(!name) return false;
  if(currentUser && currentUser.toLowerCase() === name.toLowerCase()) return true;
  if(name.toLowerCase() === ADMIN_USERNAME.toLowerCase() && isMasterAdmin()) return true;
  const data = accounts[name];
  if(!data) return false;
  return (Date.now() - (data.lastActive || 0)) < 75000;
}

function getAccountOnlineState(name){
  if(!name) return { status: "offline", label: "Offline", color: "#64748b" };
  const isCurrent = currentUser && currentUser.toLowerCase() === name.toLowerCase();
  if(isCurrent) return { status: "online", label: "Online Now", color: "#4ade80" };
  const data = accounts[name];
  if(!data || !data.lastActive) return { status: "offline", label: "Offline", color: "#64748b" };
  const diffSec = Math.floor((Date.now() - data.lastActive) / 1000);
  if(diffSec < 75) return { status: "online", label: "Online Now", color: "#4ade80" };
  if(diffSec < 300) return { status: "away", label: `${Math.floor(diffSec/60)}m ago`, color: "#fbbf24" };
  if(diffSec < 3600) return { status: "offline", label: `${Math.floor(diffSec/60)}m ago`, color: "#94a3b8" };
  return { status: "offline", label: `${Math.floor(diffSec/3600)}h ago`, color: "#64748b" };
}

function selectPlayerInAllAdminDropdowns(name){
  const skinSel = document.getElementById("skinPlayerSelect");
  const ecoSel = document.getElementById("economyPlayerSelect");
  const subSel = document.getElementById("subAdminTargetSelect");
  const skinInput = document.getElementById("skinPlayerInput");
  const ecoInput = document.getElementById("economyPlayerInput");
  const subInput = document.getElementById("subAdminCustomPlayerInput");

  if(skinSel) skinSel.value = name;
  if(ecoSel) ecoSel.value = name;
  if(subSel) subSel.value = name;
  if(skinInput) skinInput.value = name;
  if(ecoInput) ecoInput.value = name;
  if(subInput) subInput.value = name;

  // Flash highlight target inputs for visual confirmation
  [skinInput, ecoInput, subInput].forEach(inp => {
    if(inp){
      inp.style.borderColor = "#10b981";
      inp.style.boxShadow = "0 0 10px rgba(16,185,129,0.5)";
      setTimeout(()=>{
        inp.style.borderColor = "";
        inp.style.boxShadow = "";
      }, 1000);
    }
  });
}

function isValidGameAccount(name, data){
  if(!name || typeof name !== "string") return false;
  const n = name.trim();
  // Filter out any made-up bot names
  const fakeNames = ["Alex", "Jordan", "Elena", "Kai", "Morgan", "Sam", "Taylor", "Riley", "Aria", "Leo", "Zane", "Maya", "Finn", "Chloe", "Noah", "Liam", "Sophia"];
  if(fakeNames.map(f => f.toLowerCase()).includes(n.toLowerCase())) return false;

  // Master admin Cam is always valid
  if(n.toLowerCase() === ADMIN_USERNAME.toLowerCase()) return true;

  // Current session user is always valid
  if(currentUser && currentUser.toLowerCase() === n.toLowerCase()) return true;

  // Online account is valid
  if(isAccountOnline(n)) return true;

  // Must have played the game before
  if(data && (data.hasPlayed === true || (Array.isArray(data.owned) && data.owned.length > 0) || (data.lastActive && data.lastActive > 0))){
    return true;
  }

  return false;
}

function refreshAdminPlayerData(){
  const playerSelect = document.getElementById("skinPlayerSelect");
  const subAdminSelect = document.getElementById("subAdminTargetSelect");
  const ecoPlayerSelect = document.getElementById("economyPlayerSelect");
  const tableBody = document.getElementById("playerTableBody");
  const onlineOnlyFilter = document.getElementById("adminFilterOnlineOnly");

  if(onlineOnlyFilter && !onlineOnlyFilter._hasListener){
    onlineOnlyFilter._hasListener = true;
    onlineOnlyFilter.onchange = refreshAdminPlayerData;
  }

  const isFilterOnline = onlineOnlyFilter ? onlineOnlyFilter.checked : false;

  const prevSkinPlayer = playerSelect ? playerSelect.value : "";
  const prevEcoPlayer = ecoPlayerSelect ? ecoPlayerSelect.value : "";
  const prevSubPlayer = subAdminSelect ? subAdminSelect.value : "";

  if(playerSelect) playerSelect.innerHTML = '<option value="">Select Target Player...</option>';
  if(subAdminSelect) subAdminSelect.innerHTML = '<option value="">Select Player...</option>';
  if(ecoPlayerSelect) ecoPlayerSelect.innerHTML = '<option value="">Select Target Player...</option>';
  if(tableBody) tableBody.innerHTML = "";

  // Always sanitize against fake / made-up names
  const fakeNames = ["Alex", "Jordan", "Elena", "Kai", "Morgan", "Sam", "Taylor", "Riley", "Aria", "Leo", "Zane", "Maya", "Finn", "Chloe", "Noah", "Liam", "Sophia"];
  fakeNames.forEach(fn => {
    delete accounts[fn];
    if(subAdminRoles && subAdminRoles[fn]) delete subAdminRoles[fn];
  });
  localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
  localStorage.setItem("cardCollectorSubAdmins", JSON.stringify(subAdminRoles));

  // ONLY accounts that are online or that have played the game before. Zero made-up names.
  let allNames = Object.keys(accounts).filter(name => isValidGameAccount(name, accounts[name]));

  if(isFilterOnline){
    allNames = allNames.filter(name => isAccountOnline(name));
  }

  // Sort so online players are at the very top, followed by Master Cam, then alphabetical
  allNames.sort((a, b) => {
    const aOn = isAccountOnline(a) ? 1 : 0;
    const bOn = isAccountOnline(b) ? 1 : 0;
    if(bOn !== aOn) return bOn - aOn;
    if(a.toLowerCase() === ADMIN_USERNAME.toLowerCase()) return -1;
    if(b.toLowerCase() === ADMIN_USERNAME.toLowerCase()) return 1;
    return a.localeCompare(b);
  });

  if(allNames.length === 0){
    tableBody.innerHTML = `<tr><td colspan="6" style="color:#64748b;padding:8px">${isFilterOnline ? "No accounts currently online." : "No active player accounts found."}</td></tr>`;
    return;
  }

  allNames.forEach(name => {
    const data = accounts[name] || {};
    const isCurrent = currentUser && currentUser.toLowerCase() === name.toLowerCase();
    const isMaster = name.toLowerCase() === ADMIN_USERNAME.toLowerCase();
    const subRole = (typeof getSubAdminRole === "function") ? getSubAdminRole(name) : (subAdminRoles[name] || null);
    const isSub = !!(subRole && subRole.active);
    const isOnline = isAccountOnline(name);

    let roleText = "Player";
    if(isMaster) roleText = "Master";
    else if(isSub) roleText = "Sub-Admin";

    const onlineState = getAccountOnlineState(name);
    const statusBadge = `<span style="color:${onlineState.color};font-weight:700">● ${onlineState.label}</span>`;
    const statusText = onlineState.status === "online" ? "🟢 Online" : (onlineState.status === "away" ? "🟡 Away" : "Offline");

    // Player Skins selector
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = `${name} [${statusText}]${isCurrent ? " (You)" : ""}`;
    playerSelect.appendChild(opt);

    // Economy Target selector
    const ecoOpt = document.createElement("option");
    ecoOpt.value = name;
    ecoOpt.textContent = `${name} [${statusText}]${isCurrent ? " (You)" : ""}`;
    ecoPlayerSelect.appendChild(ecoOpt);

    // Sub-Admin role assignment selector
    if(!isMaster){
      const opt2 = document.createElement("option");
      opt2.value = name;
      opt2.textContent = `${name} [${statusText}]`;
      subAdminSelect.appendChild(opt2);
    }

    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
    tr.style.cursor = "pointer";
    tr.title = `Click to select ${name} for gifting & treasury`;
    tr.onclick = (e)=>{
      if(e.target.tagName.toLowerCase() === "button") return;
      selectPlayerInAllAdminDropdowns(name);
    };
    tr.innerHTML = `
      <td style="padding:8px 6px"><b>${name}</b></td>
      <td><span style="color:${isMaster ? '#f43f5e' : (isSub ? '#38bdf8' : '#64748b')}">${roleText}</span></td>
      <td>${statusBadge}</td>
      <td>🪙 ${(data.coins || 0).toLocaleString()}</td>
      <td>${(data.owned || []).length} / ${cards.length}</td>
      <td>
        <button type="button" class="accountBtn" style="padding:4px 8px;font-size:11px;background:#059669;color:#fff;margin-right:4px" onclick="quickGiftPlayerCardPrompt('${name}')">🎁 Gift</button>
        ${!isMaster ? ((typeof isMasterAdmin === "function" && isMasterAdmin()) ? `<button class="accountBtn" style="padding:4px 8px;font-size:11px;color:#f87171" onclick="adminDeleteSingleAccount('${name}')">Delete</button>` : '') : '<span style="color:#94a3b8;font-size:11px">Owner</span>'}
      </td>
    `;
    tableBody.appendChild(tr);
  });

  // Restore active player dropdown selections if still available
  if(prevSkinPlayer && playerSelect && Array.from(playerSelect.options).some(o => o.value === prevSkinPlayer)){
    playerSelect.value = prevSkinPlayer;
  }
  if(prevEcoPlayer && ecoPlayerSelect && Array.from(ecoPlayerSelect.options).some(o => o.value === prevEcoPlayer)){
    ecoPlayerSelect.value = prevEcoPlayer;
  }
  if(prevSubPlayer && subAdminSelect && Array.from(subAdminSelect.options).some(o => o.value === prevSubPlayer)){
    subAdminSelect.value = prevSubPlayer;
  }

  const availListEl = document.getElementById("subAdminAvailablePlayersList");
  if(availListEl){
    availListEl.innerHTML = "";
    const candidatePlayers = Object.keys(accounts).filter(n => n.toLowerCase() !== ADMIN_USERNAME.toLowerCase());
    if(candidatePlayers.length === 0){
      availListEl.innerHTML = '<span style="color:#64748b;font-size:12px;padding:4px">No other player accounts recorded yet. Type any player username above to grant them sub-admin privileges directly.</span>';
    } else {
      candidatePlayers.forEach(name => {
        const isOnline = isAccountOnline(name);
        const isAlreadySub = subAdminRoles[name] && subAdminRoles[name].active;
        const div = document.createElement("div");
        div.style.cssText = "display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);padding:6px 10px;border-radius:6px;font-size:12px";
        div.innerHTML = `
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-weight:700;color:#f8fafc">${name}</span>
            <span style="font-size:10px;color:${isOnline ? "#4ade80" : "#64748b"}">${isOnline ? "🟢 Online" : "⚪ Offline"}</span>
            ${isAlreadySub ? '<span style="font-size:10px;color:#38bdf8;background:rgba(56,189,248,0.15);padding:1px 6px;border-radius:4px;font-weight:700">Sub-Admin</span>' : ""}
          </div>
          <button type="button" class="accountBtn" style="padding:3px 10px;font-size:11px;background:#0284c7;color:#fff" onclick="selectSubAdminCandidate('${name}')">Select</button>
        `;
        availListEl.appendChild(div);
      });
    }
  }

  renderSubAdminRolesList();
  if(typeof updateLivePresenceDisplay === "function") updateLivePresenceDisplay();
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
    if(!role || !role.active) return;

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

const studioUrlInput = document.getElementById("newCardImageUrl");
if(studioUrlInput){
  studioUrlInput.addEventListener("input", ()=>{
    const url = studioUrlInput.value.trim();
    if(url){
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = ()=>ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = url;
    }
  });
}

function isCanvasBlank(cnv){
  if(!cnv) return true;
  const ctx = cnv.getContext("2d");
  const pixelBuffer = new Uint32Array(
    ctx.getImageData(0, 0, cnv.width, cnv.height).data.buffer
  );
  return !pixelBuffer.some(color => color !== 0);
}

function getFinalArtworkSrc(){
  const urlVal = document.getElementById("newCardImageUrl").value.trim();
  if(urlVal) return urlVal;
  if(uploadedImageData) return uploadedImageData;
  if(canvas && !isCanvasBlank(canvas)){
    return canvas.toDataURL("image/png");
  }
  return null;
}


/* Admin Controls & Actions */
document.getElementById("adminOpenBtn").onclick = ()=>{
  initCardSelect();
  refreshAdminPlayerData();
  if(typeof isMasterAdmin === "function" && isMasterAdmin()){
    renderUnreleasedAdminUI();
  }
  renderStudioCustomCards();
  populateRarityDropdowns();
  if(typeof updateAccountUI === "function") updateAccountUI();
  if(typeof updateLivePresenceDisplay === "function") updateLivePresenceDisplay();
  document.getElementById("adminLeakInput").value = localStorage.getItem("cardCollectorLeak") || "";
  document.getElementById("adminLuckSelect").value = adminLuckMultiplier.toString();
  document.getElementById("eventCoinMultiplierSelect").value = eventCoinMultiplier.toString();
  document.getElementById("eventPackDiscountSelect").value = eventPackDiscount.toString();
  document.getElementById("toggleMaintenanceBtn").textContent = isMaintenanceMode ? "ON" : "OFF";
  document.getElementById("toggleGodModeBtn").textContent = isGodModeEnabled ? "ENABLED" : "DISABLED";
  document.getElementById("adminModal").classList.add("show");

  clearInterval(window._adminAutoRefreshTimer);
  window._adminAutoRefreshTimer = setInterval(()=>{
    refreshAdminPlayerData();
  }, 2500);
};
document.getElementById("adminCloseBtn").onclick = ()=>{
  clearInterval(window._adminAutoRefreshTimer);
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

function getTargetPlayer(inputId, selectId){
  const inputEl = document.getElementById(inputId);
  const selectEl = document.getElementById(selectId);
  const typed = inputEl ? inputEl.value.trim() : "";
  const selected = (selectEl && selectEl.value) ? selectEl.value.trim() : "";

  // Always reload accounts from localStorage to prevent stale references
  try {
    const freshAccounts = JSON.parse(localStorage.getItem("cardCollectorAccounts"));
    if(freshAccounts && typeof freshAccounts === "object") accounts = freshAccounts;
  } catch(e){}

  const rawName = selected || typed;
  if(!rawName) return "";

  // Case-insensitive lookup against registered accounts
  const matchKey = Object.keys(accounts).find(k => k.toLowerCase() === rawName.toLowerCase());
  const name = matchKey || rawName;

  if(!accounts[name]){
    accounts[name] = { password: "", owned: [], coins: 100, hasPlayed: true, lastActive: Date.now() };
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
  }
  return name;
}

window.selectSubAdminCandidate = function(name){
  const sel = document.getElementById("subAdminTargetSelect");
  const input = document.getElementById("subAdminCustomPlayerInput");
  if(sel) sel.value = name;
  if(input) input.value = name;
};

// Two-way sync for typed username inputs and dropdowns
setTimeout(()=>{
  const sIn = document.getElementById("skinPlayerInput");
  const sSel = document.getElementById("skinPlayerSelect");
  if(sIn && sSel){
    sSel.addEventListener("change", ()=>{ if(sSel.value) sIn.value = sSel.value; });
    sIn.addEventListener("input", ()=>{
      const val = sIn.value.trim().toLowerCase();
      const matchOpt = Array.from(sSel.options).find(o => o.value.toLowerCase() === val);
      if(matchOpt) sSel.value = matchOpt.value;
      else sSel.value = "";
    });
  }

  const eIn = document.getElementById("economyPlayerInput");
  const eSel = document.getElementById("economyPlayerSelect");
  if(eIn && eSel){
    eSel.addEventListener("change", ()=>{ if(eSel.value) eIn.value = eSel.value; });
    eIn.addEventListener("input", ()=>{
      const val = eIn.value.trim().toLowerCase();
      const matchOpt = Array.from(eSel.options).find(o => o.value.toLowerCase() === val);
      if(matchOpt) eSel.value = matchOpt.value;
      else eSel.value = "";
    });
  }

  const subIn = document.getElementById("subAdminCustomPlayerInput");
  const subSel = document.getElementById("subAdminTargetSelect");
  if(subIn && subSel){
    subSel.addEventListener("change", ()=>{ if(subSel.value) subIn.value = subSel.value; });
    subIn.addEventListener("input", ()=>{
      const val = subIn.value.trim().toLowerCase();
      const matchOpt = Array.from(subSel.options).find(o => o.value.toLowerCase() === val);
      if(matchOpt) subSel.value = matchOpt.value;
      else subSel.value = "";
    });
  }
}, 100);

document.getElementById("saveSubAdminRoleBtn").onclick = ()=>{
  if(!isMasterAdmin()) return alert("Only Cam can configure admin privileges.");

  const target = getTargetPlayer("subAdminCustomPlayerInput", "subAdminTargetSelect");
  if(!target) return alert("Type or select a player username to assign privileges to.");

  if(target.toLowerCase() === ADMIN_USERNAME.toLowerCase()){
    return alert("Cam is already Supreme Master Admin.");
  }

  const dailyCap = parseInt(document.getElementById("subAdminDailyCapInput").value, 10) || 0;
  const canGiftSkins = document.getElementById("subAdminAllowSkinsCheck").checked;

  const allowedSkinIds = [];
  document.querySelectorAll(".subadmin-skin-check:checked").forEach(cb => {
    allowedSkinIds.push(parseInt(cb.value, 10));
  });

  // Remove any conflicting case variations from subAdminRoles
  const targetLower = target.toLowerCase().trim();
  Object.keys(subAdminRoles).forEach(k => {
    if(k.toLowerCase().trim() === targetLower && k !== target){
      delete subAdminRoles[k];
    }
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

  // Real-time synchronization
  if(typeof broadcastAdminActionToTarget === "function"){
    broadcastAdminActionToTarget(target, {
      type: "update_subadmin_role",
      target: target,
      role: subAdminRoles[target],
      allRoles: subAdminRoles
    });
  }
  if(typeof broadcastToAllPresencePeers === "function"){
    broadcastToAllPresencePeers({
      type: "sync_sub_admins",
      subAdminRoles: subAdminRoles
    });
  }
  if(typeof presenceBroadcast !== "undefined" && presenceBroadcast){
    try {
      presenceBroadcast.postMessage({
        type: "sync_sub_admins",
        subAdminRoles: subAdminRoles
      });
    } catch(e){}
  }

  alert(`Granted Sub-Admin privileges to ${target}!`);
};

window.revokeSubAdminRole = function(user){
  if(!isMasterAdmin()) return alert("Only Cam can revoke sub-admin roles.");
  if(confirm(`Revoke admin privileges from ${user}?`)){
    const userLower = user.toLowerCase().trim();
    Object.keys(subAdminRoles).forEach(k => {
      if(k.toLowerCase().trim() === userLower) delete subAdminRoles[k];
    });
    localStorage.setItem("cardCollectorSubAdmins", JSON.stringify(subAdminRoles));
    refreshAdminPlayerData();

    if(typeof broadcastAdminActionToTarget === "function"){
      broadcastAdminActionToTarget(user, {
        type: "revoke_subadmin_role",
        target: user,
        allRoles: subAdminRoles
      });
    }
    if(typeof broadcastToAllPresencePeers === "function"){
      broadcastToAllPresencePeers({
        type: "sync_sub_admins",
        subAdminRoles: subAdminRoles
      });
    }
    if(typeof presenceBroadcast !== "undefined" && presenceBroadcast){
      try {
        presenceBroadcast.postMessage({
          type: "sync_sub_admins",
          subAdminRoles: subAdminRoles
        });
      } catch(e){}
    }
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

  let image = getFinalArtworkSrc();

  if(!name || !desc) return alert("Please specify card name and description.");

  // If no image or blank canvas, generate procedural SVG matching rarity
  if(!image){
    const rarityColors = {
      common: ["#16a34a", "#052e16", "⚔️", "#bbf7d0"],
      rare: ["#0284c7", "#082f49", "⚡", "#7dd3fc"],
      epic: ["#9333ea", "#3b0764", "🔮", "#f0abfc"],
      legendary: ["#f59e0b", "#78350f", "👑", "#fde68a"],
      mythic: ["#ec4899", "#831843", "🌌", "#fbcfe8"],
      divine: ["#06b6d4", "#1e1b4b", "✨", "#cffafe"]
    };
    const cPreset = rarityColors[rarity] || ["#6366f1", "#1e1b4b", "✨", "#c7d2fe"];
    image = makeSvgArt(cPreset[0], cPreset[1], cPreset[2], cPreset[3]);
  }

  const hpByRarity = { common: 75, rare: 90, epic: 115, legendary: 150, mythic: 180, divine: 210 };
  const newCard = { 
    id: "card_custom_" + Date.now(),
    name, 
    image, 
    rarity, 
    desc, 
    hp: hpByRarity[rarity] || 100,
    attacks: [
      { name: atk1Name, dmg: atk1Dmg },
      { name: atk2Name, dmg: atk2Dmg }
    ],
    isUnreleased: false,
    isCustom: true
  };
  cards.push(newCard);
  const newCardIdx = cards.length - 1;

  // Creator automatically owns the newly forged studio card so they can use it immediately in Arena and collection
  const curAcc = (typeof getUserAccount === "function") ? getUserAccount(currentUser) : (accounts && accounts[currentUser]);
  if(curAcc){
    if(!Array.isArray(curAcc.owned)) curAcc.owned = [];
    if(!curAcc.owned.some(x => parseInt(x, 10) === newCardIdx)){
      curAcc.owned.push(newCardIdx);
    }
  }
  if(typeof owned !== "undefined" && Array.isArray(owned)){
    if(!owned.some(x => parseInt(x, 10) === newCardIdx)){
      owned.push(newCardIdx);
    }
  }
  if(typeof window !== "undefined" && Array.isArray(window.owned)){
    if(!window.owned.some(x => parseInt(x, 10) === newCardIdx)){
      window.owned.push(newCardIdx);
    }
  }
  if(typeof save === "function") save();

  if(typeof saveCustomCardsToStorage === "function") saveCustomCardsToStorage();

  if(typeof broadcastStudioCardCreated === "function"){
    broadcastStudioCardCreated(newCard);
  }

  initCardSelect();
  renderStudioCustomCards();

  document.getElementById("newCardName").value = "";
  document.getElementById("newCardDesc").value = "";
  document.getElementById("newCardAttack1Name").value = "";
  document.getElementById("newCardAttack2Name").value = "";
  document.getElementById("newCardImageUrl").value = "";
  clearCanvas();

  // Close Admin Hub modal so user is immediately viewing the Cards section on the main page
  const adminModalEl = document.getElementById("adminModal");
  if(adminModalEl) adminModalEl.classList.remove("show");

  // Switch to Full Binder so the new card is immediately in view
  filter = "all";
  document.querySelectorAll("[data-filter]").forEach(b => {
    b.classList.toggle("active", b.dataset.filter === "all");
  });

  render();

  // Smoothly scroll down to the new card in the Cards section and highlight with an illuminating aura
  setTimeout(()=>{
    const cardEls = Array.from(document.querySelectorAll("#grid .card"));
    const foundCardEl = cardEls.find(el => el.textContent.includes(name) || el.innerHTML.includes(name));
    if(foundCardEl){
      foundCardEl.scrollIntoView({ behavior: "smooth", block: "center" });
      foundCardEl.style.boxShadow = "0 0 35px #a855f7";
      setTimeout(()=>{ foundCardEl.style.boxShadow = ""; }, 3000);
    }
  }, 150);

  if(typeof showLiveToast === "function"){
    showLiveToast(`🎨 "<b>${name}</b>" (${rarity}) is now live in the Cards Section for everyone to see and unlock in Booster Packs!`, true);
  }
};

document.getElementById("adminUpdateCardArtBtn").onclick = ()=>{
  const idx = parseInt(document.getElementById("skinSelect").value, 10);
  if(isNaN(idx)) return alert("Select an existing card from the dropdown to update.");

  const image = getFinalArtworkSrc();
  cards[idx].image = image;
  if(typeof saveCustomCardsToStorage === "function") saveCustomCardsToStorage();

  render();
  alert(`Updated picture for card "${cards[idx].name}"!`);
};

document.getElementById("adminGiveSkinBtn").onclick = ()=>{
  const target = getTargetPlayer("skinPlayerInput", "skinPlayerSelect");
  const rawVal = document.getElementById("skinSelect").value;
  if(!target || !rawVal) return alert("Type or select recipient username and valid card.");

  // Handle Unreleased Vault Cards (Gift Only)
  if(rawVal.startsWith("vault_")){
    if(!isMasterAdmin()) return alert("Only Master Admin Cam can gift unreleased vault cards.");
    const vaultId = rawVal.replace("vault_", "");
    const vCard = unreleasedCards.find(c => (c.id || c.name) === vaultId);
    if(!vCard) return alert("Selected vault card not found in unreleased vault.");

    if(!accounts[target]) accounts[target] = { password: "", owned: [], coins: 100, hasPlayed: true, lastActive: Date.now() };
    if(!accounts[target].unreleasedOwned) accounts[target].unreleasedOwned = [];
    if(!accounts[target].unreleasedOwned.includes(vaultId)){
      accounts[target].unreleasedOwned.push(vaultId);
      localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));

      if(typeof broadcastAdminActionToTarget === "function"){
        broadcastAdminActionToTarget(target, { type: "gift_vault_card", card: vCard });
      }
      refreshAdminPlayerData();
      render();
      alert(`🎁 Exclusive Vault Card "${vCard.name}" gifted to ${target}!\n\nThis card is now unlocked in ${target}'s binder and arena, and will NEVER drop in booster packs for anyone.`);
    } else {
      alert(`${target} already possesses this exclusive vault card.`);
    }
    return;
  }

  const idx = parseInt(rawVal, 10);
  if(isNaN(idx)) return alert("Select a valid card to grant.");

  if(isSubAdmin() && !isMasterAdmin()){
    const role = (typeof getSubAdminRole === "function") ? getSubAdminRole(currentUser) : subAdminRoles[currentUser];
    if(!role || !role.active || !role.canGiftSkins){
      return alert("Permission Denied: Your sub-admin role is not authorized to gift skins.");
    }
    const isAllowed = !role.allowedSkinIds || role.allowedSkinIds.length === 0 || role.allowedSkinIds.some(id => parseInt(id, 10) === idx);
    if(!isAllowed){
      return alert(`Permission Denied: You are not authorized to gift the skin "${cards[idx].name}".`);
    }
  }

  if(!accounts[target].owned) accounts[target].owned = [];
  const alreadyHas = accounts[target].owned.some(x => parseInt(x, 10) === idx);
  if(!alreadyHas){
    accounts[target].owned.push(idx);
    if(currentUser && target.toLowerCase() === currentUser.toLowerCase()) owned = accounts[target].owned;
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    if(typeof broadcastAdminActionToTarget === "function"){
      broadcastAdminActionToTarget(target, { type: "gift_card", cardIndex: idx, card: cards[idx] });
    }
    refreshAdminPlayerData();
    render();
    alert(`Card "${cards[idx].name}" granted to ${target}.`);
  } else {
    alert(`${target} already possesses this card.`);
  }
};

document.getElementById("adminTakeSkinBtn").onclick = ()=>{
  if(!isMasterAdmin()) return alert("Only master admin Cam can revoke cards.");

  const target = getTargetPlayer("skinPlayerInput", "skinPlayerSelect");
  const rawVal = document.getElementById("skinSelect").value;
  if(!target || !rawVal) return alert("Type or select recipient username and valid card.");

  // Handle Unreleased Vault Cards
  if(rawVal.startsWith("vault_")){
    const vaultId = rawVal.replace("vault_", "");
    const vCard = unreleasedCards.find(c => (c.id || c.name) === vaultId);
    const cardTitle = vCard ? vCard.name : vaultId;

    if(accounts[target] && Array.isArray(accounts[target].unreleasedOwned) && accounts[target].unreleasedOwned.includes(vaultId)){
      accounts[target].unreleasedOwned = accounts[target].unreleasedOwned.filter(x => x !== vaultId);
      localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
      if(typeof broadcastAdminActionToTarget === "function"){
        broadcastAdminActionToTarget(target, { type: "revoke_vault_card", cardId: vaultId });
      }
      refreshAdminPlayerData();
      render();
      alert(`Revoked exclusive vault card "${cardTitle}" from ${target}.`);
    } else {
      alert(`${target} does not possess this exclusive vault card.`);
    }
    return;
  }

  const idx = parseInt(rawVal, 10);
  if(isNaN(idx)) return alert("Select a valid card to revoke.");

  if(accounts[target] && accounts[target].owned){
    accounts[target].owned = accounts[target].owned.filter(x => x !== idx);
    if(target.toLowerCase() === currentUser.toLowerCase()) owned = accounts[target].owned;
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    if(typeof broadcastAdminActionToTarget === "function"){
      broadcastAdminActionToTarget(target, { type: "revoke_card", cardIndex: idx });
    }
    refreshAdminPlayerData();
    render();
    alert(`Card revoked from ${target}.`);
  }
};

document.getElementById("adminUnlockAllPlayerBtn").onclick = ()=>{
  if(!isMasterAdmin()) return alert("Only master admin Cam can unlock all cards.");

  const target = getTargetPlayer("skinPlayerInput", "skinPlayerSelect");
  if(!target) return alert("Type or select a target player username first.");
  accounts[target].owned = cards.map((_, i) => i);
  if(target.toLowerCase() === currentUser.toLowerCase()) owned = accounts[target].owned;
  localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
  if(typeof broadcastAdminActionToTarget === "function"){
    broadcastAdminActionToTarget(target, { type: "unlock_all" });
  }
  refreshAdminPlayerData();
  render();
  alert(`Unlocked all ${cards.length} cards for ${target}!`);
};

document.getElementById("adminWipePlayerBtn").onclick = ()=>{
  if(!isMasterAdmin()) return alert("Only master admin Cam can wipe accounts.");

  const target = getTargetPlayer("skinPlayerInput", "skinPlayerSelect");
  if(!target) return alert("Type or select a target player username first.");
  if(confirm(`Wipe all unlocked cards for ${target}?`)){
    accounts[target].owned = [];
    if(target.toLowerCase() === currentUser.toLowerCase()) owned = [];
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    if(typeof broadcastAdminActionToTarget === "function"){
      broadcastAdminActionToTarget(target, { type: "wipe_cards" });
    }
    refreshAdminPlayerData();
    render();
    alert(`Inventory cleared for ${target}.`);
  }
};

// Target-Specific Coin Gifting
document.getElementById("adminAddPlayerCoinsBtn").onclick = ()=>{
  const target = getTargetPlayer("economyPlayerInput", "economyPlayerSelect");
  const amt = parseInt(document.getElementById("adminPlayerCoinsAmount").value, 10);
  if(!target) return alert("Please type or select a target player username.");
  if(isNaN(amt) || amt <= 0) return alert("Enter a valid positive number.");

  if(isSubAdmin() && !isMasterAdmin()){
    const role = (typeof getSubAdminRole === "function") ? getSubAdminRole(currentUser) : subAdminRoles[currentUser];
    if(!role || !role.active){
      return alert("Permission Denied: Your sub-admin role is inactive.");
    }
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
    subAdminRoles[currentUser] = role;
    localStorage.setItem("cardCollectorSubAdmins", JSON.stringify(subAdminRoles));
    if(typeof updateAccountUI === "function") updateAccountUI();
  }

  accounts[target].coins = (accounts[target].coins || 0) + amt;
  if(target.toLowerCase() === currentUser.toLowerCase()) coins = accounts[target].coins;
  localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
  if(typeof broadcastAdminActionToTarget === "function"){
    broadcastAdminActionToTarget(target, { type: "gift_coins", amount: amt });
  }
  refreshAdminPlayerData();
  render();
  alert(`Added ${amt.toLocaleString()} coins to ${target}.`);
};

document.getElementById("adminSetPlayerCoinsBtn").onclick = ()=>{
  if(!isMasterAdmin()) return alert("Only master admin Cam can set exact treasury balances.");
  const target = getTargetPlayer("economyPlayerInput", "economyPlayerSelect");
  const amt = parseInt(document.getElementById("adminPlayerCoinsAmount").value, 10);
  if(!target) return alert("Please type or select a target player username.");
  if(isNaN(amt) || amt < 0) return alert("Enter a valid non-negative number.");
  accounts[target].coins = amt;
  if(target.toLowerCase() === currentUser.toLowerCase()) coins = accounts[target].coins;
  localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
  if(typeof broadcastAdminActionToTarget === "function"){
    broadcastAdminActionToTarget(target, { type: "set_coins", amount: amt });
  }
  refreshAdminPlayerData();
  render();
  alert(`Set ${target}'s treasury balance to ${amt.toLocaleString()} coins.`);
};

document.getElementById("adminDrainPlayerCoinsBtn").onclick = ()=>{
  if(!isMasterAdmin()) return alert("Only master admin Cam can drain accounts.");
  const target = getTargetPlayer("economyPlayerInput", "economyPlayerSelect");
  if(!target) return alert("Please type or select a target player username.");
  accounts[target].coins = 0;
  if(target.toLowerCase() === currentUser.toLowerCase()) coins = 0;
  localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
  if(typeof broadcastAdminActionToTarget === "function"){
    broadcastAdminActionToTarget(target, { type: "set_coins", amount: 0 });
  }
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

  // Populate Card Studio Rarity select
  const studioRaritySelect = document.getElementById("newCardRarity");
  if(studioRaritySelect){
    const currentStudioVal = studioRaritySelect.value || "common";
    studioRaritySelect.innerHTML = "";
    allRarities.forEach(r => {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = r.name;
      studioRaritySelect.appendChild(opt);
    });
    if(allRarities.some(r => r.id === currentStudioVal)){
      studioRaritySelect.value = currentStudioVal;
    }
  }

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
    binderCheck.checked = (localStorage.getItem("cardCollectorShowUnreleasedInBinder") !== "false");
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
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button type="button" class="accountBtn vault-gift-btn" style="padding:5px 9px;font-size:11px;background:rgba(16,185,129,0.2);border-color:#10b981;color:#6ee7b7" title="Gift this exclusive card to a specific player">
            🎁 Gift
          </button>
          <button type="button" class="accountBtn vault-own-btn" style="padding:5px 9px;font-size:11px;background:${isOwnedByCam ? "rgba(16,185,129,0.2)" : "rgba(56,189,248,0.2)"};border-color:${isOwnedByCam ? "#10b981" : "#38bdf8"};color:${isOwnedByCam ? "#6ee7b7" : "#38bdf8"}">
            ${isOwnedByCam ? "✓ Owned" : "+ Own"}
          </button>
          <button type="button" class="accountBtn vault-release-btn" style="padding:5px 9px;font-size:11px;background:rgba(234,179,8,0.2);border-color:#eab308;color:#fde047" title="Release to Home Page and Booster Packs for everyone">
            🚀 Release Public
          </button>
          <button type="button" class="accountBtn vault-del-btn" style="padding:5px 8px;font-size:11px;background:rgba(239,68,68,0.2);border-color:#ef4444;color:#fca5a5">
            ✕
          </button>
        </div>
      `;
      const giftBtn = item.querySelector(".vault-gift-btn");
      if(giftBtn) giftBtn.onclick = () => quickGiftVaultCard(cardId);
      const ownBtn = item.querySelector(".vault-own-btn");
      if(ownBtn) ownBtn.onclick = () => toggleUnreleasedCardOwnership(cardId);
      const relBtn = item.querySelector(".vault-release-btn");
      if(relBtn) relBtn.onclick = () => releaseVaultCardToStudio(cardId);
      const delBtn = item.querySelector(".vault-del-btn");
      if(delBtn) delBtn.onclick = () => deleteUnreleasedCard(idx);
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

let unreleasedCardUploadedImg = "";

const unreleasedCardFileEl = document.getElementById("unreleasedCardFileInput");
const unreleasedCardUrlEl = document.getElementById("unreleasedCardImageUrl");
const unreleasedCardPreviewWrap = document.getElementById("unreleasedCardImagePreviewWrap");
const unreleasedCardPreviewImg = document.getElementById("unreleasedCardImagePreview");
const unreleasedCardClearBtn = document.getElementById("unreleasedCardImageClearBtn");

function updateUnreleasedCardPreview(){
  const url = (unreleasedCardUrlEl ? unreleasedCardUrlEl.value.trim() : "") || unreleasedCardUploadedImg;
  if(url && unreleasedCardPreviewImg && unreleasedCardPreviewWrap){
    unreleasedCardPreviewImg.src = url;
    unreleasedCardPreviewWrap.style.display = "flex";
  } else if(unreleasedCardPreviewWrap){
    unreleasedCardPreviewWrap.style.display = "none";
  }
}

if(unreleasedCardUrlEl){
  unreleasedCardUrlEl.addEventListener("input", updateUnreleasedCardPreview);
}

if(unreleasedCardFileEl){
  unreleasedCardFileEl.addEventListener("change", (e)=>{
    const file = e.target.files && e.target.files[0];
    if(file){
      const reader = new FileReader();
      reader.onload = (event)=>{
        unreleasedCardUploadedImg = event.target.result;
        updateUnreleasedCardPreview();
      };
      reader.readAsDataURL(file);
    }
  });
}

if(unreleasedCardClearBtn){
  unreleasedCardClearBtn.addEventListener("click", ()=>{
    unreleasedCardUploadedImg = "";
    if(unreleasedCardUrlEl) unreleasedCardUrlEl.value = "";
    if(unreleasedCardFileEl) unreleasedCardFileEl.value = "";
    updateUnreleasedCardPreview();
  });
}

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

    let image = "";
    const typedUrl = (unreleasedCardUrlEl ? unreleasedCardUrlEl.value.trim() : "");
    if(typedUrl){
      image = typedUrl;
    } else if(unreleasedCardUploadedImg){
      image = unreleasedCardUploadedImg;
    } else {
      let c1 = "#4c0519", c2 = "#0f172a", textC = "#fda4af", glowC = "rgba(244, 63, 94, 0.6)";
      if(theme === "glitch"){ c1 = "#064e3b"; c2 = "#022c22"; textC = "#6ee7b7"; glowC = "rgba(168, 85, 247, 0.6)"; }
      else if(theme === "abyss"){ c1 = "#1e1b4b"; c2 = "#09090b"; textC = "#c084fc"; glowC = "rgba(168, 85, 247, 0.6)"; }
      else if(theme === "celestial"){ c1 = "#78350f"; c2 = "#1c0901"; textC = "#fde047"; glowC = "rgba(250, 204, 21, 0.6)"; }
      else if(theme === "emerald"){ c1 = "#065f46"; c2 = "#022c22"; textC = "#a7f3d0"; glowC = "rgba(52, 211, 153, 0.6)"; }
      image = makeSvgArt(c1, c2, emoji, textC, glowC);
    }

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

    // Automatically add exclusively to Cam's collection so it shows only on Cam's home page
    const newCardId = newCard.id || newCard.name;
    if(accounts["Cam"]){
      if(!accounts["Cam"].unreleasedOwned) accounts["Cam"].unreleasedOwned = [];
      if(!accounts["Cam"].unreleasedOwned.includes(newCardId)) accounts["Cam"].unreleasedOwned.push(newCardId);
    }
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    localStorage.setItem("cardCollectorShowUnreleasedInBinder", "true");

    initCardSelect();
    render();
    renderUnreleasedAdminUI();

    document.getElementById("unreleasedCardName").value = "";
    document.getElementById("unreleasedCardDesc").value = "";
    unreleasedCardUploadedImg = "";
    if(unreleasedCardUrlEl) unreleasedCardUrlEl.value = "";
    if(unreleasedCardFileEl) unreleasedCardFileEl.value = "";
    updateUnreleasedCardPreview();

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


/* Studio Custom Cards Manager (Live on Home Page & Packs) */
function renderStudioCustomCards(){
  const listEl = document.getElementById("studioCustomCardsList");
  const countEl = document.getElementById("studioCustomCardsCount");
  if(!listEl) return;

  const customOnly = cards.filter(c => !c.isUnreleased && !defaultCards.some(dc => dc.name.toLowerCase() === c.name.toLowerCase()));
  if(countEl) countEl.textContent = customOnly.length;

  listEl.innerHTML = "";
  if(customOnly.length === 0){
    listEl.innerHTML = "<div style=\"color:#64748b;font-size:12px;padding:8px\">No studio cards created yet. Create one above to publish to the Home Page and Booster Packs!</div>";
    return;
  }

  customOnly.forEach((c) => {
    const item = document.createElement("div");
    item.style.cssText = "display:flex;align-items:center;justify-content:space-between;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.1);padding:10px 12px;border-radius:12px;gap:10px";
    
    const atkText = (c.attacks || []).map(a => `${a.name} (${a.dmg})`).join(", ");
    item.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;min-width:0">
        <img src="${c.image}" style="width:36px;height:48px;border-radius:6px;object-fit:cover;border:1px solid rgba(255,255,255,0.15);flex-shrink:0">
        <div style="min-width:0">
          <div style="font-size:13px;font-weight:700;color:#f1f5f9;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span>${c.name}</span>
            <span style="font-size:10px;text-transform:uppercase;color:#38bdf8;font-weight:800;background:rgba(56,189,248,0.15);padding:1px 5px;border-radius:4px">${c.rarity}</span>
            <span style="font-size:10px;color:#4ade80;font-weight:800;background:rgba(74,222,128,0.15);padding:1px 5px;border-radius:4px">● Live in Packs</span>
          </div>
          <div style="font-size:11px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.hp || 100} HP • ${atkText}</div>
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button type="button" class="accountBtn" style="padding:5px 8px;font-size:11px;background:rgba(56,189,248,0.15);border-color:#38bdf8;color:#38bdf8" title="View in Home Page Binder" onclick="viewStudioCardInBinder('${c.name.replace(/'/g, "\\x27")}')">
          👁️ Binder
        </button>
        <button type="button" class="accountBtn" style="padding:5px 8px;font-size:11px;background:rgba(168,85,247,0.15);border-color:#a855f7;color:#c084fc" title="Copy Card Code" onclick="copyStudioCardCode('${c.name.replace(/'/g, "\\x27")}')">
          📋 Code
        </button>
        <button type="button" class="accountBtn" style="padding:5px 8px;font-size:11px;background:rgba(239,68,68,0.15);border-color:#ef4444;color:#fca5a5" title="Remove Card" onclick="deleteStudioCard('${c.name.replace(/'/g, "\\x27")}')">
          ✕
        </button>
      </div>
    `;
    listEl.appendChild(item);
  });
}

window.viewStudioCardInBinder = function(cardName){
  document.getElementById("adminModal").classList.remove("show");
  filter = "all";
  document.querySelectorAll(".binder-tab").forEach(t => t.classList.toggle("active", t.dataset.filter === "all"));
  render();
  setTimeout(()=>{
    const cardsEl = Array.from(document.querySelectorAll("#grid .card"));
    const found = cardsEl.find(el => el.textContent.includes(cardName) || el.innerHTML.includes(cardName));
    if(found){
      found.scrollIntoView({ behavior: "smooth", block: "center" });
      found.style.boxShadow = "0 0 25px #38bdf8";
      setTimeout(()=>{ found.style.boxShadow = ""; }, 2500);
    } else {
      const idx = cards.findIndex(c => c.name === cardName);
      if(idx !== -1 && cardsEl[idx]){
        cardsEl[idx].scrollIntoView({ behavior: "smooth", block: "center" });
        cardsEl[idx].style.boxShadow = "0 0 25px #38bdf8";
        setTimeout(()=>{ cardsEl[idx].style.boxShadow = ""; }, 2500);
      }
    }
  }, 200);
};

window.copyStudioCardCode = function(cardName){
  const found = cards.find(c => c.name === cardName);
  if(!found) return;
  const json = JSON.stringify(found, null, 2);
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(json).then(()=>{
      alert(`Card JSON copied to clipboard!\nYou can paste this into defaultCards in js/cards-data.js to make it permanently built-in.`);
    }).catch(()=>{
      prompt("Copy card JSON:", json);
    });
  } else {
    prompt("Copy card JSON:", json);
  }
};

window.deleteStudioCard = function(cardName){
  if(!confirm(`Remove card "${cardName}" from the Home Page binder and Booster Pack drop pool?`)) return;
  const idx = cards.findIndex(c => c.name === cardName);
  if(idx !== -1){
    cards.splice(idx, 1);
    if(typeof saveCustomCardsToStorage === "function") saveCustomCardsToStorage();
    initCardSelect();
    render();
    renderStudioCustomCards();
    alert(`Card "${cardName}" removed from Home Page and packs.`);
  }
};

window.releaseVaultCardToStudio = function(cardId){
  const idx = unreleasedCards.findIndex(c => (c.id || c.name) === cardId);
  if(idx === -1) return;
  const vCard = unreleasedCards[idx];
  if(!confirm(`Release "${vCard.name}" to the Home Page and Booster Packs for everyone?`)) return;

  const publicCard = {
    ...vCard,
    isUnreleased: false,
    isCustom: true
  };
  delete publicCard.isUnreleased;

  if(!cards.some(c => c.name.toLowerCase() === publicCard.name.toLowerCase())){
    cards.push(publicCard);
    if(typeof saveCustomCardsToStorage === "function") saveCustomCardsToStorage();
    if(typeof broadcastStudioCardCreated === "function"){
      broadcastStudioCardCreated(publicCard);
    }
  }

  unreleasedCards.splice(idx, 1);
  localStorage.setItem("cardCollectorUnreleasedCards", JSON.stringify(unreleasedCards));

  initCardSelect();
  render();
  renderUnreleasedAdminUI();
  renderStudioCustomCards();
  alert(`🚀 "${publicCard.name}" is now live on the Home Page and available in Booster Packs for everyone!`);
};

// Initial render of studio cards
renderStudioCustomCards();
populateRarityDropdowns();

window.quickGiftVaultCard = function(cardId){
  if(!isMasterAdmin()) return alert("Only Master Admin Cam can gift unreleased vault cards.");
  const vCard = (typeof findVaultCardByIdOrName === "function")
    ? findVaultCardByIdOrName(cardId)
    : unreleasedCards.find(c => (c.id || c.name) === cardId);
  if(!vCard) return alert("Vault card not found.");

  // Always reload accounts to have latest players
  try {
    const freshAccounts = JSON.parse(localStorage.getItem("cardCollectorAccounts"));
    if(freshAccounts && typeof freshAccounts === "object") accounts = freshAccounts;
  } catch(e){}

  const playerKeys = Object.keys(accounts).filter(k => k.toLowerCase() !== ADMIN_USERNAME.toLowerCase());
  let promptMsg = `Gift Exclusive Vault Card "${vCard.name}" to which player?\n\n`;
  if(playerKeys.length > 0){
    promptMsg += `Available registered players: ${playerKeys.join(", ")}`;
  } else {
    promptMsg += `Enter any registered player username:`;
  }

  const defTarget = playerKeys[0] || "";
  const recipient = prompt(promptMsg, defTarget);
  if(!recipient) return;
  const rawTarget = recipient.trim();
  if(!rawTarget) return;

  const targetAcc = (typeof getUserAccount === "function") ? getUserAccount(rawTarget) : accounts[rawTarget];
  const target = targetAcc ? (Object.keys(accounts).find(k => accounts[k] === targetAcc) || rawTarget) : rawTarget;

  if(!accounts[target]){
    accounts[target] = { password: "", owned: [], coins: 100, unreleasedOwned: [], hasPlayed: true, lastActive: Date.now() };
  }
  const acc = accounts[target];
  if(!acc.unreleasedOwned) acc.unreleasedOwned = [];

  const isAlreadyOwned = (typeof isVaultCardOwnedByUser === "function")
    ? isVaultCardOwnedByUser(vCard, acc.unreleasedOwned)
    : acc.unreleasedOwned.includes(cardId);

  if(!isAlreadyOwned){
    if(vCard.id && !acc.unreleasedOwned.includes(vCard.id)) acc.unreleasedOwned.push(vCard.id);
    if(vCard.name && !acc.unreleasedOwned.includes(vCard.name)) acc.unreleasedOwned.push(vCard.name);
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));

    if(typeof broadcastAdminActionToTarget === "function"){
      broadcastAdminActionToTarget(target, { type: "gift_vault_card", card: vCard });
    }

    refreshAdminPlayerData();
    render();
    renderUnreleasedAdminUI();
    initCardSelect();
    alert(`🎁 Exclusive Vault Card "${vCard.name}" successfully gifted to ${target}!\n\nThis card is now unlocked in ${target}'s binder and arena, and will NEVER drop in booster packs for anyone.`);
  } else {
    alert(`${target} already owns this exclusive vault card.`);
  }
};


window.quickGiftPlayerCardPrompt = function(name){
  selectPlayerInAllAdminDropdowns(name);
  const cardSel = document.getElementById("skinSelect");
  if(cardSel){
    cardSel.focus();
    cardSel.style.borderColor = "#10b981";
    cardSel.style.boxShadow = "0 0 10px rgba(16,185,129,0.5)";
    setTimeout(()=>{
      cardSel.style.borderColor = "";
      cardSel.style.boxShadow = "";
    }, 1500);
  }
};
