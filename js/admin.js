function updatePackPriceLabels(){
  const isLockActive = (typeof isLockdownMode !== "undefined" && isLockdownMode);
  const isMaster = (typeof isMasterAdmin === "function" && isMasterAdmin());

  Object.keys(packTiers).forEach(key => {
    const tier = packTiers[key];
    const actual = getActualPackCost(tier.baseCost);
    const label = document.getElementById("price-" + key);
    if(label){
      if(isLockActive && !isMaster){
        label.innerHTML = `<span style="color:#ef4444;font-weight:900">🚨 LOCKED DOWN</span>`;
      } else if(eventPackDiscount > 0){
        label.innerHTML = `Open • <s style="opacity:0.6">${tier.baseCost}</s> <b style="color:#4ade80">${actual} 🪙</b>`;
      } else {
        label.textContent = `Open • ${actual} 🪙`;
      }
    }
  });

  const eventBanner = document.getElementById("serverEventBanner");
  if(eventBanner){
    if(eventCoinMultiplier > 1 || eventPackDiscount > 0){
      eventBanner.style.display = "block";
      let desc = [];
      if(eventCoinMultiplier > 1) desc.push(`${eventCoinMultiplier}X COINS ACTIVE`);
      if(eventPackDiscount > 0) desc.push(`${eventPackDiscount}% OFF PACK SALE`);
      eventBanner.textContent = `🎉 SPECIAL EVENT: ${desc.join(" + ")}!`;
    } else {
      eventBanner.style.display = "none";
    }
  }

  const maintBanner = document.getElementById("maintenanceBanner");
  if(maintBanner) maintBanner.style.display = isMaintenanceMode ? "block" : "none";

  const lockBanner = document.getElementById("lockdownBanner");
  if(lockBanner) lockBanner.style.display = isLockdownMode ? "block" : "none";
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
    const targetEl = document.getElementById(targetId);
    if(targetEl) targetEl.classList.add("active");

    if(targetId === "tabCardManager" && typeof renderCardManager === "function"){
      renderCardManager();
    }
    if(targetId === "tabChaosLab" && typeof initChaosLabUI === "function"){
      initChaosLabUI();
    }
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
  const casinoSel = document.getElementById("chaosCasinoTargetSelect");
  const skinInput = document.getElementById("skinPlayerInput");
  const ecoInput = document.getElementById("economyPlayerInput");
  const subInput = document.getElementById("subAdminCustomPlayerInput");
  const casinoInput = document.getElementById("chaosCasinoTargetInput");

  if(skinSel) skinSel.value = name;
  if(ecoSel) ecoSel.value = name;
  if(subSel) subSel.value = name;
  if(casinoSel) casinoSel.value = name;
  if(skinInput) skinInput.value = name;
  if(ecoInput) ecoInput.value = name;
  if(subInput) subInput.value = name;
  if(casinoInput) casinoInput.value = name;

  // Flash highlight target inputs for visual confirmation
  [skinInput, ecoInput, subInput, casinoInput].forEach(inp => {
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
  const casinoSelect = document.getElementById("chaosCasinoTargetSelect");
  const prevCasinoPlayer = casinoSelect ? casinoSelect.value : "";
  if(casinoSelect) casinoSelect.innerHTML = '<option value="">Select Target Beneficiary (Default: Yourself)...</option>';

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

    // Lucky Wheel target selector
    if(casinoSelect){
      const casOpt = document.createElement("option");
      casOpt.value = name;
      casOpt.textContent = `${name} [${statusText}]${isCurrent ? " (You)" : ""}`;
      casinoSelect.appendChild(casOpt);
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
      <td>🪙 ${(typeof formatCoins === "function") ? formatCoins(data.coins) : (isInfiniteValue(data.coins) ? "∞" : (data.coins || 0).toLocaleString())}</td>
      <td>${(data.owned || []).length} / ${cards.length}</td>
      <td>
        <button type="button" class="accountBtn" style="padding:4px 8px;font-size:11px;background:#059669;color:#fff;margin-right:4px" onclick="quickGiftPlayerCardPrompt('${name}')">🎁 Gift</button>
        <button type="button" class="accountBtn" style="padding:4px 8px;font-size:11px;background:#0284c7;color:#fff;margin-right:4px" onclick="adminChangePlayerPasswordPrompt('${name}')" title="Change or reset password">🔑 Pass</button>
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
  if(prevCasinoPlayer && casinoSelect && Array.from(casinoSelect.options).some(o => o.value === prevCasinoPlayer)){
    casinoSelect.value = prevCasinoPlayer;
  }

  const casinoInputEl = document.getElementById("chaosCasinoTargetInput");
  if(casinoSelect && casinoInputEl && !casinoSelect._hasInputSync){
    casinoSelect._hasInputSync = true;
    casinoSelect.addEventListener("change", () => {
      if(casinoSelect.value) casinoInputEl.value = casinoSelect.value;
    });
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
  if(!listEl) return;
  listEl.innerHTML = "";
  const subAdminKeys = Object.keys(subAdminRoles);

  if(subAdminKeys.length === 0){
    listEl.innerHTML = '<span style="color:#64748b;font-size:13px">No sub-admins appointed yet.</span>';
    return;
  }

  subAdminKeys.forEach(user => {
    const role = subAdminRoles[user];
    if(!role || !role.active) return;

    const perms = (typeof getSubAdminPermissions === "function") ? getSubAdminPermissions(role) : (role.permissions || { players: true });
    const permLabels = [];
    if(perms.players) permLabels.push("👥 Players");
    if(perms.studio) permLabels.push("🎨 Studio");
    if(perms.cardManager) permLabels.push("🃏 Card Mgr");
    if(perms.economy) permLabels.push("🪙 Economy");
    if(perms.events) permLabels.push("🌪️ Events");
    if(perms.broadcast) permLabels.push("📢 Broadcast");
    const permsSummary = permLabels.length > 0 ? permLabels.join(", ") : "None";

    const div = document.createElement("div");
    div.style = "background:rgba(0,0,0,0.35);padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px";
    div.innerHTML = `
      <div style="flex:1;min-width:200px">
        <div style="display:flex;align-items:center;gap:6px">
          <b style="color:#38bdf8;font-size:14px">${user}</b>
          <span style="font-size:10px;font-weight:900;background:rgba(56,189,248,0.2);color:#38bdf8;padding:1px 6px;border-radius:4px;border:1px solid rgba(56,189,248,0.4)">SUB-ADMIN</span>
        </div>
        <div style="font-size:12px;color:#cbd5e1;margin-top:2px">Daily Cap: <b>${role.dailyCap || 0} 🪙</b> | Gifted Today: ${role.giftedToday || 0}</div>
        <div style="font-size:11px;color:#94a3b8">Can Gift Skins: <b>${role.canGiftSkins ? 'Yes' : 'No'}</b> (${(role.allowedSkinIds || []).length} allowed)</div>
        <div style="font-size:11px;color:#a78bfa;margin-top:2px"><b>Powers:</b> ${permsSummary}</div>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="accountBtn" style="background:#0284c7;padding:5px 10px;font-size:11px;font-weight:700" onclick="editSubAdminRole('${user}')">✏️ Edit</button>
        <button class="accountBtn" style="background:#dc2626;padding:5px 10px;font-size:11px;font-weight:700" onclick="revokeSubAdminRole('${user}')">Revoke</button>
      </div>
    `;
    listEl.appendChild(div);
  });
}

window.editSubAdminRole = function(user){
  const role = (typeof getSubAdminRole === "function") ? getSubAdminRole(user) : subAdminRoles[user];
  if(!role) return;

  const targetSelect = document.getElementById("subAdminTargetSelect");
  const customInput = document.getElementById("subAdminCustomPlayerInput");
  if(targetSelect){
    let foundOption = false;
    for(let i = 0; i < targetSelect.options.length; i++){
      if(targetSelect.options[i].value.toLowerCase() === user.toLowerCase()){
        targetSelect.selectedIndex = i;
        foundOption = true;
        break;
      }
    }
    if(!foundOption && customInput) customInput.value = user;
    else if(customInput) customInput.value = "";
  } else if(customInput){
    customInput.value = user;
  }

  const dailyCapInput = document.getElementById("subAdminDailyCapInput");
  if(dailyCapInput) dailyCapInput.value = role.dailyCap || 0;

  const allowSkinsCheck = document.getElementById("subAdminAllowSkinsCheck");
  if(allowSkinsCheck) allowSkinsCheck.checked = !!role.canGiftSkins;

  const allowedIds = role.allowedSkinIds || [];
  document.querySelectorAll(".subadmin-skin-check").forEach(cb => {
    cb.checked = allowedIds.includes(parseInt(cb.value, 10));
  });

  const perms = (typeof getSubAdminPermissions === "function") ? getSubAdminPermissions(role) : (role.permissions || { players: true });
  if(document.getElementById("subAdminPermPlayers")) document.getElementById("subAdminPermPlayers").checked = perms.players !== false;
  if(document.getElementById("subAdminPermStudio")) document.getElementById("subAdminPermStudio").checked = !!perms.studio;
  if(document.getElementById("subAdminPermCardManager")) document.getElementById("subAdminPermCardManager").checked = !!perms.cardManager;
  if(document.getElementById("subAdminPermEconomy")) document.getElementById("subAdminPermEconomy").checked = !!perms.economy;
  if(document.getElementById("subAdminPermEvents")) document.getElementById("subAdminPermEvents").checked = !!perms.events;
  if(document.getElementById("subAdminPermBroadcast")) document.getElementById("subAdminPermBroadcast").checked = !!perms.broadcast;
  if(document.getElementById("subAdminPermChaosLab")) document.getElementById("subAdminPermChaosLab").checked = !!perms.chaosLab;

  const card = document.getElementById("subAdminDailyCapInput") ? document.getElementById("subAdminDailyCapInput").closest(".adminCard") : null;
  if(card) card.scrollIntoView({ behavior: "smooth", block: "start" });
};

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
  if(typeof renderCardManager === "function") renderCardManager();
  populateRarityDropdowns();
  if(typeof updateAccountUI === "function") updateAccountUI();
  if(typeof updateLivePresenceDisplay === "function") updateLivePresenceDisplay();
  document.getElementById("adminLeakInput").value = localStorage.getItem("cardCollectorLeak") || "";
  document.getElementById("adminLuckSelect").value = adminLuckMultiplier.toString();
  document.getElementById("eventCoinMultiplierSelect").value = eventCoinMultiplier.toString();
  document.getElementById("eventPackDiscountSelect").value = eventPackDiscount.toString();
  document.getElementById("toggleMaintenanceBtn").textContent = isMaintenanceMode ? "ON" : "OFF";
  document.getElementById("toggleGodModeBtn").textContent = isGodModeEnabled ? "ENABLED" : "DISABLED";
  const lockdownBtn = document.getElementById("toggleLockdownBtn");
  const lockdownBadge = document.getElementById("lockdownBadgeStatus");
  if(lockdownBtn){
    lockdownBtn.textContent = isLockdownMode ? "LOCKDOWN: ON" : "LOCKDOWN: OFF";
    lockdownBtn.style.background = isLockdownMode ? "#dc2626" : "#475569";
    lockdownBtn.style.boxShadow = isLockdownMode ? "0 0 15px rgba(220, 38, 38, 0.7)" : "none";
  }
  if(lockdownBadge){
    lockdownBadge.textContent = isLockdownMode ? "STATUS: ACTIVE (LOCKDOWN ENFORCED)" : "STATUS: INACTIVE";
    lockdownBadge.style.color = isLockdownMode ? "#f87171" : "#94a3b8";
    lockdownBadge.style.background = isLockdownMode ? "rgba(220,38,38,0.3)" : "rgba(239,68,68,0.1)";
  }
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
  if(!isMasterAdmin() && !canSubAdminPerform("events")) return alert("You do not have permission to alter world events.");

  eventCoinMultiplier = parseInt(document.getElementById("eventCoinMultiplierSelect").value);
  eventPackDiscount = parseInt(document.getElementById("eventPackDiscountSelect").value);

  localStorage.setItem("cardCollectorEventCoins", eventCoinMultiplier.toString());
  localStorage.setItem("cardCollectorEventDiscount", eventPackDiscount.toString());

  updatePackPriceLabels();
  alert("World event settings broadcasted and saved!");
};

document.getElementById("toggleMaintenanceBtn").onclick = ()=>{
  if(!isMasterAdmin() && !canSubAdminPerform("events")) return alert("You do not have permission to toggle maintenance mode.");
  isMaintenanceMode = !isMaintenanceMode;
  localStorage.setItem("cardCollectorMaintenance", isMaintenanceMode.toString());
  document.getElementById("toggleMaintenanceBtn").textContent = isMaintenanceMode ? "ON" : "OFF";
  updatePackPriceLabels();
};

const toggleLockdownBtn = document.getElementById("toggleLockdownBtn");
if(toggleLockdownBtn){
  toggleLockdownBtn.onclick = ()=>{
    if(!isMasterAdmin() && !canSubAdminPerform("events")) return alert("You do not have permission to toggle server lockdown mode.");
    isLockdownMode = !isLockdownMode;
    localStorage.setItem("cardCollectorLockdown", isLockdownMode.toString());
    if(typeof window !== "undefined") window.isLockdownMode = isLockdownMode;

    const btn = document.getElementById("toggleLockdownBtn");
    const badge = document.getElementById("lockdownBadgeStatus");
    if(btn){
      btn.textContent = isLockdownMode ? "LOCKDOWN: ON" : "LOCKDOWN: OFF";
      btn.style.background = isLockdownMode ? "#dc2626" : "#475569";
      btn.style.boxShadow = isLockdownMode ? "0 0 15px rgba(220, 38, 38, 0.7)" : "none";
    }
    if(badge){
      badge.textContent = isLockdownMode ? "STATUS: ACTIVE (LOCKDOWN ENFORCED)" : "STATUS: INACTIVE";
      badge.style.color = isLockdownMode ? "#f87171" : "#94a3b8";
      badge.style.background = isLockdownMode ? "rgba(220,38,38,0.3)" : "rgba(239,68,68,0.1)";
    }

    updatePackPriceLabels();

    if(typeof broadcastLockdownMode === "function"){
      broadcastLockdownMode(isLockdownMode);
    }

    if(typeof showLiveToast === "function"){
      showLiveToast(isLockdownMode 
        ? "🚨 HIGH-ALERT SERVER LOCKDOWN ACTIVATED! All matches and booster packs are now blocked." 
        : "✅ Server lockdown lifted! Arena matches and booster packs restored.", 
        true
      );
    }
  };
}

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

  const permissions = {
    players: document.getElementById("subAdminPermPlayers") ? document.getElementById("subAdminPermPlayers").checked : true,
    studio: document.getElementById("subAdminPermStudio") ? document.getElementById("subAdminPermStudio").checked : false,
    cardManager: document.getElementById("subAdminPermCardManager") ? document.getElementById("subAdminPermCardManager").checked : false,
    economy: document.getElementById("subAdminPermEconomy") ? document.getElementById("subAdminPermEconomy").checked : false,
    events: document.getElementById("subAdminPermEvents") ? document.getElementById("subAdminPermEvents").checked : false,
    broadcast: document.getElementById("subAdminPermBroadcast") ? document.getElementById("subAdminPermBroadcast").checked : false,
    chaosLab: document.getElementById("subAdminPermChaosLab") ? document.getElementById("subAdminPermChaosLab").checked : false
  };

  subAdminRoles[target] = {
    active: true,
    dailyCap: dailyCap,
    giftedToday: 0,
    lastGiftDate: new Date().toDateString(),
    canGiftSkins: canGiftSkins,
    allowedSkinIds: allowedSkinIds,
    permissions: permissions
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
  if(!isMasterAdmin() && !canSubAdminPerform("studio")) return alert("You do not have permission to use the Card Studio.");
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

// Check if auto-unlock was chosen (default is unchecked so it behaves like every other card and you can get it from a pack!)
  const autoUnlockEl = document.getElementById("newCardAutoUnlock");
  const shouldAutoUnlock = autoUnlockEl ? autoUnlockEl.checked : false;

  if(shouldAutoUnlock){
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
  }

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
    const claimMsg = shouldAutoUnlock 
      ? "claimed to your collection! Ready for battle in Arena!" 
      : "added to Booster Packs! Open packs to discover and unlock it for battle!";
    showLiveToast(`🎨 "<b>${name}</b>" (${rarity}) ${claimMsg}`, true);
  }
};

document.getElementById("adminUpdateCardArtBtn").onclick = ()=>{
  if(!isMasterAdmin() && !canSubAdminPerform("studio")) return alert("You do not have permission to use the Card Studio.");
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
    if(!canSubAdminPerform("players") && !canSubAdminPerform("economy")) return alert("Permission Denied: Master Cam has not granted you player coin gifting powers.");
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

// Target-Specific Coin Gifting & Infinite Money Operations
function giftInfiniteCoinsToTarget(target){
  if(!target) return alert("Please type or select a target player username.");
  if(!accounts[target]){
    accounts[target] = { password: "", owned: [0], coins: "Infinity", hasPlayed: true, lastActive: Date.now() };
  } else {
    accounts[target].coins = "Infinity";
  }

  if(target.toLowerCase() === currentUser.toLowerCase()){
    coins = Infinity;
  }

  localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
  if(typeof broadcastAdminActionToTarget === "function"){
    broadcastAdminActionToTarget(target, { type: "gift_coins", amount: "Infinity" });
  }
  if(typeof playChaosSfx === "function") playChaosSfx("triumph");
  if(typeof confetti === "function") confetti({ particleCount: 90, spread: 75 });
  refreshAdminPlayerData();
  render();
  if(typeof showLiveToast === "function") showLiveToast(`⚡ Gifted ∞ INFINITE COINS to ${target}!`, true);
  alert(`⚡ SUCCESS! Gifted ∞ INFINITE COINS to ${target}! They now have unlimited money forever.`);
}

const quickInfBtn = document.getElementById("adminQuickInfiniteCoinInputBtn");
if(quickInfBtn){
  quickInfBtn.onclick = ()=>{
    const inp = document.getElementById("adminPlayerCoinsAmount");
    if(inp) inp.value = "Infinity";
  };
}

const giftInfCoinsBtn = document.getElementById("adminGiftInfiniteCoinsBtn");
if(giftInfCoinsBtn){
  giftInfCoinsBtn.onclick = ()=>{
    const target = getTargetPlayer("economyPlayerInput", "economyPlayerSelect");
    giftInfiniteCoinsToTarget(target);
  };
}

document.getElementById("adminAddPlayerCoinsBtn").onclick = ()=>{
  const target = getTargetPlayer("economyPlayerInput", "economyPlayerSelect");
  const rawInput = (document.getElementById("adminPlayerCoinsAmount").value || "").trim();
  if(!target) return alert("Please type or select a target player username.");

  if((typeof isInfiniteValue === "function" && isInfiniteValue(rawInput)) || rawInput.toLowerCase() === "infinity" || rawInput === "∞"){
    return giftInfiniteCoinsToTarget(target);
  }

  const amt = parseInt(rawInput, 10);
  if(isNaN(amt) || amt <= 0) return alert("Enter a valid positive number or type 'Infinity' / '∞'.");

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

  if(isInfiniteValue(accounts[target].coins)){
    alert(`${target} already has ∞ Infinite Coins!`);
    return;
  }

  accounts[target].coins = (accounts[target].coins || 0) + amt;
  if(target.toLowerCase() === currentUser.toLowerCase()) coins = accounts[target].coins;
  localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
  if(typeof broadcastAdminActionToTarget === "function"){
    broadcastAdminActionToTarget(target, { type: "gift_coins", amount: amt });
  }
  if(typeof playChaosSfx === "function") playChaosSfx("coins");
  refreshAdminPlayerData();
  render();
  alert(`Added ${amt.toLocaleString()} coins to ${target}.`);
};

document.getElementById("adminSetPlayerCoinsBtn").onclick = ()=>{
  if(!isMasterAdmin()) return alert("Only master admin Cam can set exact treasury balances.");
  const target = getTargetPlayer("economyPlayerInput", "economyPlayerSelect");
  const rawInput = (document.getElementById("adminPlayerCoinsAmount").value || "").trim();
  if(!target) return alert("Please type or select a target player username.");

  if((typeof isInfiniteValue === "function" && isInfiniteValue(rawInput)) || rawInput.toLowerCase() === "infinity" || rawInput === "∞"){
    return giftInfiniteCoinsToTarget(target);
  }

  const amt = parseInt(rawInput, 10);
  if(isNaN(amt) || amt < 0) return alert("Enter a valid non-negative number or 'Infinity' / '∞'.");
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
  if(!isInfiniteValue(coins)) coins += 10000;
  save();
  render();
  refreshAdminPlayerData();
  if(typeof playChaosSfx === "function") playChaosSfx("coins");
  alert("Deposited 10,000 coins to Cam.");
};

const selfInfCoinsBtn = document.getElementById("adminAddSelfInfiniteCoinsBtn");
if(selfInfCoinsBtn){
  selfInfCoinsBtn.onclick = ()=>{
    coins = Infinity;
    if(accounts[currentUser]) accounts[currentUser].coins = "Infinity";
    if(accounts[ADMIN_USERNAME]) accounts[ADMIN_USERNAME].coins = "Infinity";
    save();
    render();
    refreshAdminPlayerData();
    if(typeof playChaosSfx === "function") playChaosSfx("triumph");
    if(typeof confetti === "function") confetti({ particleCount: 100, spread: 80 });
    if(typeof showLiveToast === "function") showLiveToast("⚡ Granted Master Cam ∞ INFINITE COINS!", true);
    alert("⚡ SUCCESS! Master Cam now has ∞ INFINITE COINS! You have unlimited money forever.");
  };
};

document.getElementById("adminSaveLuckBtn").onclick = ()=>{
  if(!isMasterAdmin()) return alert("Only master admin Cam can adjust RNG drop luck.");
  adminLuckMultiplier = parseFloat(document.getElementById("adminLuckSelect").value);
  localStorage.setItem("cardCollectorLuck", adminLuckMultiplier.toString());
  alert(`Pack opening luck multiplier set to ${adminLuckMultiplier}x!`);
};

document.getElementById("adminPostLeakBtn").onclick = ()=>{
  if(!isMasterAdmin() && !canSubAdminPerform("broadcast")) return alert("You do not have permission to post broadcasts or leaks.");
  const txt = document.getElementById("adminLeakInput").value.trim();
  localStorage.setItem("cardCollectorLeak", txt);
  checkLeaksDisplay();
  alert("Broadcast transmitted.");
};
document.getElementById("adminClearLeakBtn").onclick = ()=>{
  if(!isMasterAdmin() && !canSubAdminPerform("broadcast")) return alert("You do not have permission to delete broadcasts or leaks.");
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

window.adminChangePlayerPasswordPrompt = function(username){
  if(!username) return;
  // Reload fresh accounts
  try {
    const stored = JSON.parse(localStorage.getItem("cardCollectorAccounts"));
    if(stored && typeof stored === "object") accounts = stored;
  } catch(e){}

  const acc = (typeof getUserAccount === "function") ? getUserAccount(username) : (accounts && accounts[username]);
  const currentPass = (acc && acc.password) ? acc.password : "(none set)";

  const newPass = prompt(`Change password for player [${username}]:\nCurrent password: ${currentPass}\n\nEnter new password (minimum 3 characters):`);
  if(newPass === null) return;
  const cleanPass = newPass.trim();
  if(cleanPass.length < 3){
    alert("Password must be at least 3 characters.");
    return;
  }

  const matchKey = Object.keys(accounts).find(k => k.toLowerCase() === username.toLowerCase()) || username;
  if(!accounts[matchKey]){
    accounts[matchKey] = { password: cleanPass, owned: [0], coins: 100, hasPlayed: true, lastActive: Date.now() };
  } else {
    accounts[matchKey].password = cleanPass;
  }
  localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));

  if(matchKey.toLowerCase() === "cam"){
    localStorage.setItem("cardCollectorCamPass", cleanPass);
  }

  refreshAdminPlayerData();

  // Broadcast password update to peer if online
  if(typeof broadcastAdminActionToTarget === "function"){
    broadcastAdminActionToTarget(matchKey, { type: "sync_password", password: cleanPass });
  }

  if(typeof showLiveToast === "function"){
    showLiveToast(`🔑 Password for <b>${matchKey}</b> updated to: <code>${cleanPass}</code>`, true);
  }
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

  const curAcc = (typeof getUserAccount === "function") ? getUserAccount(currentUser) : (accounts && accounts[currentUser]);
  const activeOwned = (curAcc && Array.isArray(curAcc.owned)) ? curAcc.owned : ((typeof owned !== "undefined" && Array.isArray(owned)) ? owned : []);

  customOnly.forEach((c) => {
    const cardIdx = cards.indexOf(c);
    const isOwned = activeOwned.some(x => parseInt(x, 10) === cardIdx);
    const item = document.createElement("div");
    item.style.cssText = "display:flex;align-items:center;justify-content:space-between;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.1);padding:10px 12px;border-radius:12px;gap:10px";
    
    const atkText = (c.attacks || []).map(a => `${a.name} (${typeof formatDmg === "function" ? formatDmg(a.dmg) : a.dmg})`).join(", ");
    item.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;min-width:0">
        <img src="${c.image}" style="width:36px;height:48px;border-radius:6px;object-fit:cover;border:1px solid rgba(255,255,255,0.15);flex-shrink:0">
        <div style="min-width:0">
          <div style="font-size:13px;font-weight:700;color:#f1f5f9;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span>${c.name}</span>
            <span style="font-size:10px;text-transform:uppercase;color:#38bdf8;font-weight:800;background:rgba(56,189,248,0.15);padding:1px 5px;border-radius:4px">${c.rarity}</span>
            <span style="font-size:10px;color:#4ade80;font-weight:800;background:rgba(74,222,128,0.15);padding:1px 5px;border-radius:4px">● In Booster Packs</span>
            <span style="font-size:10px;color:${isOwned ? '#38bdf8' : '#eab308'};font-weight:800;background:${isOwned ? 'rgba(56,189,248,0.15)' : 'rgba(234,179,8,0.15)'};padding:1px 5px;border-radius:4px">${isOwned ? '✓ In Collection' : '🔒 Undiscovered (In Packs)'}</span>
          </div>
          <div style="font-size:11px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${typeof formatHp === "function" ? formatHp(c.hp) : (c.hp || 100) + " HP"} • ${atkText}</div>
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button type="button" class="accountBtn" style="padding:5px 8px;font-size:11px;background:${isOwned ? 'rgba(234,179,8,0.15)' : 'rgba(74,222,128,0.15)'};border-color:${isOwned ? '#eab308' : '#4ade80'};color:${isOwned ? '#fde047' : '#86efac'}" title="${isOwned ? 'Remove from collection so you can pull it from booster packs' : 'Instantly add to your collection'}" onclick="toggleStudioCardClaim('${c.name.replace(/'/g, "\\x27")}')">
          ${isOwned ? '🔄 Return to Packs' : '🎁 Instant Claim'}
        </button>
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

window.toggleStudioCardClaim = function(cardName){
  const idx = cards.findIndex(c => c.name.toLowerCase() === cardName.toLowerCase());
  if(idx === -1) return;
  const curAcc = (typeof getUserAccount === "function") ? getUserAccount(currentUser) : (accounts && accounts[currentUser]);
  if(!curAcc) return;
  if(!Array.isArray(curAcc.owned)) curAcc.owned = [];

  const has = curAcc.owned.some(x => parseInt(x, 10) === idx);
  if(has){
    curAcc.owned = curAcc.owned.filter(x => parseInt(x, 10) !== idx);
    if(typeof owned !== "undefined" && Array.isArray(owned)){
      owned = owned.filter(x => parseInt(x, 10) !== idx);
      if(typeof window !== "undefined") window.owned = owned;
    }
    if(typeof save === "function") save();
    if(typeof render === "function") render();
    renderStudioCustomCards();
    if(typeof showLiveToast === "function") showLiveToast(`🔄 "${cardName}" returned to Booster Packs only! Open packs to discover and pull it!`, true);
  } else {
    curAcc.owned.push(idx);
    if(typeof owned !== "undefined" && Array.isArray(owned)){
      if(!owned.some(x => parseInt(x, 10) === idx)) owned.push(idx);
      if(typeof window !== "undefined") window.owned = owned;
    }
    if(typeof save === "function") save();
    if(typeof render === "function") render();
    renderStudioCustomCards();
    if(typeof showLiveToast === "function") showLiveToast(`🎁 "${cardName}" claimed directly to your collection! You can now use it in the Arena.`, true);
  }
};

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

// ==========================================
// MASTER CARD MANAGER
// (Inspect every card, edit/delete attacks, delete cards)
// ==========================================

function sanitizeAllPlayerOwned(deletedIdx){
  try {
    const rawAccs = localStorage.getItem("cardCollectorAccounts");
    if(rawAccs){
      const accs = JSON.parse(rawAccs);
      Object.keys(accs).forEach(uname => {
        const u = accs[uname];
        if(Array.isArray(u.owned)){
          u.owned = u.owned
            .filter(idx => idx !== deletedIdx)
            .map(idx => (idx > deletedIdx ? idx - 1 : idx));
          if(u.owned.length === 0 && Array.isArray(cards) && cards.length > 0){
            u.owned = [0];
          }
        }
      });
      accounts = accs;
      localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
      if(currentUser && accounts[currentUser]){
        owned = accounts[currentUser].owned;
        if(typeof window !== "undefined") window.owned = owned;
      }
    }
  } catch(e){}
}
if(typeof window !== "undefined") window.sanitizeAllPlayerOwned = sanitizeAllPlayerOwned;


function getAllCardsForManager(){
  const list = [];
  const seenIds = new Set();
  const seenNames = new Set();
  const deleted = (typeof getDeletedCardsFromStorage === "function") ? getDeletedCardsFromStorage() : [];
  const overrides = (typeof getCardOverridesFromStorage === "function") ? getCardOverridesFromStorage() : {};

  function addCard(rawCard, defaultSource){
    if(!rawCard || !rawCard.name) return;
    const nameKey = rawCard.name.toLowerCase().trim();
    const idKey = rawCard.id || ((rawCard.isUnreleased ? "vault_" : "card_") + nameKey.replace(/\s+/g, "_"));
    rawCard.id = idKey;

    const uniqueLookup = (rawCard.isUnreleased ? "vault:" : "card:") + (rawCard.id || nameKey);
    if(seenIds.has(uniqueLookup)) return;
    seenIds.add(uniqueLookup);

    let src = defaultSource;
    if(rawCard.isUnreleased) src = "vault";
    else if(rawCard.isStudio || rawCard.isCustom) src = "studio";

    // Apply any stored overrides for attacks or hp
    const ov = overrides[idKey] || overrides[nameKey];
    if(ov){
      if(ov.hp !== undefined) rawCard.hp = ov.hp;
      if(Array.isArray(ov.attacks)) rawCard.attacks = ov.attacks;
    }

    // Ensure valid attacks array
    if(!Array.isArray(rawCard.attacks) || rawCard.attacks.length === 0){
      rawCard.attacks = [
        { name: rawCard.attack || "Strike", dmg: rawCard.dmg || 20 },
        { name: "Power Burst", dmg: Math.floor((rawCard.dmg || 20) * 1.5) }
      ];
    }

    // Ensure valid hp
    if(rawCard.hp === undefined || rawCard.hp === null || rawCard.hp === ""){
      rawCard.hp = 80;
    }

    const isMarkedDeleted = deleted.includes(idKey) || deleted.includes(nameKey);

    list.push({
      card: rawCard,
      id: idKey,
      source: src,
      isDeleted: isMarkedDeleted
    });
  }

  // 1. Active cards in memory
  if(Array.isArray(cards)){
    cards.forEach(c => addCard(c, (c.isStudio || c.isCustom) ? "studio" : "default"));
  }

  // 2. All default cards catalog (ensures ALL 37 base cards are always present!)
  const defPool = (typeof defaultCards !== "undefined" && Array.isArray(defaultCards))
    ? defaultCards
    : ((typeof window !== "undefined" && Array.isArray(window.defaultCards)) ? window.defaultCards : []);
  defPool.forEach(c => addCard(c, "default"));

  // 3. Custom Studio cards from storage
  if(typeof getCustomCardsFromStorage === "function"){
    const storedCustom = getCustomCardsFromStorage();
    if(Array.isArray(storedCustom)){
      storedCustom.forEach(c => addCard(c, "studio"));
    }
  }

  // 4. Vault / Unreleased prototype cards
  let vaultPool = [];
  if(typeof unreleasedCards !== "undefined" && Array.isArray(unreleasedCards)){
    vaultPool = unreleasedCards;
  } else if(typeof window !== "undefined" && Array.isArray(window.unreleasedCards)){
    vaultPool = window.unreleasedCards;
  } else {
    try {
      const stored = JSON.parse(localStorage.getItem("cardCollectorUnreleasedCards"));
      if(Array.isArray(stored)) vaultPool = stored;
    } catch(e){}
  }
  vaultPool.forEach(c => addCard(c, "vault"));

  return list;
}
if(typeof window !== "undefined") window.getAllCardsForManager = getAllCardsForManager;

function renderCardManager(){
  const container = document.getElementById("cardManagerList");
  if(!container) return;

  const allCards = getAllCardsForManager();
  const totalCountEl = document.getElementById("cardManagerTotalCount");
  if(totalCountEl) totalCountEl.textContent = allCards.length;

  const searchInput = document.getElementById("cardManagerSearchInput");
  const raritySelect = document.getElementById("cardManagerRarityFilter");
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const filterRarity = (raritySelect && raritySelect.value) ? raritySelect.value : "all";

  const filtered = allCards.filter(item => {
    const c = item.card;
    if(!c) return false;

    // Filter by rarity / special source
    if(filterRarity === "studio" && !c.isStudio && !c.isCustom) return false;
    if(filterRarity === "vault" && item.source !== "vault") return false;
    if(filterRarity === "infinite_hp" && !isInfiniteValue(c.hp)) return false;
    if(filterRarity === "infinite_dmg" && !(Array.isArray(c.attacks) && c.attacks.some(a => isInfiniteValue(a.dmg)))) return false;
    if(filterRarity !== "all" && filterRarity !== "studio" && filterRarity !== "vault" && filterRarity !== "infinite_hp" && filterRarity !== "infinite_dmg"){
      if(c.rarity.toLowerCase() !== filterRarity.toLowerCase()) return false;
    }

    // Filter by query (name, attacks, desc, rarity)
    if(query){
      const nameMatch = (c.name || "").toLowerCase().includes(query);
      const descMatch = (c.desc || "").toLowerCase().includes(query);
      const rarityMatch = (c.rarity || "").toLowerCase().includes(query);
      const atkMatch = Array.isArray(c.attacks) && c.attacks.some(a => (a.name || "").toLowerCase().includes(query) || String(a.dmg).toLowerCase().includes(query));
      if(!nameMatch && !descMatch && !rarityMatch && !atkMatch) return false;
    }

    return true;
  });

  const showingCountEl = document.getElementById("cardManagerShowingCount");
  if(showingCountEl) showingCountEl.textContent = filtered.length;

  if(filtered.length === 0){
    container.innerHTML = `
      <div style="text-align:center;padding:36px;color:#94a3b8;background:rgba(15,23,42,0.4);border-radius:12px;border:1px dashed rgba(255,255,255,0.1)">
        <div style="font-size:32px;margin-bottom:8px">🔍</div>
        <b style="color:#f1f5f9;font-size:14px">No cards found matching your search.</b>
        <p style="font-size:12px;margin:4px 0 0 0">Try clearing the search or changing the filter to "All Rarities & Types".</p>
      </div>
    `;
    return;
  }

  let html = "";
  filtered.forEach((item, cardOrder) => {
    const c = item.card;
    const cardId = item.id;
    const attacks = Array.isArray(c.attacks) ? c.attacks : [];
    const rTheme = (typeof getRarityTheme === "function") ? getRarityTheme(c.rarity) : { bg: "rgba(148,163,184,0.15)", text: "#cbd5e1", border: "#64748b" };

    let typeBadge = "";
    if(c.isStudio || c.isCustom){
      typeBadge = `<span style="font-size:10px;font-weight:900;background:rgba(168,85,247,0.25);color:#d8b4fe;border:1px solid rgba(168,85,247,0.4);padding:2px 7px;border-radius:4px">🎨 STUDIO</span>`;
    } else if(item.source === "vault"){
      typeBadge = `<span style="font-size:10px;font-weight:900;background:rgba(244,63,94,0.25);color:#fda4af;border:1px solid rgba(244,63,94,0.4);padding:2px 7px;border-radius:4px">🔒 VAULT</span>`;
    } else {
      typeBadge = `<span style="font-size:10px;font-weight:900;background:rgba(100,116,139,0.2);color:#cbd5e1;border:1px solid rgba(100,116,139,0.3);padding:2px 7px;border-radius:4px">DEFAULT</span>`;
    }

    let deletedNotice = "";
    if(item.isDeleted){
      deletedNotice = `<span style="font-size:10px;font-weight:900;background:rgba(239,68,68,0.2);color:#fca5a5;border:1px solid #ef4444;padding:2px 7px;border-radius:4px">⚠️ REMOVED FROM PACKS</span>`;
    }

    let imgHtml = "";
    if(c.image && c.image.startsWith("data:image")){
      imgHtml = `<img src="${c.image}" style="width:100%;height:100%;object-fit:cover">`;
    } else if(c.image && (c.image.startsWith("http://") || c.image.startsWith("https://"))){
      imgHtml = `<img src="${c.image}" style="width:100%;height:100%;object-fit:cover" onerror="this.src='assets/placeholder.png'">`;
    } else {
      imgHtml = `<div style="font-size:28px">🃏</div>`;
    }

    let attacksListHtml = "";
    if(attacks.length === 0){
      attacksListHtml = `<div style="font-size:11px;color:#94a3b8;font-style:italic;padding:4px 0">No attacks configured for this card. Use the form below to add one!</div>`;
    } else {
      attacks.forEach((atk, aIdx) => {
        const isAtkInf = (typeof isInfiniteValue === "function" && isInfiniteValue(atk.dmg)) || atk.dmg === "Infinity";
        attacksListHtml += `
          <div class="mgr-atk-row" style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.04);padding:8px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.08);flex-wrap:wrap;gap:8px">
            <div style="display:flex;align-items:center;gap:6px;flex:1;min-width:240px;flex-wrap:wrap">
              <span style="color:#f59e0b;font-size:14px">⚔️</span>
              <input type="text" class="adminInput mgr-edit-atk-name" data-card-id="${cardId}" data-atk-idx="${aIdx}" value="${atk.name || ''}" placeholder="Attack Name" style="width:130px;min-width:110px;margin:0;padding:4px 7px;font-size:12px;flex:1">
              <input type="text" class="adminInput mgr-edit-atk-dmg" data-card-id="${cardId}" data-atk-idx="${aIdx}" value="${isAtkInf ? 'Infinity' : (atk.dmg || 20)}" placeholder="DMG (e.g. 35 or Infinity)" style="width:90px;margin:0;padding:4px 7px;font-size:12px;font-weight:700">
              
              ${isAtkInf
                ? `<span style="font-size:10px;font-weight:900;color:#f43f5e;background:rgba(244,63,94,0.25);padding:3px 7px;border-radius:4px;border:1px solid #f43f5e;box-shadow:0 0 8px rgba(244,63,94,0.5)">⚡ ∞ INFINITE DMG</span>`
                : `<span style="font-size:10px;font-weight:900;color:#ef4444;background:rgba(239,68,68,0.15);padding:3px 6px;border-radius:4px;border:1px solid rgba(239,68,68,0.3)">${atk.dmg || 20} DMG</span>`
              }

              <!-- Quick Damage Presets -->
              <div style="display:flex;align-items:center;gap:3px">
                <button type="button" class="accountBtn mgr-dmg-chip" data-card-id="${cardId}" data-atk-idx="${aIdx}" data-val="25" style="background:rgba(255,255,255,0.06);color:#cbd5e1;padding:2px 5px;font-size:9px;font-weight:700">25</button>
                <button type="button" class="accountBtn mgr-dmg-chip" data-card-id="${cardId}" data-atk-idx="${aIdx}" data-val="50" style="background:rgba(255,255,255,0.06);color:#cbd5e1;padding:2px 5px;font-size:9px;font-weight:700">50</button>
                <button type="button" class="accountBtn mgr-dmg-chip" data-card-id="${cardId}" data-atk-idx="${aIdx}" data-val="100" style="background:rgba(255,255,255,0.06);color:#cbd5e1;padding:2px 5px;font-size:9px;font-weight:700">100</button>
                <button type="button" class="accountBtn mgr-dmg-chip" data-card-id="${cardId}" data-atk-idx="${aIdx}" data-val="Infinity" style="background:rgba(244,63,94,0.2);color:#fca5a5;border:1px solid rgba(244,63,94,0.4);padding:2px 5px;font-size:9px;font-weight:800">∞ Inf</button>
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">
              <button class="accountBtn mgr-save-atk-btn" data-card-id="${cardId}" data-atk-idx="${aIdx}" style="background:#059669;color:#fff;padding:4px 10px;font-size:11px;font-weight:800" title="Save updated attack name or damage number">
                💾 Save DMG
              </button>
              <button class="accountBtn mgr-set-atk-inf-btn" data-card-id="${cardId}" data-atk-idx="${aIdx}" style="background:linear-gradient(135deg,#be123c,#e11d48);color:#fff;padding:4px 10px;font-size:11px;font-weight:900;border:1px solid #f43f5e;box-shadow:0 0 8px rgba(225,29,72,0.4)" title="Make this attack deal infinite damage (Instant KO)">
                ⚡ Set ∞ DMG
              </button>
              <button class="accountBtn mgr-del-atk-btn" data-card-id="${cardId}" data-atk-idx="${aIdx}" style="background:#7f1d1d;color:#fca5a5;padding:4px 8px;font-size:11px;font-weight:700" title="Delete this attack">
                🗑️
              </button>
            </div>
          </div>
        `;
      });
    }

    const isCardInfHp = (typeof isInfiniteValue === "function" && isInfiniteValue(c.hp)) || c.hp === "Infinity";

    html += `
      <div class="adminCard" style="border:1px solid rgba(255,255,255,0.1);background:rgba(30,41,59,0.7);padding:14px;border-radius:10px;margin-bottom:0">
        <div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap">
          <!-- Thumbnail preview -->
          <div style="width:70px;height:95px;flex-shrink:0;border-radius:8px;overflow:hidden;border:2px solid ${rTheme.border};background:#0f172a;display:flex;align-items:center;justify-content:center;position:relative">
            ${imgHtml}
            <div style="position:absolute;top:2px;left:2px;background:rgba(0,0,0,0.7);color:#94a3b8;font-size:9px;font-weight:900;padding:1px 4px;border-radius:3px">
              #${cardOrder + 1}
            </div>
          </div>

          <!-- Card Details & Actions -->
          <div style="flex:1;min-width:240px">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:4px">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <b style="font-size:15px;color:#fff">${c.name}</b>
                <span style="font-size:10px;font-weight:900;text-transform:uppercase;padding:2px 7px;border-radius:4px;background:${rTheme.bg};color:${rTheme.text};border:1px solid ${rTheme.border}">
                  ${c.rarity}
                </span>
                ${isCardInfHp
                  ? `<span style="font-size:11px;font-weight:900;color:#38bdf8;background:rgba(56,189,248,0.25);border:1px solid #38bdf8;padding:2px 8px;border-radius:4px;box-shadow:0 0 8px rgba(56,189,248,0.5)">❤️ ∞ INFINITE HP</span>`
                  : `<span style="font-size:11px;color:#fca5a5;font-weight:800;background:rgba(239,68,68,0.12);padding:2px 7px;border-radius:4px;border:1px solid rgba(239,68,68,0.25)">❤️ ${c.hp || 80} HP</span>`
                }
                ${typeBadge}
                ${deletedNotice}
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                ${item.isDeleted
                  ? `<button class="accountBtn mgr-restore-card-btn" data-card-id="${cardId}" style="background:#059669;color:#fff;padding:4px 10px;font-size:11px;font-weight:800">🔄 Restore to Packs</button>`
                  : `<button class="accountBtn mgr-del-card-btn" data-card-id="${cardId}" style="background:#dc2626;color:#fff;padding:4px 10px;font-size:11px;font-weight:800;border:1px solid rgba(239,68,68,0.5)">🗑️ Delete Card</button>`
                }
              </div>
            </div>

            <p style="font-size:11px;color:#94a3b8;margin:2px 0 8px 0;line-height:1.3">${c.desc || "No description provided."}</p>

            <!-- Health Editor Section: Any Number OR Infinite HP -->
            <div style="display:flex;align-items:center;gap:8px;margin:8px 0;background:rgba(15,23,42,0.65);border:1px solid rgba(255,255,255,0.08);padding:8px 12px;border-radius:6px;flex-wrap:wrap">
              <span style="font-size:12px;font-weight:800;color:#fca5a5;display:flex;align-items:center;gap:4px">
                ❤️ Edit Health:
              </span>
              <input type="text" class="adminInput mgr-hp-input" data-card-id="${cardId}" value="${isCardInfHp ? 'Infinity' : (c.hp || 80)}" placeholder="HP (e.g. 100 or Infinity)" style="width:110px;margin:0;padding:5px 8px;font-size:12px;font-weight:700">
              
              <button class="accountBtn mgr-save-hp-btn" data-card-id="${cardId}" style="background:#059669;color:#fff;padding:5px 12px;font-size:11px;font-weight:800" title="Save this number or Infinity as card health">
                💾 Save HP
              </button>
              <button class="accountBtn mgr-infinite-hp-btn" data-card-id="${cardId}" style="background:linear-gradient(135deg,#0284c7,#38bdf8);color:#fff;padding:5px 12px;font-size:11px;font-weight:900;border:1px solid #38bdf8;box-shadow:0 0 10px rgba(56,189,248,0.5)" title="One-click make this card have Infinite Health">
                ♾️ Set Infinite HP
              </button>

              <!-- Quick HP Chips -->
              <div style="display:flex;align-items:center;gap:4px">
                <span style="font-size:10px;color:#64748b">Presets:</span>
                <button type="button" class="accountBtn mgr-hp-chip" data-card-id="${cardId}" data-val="80" style="background:rgba(255,255,255,0.06);color:#cbd5e1;padding:2px 6px;font-size:10px;font-weight:700">80</button>
                <button type="button" class="accountBtn mgr-hp-chip" data-card-id="${cardId}" data-val="150" style="background:rgba(255,255,255,0.06);color:#cbd5e1;padding:2px 6px;font-size:10px;font-weight:700">150</button>
                <button type="button" class="accountBtn mgr-hp-chip" data-card-id="${cardId}" data-val="250" style="background:rgba(255,255,255,0.06);color:#cbd5e1;padding:2px 6px;font-size:10px;font-weight:700">250</button>
                <button type="button" class="accountBtn mgr-hp-chip" data-card-id="${cardId}" data-val="500" style="background:rgba(255,255,255,0.06);color:#cbd5e1;padding:2px 6px;font-size:10px;font-weight:700">500</button>
                <button type="button" class="accountBtn mgr-hp-chip" data-card-id="${cardId}" data-val="Infinity" style="background:rgba(56,189,248,0.15);color:#38bdf8;border:1px solid rgba(56,189,248,0.4);padding:2px 6px;font-size:10px;font-weight:800">∞ Inf</button>
              </div>
            </div>

            <!-- Attacks Manager Section: Any Number OR Infinite Damage -->
            <div style="background:rgba(15,23,42,0.6);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:10px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px">
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="font-size:12px;font-weight:800;color:#38bdf8">⚔️ Combat Attacks (${attacks.length})</span>
                  <span style="font-size:10px;color:#64748b">Instant combat & pack sync</span>
                </div>
                <div style="display:flex;align-items:center;gap:6px">
                  <button class="accountBtn mgr-all-inf-dmg-btn" data-card-id="${cardId}" style="background:linear-gradient(135deg,#e11d48,#be123c);color:#fff;padding:3px 10px;font-size:11px;font-weight:900;border:1px solid #f43f5e;box-shadow:0 0 8px rgba(244,63,94,0.4)" title="Set all attacks on this card to deal Infinite Damage (Instant KO)">
                    ⚡ All Attacks ∞ DMG
                  </button>
                </div>
              </div>

              <!-- List of attacks -->
              <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px">
                ${attacksListHtml}
              </div>

              <!-- Add Attack Form -->
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;background:rgba(0,0,0,0.3);padding:6px 8px;border-radius:6px;border:1px dashed rgba(56,189,248,0.35)">
                <input type="text" class="adminInput mgr-new-atk-name" placeholder="New Attack Name (e.g. Oblivion Strike)" style="flex:2;min-width:130px;margin:0;padding:5px 8px;font-size:12px">
                <input type="text" class="adminInput mgr-new-atk-dmg" placeholder="DMG or Infinity" value="25" style="width:95px;margin:0;padding:5px 8px;font-size:12px;font-weight:700">
                <button class="accountBtn mgr-quick-inf-dmg-btn" type="button" style="background:rgba(244,63,94,0.2);color:#fca5a5;border:1px solid rgba(244,63,94,0.5);padding:5px 8px;font-size:11px;font-weight:800" title="Quickly set damage to Infinity">
                  ♾️ Infinite
                </button>
                <button class="accountBtn mgr-add-atk-btn" data-card-id="${cardId}" style="background:#0284c7;color:#fff;padding:5px 12px;font-size:11px;font-weight:800;white-space:nowrap">
                  ➕ Add Attack
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Wire Save HP Buttons
  container.querySelectorAll(".mgr-save-hp-btn").forEach(btn => {
    btn.onclick = ()=>{
      const cardId = btn.getAttribute("data-card-id");
      const parentRow = btn.parentElement;
      const hpInput = parentRow ? parentRow.querySelector(".mgr-hp-input") : null;
      const hpVal = hpInput ? hpInput.value.trim() : "";
      handleCardManagerSaveHp(cardId, hpVal);
    };
  });

  // Wire HP Input Enter Key
  container.querySelectorAll(".mgr-hp-input").forEach(inp => {
    inp.onkeydown = (e)=>{
      if(e.key === "Enter"){
        e.preventDefault();
        const cardId = inp.getAttribute("data-card-id");
        handleCardManagerSaveHp(cardId, inp.value.trim());
      }
    };
  });

  // Wire HP Preset Chips
  container.querySelectorAll(".mgr-hp-chip").forEach(chip => {
    chip.onclick = ()=>{
      const cardId = chip.getAttribute("data-card-id");
      const val = chip.getAttribute("data-val");
      handleCardManagerSaveHp(cardId, val);
    };
  });

  // Wire Set Infinite HP Buttons
  container.querySelectorAll(".mgr-infinite-hp-btn").forEach(btn => {
    btn.onclick = ()=>{
      const cardId = btn.getAttribute("data-card-id");
      handleCardManagerSetInfiniteHp(cardId);
    };
  });

  // Wire Save Attack Name/DMG Buttons
  container.querySelectorAll(".mgr-save-atk-btn").forEach(btn => {
    btn.onclick = ()=>{
      const cardId = btn.getAttribute("data-card-id");
      const atkIdx = parseInt(btn.getAttribute("data-atk-idx"), 10);
      const row = btn.closest(".mgr-atk-row");
      const nameInput = row ? row.querySelector(".mgr-edit-atk-name") : null;
      const dmgInput = row ? row.querySelector(".mgr-edit-atk-dmg") : null;
      const newName = nameInput ? nameInput.value.trim() : "";
      const newDmg = dmgInput ? dmgInput.value.trim() : "";
      handleCardManagerSaveAttack(cardId, atkIdx, newName, newDmg);
    };
  });

  // Wire Attack Input Enter Key
  container.querySelectorAll(".mgr-edit-atk-dmg, .mgr-edit-atk-name").forEach(inp => {
    inp.onkeydown = (e)=>{
      if(e.key === "Enter"){
        e.preventDefault();
        const cardId = inp.getAttribute("data-card-id");
        const atkIdx = parseInt(inp.getAttribute("data-atk-idx"), 10);
        const row = inp.closest(".mgr-atk-row");
        const nameInput = row ? row.querySelector(".mgr-edit-atk-name") : null;
        const dmgInput = row ? row.querySelector(".mgr-edit-atk-dmg") : null;
        const newName = nameInput ? nameInput.value.trim() : "";
        const newDmg = dmgInput ? dmgInput.value.trim() : "";
        handleCardManagerSaveAttack(cardId, atkIdx, newName, newDmg);
      }
    };
  });

  // Wire Damage Preset Chips
  container.querySelectorAll(".mgr-dmg-chip").forEach(chip => {
    chip.onclick = ()=>{
      const cardId = chip.getAttribute("data-card-id");
      const atkIdx = parseInt(chip.getAttribute("data-atk-idx"), 10);
      const val = chip.getAttribute("data-val");
      const row = chip.closest(".mgr-atk-row");
      const nameInput = row ? row.querySelector(".mgr-edit-atk-name") : null;
      const currentName = nameInput ? nameInput.value.trim() : "";
      handleCardManagerSaveAttack(cardId, atkIdx, currentName, val);
    };
  });

  // Wire Set All Attacks to Infinite DMG Buttons
  container.querySelectorAll(".mgr-all-inf-dmg-btn").forEach(btn => {
    btn.onclick = ()=>{
      const cardId = btn.getAttribute("data-card-id");
      handleCardManagerSetAllAttacksInfiniteDmg(cardId);
    };
  });

  // Wire Set Attack Infinite DMG Buttons
  container.querySelectorAll(".mgr-set-atk-inf-btn").forEach(btn => {
    btn.onclick = ()=>{
      const cardId = btn.getAttribute("data-card-id");
      const atkIdx = parseInt(btn.getAttribute("data-atk-idx"), 10);
      handleCardManagerSetAttackInfiniteDmg(cardId, atkIdx);
    };
  });

  // Wire Delete Attack Buttons
  container.querySelectorAll(".mgr-del-atk-btn").forEach(btn => {
    btn.onclick = ()=>{
      const cardId = btn.getAttribute("data-card-id");
      const atkIdx = parseInt(btn.getAttribute("data-atk-idx"), 10);
      handleCardManagerDeleteAttack(cardId, atkIdx);
    };
  });

  // Wire Quick Infinite DMG Buttons in Add Attack Form
  container.querySelectorAll(".mgr-quick-inf-dmg-btn").forEach(btn => {
    btn.onclick = ()=>{
      const parentForm = btn.parentElement;
      const dmgInput = parentForm ? parentForm.querySelector(".mgr-new-atk-dmg") : null;
      if(dmgInput) dmgInput.value = "Infinity";
    };
  });

  // Wire Add Attack Buttons
  container.querySelectorAll(".mgr-add-atk-btn").forEach(btn => {
    btn.onclick = ()=>{
      const cardId = btn.getAttribute("data-card-id");
      const parentForm = btn.parentElement;
      const nameInput = parentForm.querySelector(".mgr-new-atk-name");
      const dmgInput = parentForm.querySelector(".mgr-new-atk-dmg");
      const attackName = nameInput ? nameInput.value.trim() : "";
      const dmgVal = dmgInput ? dmgInput.value.trim() : "25";
      handleCardManagerAddAttack(cardId, attackName, dmgVal);
    };
  });

  // Wire Delete Card Buttons
  container.querySelectorAll(".mgr-del-card-btn").forEach(btn => {
    btn.onclick = ()=>{
      const cardId = btn.getAttribute("data-card-id");
      handleCardManagerDeleteCard(cardId);
    };
  });

  // Wire Restore Card Buttons
  container.querySelectorAll(".mgr-restore-card-btn").forEach(btn => {
    btn.onclick = ()=>{
      const cardId = btn.getAttribute("data-card-id");
      handleCardManagerRestoreCard(cardId);
    };
  });
}
if(typeof window !== "undefined") window.renderCardManager = renderCardManager;

function findCardByIdInManager(cardId){
  if(!cardId) return null;
  const allCards = getAllCardsForManager();
  const lowerId = String(cardId).toLowerCase().trim();
  const match = allCards.find(item => {
    if(item.id && item.id.toLowerCase() === lowerId) return true;
    if(item.card && item.card.id && item.card.id.toLowerCase() === lowerId) return true;
    if(item.card && item.card.name && item.card.name.toLowerCase() === lowerId) return true;
    return false;
  });
  if(match) return match;

  if(Array.isArray(cards)){
    const c = cards.find(item => (item.id && item.id.toLowerCase() === lowerId) || (item.name && item.name.toLowerCase() === lowerId));
    if(c) return { card: c, id: c.id || lowerId, source: (c.isStudio || c.isCustom) ? "studio" : "default" };
  }
  return null;
}

function handleCardManagerRestoreCard(cardId){
  if(!isMasterAdmin() && !canSubAdminPerform("cardManager")) return alert("You do not have permission to restore cards.");
  const found = findCardByIdInManager(cardId);
  if(!found) return alert("Card not found.");

  const card = found.card;
  const idKey = card.id || ("card_" + card.name.toLowerCase().replace(/\s+/g, "_"));

  if(typeof getDeletedCardsFromStorage === "function" && typeof saveDeletedCardsToStorage === "function"){
    const deleted = getDeletedCardsFromStorage();
    const filtered = deleted.filter(d => d !== idKey && d !== card.name.toLowerCase());
    saveDeletedCardsToStorage(filtered);
  }

  if(!card.isUnreleased && Array.isArray(cards) && !cards.some(c => c.name.toLowerCase() === card.name.toLowerCase())){
    cards.push(card);
  }

  renderCardManager();
  if(typeof render === "function") render();
  if(typeof initCardSelect === "function") initCardSelect();

  if(typeof showLiveToast === "function"){
    showLiveToast(`🔄 Restored card "${card.name}" to active booster packs!`, true);
  }
}
if(typeof window !== "undefined") window.handleCardManagerRestoreCard = handleCardManagerRestoreCard;

function handleCardManagerSaveHp(cardId, hpValRaw){
  if(!isMasterAdmin() && !canSubAdminPerform("cardManager")) return alert("You do not have permission to modify card stats.");
  const found = findCardByIdInManager(cardId);
  if(!found) return alert("Card not found.");

  const card = found.card;
  let newHp;
  const rawStr = String(hpValRaw || "").trim().toLowerCase();
  if(rawStr === "infinity" || rawStr === "infinite" || rawStr === "∞" || rawStr === "999999999" || hpValRaw === Infinity){
    newHp = "Infinity";
  } else {
    const num = parseInt(hpValRaw, 10);
    if(isNaN(num) || num <= 0){
      return alert("Please enter a valid positive number for HP (e.g. 100, 250), or 'Infinity'.");
    }
    newHp = num;
  }

  card.hp = newHp;

  // Persist HP in overrides
  if(typeof getCardOverridesFromStorage === "function" && typeof saveCardOverridesToStorage === "function"){
    const overrides = getCardOverridesFromStorage();
    const idKey = card.id || ("card_" + card.name.toLowerCase().replace(/\s+/g, "_"));
    overrides[idKey] = overrides[idKey] || {};
    overrides[idKey].hp = newHp;
    if(card.name) overrides[card.name.toLowerCase()] = overrides[idKey];
    saveCardOverridesToStorage(overrides);
  }

  // Sync in active cards array
  if(Array.isArray(cards)){
    const activeMatch = cards.find(c => (c.id && c.id === card.id) || (c.name && c.name.toLowerCase() === card.name.toLowerCase()));
    if(activeMatch){
      activeMatch.hp = newHp;
    }
  }

  if(card.isStudio || card.isCustom){
    if(typeof saveCustomCardsToStorage === "function") saveCustomCardsToStorage();
  }
  if(found.source === "vault"){
    try { localStorage.setItem("cardCollectorUnreleasedCards", JSON.stringify(unreleasedCards)); } catch(e){}
  }

  // Restore to active if it was deleted
  if(typeof getDeletedCardsFromStorage === "function" && typeof saveDeletedCardsToStorage === "function"){
    const deleted = getDeletedCardsFromStorage();
    const idKey = card.id || ("card_" + card.name.toLowerCase().replace(/\s+/g, "_"));
    const filtered = deleted.filter(d => d !== idKey && d !== card.name.toLowerCase());
    if(filtered.length !== deleted.length) saveDeletedCardsToStorage(filtered);
  }

  if(typeof broadcastCardHpUpdated === "function"){
    broadcastCardHpUpdated(card.id || card.name, newHp);
  }

  renderCardManager();
  if(typeof render === "function") render();

  if(typeof showLiveToast === "function"){
    showLiveToast(`❤️ Set HP of "${card.name}" to ${newHp === "Infinity" ? "∞ INFINITE" : newHp}!`, true);
  }
}
if(typeof window !== "undefined") window.handleCardManagerSaveHp = handleCardManagerSaveHp;

function handleCardManagerSetInfiniteHp(cardId){
  handleCardManagerSaveHp(cardId, "Infinity");
}
if(typeof window !== "undefined") window.handleCardManagerSetInfiniteHp = handleCardManagerSetInfiniteHp;

function handleCardManagerSaveAttack(cardId, atkIdx, newName, newDmgRaw){
  if(!isMasterAdmin() && !canSubAdminPerform("cardManager")) return alert("You do not have permission to modify card attacks.");
  const found = findCardByIdInManager(cardId);
  if(!found) return alert("Card not found.");

  const card = found.card;
  if(!Array.isArray(card.attacks) || atkIdx < 0 || atkIdx >= card.attacks.length){
    return alert("Invalid attack index.");
  }

  let dmgVal;
  const rawStr = String(newDmgRaw || "").trim().toLowerCase();
  if(rawStr === "infinity" || rawStr === "infinite" || rawStr === "∞" || rawStr === "999999999" || newDmgRaw === Infinity){
    dmgVal = "Infinity";
  } else {
    const num = parseInt(newDmgRaw, 10);
    if(isNaN(num) || num <= 0){
      return alert("Please enter a valid damage value (e.g. 25, 50, 100), or 'Infinity'.");
    }
    dmgVal = num;
  }

  if(newName && newName.trim()) card.attacks[atkIdx].name = newName.trim();
  card.attacks[atkIdx].dmg = dmgVal;

  // Persist attack changes
  if(typeof getCardOverridesFromStorage === "function" && typeof saveCardOverridesToStorage === "function"){
    const overrides = getCardOverridesFromStorage();
    const idKey = card.id || ("card_" + card.name.toLowerCase().replace(/\s+/g, "_"));
    overrides[idKey] = overrides[idKey] || {};
    overrides[idKey].attacks = card.attacks;
    if(card.name) overrides[card.name.toLowerCase()] = overrides[idKey];
    saveCardOverridesToStorage(overrides);
  }

  // Sync in active cards array
  if(Array.isArray(cards)){
    const activeMatch = cards.find(c => (c.id && c.id === card.id) || (c.name && c.name.toLowerCase() === card.name.toLowerCase()));
    if(activeMatch){
      activeMatch.attacks = card.attacks;
    }
  }

  if(card.isStudio || card.isCustom){
    if(typeof saveCustomCardsToStorage === "function") saveCustomCardsToStorage();
  }
  if(found.source === "vault"){
    try { localStorage.setItem("cardCollectorUnreleasedCards", JSON.stringify(unreleasedCards)); } catch(e){}
  }

  if(typeof broadcastCardAttacksUpdated === "function"){
    broadcastCardAttacksUpdated(card.id || card.name, card.attacks);
  }

  renderCardManager();
  if(typeof render === "function") render();

  if(typeof showLiveToast === "function"){
    showLiveToast(`⚔️ Attack "${card.attacks[atkIdx].name}" on ${card.name} updated to ${dmgVal === "Infinity" ? "∞ INFINITE DMG" : dmgVal + " DMG"}!`, true);
  }
}
if(typeof window !== "undefined") window.handleCardManagerSaveAttack = handleCardManagerSaveAttack;

function handleCardManagerSetAllAttacksInfiniteDmg(cardId){
  if(!isMasterAdmin() && !canSubAdminPerform("cardManager")) return alert("You do not have permission to modify card attacks.");
  const found = findCardByIdInManager(cardId);
  if(!found) return alert("Card not found.");

  const card = found.card;
  if(!Array.isArray(card.attacks) || card.attacks.length === 0){
    card.attacks = [{ name: "Oblivion Strike", dmg: "Infinity" }];
  } else {
    card.attacks.forEach(atk => { atk.dmg = "Infinity"; });
  }

  // Persist attack changes
  if(typeof getCardOverridesFromStorage === "function" && typeof saveCardOverridesToStorage === "function"){
    const overrides = getCardOverridesFromStorage();
    const idKey = card.id || ("card_" + card.name.toLowerCase().replace(/\s+/g, "_"));
    overrides[idKey] = overrides[idKey] || {};
    overrides[idKey].attacks = card.attacks;
    if(card.name) overrides[card.name.toLowerCase()] = overrides[idKey];
    saveCardOverridesToStorage(overrides);
  }

  if(Array.isArray(cards)){
    const activeMatch = cards.find(c => (c.id && c.id === card.id) || (c.name && c.name.toLowerCase() === card.name.toLowerCase()));
    if(activeMatch){
      activeMatch.attacks = card.attacks;
    }
  }

  if(card.isStudio || card.isCustom){
    if(typeof saveCustomCardsToStorage === "function") saveCustomCardsToStorage();
  }
  if(found.source === "vault"){
    try { localStorage.setItem("cardCollectorUnreleasedCards", JSON.stringify(unreleasedCards)); } catch(e){}
  }

  if(typeof broadcastCardAttacksUpdated === "function"){
    broadcastCardAttacksUpdated(card.id || card.name, card.attacks);
  }

  renderCardManager();
  if(typeof render === "function") render();

  if(typeof showLiveToast === "function"){
    showLiveToast(`⚡ All attacks on ${card.name} now deal ∞ INFINITE DAMAGE!`, true);
  }
}
if(typeof window !== "undefined") window.handleCardManagerSetAllAttacksInfiniteDmg = handleCardManagerSetAllAttacksInfiniteDmg;

function handleCardManagerSetAttackInfiniteDmg(cardId, atkIdx){
  handleCardManagerSaveAttack(cardId, atkIdx, "", "Infinity");
}
if(typeof window !== "undefined") window.handleCardManagerSetAttackInfiniteDmg = handleCardManagerSetAttackInfiniteDmg;

function handleCardManagerDeleteAttack(cardId, atkIdx){
  if(!isMasterAdmin() && !canSubAdminPerform("cardManager")) return alert("You do not have permission to modify card attacks.");
  const found = findCardByIdInManager(cardId);
  if(!found) return alert("Card not found.");

  const card = found.card;
  if(!Array.isArray(card.attacks) || atkIdx < 0 || atkIdx >= card.attacks.length){
    return alert("Invalid attack index.");
  }

  const deletedAtk = card.attacks.splice(atkIdx, 1)[0];

  // Persist attack changes
  if(typeof getCardOverridesFromStorage === "function" && typeof saveCardOverridesToStorage === "function"){
    const overrides = getCardOverridesFromStorage();
    const idKey = card.id || ("card_" + card.name.toLowerCase().replace(/\s+/g, "_"));
    overrides[idKey] = overrides[idKey] || {};
    overrides[idKey].attacks = card.attacks;
    saveCardOverridesToStorage(overrides);
  }

  if(card.isStudio || card.isCustom){
    if(typeof saveCustomCardsToStorage === "function") saveCustomCardsToStorage();
  }
  if(found.source === "vault"){
    try { localStorage.setItem("cardCollectorUnreleasedCards", JSON.stringify(unreleasedCards)); } catch(e){}
  }

  if(typeof broadcastCardAttacksUpdated === "function"){
    broadcastCardAttacksUpdated(card.id || card.name, card.attacks);
  }

  renderCardManager();
  if(typeof render === "function") render();

  if(typeof showLiveToast === "function"){
    showLiveToast(`🗑️ Attack "${deletedAtk ? deletedAtk.name : "Attack"}" removed from ${card.name}.`, true);
  }
}
if(typeof window !== "undefined") window.handleCardManagerDeleteAttack = handleCardManagerDeleteAttack;

function handleCardManagerAddAttack(cardId, attackName, dmgValRaw){
  if(!isMasterAdmin() && !canSubAdminPerform("cardManager")) return alert("You do not have permission to add card attacks.");
  if(!attackName){
    return alert("Please enter a valid attack name.");
  }
  let dmgVal;
  const rawStr = String(dmgValRaw || "").trim().toLowerCase();
  if(rawStr === "infinity" || rawStr === "infinite" || rawStr === "∞"){
    dmgVal = "Infinity";
  } else {
    const num = parseInt(dmgValRaw, 10);
    if(isNaN(num) || num <= 0){
      return alert("Please enter a valid damage value (minimum 1), or 'Infinity'.");
    }
    dmgVal = num;
  }

  const found = findCardByIdInManager(cardId);
  if(!found) return alert("Card not found.");

  const card = found.card;
  if(!Array.isArray(card.attacks)) card.attacks = [];

  const newAtk = { name: attackName, dmg: dmgVal };
  card.attacks.push(newAtk);

  // Persist attack changes
  if(typeof getCardOverridesFromStorage === "function" && typeof saveCardOverridesToStorage === "function"){
    const overrides = getCardOverridesFromStorage();
    const idKey = card.id || ("card_" + card.name.toLowerCase().replace(/\s+/g, "_"));
    overrides[idKey] = overrides[idKey] || {};
    overrides[idKey].attacks = card.attacks;
    saveCardOverridesToStorage(overrides);
  }

  if(card.isStudio || card.isCustom){
    if(typeof saveCustomCardsToStorage === "function") saveCustomCardsToStorage();
  }
  if(found.source === "vault"){
    try { localStorage.setItem("cardCollectorUnreleasedCards", JSON.stringify(unreleasedCards)); } catch(e){}
  }

  if(typeof broadcastCardAttacksUpdated === "function"){
    broadcastCardAttacksUpdated(card.id || card.name, card.attacks);
  }

  renderCardManager();
  if(typeof render === "function") render();

  if(typeof showLiveToast === "function"){
    showLiveToast(`⚔️ Added "${attackName}" (${dmgVal} DMG) to ${card.name}!`, true);
  }
}
if(typeof window !== "undefined") window.handleCardManagerAddAttack = handleCardManagerAddAttack;

function handleCardManagerDeleteCard(cardId){
  if(!isMasterAdmin() && !canSubAdminPerform("cardManager")) return alert("You do not have permission to delete cards.");
  const found = findCardByIdInManager(cardId);
  if(!found) return alert("Card not found.");

  const card = found.card;
  if(!confirm(`Are you sure you want to permanently delete "${card.name}"?\n\nThis will remove the card from all booster packs, the binder, and the battle arena for all players.`)){
    return;
  }

  // 1. Mark as deleted persistently
  if(typeof getDeletedCardsFromStorage === "function" && typeof saveDeletedCardsToStorage === "function"){
    const deleted = getDeletedCardsFromStorage();
    const idKey = card.id || ("card_" + card.name.toLowerCase().replace(/\s+/g, "_"));
    if(!deleted.includes(idKey)) deleted.push(idKey);
    if(card.name && !deleted.includes(card.name.toLowerCase())) deleted.push(card.name.toLowerCase());
    saveDeletedCardsToStorage(deleted);
  }

  // 2. Remove from active cards & sanitize player owned indices
  if(Array.isArray(cards)){
    const cIdx = cards.findIndex(item => item === card || (item.id && (item.id === card.id || item.id === cardId)) || (item.name && card.name && item.name.toLowerCase() === card.name.toLowerCase()));
    if(cIdx >= 0){
      cards.splice(cIdx, 1);
      sanitizeAllPlayerOwned(cIdx);
    }
  }

  // 3. Remove from vault cards if applicable
  if(found.source === "vault" && typeof unreleasedCards !== "undefined" && Array.isArray(unreleasedCards)){
    const vIdx = unreleasedCards.findIndex(item => (item.id || item.name) === (card.id || card.name));
    if(vIdx >= 0){
      unreleasedCards.splice(vIdx, 1);
      try { localStorage.setItem("cardCollectorUnreleasedCards", JSON.stringify(unreleasedCards)); } catch(e){}
    }
  }

  // 4. Save custom cards if studio
  if(card.isStudio || card.isCustom){
    if(typeof saveCustomCardsToStorage === "function") saveCustomCardsToStorage();
  }

  // 5. Update UI & Broadcast
  const totalCountEl = document.getElementById("totalCardsCount");
  if(totalCountEl && Array.isArray(cards)) totalCountEl.textContent = cards.length;

  renderCardManager();
  if(typeof render === "function") render();
  if(typeof updatePackPriceLabels === "function") updatePackPriceLabels();
  if(typeof initCardSelect === "function") initCardSelect();
  if(typeof renderStudioCustomCards === "function") renderStudioCustomCards();
  if(typeof renderUnreleasedAdminUI === "function") renderUnreleasedAdminUI();

  if(typeof broadcastCardDeleted === "function"){
    broadcastCardDeleted(card.id || card.name, card.name);
  }

  if(typeof showLiveToast === "function"){
    showLiveToast(`🗑️ Card "${card.name}" permanently deleted from Cardstack.`, true);
  }
}
if(typeof window !== "undefined") window.handleCardManagerDeleteCard = handleCardManagerDeleteCard;

// Wire Card Manager inputs
const cardMgrSearch = document.getElementById("cardManagerSearchInput");
if(cardMgrSearch){
  cardMgrSearch.oninput = renderCardManager;
}
const cardMgrFilter = document.getElementById("cardManagerRarityFilter");
if(cardMgrFilter){
  cardMgrFilter.onchange = renderCardManager;
}

const cardMgrTabBtn = document.getElementById("cardManagerTabBtn");
if(cardMgrTabBtn){
  cardMgrTabBtn.addEventListener("click", renderCardManager);
}


// ==========================================
// ⚡ TAB: CHAOS LAB & GOD TOOLS MODULE
// ==========================================

// ==========================================
// ⚡ STUDIO HIGH-FIDELITY WEB AUDIO ENGINE
// ==========================================

let chaosAudioCtx = null;
let masterCompressor = null;
let masterWarmthFilter = null;
let masterLimiterGain = null;
let reverbConvolver = null;
let reverbSendGain = null;

function getChaosAudioCtx(){
  if(!chaosAudioCtx){
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if(!AudioCtx) return null;
    chaosAudioCtx = new AudioCtx();

    // 1. Studio Master Dynamics Compressor (smooths transients, punches bass, prevents digital distortion)
    masterCompressor = chaosAudioCtx.createDynamicsCompressor();
    masterCompressor.threshold.setValueAtTime(-18, chaosAudioCtx.currentTime);
    masterCompressor.knee.setValueAtTime(14, chaosAudioCtx.currentTime);
    masterCompressor.ratio.setValueAtTime(5, chaosAudioCtx.currentTime);
    masterCompressor.attack.setValueAtTime(0.003, chaosAudioCtx.currentTime);
    masterCompressor.release.setValueAtTime(0.22, chaosAudioCtx.currentTime);

    // 2. Master Warmth Filter (cuts abrasive 13.5kHz+ digital noise)
    masterWarmthFilter = chaosAudioCtx.createBiquadFilter();
    masterWarmthFilter.type = "lowpass";
    masterWarmthFilter.frequency.setValueAtTime(13500, chaosAudioCtx.currentTime);
    masterWarmthFilter.Q.setValueAtTime(0.707, chaosAudioCtx.currentTime);

    // 3. Master Limiter Output
    masterLimiterGain = chaosAudioCtx.createGain();
    masterLimiterGain.gain.setValueAtTime(0.85, chaosAudioCtx.currentTime);

    masterCompressor.connect(masterWarmthFilter);
    masterWarmthFilter.connect(masterLimiterGain);
    masterLimiterGain.connect(chaosAudioCtx.destination);

    // 4. Algorithmic Spatial Stereo Reverb Convolver
    try {
      const sampleRate = chaosAudioCtx.sampleRate;
      const length = Math.floor(sampleRate * 1.4);
      const impulse = chaosAudioCtx.createBuffer(2, length, sampleRate);
      const left = impulse.getChannelData(0);
      const right = impulse.getChannelData(1);
      for(let i = 0; i < length; i++){
        const decay = Math.pow((length - i) / length, 2.5);
        left[i] = (Math.random() * 2 - 1) * decay;
        right[i] = (Math.random() * 2 - 1) * decay;
      }
      reverbConvolver = chaosAudioCtx.createConvolver();
      reverbConvolver.buffer = impulse;

      reverbSendGain = chaosAudioCtx.createGain();
      reverbSendGain.gain.setValueAtTime(0.35, chaosAudioCtx.currentTime);
      reverbSendGain.connect(reverbConvolver);
      reverbConvolver.connect(masterCompressor);
    } catch(e){}
  }

  if(chaosAudioCtx && chaosAudioCtx.state === "suspended"){
    chaosAudioCtx.resume();
  }
  return chaosAudioCtx;
}

function getChaosVolume(){
  const slider = document.getElementById("chaosSfxVolume");
  return slider ? (parseInt(slider.value, 10) / 100) * 0.38 : 0.28;
}

function playChaosSfx(type){
  const ctx = getChaosAudioCtx();
  if(!ctx) return;
  const now = ctx.currentTime;
  const vol = getChaosVolume();

  const soundBus = ctx.createGain();
  soundBus.gain.setValueAtTime(vol, now);
  soundBus.connect(masterCompressor);

  function sendReverb(node, amount = 0.35){
    if(!reverbSendGain) return;
    const send = ctx.createGain();
    send.gain.setValueAtTime(amount, now);
    node.connect(send);
    send.connect(reverbSendGain);
  }

  // 1. TRIUMPH: Cinematic Heroic Brass Fanfare & Stardust Resolution
  if(type === "triumph"){
    const arpeggio = [
      { f: 261.63, t: 0 },
      { f: 329.63, t: 0.08 },
      { f: 392.00, t: 0.16 },
      { f: 523.25, t: 0.25 },
      { f: 659.25, t: 0.36 }
    ];
    arpeggio.forEach(n => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filt = ctx.createBiquadFilter();
      const noteGain = ctx.createGain();

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(n.f, now + n.t);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(n.f * 1.004, now + n.t);

      filt.type = "lowpass";
      filt.frequency.setValueAtTime(500, now + n.t);
      filt.frequency.exponentialRampToValueAtTime(3200, now + n.t + 0.04);
      filt.frequency.exponentialRampToValueAtTime(1400, now + n.t + 0.2);

      noteGain.gain.setValueAtTime(0.5, now + n.t);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + n.t + 0.28);

      osc1.connect(filt);
      osc2.connect(filt);
      filt.connect(noteGain);
      noteGain.connect(soundBus);
      sendReverb(noteGain, 0.3);

      osc1.start(now + n.t);
      osc2.start(now + n.t);
      osc1.stop(now + n.t + 0.3);
      osc2.stop(now + n.t + 0.3);
    });

    const chordTime = now + 0.48;
    const chordFreqs = [392.00, 523.25, 659.25, 783.99, 1046.50];
    chordFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const oscSub = ctx.createOscillator();
      const filt = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, chordTime);

      oscSub.type = "triangle";
      oscSub.frequency.setValueAtTime(freq * 0.997, chordTime);

      filt.type = "lowpass";
      filt.frequency.setValueAtTime(800, chordTime);
      filt.frequency.exponentialRampToValueAtTime(4500, chordTime + 0.08);
      filt.frequency.exponentialRampToValueAtTime(1800, chordTime + 0.85);

      const noteVol = (idx === chordFreqs.length - 1) ? 0.35 : 0.25;
      gain.gain.setValueAtTime(noteVol, chordTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, chordTime + 1.1);

      osc.connect(filt);
      oscSub.connect(filt);
      filt.connect(gain);
      gain.connect(soundBus);
      sendReverb(gain, 0.55);

      osc.start(chordTime);
      oscSub.start(chordTime);
      osc.stop(chordTime + 1.15);
      oscSub.stop(chordTime + 1.15);
    });

    [2093.00, 2637.02, 3135.96].forEach((f, i) => {
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = "sine";
      chimeOsc.frequency.setValueAtTime(f, chordTime + 0.1 + i * 0.06);
      chimeGain.gain.setValueAtTime(0.12, chordTime + 0.1 + i * 0.06);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, chordTime + 0.75 + i * 0.06);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(soundBus);
      sendReverb(chimeGain, 0.6);

      chimeOsc.start(chordTime + 0.1 + i * 0.06);
      chimeOsc.stop(chordTime + 0.8 + i * 0.06);
    });
  }

  // 2. PACK TEAR: Realistic Tactile Foil Rip & Tension Pop
  else if(type === "packTear"){
    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();
    popOsc.type = "triangle";
    popOsc.frequency.setValueAtTime(170, now);
    popOsc.frequency.exponentialRampToValueAtTime(42, now + 0.045);
    popGain.gain.setValueAtTime(0.8, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    popOsc.connect(popGain);
    popGain.connect(soundBus);
    popOsc.start(now);
    popOsc.stop(now + 0.055);

    const bufferSize = Math.floor(ctx.sampleRate * 0.32);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const outData = noiseBuffer.getChannelData(0);
    for(let i = 0; i < bufferSize; i++){
      const spike = Math.random() < 0.03 ? (Math.random() * 2 - 1) * 2.2 : (Math.random() * 2 - 1);
      outData[i] = spike * Math.pow(1 - (i / bufferSize), 0.75);
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const bandFilter = ctx.createBiquadFilter();
    bandFilter.type = "bandpass";
    bandFilter.Q.setValueAtTime(2.6, now);
    bandFilter.frequency.setValueAtTime(2800, now);
    bandFilter.frequency.exponentialRampToValueAtTime(580, now + 0.28);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(1.1, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    noiseSource.connect(bandFilter);
    bandFilter.connect(noiseGain);
    noiseGain.connect(soundBus);
    noiseSource.start(now);

    const sheenFilter = ctx.createBiquadFilter();
    sheenFilter.type = "highpass";
    sheenFilter.frequency.setValueAtTime(4600, now);

    const sheenGain = ctx.createGain();
    sheenGain.gain.setValueAtTime(0.4, now);
    sheenGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    const noiseSource2 = ctx.createBufferSource();
    noiseSource2.buffer = noiseBuffer;
    noiseSource2.connect(sheenFilter);
    sheenFilter.connect(sheenGain);
    sheenGain.connect(soundBus);
    noiseSource2.start(now);
  }

  // 3. LASER: Cyber Heavyweight Impact Blast
  else if(type === "laser"){
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.07);
    subGain.gain.setValueAtTime(0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
    subOsc.connect(subGain);
    subGain.connect(soundBus);
    subOsc.start(now);
    subOsc.stop(now + 0.08);

    const modOsc = ctx.createOscillator();
    const modGain = ctx.createGain();
    modOsc.type = "sine";
    modOsc.frequency.setValueAtTime(380, now);
    modGain.gain.setValueAtTime(420, now);
    modGain.gain.exponentialRampToValueAtTime(20, now + 0.2);

    const carrierOsc = ctx.createOscillator();
    carrierOsc.type = "sawtooth";
    carrierOsc.frequency.setValueAtTime(1750, now);
    carrierOsc.frequency.exponentialRampToValueAtTime(110, now + 0.22);
    modOsc.connect(modGain);
    modGain.connect(carrierOsc.frequency);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.setValueAtTime(3.8, now);
    filter.frequency.setValueAtTime(4500, now);
    filter.frequency.exponentialRampToValueAtTime(220, now + 0.22);

    const laserGain = ctx.createGain();
    laserGain.gain.setValueAtTime(0.85, now);
    laserGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    carrierOsc.connect(filter);
    filter.connect(laserGain);
    laserGain.connect(soundBus);
    sendReverb(laserGain, 0.25);

    modOsc.start(now);
    carrierOsc.start(now);
    modOsc.stop(now + 0.24);
    carrierOsc.stop(now + 0.24);
  }

  // 4. WARP: Deep Cinematic Wormhole Hyperspace Rift
  else if(type === "warp"){
    [48, 52].forEach(f => {
      const drone = ctx.createOscillator();
      const dGain = ctx.createGain();
      drone.type = "sine";
      drone.frequency.setValueAtTime(f, now);
      dGain.gain.setValueAtTime(0.6, now);
      dGain.gain.linearRampToValueAtTime(0.8, now + 0.25);
      dGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      drone.connect(dGain);
      dGain.connect(soundBus);
      drone.start(now);
      drone.stop(now + 0.72);
    });

    const saw = ctx.createOscillator();
    saw.type = "sawtooth";
    saw.frequency.setValueAtTime(120, now);
    saw.frequency.linearRampToValueAtTime(320, now + 0.3);
    saw.frequency.exponentialRampToValueAtTime(60, now + 0.65);

    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.Q.setValueAtTime(4.2, now);
    band.frequency.setValueAtTime(180, now);
    band.frequency.linearRampToValueAtTime(1600, now + 0.28);
    band.frequency.exponentialRampToValueAtTime(95, now + 0.68);

    const sawGain = ctx.createGain();
    sawGain.gain.setValueAtTime(0.65, now);
    sawGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    saw.connect(band);
    band.connect(sawGain);
    sawGain.connect(soundBus);
    sendReverb(sawGain, 0.45);

    saw.start(now);
    saw.stop(now + 0.72);

    const crystal = ctx.createOscillator();
    const crystalGain = ctx.createGain();
    crystal.type = "sine";
    crystal.frequency.setValueAtTime(987.77, now);
    crystal.frequency.exponentialRampToValueAtTime(440, now + 0.55);
    crystalGain.gain.setValueAtTime(0.2, now);
    crystalGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
    crystal.connect(crystalGain);
    crystalGain.connect(soundBus);
    sendReverb(crystalGain, 0.5);
    crystal.start(now);
    crystal.stop(now + 0.68);
  }

  // 5. COINS: Authentic Metallic Gold Coin Shower & Velvet Clinks
  else if(type === "coins"){
    const coinPitches = [1980, 2240, 1850, 2460, 2100, 2350];
    const coinDelays = [0, 0.045, 0.092, 0.148, 0.21, 0.275];
    const pans = [-0.35, 0.35, -0.2, 0.25, -0.1, 0.3];

    coinDelays.forEach((delay, idx) => {
      const coinTime = now + delay;
      const carrierFreq = coinPitches[idx];
      const modFreq = carrierFreq * 2.76;

      const modOsc = ctx.createOscillator();
      const modGain = ctx.createGain();
      modOsc.type = "sine";
      modOsc.frequency.setValueAtTime(modFreq, coinTime);
      modGain.gain.setValueAtTime(carrierFreq * 1.5, coinTime);
      modGain.gain.exponentialRampToValueAtTime(1, coinTime + 0.08);

      const carrierOsc = ctx.createOscillator();
      carrierOsc.type = "sine";
      carrierOsc.frequency.setValueAtTime(carrierFreq, coinTime);

      modOsc.connect(modGain);
      modGain.connect(carrierOsc.frequency);

      const coinGain = ctx.createGain();
      coinGain.gain.setValueAtTime(0.45, coinTime);
      coinGain.gain.exponentialRampToValueAtTime(0.0001, coinTime + 0.28);

      if(ctx.createStereoPanner){
        try {
          const panner = ctx.createStereoPanner();
          panner.pan.setValueAtTime(pans[idx], coinTime);
          carrierOsc.connect(coinGain);
          coinGain.connect(panner);
          panner.connect(soundBus);
        } catch(e){
          carrierOsc.connect(coinGain);
          coinGain.connect(soundBus);
        }
      } else {
        carrierOsc.connect(coinGain);
        coinGain.connect(soundBus);
      }
      sendReverb(coinGain, 0.25);

      modOsc.start(coinTime);
      carrierOsc.start(coinTime);
      modOsc.stop(coinTime + 0.3);
      carrierOsc.stop(coinTime + 0.3);
    });
  }

  // 6. SIREN: Tactical Emergency Alert Klaxon
  else if(type === "siren"){
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const hornGain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.linearRampToValueAtTime(760, now + 0.16);
    osc.frequency.linearRampToValueAtTime(580, now + 0.32);
    osc.frequency.linearRampToValueAtTime(760, now + 0.48);
    osc.frequency.linearRampToValueAtTime(580, now + 0.64);

    filter.type = "bandpass";
    filter.Q.setValueAtTime(1.5, now);
    filter.frequency.setValueAtTime(750, now);

    hornGain.gain.setValueAtTime(0.65, now);
    hornGain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);

    osc.connect(filter);
    filter.connect(hornGain);
    hornGain.connect(soundBus);
    sendReverb(hornGain, 0.3);

    osc.start(now);
    osc.stop(now + 0.74);

    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(68, now);
    subGain.gain.setValueAtTime(0.5, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
    sub.connect(subGain);
    subGain.connect(soundBus);
    sub.start(now);
    sub.stop(now + 0.74);
  }

  // 7. ASCENSION: Pristine Celestial Crystal Harp Glissando
  else if(type === "ascension"){
    const scale = [523.25, 659.25, 783.99, 987.77, 1174.66, 1318.51, 1567.98];
    scale.forEach((freq, idx) => {
      const noteTime = now + idx * 0.054;
      const modFreq = freq * 2.005;

      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();
      mod.type = "sine";
      mod.frequency.setValueAtTime(modFreq, noteTime);
      modGain.gain.setValueAtTime(freq * 0.8, noteTime);
      modGain.gain.exponentialRampToValueAtTime(1, noteTime + 0.4);

      const carrier = ctx.createOscillator();
      carrier.type = "sine";
      carrier.frequency.setValueAtTime(freq, noteTime);

      mod.connect(modGain);
      modGain.connect(carrier.frequency);

      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0.35, noteTime);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.95);

      carrier.connect(noteGain);
      noteGain.connect(soundBus);
      sendReverb(noteGain, 0.55);

      mod.start(noteTime);
      carrier.start(noteTime);
      mod.stop(noteTime + 1.0);
      carrier.stop(noteTime + 1.0);
    });
  }

  // 8. DETONATION: Blockbuster Seismic Shockwave & EMP Rumble
  else if(type === "detonation"){
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(85, now);
    sub.frequency.exponentialRampToValueAtTime(20, now + 0.7);
    subGain.gain.setValueAtTime(1.1, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    sub.connect(subGain);
    subGain.connect(soundBus);
    sub.start(now);
    sub.stop(now + 0.78);

    const bufferSize = Math.floor(ctx.sampleRate * 0.85);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for(let i = 0; i < bufferSize; i++){
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - (i / bufferSize), 1.2);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.setValueAtTime(2.2, now);
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(55, now + 0.8);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(1.0, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.82);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(soundBus);
    sendReverb(noiseGain, 0.4);
    noise.start(now);

    const sizzle = ctx.createOscillator();
    const sizzleFilter = ctx.createBiquadFilter();
    const sizzleGain = ctx.createGain();
    sizzle.type = "sawtooth";
    sizzle.frequency.setValueAtTime(120, now);
    sizzle.frequency.linearRampToValueAtTime(45, now + 0.35);

    sizzleFilter.type = "bandpass";
    sizzleFilter.Q.setValueAtTime(4.0, now);
    sizzleFilter.frequency.setValueAtTime(3200, now);
    sizzleFilter.frequency.exponentialRampToValueAtTime(400, now + 0.35);

    sizzleGain.gain.setValueAtTime(0.35, now);
    sizzleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    sizzle.connect(sizzleFilter);
    sizzleFilter.connect(sizzleGain);
    sizzleGain.connect(soundBus);
    sizzle.start(now);
    sizzle.stop(now + 0.38);
  }
}
window.playChaosSfx = playChaosSfx;
window.playSound = playChaosSfx;
window.playAudioFx = playChaosSfx;

// 1. SCREEN FX: Card Rain
function triggerCardRain(durationSec = 6, isRemote = false){
  if(!isRemote && typeof broadcastChaosFx === "function"){
    broadcastChaosFx({ type: "card_rain", durationSec });
  }
  playChaosSfx("ascension");
  const containerId = "chaosCardRainContainer";
  let container = document.getElementById(containerId);
  if(!container){
    container = document.createElement("div");
    container.id = containerId;
    container.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:999999;overflow:hidden";
    document.body.appendChild(container);
  }
  
  const highTierCards = (cards || []).filter(c => ["epic", "legendary", "mythic", "divine"].includes(c.rarity));
  const pool = highTierCards.length ? highTierCards : (cards || []);
  if(!pool.length) return;

  function spawnCard(){
    if(!container) return;
    const card = pool[Math.floor(Math.random() * pool.length)];
    const el = document.createElement("div");
    el.className = "chaos-rain-card";
    const startX = Math.random() * 92 + 2;
    const duration = (Math.random() * 2 + 3.2).toFixed(2);
    const size = Math.floor(Math.random() * 32 + 58);

    el.style.cssText = `
      position:absolute;
      left:${startX}vw;
      top:-120px;
      width:${size}px;
      height:${Math.floor(size * 1.4)}px;
      border-radius:8px;
      border:2px solid #fbbf24;
      background:rgba(15,23,42,0.95);
      box-shadow:0 0 18px rgba(251,191,36,0.65);
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      overflow:hidden;
      animation: cardRainFall ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    `;
    el.innerHTML = `
      <img src="${card.image}" style="width:100%;height:70%;object-fit:cover">
      <div style="font-size:8px;font-weight:900;color:#fff;background:rgba(0,0,0,0.85);width:100%;text-align:center;padding:1px;white-space:nowrap;overflow:hidden">${card.name}</div>
    `;
    container.appendChild(el);
    setTimeout(() => el.remove(), parseFloat(duration) * 1000 + 400);
  }

  for(let i=0; i<12; i++){
    setTimeout(spawnCard, i * 140);
  }
  
  let spawned = 12;
  const loop = setInterval(() => {
    spawnCard();
    spawned++;
    if(spawned >= durationSec * 6){
      clearInterval(loop);
      setTimeout(() => {
        if(container && container.children.length === 0) container.remove();
      }, 5500);
    }
  }, 220);

  const status = document.getElementById("chaosFxStatus");
  if(status) status.innerHTML = '<span style="color:#c084fc">🌧️ Cosmic Card Rain Storm in progress!</span>';
  if(!isRemote && typeof showLiveToast === "function") showLiveToast("🌧️ Cosmic Card Rain descending across every screen!", true);
}

// 2. SCREEN FX: Mega Confetti Storm
function triggerMegaConfetti(isRemote = false){
  if(!isRemote && typeof broadcastChaosFx === "function"){
    broadcastChaosFx({ type: "mega_confetti" });
  }
  playChaosSfx("triumph");
  if(typeof confetti === "function"){
    const end = Date.now() + 3000;
    const colors = ["#fbbf24", "#ec4899", "#38bdf8", "#a855f7", "#10b981"];
    (function frame() {
      confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  }
  const status = document.getElementById("chaosFxStatus");
  if(status) status.innerHTML = '<span style="color:#f472b6">🎉 Mega Confetti Storm discharged!</span>';
  if(!isRemote && typeof showLiveToast === "function") showLiveToast("🎉 Mega Confetti Storm detonated on all players screens!", true);
}

// 3. SCREEN FX: Nuclear EMP Glitch & Shake
function triggerEmpGlitch(isRemote = false){
  if(!isRemote && typeof broadcastChaosFx === "function"){
    broadcastChaosFx({ type: "emp_glitch" });
  }
  playChaosSfx("detonation");
  setTimeout(() => playChaosSfx("laser"), 180);

  document.body.classList.add("chaos-screen-shake");
  
  const flash = document.createElement("div");
  flash.style.cssText = "position:fixed;inset:0;background:rgba(239,68,68,0.35);mix-blend-mode:difference;pointer-events:none;z-index:999999;transition:opacity 0.7s ease-out";
  document.body.appendChild(flash);

  setTimeout(() => {
    flash.style.opacity = "0";
    setTimeout(() => flash.remove(), 750);
  }, 350);

  setTimeout(() => {
    document.body.classList.remove("chaos-screen-shake");
  }, 1100);

  const status = document.getElementById("chaosFxStatus");
  if(status) status.innerHTML = '<span style="color:#ef4444">💥 Nuclear EMP executed: Visual disturbance localized.</span>';
  if(!isRemote && typeof showLiveToast === "function") showLiveToast("⚡ NUCLEAR EMP DETONATED: Seismic glitch shockwave unleashed across all screens!", true);
}

// 4. SCREEN FX: Rainbow Disco Mode
function toggleDiscoMode(forcedState = null, isRemote = false){
  const active = (forcedState !== null) ? (forcedState ? (document.body.classList.add("disco-mode-active"), true) : (document.body.classList.remove("disco-mode-active"), false)) : document.body.classList.toggle("disco-mode-active");
  const btn = document.getElementById("chaosDiscoModeBtn");
  if(btn){
    btn.style.background = active ? "linear-gradient(135deg, #ec4899, #8b5cf6)" : "#06b6d4";
    btn.textContent = active ? "🌈 Rainbow Disco: ON" : "🌈 Rainbow Disco Aura";
  }
  playChaosSfx(active ? "ascension" : "packTear");
  const status = document.getElementById("chaosFxStatus");
  if(status) status.innerHTML = active ? '<span style="color:#38bdf8">🌈 Rainbow Disco Aura ACTIVE across all binder cards!</span>' : 'Rainbow Disco Aura deactivated.';
  if(!isRemote && typeof showLiveToast === "function"){
    showLiveToast(active ? "✨ Rainbow Disco Aura ACTIVATED across all cards!" : "Rainbow Disco Aura deactivated.", true);
  }
  if(!isRemote && typeof broadcastChaosFx === "function"){
    broadcastChaosFx({ type: "disco_mode", active });
  }
}

// 5. HIGH-ROLLER CASINO LUCKY WHEEL
const CASINO_PRIZES = [
  { label: "💎 10,000 Gold Coins", type: "coins", amount: 10000 },
  { label: "💰 25,000 Treasure Coins", type: "coins", amount: 25000 },
  { label: "👑 50,000 MEGA JACKPOT", type: "coins", amount: 50000 },
  { label: "✨ Guaranteed Random Mythic Card", type: "card", rarity: "mythic" },
  { label: "🌟 Guaranteed Random Divine Relic", type: "card", rarity: "divine" },
  { label: "⚡ 5X God Luck Multiplier (10 Packs)", type: "luck", multiplier: 5 }
];

let isCasinoSpinning = false;
function spinChaosCasino(){
  if(isCasinoSpinning) return;
  const targetSel = document.getElementById("chaosCasinoTargetSelect");
  const targetInp = document.getElementById("chaosCasinoTargetInput");

  // Priority: typed username > selected dropdown > current logged in user
  let targetUser = (targetInp && targetInp.value.trim()) ? targetInp.value.trim() : ((targetSel && targetSel.value) ? targetSel.value : currentUser);
  if(!targetUser) targetUser = ADMIN_USERNAME || "Cam";

  // Reload freshest accounts
  try {
    const saved = JSON.parse(localStorage.getItem("cardCollectorAccounts"));
    if(saved && typeof saved === "object") accounts = saved;
  } catch(e){}

  let targetAcc = (typeof getUserAccount === "function") ? getUserAccount(targetUser) : (accounts && accounts[targetUser]);
  if(!targetAcc){
    accounts[targetUser] = {
      password: "player123",
      owned: [0],
      coins: 100,
      hasPlayed: true,
      lastActive: Date.now()
    };
    targetAcc = accounts[targetUser];
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    if(typeof refreshAdminPlayerData === "function") refreshAdminPlayerData();
  }

  isCasinoSpinning = true;
  const reel = document.getElementById("chaosCasinoReel");
  const spinBtn = document.getElementById("chaosSpinReelBtn");
  if(spinBtn) spinBtn.disabled = true;

  playChaosSfx("warp");

  let ticks = 0;
  const maxTicks = 18;
  const interval = setInterval(() => {
    ticks++;
    const randomPrize = CASINO_PRIZES[Math.floor(Math.random() * CASINO_PRIZES.length)];
    if(reel) reel.textContent = randomPrize.label;
    playChaosSfx("coins");

    if(ticks >= maxTicks){
      clearInterval(interval);
      isCasinoSpinning = false;
      if(spinBtn) spinBtn.disabled = false;

      const prize = CASINO_PRIZES[Math.floor(Math.random() * CASINO_PRIZES.length)];
      if(reel){
        reel.textContent = `🎉 ${prize.label} 🎉`;
        reel.style.transform = "scale(1.08)";
        setTimeout(() => { if(reel) reel.style.transform = "none"; }, 600);
      }

      playChaosSfx("triumph");
      if(typeof confetti === "function"){
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      }

      if(prize.type === "coins"){
        targetAcc.coins = (targetAcc.coins || 0) + prize.amount;
        if(targetUser === currentUser && typeof coins !== "undefined") coins = targetAcc.coins;
      } else if(prize.type === "card"){
        const pool = (cards || []).filter(c => c.rarity === prize.rarity && !c.isUnreleased);
        const cardAwarded = pool.length ? pool[Math.floor(Math.random() * pool.length)] : cards[0];
        const cardIdx = cards.indexOf(cardAwarded);
        if(!Array.isArray(targetAcc.owned)) targetAcc.owned = [];
        if(cardIdx !== -1 && !targetAcc.owned.includes(cardIdx)){
          targetAcc.owned.push(cardIdx);
          if(targetUser === currentUser && Array.isArray(owned) && !owned.includes(cardIdx)){
            owned.push(cardIdx);
          }
        }
      } else if(prize.type === "luck"){
        localStorage.setItem("cardCollectorLuck", "5");
      }

      if(typeof save === "function") save();
      if(typeof render === "function") render();

      if(typeof showLiveToast === "function"){
        showLiveToast(`🎰 CASINO WINNER! ${targetUser} received: ${prize.label}!`, true);
      }
      if(typeof broadcastChaosFx === "function"){
        broadcastChaosFx({ type: "casino_spin", targetUser, prize: prize.label });
      }
    }
  }, 100);
}

// 6. 100x SPEED PACK BUSTER (BENCHMARK & MASS OPENER)
function runChaosPackBuster(){
  const packSelect = document.getElementById("chaosPackSelect");
  const countSelect = document.getElementById("chaosPackCountSelect");
  const claimCheck = document.getElementById("chaosPackClaimCards");
  const statsDiv = document.getElementById("chaosPackBusterStats");
  if(!packSelect || !countSelect || !statsDiv) return;

  const packKey = packSelect.value;
  const count = parseInt(countSelect.value, 10) || 50;
  const shouldClaim = claimCheck ? claimCheck.checked : false;

  const pack = (typeof packTiers === "object" && packTiers) ? packTiers[packKey] : null;
  if(!pack) return alert("Please select a valid booster pack tier.");

  playChaosSfx("warp");

  const rarityStats = { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0, divine: 0 };
  const customRarityStats = {};
  let totalCards = 0;
  let newDiscoveries = 0;
  const topPulls = [];

  const curAcc = (typeof getUserAccount === "function") ? getUserAccount(currentUser) : (accounts && accounts[currentUser]);

  for(let p = 0; p < count; p++){
    const guarantee = pack.minRarity || null;
    const packCount = pack.count || 5;

    for(let c = 0; c < packCount; c++){
      totalCards++;
      const isGuaranteedSlot = (c === 0 && guarantee);
      const drawn = (typeof chooseCardFromWeights === "function") ? chooseCardFromWeights(pack.weights, isGuaranteedSlot ? guarantee : null, false) : cards[0];
      if(!drawn) continue;

      const r = drawn.rarity;
      if(rarityStats[r] !== undefined){
        rarityStats[r]++;
      } else {
        customRarityStats[r] = (customRarityStats[r] || 0) + 1;
      }

      if(["legendary", "mythic", "divine"].includes(r) && topPulls.length < 8){
        if(!topPulls.some(x => x.name === drawn.name)) topPulls.push(drawn);
      }

      if(shouldClaim && curAcc){
        const idx = cards.indexOf(drawn);
        if(!Array.isArray(curAcc.owned)) curAcc.owned = [];
        if(idx !== -1 && !curAcc.owned.includes(idx)){
          curAcc.owned.push(idx);
          if(Array.isArray(owned) && !owned.includes(idx)) owned.push(idx);
          newDiscoveries++;
        }
      }
    }
  }

  if(shouldClaim){
    if(typeof save === "function") save();
    if(typeof render === "function") render();
  }

  playChaosSfx("triumph");
  if(typeof confetti === "function"){
    confetti({ particleCount: 75, spread: 70 });
  }

  const colorMap = { common: "#64748b", rare: "#3b82f6", epic: "#a855f7", legendary: "#f59e0b", mythic: "#ec4899", divine: "#06b6d4" };
  const rarityBadges = Object.keys(rarityStats).map(r => {
    const num = rarityStats[r];
    const pct = totalCards > 0 ? ((num / totalCards) * 100).toFixed(1) : 0;
    return `
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);padding:6px 10px;border-radius:8px;text-align:center">
        <div style="font-size:10px;text-transform:uppercase;color:${colorMap[r] || '#fff'};font-weight:900">${r}</div>
        <div style="font-size:15px;font-weight:800;color:#fff">${num}</div>
        <div style="font-size:10px;color:#94a3b8">${pct}%</div>
      </div>
    `;
  }).join("");

  const topPullsHtml = topPulls.length ? topPulls.map(tp => `
    <span style="display:inline-flex;align-items:center;gap:4px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.15);padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;color:#fff">
      ${tp.name} (${tp.rarity})
    </span>
  `).join("") : '<span style="color:#94a3b8">None</span>';

  statsDiv.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">
      <b style="font-size:13px;color:#38bdf8">⚡ Simulation Completed: ${count} Packs (${totalCards} Cards Drawn)</b>
      ${shouldClaim ? `<span style="font-size:11px;font-weight:800;color:#4ade80;background:rgba(74,222,128,0.15);padding:2px 8px;border-radius:6px">✓ ${newDiscoveries} New Discoveries Added to Collection</span>` : '<span style="font-size:11px;color:#94a3b8">Benchmark Test Only (Inventory Untouched)</span>'}
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(90px, 1fr));gap:8px;margin-bottom:10px">
      ${rarityBadges}
    </div>
    <div style="font-size:11px;color:#cbd5e1">
      <b>Top High-Tier Discoveries:</b>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
        ${topPullsHtml}
      </div>
    </div>
  `;
}

// 7. WORLD BOSS RAID SUMMONER
const WORLD_BOSS_TEMPLATES = {
  ignis: {
    name: "🔥 Ignis, The Solar Behemoth",
    element: "Divine Fire",
    hp: 10000,
    maxHp: 10000,
    icon: "🌋",
    weakness: "Water / Void",
    desc: "A towering titan forged in the heart of a dying sun."
  },
  umbra: {
    name: "🌑 Umbra, The Void Leviathan",
    element: "Abyssal Void",
    hp: 25000,
    maxHp: 25000,
    icon: "🌌",
    weakness: "Solar / Divine",
    desc: "An eldritch anomaly that devours celestial star clusters."
  },
  chronos: {
    name: "⚡ Chronos, The Time Devourer",
    element: "Temporal Storm",
    hp: 50000,
    maxHp: 50000,
    icon: "⏳",
    weakness: "Arcane / Prismatic",
    desc: "An omnipotent temporal sovereign warping space and reality."
  }
};

function summonWorldBoss(bossKey, customName, customHp){
  let boss = null;
  if(bossKey === "custom"){
    const name = customName ? customName.trim() : "Titan Sovereign";
    const hp = parseInt(customHp, 10) || 15000;
    boss = {
      id: "boss_" + Date.now(),
      name: name,
      element: "Cosmic Apex",
      hp: hp,
      maxHp: hp,
      icon: "👾",
      weakness: "All Elements",
      desc: "An omnipotent entity summoned directly from the Chaos Lab."
    };
  } else {
    const tmpl = WORLD_BOSS_TEMPLATES[bossKey] || WORLD_BOSS_TEMPLATES.ignis;
    boss = {
      id: "boss_" + bossKey,
      name: tmpl.name,
      element: tmpl.element,
      hp: tmpl.hp,
      maxHp: tmpl.maxHp,
      icon: tmpl.icon,
      weakness: tmpl.weakness,
      desc: tmpl.desc
    };
  }

  localStorage.setItem("cardCollectorWorldBoss", JSON.stringify(boss));
  playChaosSfx("siren");
  setTimeout(() => playChaosSfx("detonation"), 450);

  renderWorldBossBanner();
  updateChaosBossAdminControls();
  if(typeof broadcastChaosFx === "function"){
    broadcastChaosFx({ type: "strike_boss", dmg, attacker: (typeof currentUser !== "undefined" && currentUser) ? currentUser : "Admin", newHp: boss.hp, maxHp: boss.maxHp, isDead: boss.hp <= 0 });
  }
  
  if(typeof showLiveToast === "function"){
    showLiveToast(`🚨 WORLD BOSS SUMMONED: ${boss.name} has emerged on the home battlefield!`, true);
  }
  if(typeof broadcastChaosFx === "function"){
    broadcastChaosFx({ type: "summon_boss", boss });
  }
}

function dismissWorldBoss(isRemote = false){
  localStorage.removeItem("cardCollectorWorldBoss");
  renderWorldBossBanner();
  updateChaosBossAdminControls();
  if(!isRemote && typeof showLiveToast === "function") showLiveToast("🛑 World Boss Raid dismissed.", true);
  if(!isRemote && typeof broadcastChaosFx === "function"){
    broadcastChaosFx({ type: "dismiss_boss" });
  }
}

function healWorldBoss(){
  let boss = null;
  try { boss = JSON.parse(localStorage.getItem("cardCollectorWorldBoss")); } catch(e){}
  if(!boss) return;
  boss.hp = boss.maxHp;
  localStorage.setItem("cardCollectorWorldBoss", JSON.stringify(boss));
  renderWorldBossBanner();
  updateChaosBossAdminControls();
  playChaosSfx("ascension");
  if(typeof showLiveToast === "function") showLiveToast(`💖 ${boss.name} fully restored to ${boss.maxHp.toLocaleString()} HP!`, true);
  if(typeof broadcastChaosFx === "function"){
    broadcastChaosFx({ type: "heal_boss", newHp: boss.hp, maxHp: boss.maxHp });
  }
}

function nukeWorldBoss(){
  strikeWorldBoss(5000);
}

function updateChaosBossAdminControls(){
  const controls = document.getElementById("chaosBossAdminControls");
  if(!controls) return;
  let boss = null;
  try { boss = JSON.parse(localStorage.getItem("cardCollectorWorldBoss")); } catch(e){}
  if(boss && boss.hp > 0){
    controls.style.display = "flex";
  } else {
    controls.style.display = "none";
  }
}

function renderWorldBossBanner(){
  const banner = document.getElementById("worldBossBanner");
  if(!banner) return;

  let boss = null;
  try {
    boss = JSON.parse(localStorage.getItem("cardCollectorWorldBoss"));
  } catch(e){}

  if(!boss || !boss.hp || boss.hp <= 0){
    banner.style.display = "none";
    banner.innerHTML = "";
    return;
  }

  banner.style.display = "block";
  const pct = Math.max(0, Math.min(100, Math.round((boss.hp / boss.maxHp) * 100)));

  const champ = (typeof getSelectedChampionCard === "function") ? getSelectedChampionCard() : (cards && cards[0] ? cards[0] : null);
  const champName = champ ? champ.name : "Blaze";

  banner.innerHTML = `
    <div class="world-boss-container" id="worldBossWidget">
      <div style="display:flex;align-items:center;gap:16px;min-width:260px">
        <div style="font-size:46px;filter:drop-shadow(0 0 15px #ef4444);user-select:none">${boss.icon}</div>
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="font-size:16px;font-weight:900;color:#fff">${boss.name}</span>
            <span style="font-size:10px;font-weight:900;color:#ef4444;background:rgba(239,68,68,0.2);padding:2px 7px;border-radius:6px;border:1px solid #ef4444">GLOBAL RAID BOSS</span>
          </div>
          <div style="font-size:12px;color:#94a3b8;margin-top:2px">
            Element: <b style="color:#f87171">${boss.element}</b> • Weakness: <b style="color:#38bdf8">${boss.weakness}</b>
          </div>
          <div style="font-size:11px;color:#cbd5e1;margin-top:2px">
            Your Champion: <b style="color:#fbbf24">${champName}</b>
          </div>
        </div>
      </div>

      <div style="flex:1;min-width:240px">
        <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:800;margin-bottom:6px">
          <span style="color:#fca5a5">Raid Boss Vitality</span>
          <span id="worldBossHpDisplay" style="color:#fff">${boss.hp.toLocaleString()} / ${boss.maxHp.toLocaleString()} HP (${pct}%)</span>
        </div>
        <div style="background:rgba(0,0,0,0.6);border-radius:10px;height:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.15);position:relative">
          <div id="worldBossHpFill" style="background:linear-gradient(90deg, #ef4444, #f59e0b);height:100%;width:${pct}%;transition:width 0.25s ease;box-shadow:0 0 10px #ef4444"></div>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:10px">
        <button id="strikeWorldBossBtn" class="accountBtn" onclick="strikeWorldBoss()" style="background:linear-gradient(135deg, #ef4444, #b91c1c);color:#fff;font-weight:900;font-size:14px;padding:12px 22px;border-radius:12px;box-shadow:0 0 25px rgba(239,68,68,0.6);letter-spacing:0.5px">
          ⚔️ STRIKE BOSS!
        </button>
      </div>
    </div>
  `;
}
window.renderWorldBossBanner = renderWorldBossBanner;

window.strikeWorldBoss = function(overrideDmg){
  let boss = null;
  try {
    boss = JSON.parse(localStorage.getItem("cardCollectorWorldBoss"));
  } catch(e){}
  if(!boss || !boss.hp || boss.hp <= 0) return;

  const champ = (typeof getSelectedChampionCard === "function") ? getSelectedChampionCard() : (cards && cards[0] ? cards[0] : null);
  let dmg = 0;
  if(typeof overrideDmg === "number"){
    dmg = overrideDmg;
  } else if(champ && Array.isArray(champ.attacks) && champ.attacks.length > 0){
    const highestAtk = Math.max(...champ.attacks.map(a => parseInt(a.dmg, 10) || 25));
    const isCrit = Math.random() < 0.25;
    const mult = isCrit ? (1.5 + Math.random() * 0.5) : (0.95 + Math.random() * 0.25);
    dmg = Math.round(highestAtk * mult);
    if(isCrit && typeof showLiveToast === "function"){
      showLiveToast(`💥 CRITICAL STRIKE! ${champ.name} dealt ${dmg} CRIT DMG to ${boss.name}!`, false);
    }
  } else {
    dmg = Math.floor(Math.random() * 50) + 40;
  }

  if(dmg > 999999) dmg = 999999;

  boss.hp = Math.max(0, boss.hp - dmg);
  localStorage.setItem("cardCollectorWorldBoss", JSON.stringify(boss));

  playChaosSfx("laser");

  const widget = document.getElementById("worldBossWidget");
  if(widget){
    const floatEl = document.createElement("div");
    floatEl.className = "chaos-floating-dmg";
    floatEl.textContent = `-${dmg.toLocaleString()} DMG!`;
    floatEl.style.left = `${Math.random() * 40 + 30}%`;
    floatEl.style.top = "20px";
    widget.appendChild(floatEl);
    setTimeout(() => floatEl.remove(), 900);
  }

  const pct = Math.max(0, Math.min(100, Math.round((boss.hp / boss.maxHp) * 100)));
  const hpDisp = document.getElementById("worldBossHpDisplay");
  const hpFill = document.getElementById("worldBossHpFill");
  if(hpDisp) hpDisp.textContent = `${boss.hp.toLocaleString()} / ${boss.maxHp.toLocaleString()} HP (${pct}%)`;
  if(hpFill) hpFill.style.width = `${pct}%`;

  updateChaosBossAdminControls();

  if(boss.hp <= 0){
    playChaosSfx("detonation");
    setTimeout(() => playChaosSfx("triumph"), 400);
    if(typeof confetti === "function"){
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
    }

    if(typeof coins !== "undefined"){
      coins += 2500;
    }
    const curAcc = (typeof getUserAccount === "function") ? getUserAccount(currentUser) : (accounts && accounts[currentUser]);
    if(curAcc){
      curAcc.coins = (curAcc.coins || 0) + 2500;
    }

    if(typeof save === "function") save();
    if(typeof render === "function") render();

    localStorage.removeItem("cardCollectorWorldBoss");
    renderWorldBossBanner();
    updateChaosBossAdminControls();

    if(typeof showLiveToast === "function"){
      showLiveToast(`🏆 WORLD BOSS SLAIN! ${boss.name} was vanquished! You received +2,500 Coins!`, true);
    }
  }
};

function initChaosLabPacks(){
  const packSelect = document.getElementById("chaosPackSelect");
  if(!packSelect || typeof packTiers !== "object" || !packTiers) return;
  const prevVal = packSelect.value;
  packSelect.innerHTML = "";
  Object.keys(packTiers).forEach(key => {
    const p = packTiers[key];
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = `${p.icon || "📦"} ${p.name || key} (${p.count || 5} Cards • ${p.baseCost || 100} Coins)`;
    packSelect.appendChild(opt);
  });
  if(prevVal && packSelect.querySelector(`option[value="${prevVal}"]`)){
    packSelect.value = prevVal;
  }
}

function initChaosLabUI(){
  initChaosLabPacks();
  refreshAdminPlayerData();
  updateChaosBossAdminControls();
}
window.initChaosLabUI = initChaosLabUI;

// Wire up event listeners
document.addEventListener("DOMContentLoaded", () => {
  const rainBtn = document.getElementById("chaosCardRainBtn");
  if(rainBtn) rainBtn.onclick = () => triggerCardRain(6);

  const confettiBtn = document.getElementById("chaosConfettiStormBtn");
  if(confettiBtn) confettiBtn.onclick = () => triggerMegaConfetti();

  const empBtn = document.getElementById("chaosEmpGlitchBtn");
  if(empBtn) empBtn.onclick = () => triggerEmpGlitch();

  const discoBtn = document.getElementById("chaosDiscoModeBtn");
  if(discoBtn) discoBtn.onclick = () => toggleDiscoMode();

  const spinBtn = document.getElementById("chaosSpinReelBtn");
  if(spinBtn) spinBtn.onclick = () => spinChaosCasino();

  const busterBtn = document.getElementById("chaosRunPackBusterBtn");
  if(busterBtn) busterBtn.onclick = () => runChaosPackBuster();

  const bossSelect = document.getElementById("chaosBossSelect");
  const customInputs = document.getElementById("chaosCustomBossInputs");
  if(bossSelect && customInputs){
    bossSelect.onchange = () => {
      customInputs.style.display = bossSelect.value === "custom" ? "grid" : "none";
    };
  }

  const summonBtn = document.getElementById("chaosSummonBossBtn");
  if(summonBtn) summonBtn.onclick = () => {
    const bossKey = bossSelect ? bossSelect.value : "ignis";
    const customName = document.getElementById("chaosCustomBossName") ? document.getElementById("chaosCustomBossName").value : "";
    const customHp = document.getElementById("chaosCustomBossHp") ? document.getElementById("chaosCustomBossHp").value : "";
    summonWorldBoss(bossKey, customName, customHp);
  };

  const dismissBtn = document.getElementById("chaosDismissBossBtn");
  if(dismissBtn) dismissBtn.onclick = () => dismissWorldBoss();

  const healBtn = document.getElementById("chaosHealBossBtn");
  if(healBtn) healBtn.onclick = () => healWorldBoss();

  const nukeBtn = document.getElementById("chaosNukeBossBtn");
  if(nukeBtn) nukeBtn.onclick = () => nukeWorldBoss();

  document.querySelectorAll(".chaosSoundBtn").forEach(btn => {
    btn.onclick = () => {
      const sfx = btn.getAttribute("data-sfx");
      playChaosSfx(sfx);
      btn.style.transform = "scale(0.95)";
      setTimeout(() => btn.style.transform = "none", 120);
      if(typeof broadcastChaosFx === "function"){
        broadcastChaosFx({ type: "sfx", sound: sfx });
      }
    };
  });

  renderWorldBossBanner();
});

// Immediate execution fallback if DOM already loaded
if(document.readyState === "complete" || document.readyState === "interactive"){
  setTimeout(() => {
    renderWorldBossBanner();
    updateChaosBossAdminControls();
  }, 100);
}

// ==========================================
// ⚡ INCOMING CHAOS FX SYNCHRONIZATION HANDLER
// ==========================================

function executeIncomingChaosFx(fxData, sender){
  if(!fxData || !fxData.type) return;
  const fromName = sender || "Master Admin Cam";

  if(fxData.type === "mega_confetti"){
    triggerMegaConfetti(true);
    if(typeof showLiveToast === "function"){
      showLiveToast(`🎉 Mega Confetti Storm unleashed by <b>${fromName}</b>!`, true);
    }
  } else if(fxData.type === "card_rain"){
    triggerCardRain(fxData.durationSec || 6, true);
    if(typeof showLiveToast === "function"){
      showLiveToast(`🌧️ Cosmic Card Rain storm unleashed by <b>${fromName}</b>!`, true);
    }
  } else if(fxData.type === "emp_glitch"){
    triggerEmpGlitch(true);
    if(typeof showLiveToast === "function"){
      showLiveToast(`💥 NUCLEAR EMP DETONATED by <b>${fromName}</b>: Seismic shockwave across all screens!`, true);
    }
  } else if(fxData.type === "disco_mode"){
    toggleDiscoMode(fxData.active, true);
    if(!fxData.isSilent && typeof showLiveToast === "function"){
      showLiveToast(`🌈 Rainbow Disco Aura <b>${fxData.active ? "ACTIVATED" : "deactivated"}</b> by <b>${fromName}</b>!`, true);
    }
  } else if(fxData.type === "sfx"){
    if(typeof playChaosSfx === "function") playChaosSfx(fxData.sound);
    if(typeof showLiveToast === "function"){
      showLiveToast(`🔊 Server SFX Synth [${fxData.sound}] broadcasted by <b>${fromName}</b>!`, false);
    }
  } else if(fxData.type === "summon_boss"){
    if(fxData.boss){
      localStorage.setItem("cardCollectorWorldBoss", JSON.stringify(fxData.boss));
      if(!fxData.isSilent){
        playChaosSfx("siren");
        setTimeout(() => playChaosSfx("detonation"), 450);
        if(typeof showLiveToast === "function"){
          showLiveToast(`🚨 WORLD BOSS SUMMONED by <b>${fromName}</b>: ${fxData.boss.name} has emerged on the battlefield!`, true);
        }
      }
      renderWorldBossBanner();
      updateChaosBossAdminControls();
    }
  } else if(fxData.type === "strike_boss"){
    let boss = null;
    try { boss = JSON.parse(localStorage.getItem("cardCollectorWorldBoss")); } catch(e){}
    if(!boss) return;
    boss.hp = fxData.newHp;
    localStorage.setItem("cardCollectorWorldBoss", JSON.stringify(boss));

    const widget = document.getElementById("worldBossWidget");
    if(widget){
      const floatEl = document.createElement("div");
      floatEl.className = "chaos-floating-dmg";
      floatEl.textContent = `-${(fxData.dmg || 50).toLocaleString()} DMG!`;
      floatEl.style.left = `${Math.random() * 40 + 30}%`;
      floatEl.style.top = "20px";
      widget.appendChild(floatEl);
      setTimeout(() => floatEl.remove(), 900);
    }

    const pct = Math.max(0, Math.min(100, Math.round((boss.hp / boss.maxHp) * 100)));
    const hpDisp = document.getElementById("worldBossHpDisplay");
    const hpFill = document.getElementById("worldBossHpFill");
    if(hpDisp) hpDisp.textContent = `${boss.hp.toLocaleString()} / ${boss.maxHp.toLocaleString()} HP (${pct}%)`;
    if(hpFill) hpFill.style.width = `${pct}%`;

    playChaosSfx("laser");

    if(boss.hp <= 0 || fxData.isDead){
      playChaosSfx("detonation");
      setTimeout(() => playChaosSfx("triumph"), 400);
      if(typeof confetti === "function"){
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
      }
      if(typeof coins !== "undefined" && (typeof isInfiniteValue !== "function" || !isInfiniteValue(coins))){
        coins += 2500;
      }
      const curAcc = (typeof getUserAccount === "function") ? getUserAccount(currentUser) : (accounts && accounts[currentUser]);
      if(curAcc && (typeof isInfiniteValue !== "function" || !isInfiniteValue(curAcc.coins))){
        curAcc.coins = (curAcc.coins || 0) + 2500;
      }
      if(typeof save === "function") save();
      if(typeof render === "function") render();
      localStorage.removeItem("cardCollectorWorldBoss");
      renderWorldBossBanner();
      updateChaosBossAdminControls();
      if(typeof showLiveToast === "function"){
        showLiveToast(`🏆 WORLD BOSS SLAIN by ${fxData.attacker || fromName}! ${boss.name} was vanquished! +2,500 Coins rewarded!`, true);
      }
    }
  } else if(fxData.type === "heal_boss"){
    let boss = null;
    try { boss = JSON.parse(localStorage.getItem("cardCollectorWorldBoss")); } catch(e){}
    if(!boss) return;
    boss.hp = fxData.newHp || boss.maxHp;
    localStorage.setItem("cardCollectorWorldBoss", JSON.stringify(boss));
    renderWorldBossBanner();
    updateChaosBossAdminControls();
    playChaosSfx("ascension");
    if(typeof showLiveToast === "function"){
      showLiveToast(`💖 ${boss.name} healed by <b>${fromName}</b>!`, true);
    }
  } else if(fxData.type === "dismiss_boss"){
    localStorage.removeItem("cardCollectorWorldBoss");
    renderWorldBossBanner();
    updateChaosBossAdminControls();
    if(typeof showLiveToast === "function"){
      showLiveToast(`🛑 World Boss Raid dismissed by <b>${fromName}</b>.`, true);
    }
  } else if(fxData.type === "casino_spin"){
    playChaosSfx("triumph");
    if(typeof confetti === "function"){
      confetti({ particleCount: 80, spread: 75, origin: { y: 0.6 } });
    }
    if(typeof showLiveToast === "function"){
      showLiveToast(`🎰 HIGH-ROLLER CASINO: <b>${fxData.targetUser}</b> won <b>[${fxData.prize}]</b>!`, true);
    }
  }
}
window.executeIncomingChaosFx = executeIncomingChaosFx;
