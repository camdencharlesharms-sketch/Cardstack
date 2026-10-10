
// ========================================================
// ELEMENTAL ENCHANTMENTS & FORGE CONSTANTS
// ========================================================
const ENCHANT_META = {
  none: { name: "None", icon: "", badge: "NONE", color: "#94a3b8", glow: "", statBuff: "No active elemental infusion.", desc: "Standard artifact essence." },
  inferno: { name: "Inferno", icon: "🔥", badge: "🔥 INFERNO", color: "#f97316", glow: "rgba(249, 115, 22, 0.6)", statBuff: "+20 Fire Attack DMG", desc: "Infused with nether flame. Attacks ignite opponents for scorching criticals." },
  plasma: { name: "Plasma", icon: "⚡", badge: "⚡ PLASMA", color: "#38bdf8", glow: "rgba(56, 189, 248, 0.6)", statBuff: "+20 Shock Attack DMG", desc: "Charged with high-voltage ion plasma. Delivers high-voltage critical strikes." },
  glacial: { name: "Glacial", icon: "❄️", badge: "❄️ GLACIAL", color: "#06b6d4", glow: "rgba(6, 182, 212, 0.6)", statBuff: "+25 Frost Armor Shield", desc: "Encased in absolute zero cryo ice. Shields champion from incoming damage." },
  void: { name: "Void", icon: "🌌", badge: "🌌 VOID", color: "#a855f7", glow: "rgba(168, 85, 247, 0.6)", statBuff: "True Armor Pierce", desc: "Resonates with cosmic dark matter. Attacks phase directly through enemy armor." },
  gaia: { name: "Gaia", icon: "🌿", badge: "🌿 GAIA", color: "#10b981", glow: "rgba(16, 185, 129, 0.6)", statBuff: "+15 HP Regen Each Turn", desc: "Blessed with primordial earth vitality. Regenerates HP each combat round." }
};
window.ENCHANT_META = ENCHANT_META;

// ========================================================
// DAILY FORTUNE VAULT & 7-DAY STREAK CONFIGURATION
// ========================================================
const DAILY_REWARDS = [
  { day: 1, label: "Day 1", rewardDesc: "500 🪙", icon: "🪙", coins: 500, pack: null },
  { day: 2, label: "Day 2", rewardDesc: "750 🪙 + Common Pack", icon: "📦", coins: 750, pack: "common" },
  { day: 3, label: "Day 3", rewardDesc: "1,500 🪙 + 2x Luck", icon: "✨", coins: 1500, pack: null, luck: 2 },
  { day: 4, label: "Day 4", rewardDesc: "2,000 🪙 + Rare Pack", icon: "📦", coins: 2000, pack: "rare" },
  { day: 5, label: "Day 5", rewardDesc: "3,500 🪙 + Crystal", icon: "🔮", coins: 3500, pack: null },
  { day: 6, label: "Day 6", rewardDesc: "5,000 🪙 + Legendary Pack", icon: "👑", coins: 5000, pack: "legendary" },
  { day: 7, label: "Day 7", rewardDesc: "10,000 🪙 + GOD PACK", icon: "🌌", coins: 10000, pack: "god", title: "⚡ Chronos Master" }
];
window.DAILY_REWARDS = DAILY_REWARDS;

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

let goldCards = [];
let rainbowCards = [];
if(typeof window !== "undefined"){
  window.goldCards = goldCards;
  window.rainbowCards = rainbowCards;
}

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
  const activeGold = (typeof goldCards !== "undefined" && Array.isArray(goldCards)) ? goldCards : (window.goldCards || []);
  const activeRainbow = (typeof rainbowCards !== "undefined" && Array.isArray(rainbowCards)) ? rainbowCards : (window.rainbowCards || []);
  const cleanGold = activeGold.map(x => parseInt(x, 10)).filter(n => !isNaN(n));
  const cleanRainbow = activeRainbow.map(x => parseInt(x, 10)).filter(n => !isNaN(n));

  if(targetAcc){
    targetAcc.owned = activeOwned.map(x => parseInt(x, 10)).filter(n => !isNaN(n));
    targetAcc.coins = persistCoins;
    targetAcc.goldCards = Array.from(new Set(cleanGold));
    targetAcc.rainbowCards = Array.from(new Set(cleanRainbow));
    if(Array.isArray(targetAcc.unreleasedOwned)){
      targetAcc.unreleasedOwned = Array.from(new Set(targetAcc.unreleasedOwned));
    }
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    localStorage.setItem("cardCollectorCurrentUser", currentUser);
    if(typeof syncAccountToCloud === "function") syncAccountToCloud(currentUser);
  } else if(currentUser && accounts) {
    const existing = accounts[currentUser] || {};
    accounts[currentUser] = {
      password: existing.password || "",
      owned: activeOwned.map(x => parseInt(x, 10)).filter(n => !isNaN(n)),
      goldCards: Array.from(new Set(cleanGold)),
      rainbowCards: Array.from(new Set(cleanRainbow)),
      coins: persistCoins,
      unreleasedOwned: existing.unreleasedOwned || [],
      lastDailyClaim: existing.lastDailyClaim || 0,
      dailyStreak: existing.dailyStreak || 0,
      hasPlayed: true,
      lastActive: Date.now()
    };
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    localStorage.setItem("cardCollectorCurrentUser", currentUser);
    if(typeof syncAccountToCloud === "function") syncAccountToCloud(currentUser);
  } else {
    try {
      localStorage.setItem("cardCollectorGuestOwned", JSON.stringify(owned));
      localStorage.setItem("cardCollectorGuestGold", JSON.stringify(cleanGold));
      localStorage.setItem("cardCollectorGuestRainbow", JSON.stringify(cleanRainbow));
      localStorage.setItem("cardCollectorGuestCoins", isCoinsInfinite ? "Infinity" : coins.toString());
    } catch(e){}
  }
}

let bannedCountdownInterval = null;

function showBannedScreen(banInfo, targetUsername){
  const overlay = document.getElementById("bannedScreenOverlay");
  if(!overlay) return;

  // Close any potentially active game modals so the suspension overlay takes immediate full focus
  ["packModal", "arenaModal", "cardDetailModal", "accountModal", "adminBanDialogModal", "summonerModal", "qrPairModal"].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.style.display = "none";
  });

  const targetName = targetUsername || (currentUser || localStorage.getItem("cardCollectorCurrentUser") || "Player");
  const nameEl = document.getElementById("bannedScreenAccountName");
  if(nameEl) nameEl.textContent = targetName;

  const reasonEl = document.getElementById("bannedScreenReasonText");
  const reason = (banInfo && banInfo.banReason) ? banInfo.banReason : "Your account has been temporarily suspended by Master Cam.";
  if(reasonEl) reasonEl.textContent = reason;

  const countBox = document.getElementById("bannedCountdownContainer");
  const countText = document.getElementById("bannedScreenCountdown");
  const permBox = document.getElementById("bannedPermanentContainer");

  if(bannedCountdownInterval){
    clearInterval(bannedCountdownInterval);
    bannedCountdownInterval = null;
  }

  const banExpires = banInfo ? (banInfo.banExpires || banInfo.expires) : null;

  if(banExpires && banExpires > Date.now()){
    if(countBox) countBox.style.display = "block";
    if(permBox) permBox.style.display = "none";

    const updateTimer = () => {
      const remainingMs = banExpires - Date.now();
      if(remainingMs <= 0){
        clearInterval(bannedCountdownInterval);
        bannedCountdownInterval = null;
        liftExpiredBan(targetName);
        return;
      }
      const totalSec = Math.floor(remainingMs / 1000);
      const hours = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;
      if(countText){
        if(hours > 0){
          countText.textContent = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        } else {
          countText.textContent = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
      }
    };
    updateTimer();
    bannedCountdownInterval = setInterval(updateTimer, 1000);
  } else {
    if(countBox) countBox.style.display = "none";
    if(permBox) permBox.style.display = "block";
  }

  const signOutBtn = document.getElementById("bannedScreenSignOutBtn");
  if(signOutBtn){
    signOutBtn.onclick = () => {
      if(bannedCountdownInterval){
        clearInterval(bannedCountdownInterval);
        bannedCountdownInterval = null;
      }
      overlay.style.display = "none";
      currentUser = null;
      localStorage.removeItem("cardCollectorCurrentUser");
      if(typeof updateAccountUI === "function") updateAccountUI();
      if(typeof render === "function") render();
    };
  }

  overlay.style.display = "flex";
}
window.showBannedScreen = showBannedScreen;

function hideBannedScreen(){
  if(bannedCountdownInterval){
    clearInterval(bannedCountdownInterval);
    bannedCountdownInterval = null;
  }
  const overlay = document.getElementById("bannedScreenOverlay");
  if(overlay) overlay.style.display = "none";
}
window.hideBannedScreen = hideBannedScreen;

function liftExpiredBan(username){
  hideBannedScreen();
  if(accounts && accounts[username]){
    accounts[username].banned = false;
    accounts[username].banReason = "";
    accounts[username].banExpires = null;
    accounts[username].lastAdminActionTime = Date.now();
    accounts[username].adminRevision = (accounts[username].adminRevision || 0) + 1;
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    if(typeof syncAccountToCloud === "function") syncAccountToCloud(username, true, true);
  }
  if(typeof playChaosSfx === "function") playChaosSfx("triumph");
  if(typeof showLiveToast === "function"){
    showLiveToast("🟢 Your suspension has concluded! Welcome back to Cardstack!", true);
  }
  if(username){
    loadAccount(username);
  }
}
window.liftExpiredBan = liftExpiredBan;

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
  if(userAcc && userAcc.banned && !(typeof isCamUsername === "function" && isCamUsername(username))){
    if(userAcc.banExpires && Date.now() >= userAcc.banExpires){
      userAcc.banned = false;
      userAcc.banReason = "";
      userAcc.banExpires = null;
      userAcc.lastAdminActionTime = Date.now();
      userAcc.adminRevision = (userAcc.adminRevision || 0) + 1;
      localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
      if(typeof syncAccountToCloud === "function") syncAccountToCloud(username, true, true);
      if(typeof showLiveToast === "function") showLiveToast("🟢 Welcome back! Your suspension has expired.", true);
    } else {
      currentUser = username;
      localStorage.setItem("cardCollectorCurrentUser", username);
      if(typeof showBannedScreen === "function"){
        showBannedScreen(userAcc, username);
      } else {
        alert("⛔ This account has been suspended by Master Cam.");
      }
      if(typeof initInstantAdminSSE === "function") initInstantAdminSSE();
      if(typeof checkRecentAdminDispatches === "function") checkRecentAdminDispatches();
      return;
    }
  }
  if(userAcc){
    owned = (Array.isArray(userAcc.owned) ? userAcc.owned : []).map(x => parseInt(x, 10)).filter(n => !isNaN(n));
    if(owned.length === 0) owned = [0];
    goldCards = (Array.isArray(userAcc.goldCards) ? userAcc.goldCards : []).map(x => parseInt(x, 10)).filter(n => !isNaN(n));
    rainbowCards = (Array.isArray(userAcc.rainbowCards) ? userAcc.rainbowCards : []).map(x => parseInt(x, 10)).filter(n => !isNaN(n));
    if(typeof isInfiniteValue === "function" && isInfiniteValue(userAcc.coins)){
      coins = Infinity;
    } else {
      coins = Number.isFinite(userAcc.coins) ? userAcc.coins : 100;
    }
  } else {
    owned = [0];
    goldCards = [];
    rainbowCards = [];
    coins = 100;
  }
  if(username && (username.toLowerCase() === "cam" || (typeof isCamUsername === "function" && isCamUsername(username)))){
    currentUser = "Cam";
    if(typeof cards !== "undefined" && Array.isArray(cards) && cards.length > 0){
      owned = cards.map((_, i) => i);
    } else {
      owned = Array.from({ length: 210 }, (_, i) => i);
    }
    coins = Infinity;
    if(accounts && accounts["Cam"]){
      accounts["Cam"].owned = owned;
      accounts["Cam"].ownedAll = true;
      accounts["Cam"].coins = "Infinity";
      if(!accounts["Cam"].unreleasedOwned || accounts["Cam"].unreleasedOwned.length === 0){
        accounts["Cam"].unreleasedOwned = ["vault_card_1", "vault_card_2"];
      }
    }
  }
  if(typeof window !== "undefined"){
    window.owned = owned;
    window.goldCards = goldCards;
    window.rainbowCards = rainbowCards;
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
  const tabBtnGodRealm = document.getElementById("godRealmTabBtn") || document.querySelector('.admin-tab-btn[data-tab="tabGodRealm"]');

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
    if(tabBtnGodRealm) tabBtnGodRealm.style.display = "block";

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
    if(tabBtnGodRealm) tabBtnGodRealm.style.display = perms.godRealm ? "block" : "none";

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
    adjustedWeights.transcendent = (adjustedWeights.transcendent || 1) * adminLuckMultiplier;
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
  model.classList.add("unsealing");
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
        const foilRoll = Math.random();
        const isRainbowEdition = foilRoll < 0.035; // ~3.5% chance for Ultra Rare Prismatic Rainbow!
        const isGoldEdition = !isRainbowEdition && (foilRoll < 0.115); // ~8% chance for 24K Gold!

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
          if(cardIndex >= 0){
            if(isRainbowEdition){
              if(!rainbowCards.includes(cardIndex)) rainbowCards.push(cardIndex);
            } else if(isGoldEdition){
              if(!goldCards.includes(cardIndex)) goldCards.push(cardIndex);
            }
          }
        }

        const attacksHtml = card.attacks.map(atk => `
          <div class="attack-preview">
            <span class="attack-name">⚔️ ${atk.name}</span>
            <span class="attack-dmg">${typeof formatDmg === "function" ? formatDmg(atk.dmg) : atk.dmg + " DMG"}</span>
          </div>
        `).join("");

        const item = document.createElement("div");
        item.className = "flip-card-wrapper";
        item.setAttribute("data-rarity", card.rarity);
        item.style.animationDelay = `${i * 0.12}s`;

        item.innerHTML = `
          <div class="flip-card-inner">
            <div class="flip-card-back">
              <div style="font-size:46px">🃏</div>
              <div style="font-size:13px;font-weight:900;color:#38bdf8;text-transform:uppercase;letter-spacing:1px">CARD STACK</div>
              <div style="font-size:11px;font-weight:800;color:#facc15;background:rgba(250,204,21,0.15);padding:2px 8px;border-radius:10px">FLIP TO REVEAL</div>
            </div>
            <div class="flip-card-front">
              <div class="card ${isRainbowEdition ? 'rainbow-edition-card' : (isGoldEdition ? 'gold-edition-card' : '')}" style="height:100%">
                <div class="face ${card.rarity}">
                  <div class="card-top">
                    <span class="rarity">${card.rarity}${card.isUnreleased ? '<span style="background:#dc2626;color:#fff;font-size:9px;padding:2px 5px;border-radius:4px;font-weight:800;margin-left:4px">🔒 UNRELEASED</span>' : ""}${isRainbowEdition ? '<span class="rainbow-edition-tag">🌈 RAINBOW EDITION</span>' : (isGoldEdition ? '<span class="gold-edition-tag">✨ GOLD EDITION</span>' : '')}</span>
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
                  <div class="holo-glint"></div>
                </div>
              </div>
              <div class="reveal-badge ${isNew ? 'new' : 'dup'}">${isNew ? 'New Discovery' : 'Duplicate'}</div>
            </div>
          </div>
        `;

        item.onclick = () => {
          if(item.classList.contains("flipped")) return;
          item.classList.add("flipped");
          if(typeof playChaosSfx === "function") playChaosSfx("ascension");
          if(isRainbowEdition){
            if(typeof confetti === "function"){
              confetti({ particleCount: 75, spread: 85, colors: ["#f43f5e", "#ec4899", "#a855f7", "#3b82f6", "#10b981", "#facc15", "#fff"] });
            }
            if(typeof showLiveToast === "function"){
              showLiveToast(`🌈 <b>ULTRA RARE RAINBOW DISCOVERY!</b> You pulled Rainbow Edition [${card.name}]!`, true);
            }
          } else if(isGoldEdition){
            if(typeof confetti === "function"){
              confetti({ particleCount: 45, spread: 60, colors: ["#fbbf24", "#f59e0b", "#fff", "#eab308"] });
            }
            if(typeof showLiveToast === "function"){
              showLiveToast(`✨ <b>SHINY GOLD DISCOVERY!</b> You pulled Gold Edition [${card.name}]!`, true);
            }
          }
          if(card.rarity === "divine" || card.rarity === "mythic" || card.rarity === "legendary"){
            if(typeof confetti === "function"){
              const rect = item.getBoundingClientRect();
              const x = (rect.left + rect.width / 2) / window.innerWidth;
              const y = (rect.top + rect.height / 2) / window.innerHeight;
              confetti({ particleCount: 45, spread: 60, origin: { x, y } });
            }
          }
        };

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


/* ========================================================
   COLLECTION MASTERY & COMPLETION HUD SYSTEM
   ======================================================== */
function updateMasteryHud(){
  const container = document.getElementById("masteryHudContainer");
  if(!container) return;
  const barFill = document.getElementById("masteryProgressBarFill");
  const progressText = document.getElementById("masteryProgressText");
  const rankBadge = document.getElementById("masteryTierBadge");
  const breakdownContainer = document.getElementById("masteryRarityBreakdown");

  const total = (typeof cards !== "undefined" && Array.isArray(cards)) ? cards.length : 210;
  const ownedCount = (Array.isArray(owned)) ? owned.length : 0;
  const pct = Math.min(100, Math.round((ownedCount / total) * 100));

  if(barFill) barFill.style.width = pct + "%";
  if(progressText) progressText.textContent = `${ownedCount} / ${total} (${pct}%)`;

  let rankTitle = "Novice Collector";
  if(pct >= 100) rankTitle = "👑 Divine Overlord";
  else if(pct >= 85) rankTitle = "🌌 Astral Custodian";
  else if(pct >= 65) rankTitle = "👑 Grandmaster";
  else if(pct >= 45) rankTitle = "🔮 Arcane Archivist";
  else if(pct >= 25) rankTitle = "⚔️ Adept Summoner";
  else if(pct >= 10) rankTitle = "🌟 Apprentice";

  if(rankBadge) rankBadge.textContent = rankTitle;

  if(breakdownContainer && typeof cards !== "undefined" && Array.isArray(cards)){
    const rarityCounts = { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0, divine: 0, transcendent: 0 };
    const rarityTotal = { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0, divine: 0, transcendent: 0 };

    cards.forEach((c, idx) => {
      const r = (c.rarity || "common").toLowerCase();
      if(rarityTotal[r] !== undefined) rarityTotal[r]++;
      if(owned.includes(idx)){
        if(rarityCounts[r] !== undefined) rarityCounts[r]++;
      }
    });

    const rarities = [
      { key: "common", label: "Common", icon: "🔘", cls: "chip-common", filterKey: "rarity-common" },
      { key: "rare", label: "Rare", icon: "💎", cls: "chip-rare", filterKey: "rarity-rare" },
      { key: "epic", label: "Epic", icon: "🔮", cls: "chip-epic", filterKey: "rarity-epic" },
      { key: "legendary", label: "Legendary", icon: "👑", cls: "chip-legendary", filterKey: "rarity-legendary" },
      { key: "mythic", label: "Mythic", icon: "🌸", cls: "chip-mythic", filterKey: "rarity-mythic" },
      { key: "divine", label: "Divine", icon: "⚡", cls: "chip-divine", filterKey: "rarity-divine" },
      { key: "transcendent", label: "Transcendent", icon: "🌌", cls: "chip-transcendent", filterKey: "rarity-transcendent" },
      { key: "gold", label: "Gold", icon: "✨", cls: "chip-gold", filterKey: "foil-gold", customCount: (typeof goldCards !== "undefined" ? goldCards.length : 0) },
      { key: "rainbow", label: "Rainbow", icon: "🌈", cls: "chip-rainbow", filterKey: "foil-rainbow", customCount: (typeof rainbowCards !== "undefined" ? rainbowCards.length : 0) }
    ];

    breakdownContainer.innerHTML = rarities.map(r => {
      const cCount = r.customCount !== undefined ? r.customCount : (rarityCounts[r.key] || 0);
      const tCount = r.customCount !== undefined ? cards.length : (rarityTotal[r.key] || 0);
      const rPct = tCount > 0 ? Math.round((cCount / tCount) * 100) : 0;
      return `
        <div class="mastery-chip ${r.cls}" data-filter-chip="${r.filterKey}" title="Filter by ${r.label}">
          <span>${r.icon} ${r.label}</span>
          <span style="color:#94a3b8;font-size:10px">${cCount}/${tCount} (${rPct}%)</span>
        </div>
      `;
    }).join("");

    if(typeof breakdownContainer.querySelectorAll === "function") breakdownContainer.querySelectorAll(".mastery-chip").forEach(chip => {
      chip.onclick = () => {
        const targetFilter = chip.getAttribute("data-filter-chip");
        document.querySelectorAll("[data-filter]").forEach(b => {
          b.classList.toggle("active", b.dataset.filter === targetFilter);
        });
        filter = targetFilter;
        render();
        if(typeof playChaosSfx === "function") playChaosSfx("click");
      };
    });
  }
}
window.updateMasteryHud = updateMasteryHud;

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
    if(filter === "foil-gold"){
      if(!has) return false;
      const cIdx = cards.indexOf(c);
      return goldCards.includes(cIdx) || (userAcc && Array.isArray(userAcc.goldCards) && userAcc.goldCards.includes(cIdx));
    }
    if(filter === "foil-rainbow"){
      if(!has) return false;
      const cIdx = cards.indexOf(c);
      return rainbowCards.includes(cIdx) || (userAcc && Array.isArray(userAcc.rainbowCards) && userAcc.rainbowCards.includes(cIdx));
    }
    if(filter.startsWith("rarity-")){
      const rTarget = filter.replace("rarity-", "").toLowerCase();
      return (c.rarity || "").toLowerCase() === rTarget;
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
    const cardIndexInDeck = cards.indexOf(c);
    const isRainbowCard = has && (rainbowCards.includes(cardIndexInDeck) || (userAcc && Array.isArray(userAcc.rainbowCards) && userAcc.rainbowCards.includes(cardIndexInDeck)));
    const isGoldCard = has && !isRainbowCard && (goldCards.includes(cardIndexInDeck) || (userAcc && Array.isArray(userAcc.goldCards) && userAcc.goldCards.includes(cardIndexInDeck)));

    const el = document.createElement("div");
    let cardClasses = "card" + (has ? "" : " locked");
    if(isRainbowCard) cardClasses += " rainbow-edition-card";
    else if(isGoldCard) cardClasses += " gold-edition-card";
    el.className = cardClasses;

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

    const myUser = (typeof currentUser !== "undefined" && currentUser) ? currentUser : localStorage.getItem("cardCollectorCurrentUser");
    const userAcc = (myUser && accounts && accounts[myUser]) ? accounts[myUser] : null;
    const cardKey = isUnrel ? c.id : (c.id || c.name);
    const enchantKey = (userAcc && userAcc.cardEnchantments && userAcc.cardEnchantments[cardKey]) || null;
    const enchantBadge = (has && enchantKey && ENCHANT_META[enchantKey]) 
      ? `<span class="enchant-badge ${enchantKey}">${ENCHANT_META[enchantKey].badge}</span>` 
      : "";
    if(has && enchantKey){
      el.classList.add(`enchant-${enchantKey}`);
    }

    const cardFaceRarity = has ? c.rarity : "";
    const displayedRarity = has ? rarityDisplayName : "Locked";
    const displayedHp = has ? ((typeof formatHp === "function") ? formatHp(c.hp) : ((c.hp || 80) + " HP")) : "???";
    const displayedName = has ? c.name : "Unknown Card";
    const displayedDesc = has ? c.desc : "Discover this artifact by opening booster packs.";

    const lockedOverlayHtml = !has ? `
      <div class="locked-rune-cipher">
        <div class="locked-rune-ring"></div>
        <div class="locked-lock-icon">🔒</div>
      </div>
    ` : '';

    el.innerHTML = `
      <div class="face ${cardFaceRarity}">
        <div class="card-top">
          <span class="rarity">${displayedRarity}${unreleasedBadge}${enchantBadge}${isRainbowCard ? '<span class="rainbow-edition-tag">🌈 RAINBOW</span>' : (isGoldCard ? '<span class="gold-edition-tag">✨ GOLD</span>' : '')}</span>
          <span style="font-size:11px;font-weight:800;color:#fca5a5">${displayedHp}</span>
        </div>
        <div class="card-art-frame">
          <img class="card-art-img" src="${c.image}" alt="${c.name}">
          <div class="card-aura"></div>
          ${lockedOverlayHtml}
        </div>
        <div class="card-bottom">
          <div class="name">${displayedName}</div>
          <div class="desc">${displayedDesc}</div>
          <div class="attacks-list">
            ${attacksHtml}
          </div>
        </div>
        ${has ? '<div class="holo-glint"></div>' : ''}
      </div>
    `;

    if(has){
      el.style.cursor = "pointer";
      el.setAttribute("title", `Click to inspect ${c.name} in 3D!`);
      el.addEventListener("click", (e) => {
        if(e.target.tagName.toLowerCase() === "button") return;
        openCardDetailModal(c);
      });
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotX = ((y - centerY) / centerY) * -14;
        const rotY = ((x - centerX) / centerX) * 14;
        el.style.transform = `perspective(900px) rotateX(${rotX.toFixed(1)}deg) rotateY(${rotY.toFixed(1)}deg) translateY(-8px) scale3d(1.025, 1.025, 1.025)`;
        const glint = el.querySelector(".holo-glint");
        if(glint){
          const xPct = Math.round((x / rect.width) * 100);
          const yPct = Math.round((y / rect.height) * 100);
          const angle = Math.round(rotY * 12 + 45);
          glint.style.background = `radial-gradient(circle at ${xPct}% ${yPct}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 28%, transparent 70%), repeating-linear-gradient(${angle}deg, rgba(255,0,128,0.2) 0%, rgba(0,255,255,0.2) 25%, rgba(255,255,0,0.2) 50%, rgba(255,0,128,0.2) 75%)`;
          glint.style.opacity = "1";
        }
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
        const glint = el.querySelector(".holo-glint");
        if(glint) glint.style.opacity = "0";
      });
    }

    grid.appendChild(el);
  });
  updateSummonerRankBadge();
  if(typeof updateMasteryHud === "function") updateMasteryHud();

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
// Global Cloud Registry & Cross-Device Synchronization
const CLOUD_REGISTRY_URL = "https://extendsclass.com/api/json-storage/bin/ecceefe";
const CLOUD_REGISTRY_BACKUP_URL = "https://extendsclass.com/api/json-storage/bin/fcedaaa";
let cloudSyncDebounceTimer = null;
let activePairPeer = null;

// Fetch accounts stored in the Global Cloud Registry
async function fetchCloudAccounts(){
  try {
    let res = await fetch(CLOUD_REGISTRY_URL, { cache: "no-store" });
    if(!res.ok){
      res = await fetch(CLOUD_REGISTRY_BACKUP_URL, { cache: "no-store" });
    }
    if(!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    let cloudAccs = {};
    if(json && json.data && json.data.accounts){
      cloudAccs = json.data.accounts;
    } else if(json && json.accounts){
      cloudAccs = json.accounts;
    }
    localStorage.setItem("cardCollectorCloudCache", JSON.stringify(cloudAccs));
    return cloudAccs;
  } catch(e){
    try {
      const cached = JSON.parse(localStorage.getItem("cardCollectorCloudCache"));
      if(cached && typeof cached === "object") return cached;
    } catch(err){}
    return {};
  }
}
window.fetchCloudAccounts = fetchCloudAccounts;

// Delete an account permanently from the Global Cloud Registry
async function deleteAccountFromCloud(username){
  if(!username) return;
  try {
    const cloudAccs = await fetchCloudAccounts();
    if(cloudAccs && cloudAccs[username]){
      delete cloudAccs[username];
      localStorage.setItem("cardCollectorCloudCache", JSON.stringify(cloudAccs));
      const delBody = JSON.stringify({
        data: {
          version: Date.now(),
          accounts: cloudAccs
        }
      });
      await fetch(CLOUD_REGISTRY_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: delBody
      });
      fetch(CLOUD_REGISTRY_BACKUP_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: delBody
      }).catch(()=>{});
      console.log(`[CloudSync] Account "${username}" purged from cloud registry.`);
    }
  } catch(e){
    console.warn("[CloudSync] Delete error:", e);
  }
}
window.deleteAccountFromCloud = deleteAccountFromCloud;


// Safe merge algorithm: never loses cards, coins, or prototype cards
function mergeAccountData(localAcc, cloudAcc){
  if(!cloudAcc) return localAcc;
  if(!localAcc) return cloudAcc;

  const cloudAdminTime = cloudAcc.lastAdminActionTime || 0;
  const localAdminTime = localAcc.lastAdminActionTime || 0;

  // Authoritative Admin Override: If cloud version has a newer admin action timestamp,
  // the cloud version is authoritative (Admin Cam gifted/took cards or coins while player was offline)
  const localGold = Array.isArray(localAcc.goldCards) ? localAcc.goldCards : [];
  const cloudGold = Array.isArray(cloudAcc.goldCards) ? cloudAcc.goldCards : [];
  const mergedGold = Array.from(new Set([...localGold, ...cloudGold])).map(x => parseInt(x, 10)).filter(n => !isNaN(n));

  const localRainbow = Array.isArray(localAcc.rainbowCards) ? localAcc.rainbowCards : [];
  const cloudRainbow = Array.isArray(cloudAcc.rainbowCards) ? cloudAcc.rainbowCards : [];
  const mergedRainbow = Array.from(new Set([...localRainbow, ...cloudRainbow])).map(x => parseInt(x, 10)).filter(n => !isNaN(n));

  const localDailyClaim = localAcc.lastDailyClaim || 0;
  const cloudDailyClaim = cloudAcc.lastDailyClaim || 0;
  const mergedLastDailyClaim = Math.max(localDailyClaim, cloudDailyClaim);

  const localDailyStreak = localAcc.dailyStreak || 0;
  const cloudDailyStreak = cloudAcc.dailyStreak || 0;
  const mergedDailyStreak = Math.max(localDailyStreak, cloudDailyStreak);

  if(cloudAdminTime > localAdminTime){
    const isOwnedAll = !!(cloudAcc.ownedAll || (cloudAcc.owned && cloudAcc.owned.length >= 200));
    return {
      password: cloudAcc.password || localAcc.password || "",
      owned: isOwnedAll && typeof cards !== "undefined" && cards.length > 0 ? cards.map((_, i) => i) : (Array.isArray(cloudAcc.owned) ? cloudAcc.owned : [0]),
      ownedAll: isOwnedAll,
      coins: cloudAcc.coins !== undefined ? cloudAcc.coins : 100,
      goldCards: mergedGold,
      rainbowCards: mergedRainbow,
      unreleasedOwned: Array.isArray(cloudAcc.unreleasedOwned) ? cloudAcc.unreleasedOwned : [],
      lastDailyClaim: mergedLastDailyClaim,
      dailyStreak: mergedDailyStreak,
      googleEmail: cloudAcc.googleEmail || localAcc.googleEmail || "",
      googleName: cloudAcc.googleName || localAcc.googleName || "",
      googlePicture: cloudAcc.googlePicture || localAcc.googlePicture || "",
      hasPlayed: true,
      banned: !!cloudAcc.banned,
      banReason: cloudAcc.banReason || "",
      banExpires: cloudAcc.banExpires || null,
      lastAdminActionTime: cloudAdminTime,
      adminRevision: cloudAcc.adminRevision || 1,
      lastActive: Math.max(localAcc.lastActive || 0, cloudAcc.lastActive || 0, Date.now())
    };
  }

  const localOwned = Array.isArray(localAcc.owned) ? localAcc.owned : [];
  const cloudOwned = Array.isArray(cloudAcc.owned) ? cloudAcc.owned : [];
  const mergedOwned = Array.from(new Set([...localOwned, ...cloudOwned])).sort((a,b)=>a-b);

  let mergedCoins = 100;
  if(localAcc.coins === "Infinity" || cloudAcc.coins === "Infinity" || localAcc.coins === Infinity || cloudAcc.coins === Infinity){
    mergedCoins = "Infinity";
  } else {
    const localCoins = Number.isFinite(localAcc.coins) ? localAcc.coins : 0;
    const cloudCoins = Number.isFinite(cloudAcc.coins) ? cloudAcc.coins : 0;
    mergedCoins = Math.max(localCoins, cloudCoins, 100);
  }

  const localUnreleased = Array.isArray(localAcc.unreleasedOwned) ? localAcc.unreleasedOwned : [];
  const cloudUnreleased = Array.isArray(cloudAcc.unreleasedOwned) ? cloudAcc.unreleasedOwned : [];
  const mergedUnreleased = Array.from(new Set([...localUnreleased, ...cloudUnreleased]));

  const password = localAcc.password || cloudAcc.password || "";
  const isOwnedAll = !!(localAcc.ownedAll || cloudAcc.ownedAll || (localAcc.owned && localAcc.owned.length >= 200) || (cloudAcc.owned && cloudAcc.owned.length >= 200));
  const googleEmail = cloudAcc.googleEmail || localAcc.googleEmail || "";
  const googleName = cloudAcc.googleName || localAcc.googleName || "";
  const googlePicture = cloudAcc.googlePicture || localAcc.googlePicture || "";

  return {
    password,
    owned: isOwnedAll && typeof cards !== "undefined" && cards.length > 0 ? cards.map((_, i) => i) : (mergedOwned.length > 0 ? mergedOwned : [0]),
    ownedAll: isOwnedAll,
    coins: mergedCoins,
    goldCards: mergedGold,
    rainbowCards: mergedRainbow,
    unreleasedOwned: mergedUnreleased,
    lastDailyClaim: mergedLastDailyClaim,
    dailyStreak: mergedDailyStreak,
    googleEmail,
    googleName,
    googlePicture,
    hasPlayed: true,
    banned: (cloudAcc.banned && (!cloudAcc.banExpires || Date.now() < cloudAcc.banExpires)) ? true : (cloudAdminTime > localAdminTime ? !!cloudAcc.banned : (localAdminTime > cloudAdminTime ? !!localAcc.banned : !!(cloudAcc.banned || localAcc.banned))),
    banReason: (cloudAcc.banned && (!cloudAcc.banExpires || Date.now() < cloudAcc.banExpires)) ? (cloudAcc.banReason || "Your account has been temporarily suspended by Master Cam.") : (cloudAdminTime > localAdminTime ? (cloudAcc.banReason || "") : (localAcc.banReason || cloudAcc.banReason || "")),
    banExpires: (cloudAcc.banned && (!cloudAcc.banExpires || Date.now() < cloudAcc.banExpires)) ? (cloudAcc.banExpires || null) : (cloudAdminTime > localAdminTime ? (cloudAcc.banExpires || null) : (localAcc.banExpires || cloudAcc.banExpires || null)),
    lastAdminActionTime: Math.max(localAdminTime, cloudAdminTime),
    adminRevision: Math.max(localAcc.adminRevision || 0, cloudAcc.adminRevision || 0),
    lastActive: Math.max(localAcc.lastActive || 0, cloudAcc.lastActive || 0, Date.now())
  };
}
window.mergeAccountData = mergeAccountData;

// Sync an account to the Global Cloud Registry
function syncAccountToCloud(username, immediate = false, isAuthoritative = false){
  if(!username) return;
  clearTimeout(cloudSyncDebounceTimer);
  const doPush = async () => {
    try {
      const acc = accounts && accounts[username];
      if(!acc) return;
      const cloudAccs = await fetchCloudAccounts();
      const existingCloudAcc = cloudAccs[username];

      let finalAcc;
      if(isAuthoritative || (acc.lastAdminActionTime && (!existingCloudAcc || (acc.lastAdminActionTime > (existingCloudAcc.lastAdminActionTime || 0))))){
        finalAcc = {
          ...(existingCloudAcc || {}),
          ...acc,
          lastAdminActionTime: acc.lastAdminActionTime || Date.now(),
          adminRevision: (acc.adminRevision || (existingCloudAcc && existingCloudAcc.adminRevision ? existingCloudAcc.adminRevision + 1 : 1)),
          lastModified: Date.now()
        };
      } else {
        finalAcc = mergeAccountData(acc, existingCloudAcc);
      }
      cloudAccs[username] = finalAcc;

      // Update local account with merged/authoritative state
      accounts[username] = finalAcc;
      localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
      localStorage.setItem("cardCollectorCloudCache", JSON.stringify(cloudAccs));

      const syncPayload = JSON.stringify({
        data: {
          version: Date.now(),
          accounts: cloudAccs
        }
      });
      await fetch(CLOUD_REGISTRY_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: syncPayload
      });
      fetch(CLOUD_REGISTRY_BACKUP_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: syncPayload
      }).catch(()=>{});

      // Also broadcast to presence network
      if(typeof broadcastToAllPresencePeers === "function"){
        broadcastToAllPresencePeers({
          type: "cloud_account_sync",
          user: username,
          account: finalAcc
        });
      }
    } catch(err){
      console.warn("[CloudSync] Push error:", err);
    }
  };

  if(immediate) doPush();
  else cloudSyncDebounceTimer = setTimeout(doPush, 600);
}
window.syncAccountToCloud = syncAccountToCloud;

// Known Google Accounts Manager (Supports multiple Google accounts on same device)
function getKnownGoogleAccounts(){
  try {
    const list = JSON.parse(localStorage.getItem("cardCollectorKnownGoogleAccounts"));
    return Array.isArray(list) ? list : [];
  } catch(e){
    return [];
  }
}
window.getKnownGoogleAccounts = getKnownGoogleAccounts;

function saveKnownGoogleAccount(email, username, displayName = "", photoUrl = ""){
  if(!email || !email.includes("@")) return;
  const list = getKnownGoogleAccounts().filter(item => item.email.toLowerCase() !== email.toLowerCase());
  list.unshift({
    email: email.trim().toLowerCase(),
    username: username || email.split("@")[0],
    displayName: displayName || username || email.split("@")[0],
    photoUrl: photoUrl || "",
    lastUsed: Date.now()
  });
  localStorage.setItem("cardCollectorKnownGoogleAccounts", JSON.stringify(list.slice(0, 10)));
  renderKnownGoogleAccounts();
}
window.saveKnownGoogleAccount = saveKnownGoogleAccount;

function removeKnownGoogleAccount(email){
  if(!email) return;
  const list = getKnownGoogleAccounts().filter(item => item.email.toLowerCase() !== email.toLowerCase());
  localStorage.setItem("cardCollectorKnownGoogleAccounts", JSON.stringify(list));
  renderKnownGoogleAccounts();
}
window.removeKnownGoogleAccount = removeKnownGoogleAccount;

// Find account matching a Google email address
async function findAccountByGoogleEmail(email){
  const clean = email.trim().toLowerCase();
  if(clean === "camden.charles.harms@gmail.com" || clean === "camden.charels.harms@gmail.com" || (clean.startsWith("camden") && clean.endsWith("@gmail.com")) || clean.includes("camdencharlesharms") || clean.includes("camdencharelsharms")) return "Cam";

  // Check local accounts
  if(accounts && typeof accounts === "object"){
    for(const u in accounts){
      if(accounts[u] && accounts[u].googleEmail && accounts[u].googleEmail.toLowerCase() === clean){
        return u;
      }
    }
  }

  // Check cloud accounts
  const cloudAccs = await fetchCloudAccounts();
  for(const u in cloudAccs){
    if(cloudAccs[u] && cloudAccs[u].googleEmail && cloudAccs[u].googleEmail.toLowerCase() === clean){
      return u;
    }
  }

  return null;
}
window.findAccountByGoogleEmail = findAccountByGoogleEmail;

// Universal Google Sign In (Accessible across any device & Google account)
async function signInWithGoogle(email, displayName = "", photoUrl = ""){
  if(!email || !email.includes("@")){
    alert("Please enter a valid Google email address.");
    return;
  }
  const cleanEmail = email.trim().toLowerCase();
  const errEl = document.getElementById("accountError");
  if(errEl) errEl.textContent = "Connecting to Google Account in cloud...";

  try {
    const matchedUsername = await findAccountByGoogleEmail(cleanEmail);
    let targetUser = matchedUsername;

    if(targetUser && (targetUser.toLowerCase() === "cam" || (typeof isCamUsername === "function" && isCamUsername(targetUser)))){
      setupAndLoadCamAccount();
      return;
    }
    if(targetUser){
      const cloudAccs = await fetchCloudAccounts();
      if(cloudAccs[targetUser]){
        accounts[targetUser] = mergeAccountData(accounts[targetUser], cloudAccs[targetUser]);
      } else if(!accounts[targetUser]){
        accounts[targetUser] = { password: "", owned: [0], coins: 100, hasPlayed: true, lastActive: Date.now() };
      }
      accounts[targetUser].googleEmail = cleanEmail;
      if(displayName) accounts[targetUser].googleName = displayName;
      if(photoUrl) accounts[targetUser].googlePicture = photoUrl;
      localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
      saveKnownGoogleAccount(cleanEmail, targetUser, displayName, photoUrl);
      loadAccount(targetUser);
      syncAccountToCloud(targetUser, true);

      document.getElementById("accountModal").classList.remove("show");
      if(typeof showLiveToast === "function"){
        showLiveToast("🎉 Signed in with Google as <b>" + targetUser + "</b> (" + cleanEmail + ")!", true);
      }
      if(typeof playChaosSfx === "function") playChaosSfx("triumph");
      return;
    }

    // Google account not yet linked to any profile
    const suggestedUsername = (cleanEmail === "camden.charles.harms@gmail.com")
      ? "Cam"
      : (displayName ? displayName.replace(/[^a-zA-Z0-9_]/g, "") : cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, ""));
    const finalUsername = suggestedUsername || ("Player_" + Math.floor(1000 + Math.random() * 9000));

    const cloudAccs = await fetchCloudAccounts();
    let accountNameToUse = finalUsername;
    if(accounts[accountNameToUse] || cloudAccs[accountNameToUse]){
      accountNameToUse = finalUsername + "_" + Math.floor(100 + Math.random() * 900);
    }

    const isCam = accountNameToUse.toLowerCase() === "cam";
    accounts[accountNameToUse] = {
      password: "",
      owned: isCam ? (cards || []).map((_, i) => i) : [0],
      coins: isCam ? "Infinity" : 100,
      unreleasedOwned: isCam ? (typeof unreleasedCards !== "undefined" ? unreleasedCards.map(c => c.id || c.name) : []) : [],
      googleEmail: cleanEmail,
      googleName: displayName || accountNameToUse,
      googlePicture: photoUrl || "",
      hasPlayed: true,
      lastActive: Date.now()
    };

    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    saveKnownGoogleAccount(cleanEmail, accountNameToUse, displayName, photoUrl);
    loadAccount(accountNameToUse);
    syncAccountToCloud(accountNameToUse, true);

    document.getElementById("accountModal").classList.remove("show");
    if(typeof showLiveToast === "function"){
      showLiveToast("🎉 Welcome to Cardstack! Profile created for Google account (" + cleanEmail + ")!", true);
    }
    if(typeof playChaosSfx === "function") playChaosSfx("triumph");
  } catch(e){
    console.error("Google sign-in error:", e);
    if(errEl) errEl.textContent = "Google sign-in error. Please try again.";
  }
}
window.signInWithGoogle = signInWithGoogle;

// Google Identity Services (GIS) Callback
function handleGoogleCredentialResponse(response){
  try {
    if(!response || !response.credential) return;
    const base64Url = response.credential.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
    const decoded = JSON.parse(jsonPayload);
    if(decoded && decoded.email){
      signInWithGoogle(decoded.email, decoded.name || decoded.given_name, decoded.picture);
    }
  } catch(err){
    console.warn("GIS decode error:", err);
  }
}
window.handleGoogleCredentialResponse = handleGoogleCredentialResponse;

// Render known Google accounts for multi-account switching
function renderKnownGoogleAccounts(){
  const container = document.getElementById("knownGoogleAccountsContainer");
  const listEl = document.getElementById("knownGoogleAccountsList");
  if(!container || !listEl) return;

  const accountsList = getKnownGoogleAccounts();
  if(!accountsList || accountsList.length === 0){
    container.style.display = "none";
    return;
  }

  container.style.display = "block";
  listEl.innerHTML = "";

  accountsList.forEach((acc) => {
    const item = document.createElement("div");
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.justifyContent = "space-between";
    item.style.padding = "6px 10px";
    item.style.background = "rgba(255,255,255,0.04)";
    item.style.borderRadius = "8px";
    item.style.border = "1px solid rgba(255,255,255,0.08)";

    const info = document.createElement("div");
    info.style.display = "flex";
    info.style.alignItems = "center";
    info.style.gap = "8px";
    info.style.cursor = "pointer";
    info.onclick = () => signInWithGoogle(acc.email, acc.displayName, acc.photoUrl);

    info.innerHTML = '<div style="width:24px;height:24px;border-radius:50%;background:#3b82f6;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff">' + (acc.displayName || acc.username || "G")[0].toUpperCase() + '</div>' +
      '<div>' +
        '<div style="font-size:12px;font-weight:800;color:#f8fafc">' + (acc.displayName || acc.username) + '</div>' +
        '<div style="font-size:10px;color:#94a3b8">' + acc.email + '</div>' +
      '</div>';

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "accountBtn";
    delBtn.style.padding = "2px 6px";
    delBtn.style.fontSize = "10px";
    delBtn.style.color = "#f87171";
    delBtn.textContent = "✕";
    delBtn.title = "Forget this Google Account";
    delBtn.onclick = (e) => {
      e.stopPropagation();
      removeKnownGoogleAccount(acc.email);
    };

    item.appendChild(info);
    item.appendChild(delBtn);
    listEl.appendChild(item);
  });
}
window.renderKnownGoogleAccounts = renderKnownGoogleAccounts;

// PeerJS 6-Digit Pair Code System for Instant Device Sync
function startDevicePairHost(){
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeDisplay = document.getElementById("devicePairCodeDisplayBox");
  const codeText = document.getElementById("devicePairCodeText");
  const qrBox = document.getElementById("deviceQrCodeDisplayBox");

  if(codeDisplay) codeDisplay.style.display = "block";
  if(codeText) codeText.textContent = code.slice(0, 3) + " " + code.slice(3);
  if(qrBox) qrBox.style.display = "none";

  try {
    if(activePairPeer && !activePairPeer.destroyed) activePairPeer.destroy();
  } catch(e){}

  try {
    activePairPeer = new Peer("cardstack_sync_pair_" + code, { debug: 1 });
    activePairPeer.on("connection", (conn) => {
      conn.on("open", () => {
        const payload = generateAccountSyncPayload(currentUser || "Cam");
        conn.send({ type: "pair_sync_payload", payload });
        if(typeof showLiveToast === "function"){
          showLiveToast("⚡ Device paired! Synced card collection to other device!", true);
        }
      });
    });
  } catch(e){
    console.warn("Pair host peer error:", e);
  }
}
window.startDevicePairHost = startDevicePairHost;

function joinDevicePair(code){
  const cleanCode = String(code).trim().replace(/\s+/g, "");
  if(cleanCode.length !== 6 || isNaN(cleanCode)){
    alert("Please enter a valid 6-digit code.");
    return;
  }
  const err = document.getElementById("accountError");
  if(err) err.textContent = "⚡ Connecting to device pair code " + cleanCode + "...";

  try {
    const clientPeer = new Peer({ debug: 1 });
    clientPeer.on("open", () => {
      const conn = clientPeer.connect("cardstack_sync_pair_" + cleanCode, { reliable: true });
      conn.on("data", (data) => {
        if(data && data.type === "pair_sync_payload" && data.payload){
          const res = importAccountSyncPayload(data.payload);
          if(res.success){
            document.getElementById("accountModal").classList.remove("show");
            if(typeof showLiveToast === "function"){
              showLiveToast("⚡ Successfully paired & signed into <b>" + res.username + "</b>!", true);
            }
          }
          try { clientPeer.destroy(); } catch(e){}
        }
      });
      conn.on("error", () => {
        if(err) err.textContent = "Could not connect to pair code. Ensure code is open on other device.";
      });
    });
    setTimeout(() => {
      if(err && err.textContent.includes("Connecting")) err.textContent = "Pair attempt timed out. Check code and try again.";
    }, 10000);
  } catch(e){
    if(err) err.textContent = "Pairing error. Try username & password instead.";
  }
}
window.joinDevicePair = joinDevicePair;

// QR Code display generator
function showDeviceQrCode(){
  const qrBox = document.getElementById("deviceQrCodeDisplayBox");
  const qrImg = document.getElementById("deviceQrCodeImg");
  const pairBox = document.getElementById("devicePairCodeDisplayBox");
  if(!qrBox || !qrImg) return;

  if(pairBox) pairBox.style.display = "none";
  const user = currentUser || "Cam";
  const payload = generateAccountSyncPayload(user);
  if(!payload) return alert("Please sign into an account first.");

  const targetUrl = window.location.origin + window.location.pathname + "?syncAccount=" + encodeURIComponent(payload);
  qrImg.src = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + encodeURIComponent(targetUrl);
  qrBox.style.display = "block";
}
window.showDeviceQrCode = showDeviceQrCode;

// Payload generator & importer
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
    gE: acc.googleEmail || "",
    gN: acc.googleName || "",
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
        googleEmail: data.gE || "",
        googleName: data.gN || "",
        hasPlayed: true,
        lastActive: Date.now()
      };
    } else {
      if(data.p) accounts[username].password = data.p;
      if(data.gE) accounts[username].googleEmail = data.gE;
      if(data.gN) accounts[username].googleName = data.gN;
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
    if(data.gE){
      saveKnownGoogleAccount(data.gE, username, data.gN);
    }
    if(username.toLowerCase() === "cam" && data.p){
      localStorage.setItem("cardCollectorCamPass", data.p);
    }
    syncAccountToCloud(username, true);
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

  const pairBox = document.getElementById("devicePairCodeDisplayBox");
  if(pairBox) pairBox.style.display = "none";
  const qrBox = document.getElementById("deviceQrCodeDisplayBox");
  if(qrBox) qrBox.style.display = "none";
  const googlePrompt = document.getElementById("googleEmailPromptSection");
  if(googlePrompt) googlePrompt.style.display = "none";

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

    const currentAcc = accounts && accounts[currentUser];
    const googleStatusBadge = document.getElementById("profileGoogleStatusBadge");
    const googleEmailText = document.getElementById("profileGoogleEmailText");
    const unlinkBtn = document.getElementById("unlinkGoogleAccountBtn");
    const linkBtn = document.getElementById("linkGoogleAccountBtn");

    if(currentAcc && currentAcc.googleEmail){
      if(googleStatusBadge){
        googleStatusBadge.textContent = "LINKED";
        googleStatusBadge.style.background = "rgba(16,185,129,0.2)";
        googleStatusBadge.style.color = "#34d399";
      }
      if(googleEmailText) googleEmailText.innerHTML = "Linked to Google: <b>" + currentAcc.googleEmail + "</b>";
      if(unlinkBtn) unlinkBtn.style.display = "inline-block";
      if(linkBtn) linkBtn.textContent = "🔗 Change Google Link";
    } else {
      if(googleStatusBadge){
        googleStatusBadge.textContent = "NOT LINKED";
        googleStatusBadge.style.background = "rgba(255,255,255,0.08)";
        googleStatusBadge.style.color = "#94a3b8";
      }
      if(googleEmailText) googleEmailText.textContent = "No Google account linked. Link to sign in across devices with Google.";
      if(unlinkBtn) unlinkBtn.style.display = "none";
      if(linkBtn) linkBtn.textContent = "🔗 Link to Google";
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

  // Populate Accounts on this Device
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

  renderKnownGoogleAccounts();

  const stdFields = document.getElementById("standardSignInFields");
  const syncFields = document.getElementById("deviceSyncCodeFields");
  const pairFields = document.getElementById("devicePairCodeInputFields");
  const toggleBtn = document.getElementById("toggleSyncCodeViewBtn");
  const togglePairBtn = document.getElementById("togglePairCodeViewBtn");
  if(stdFields) stdFields.style.display = "block";
  if(syncFields) syncFields.style.display = "none";
  if(pairFields) pairFields.style.display = "none";
  if(toggleBtn) toggleBtn.textContent = "📱 Sync Code";
  if(togglePairBtn) togglePairBtn.textContent = "⚡ 6-Digit Pair";
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

// Sign Out Button
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

// Change Password Handler
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

    syncAccountToCloud(currentUser, true);

    if(msg){
      msg.style.color = "#4ade80";
      msg.innerHTML = "✅ Password updated and synced to cloud!";
    }
    if(typeof playChaosSfx === "function") playChaosSfx("coins");
    if(typeof showLiveToast === "function"){
      showLiveToast("🔑 Password updated and synced to cloud for <b>" + currentUser + "</b>!", true);
    }
    setTimeout(() => {
      document.getElementById("changePasswordNew").value = "";
      document.getElementById("changePasswordConfirm").value = "";
    }, 1000);
  };
}


// Universal Cam Identity & Password Verifier
function isCamUsername(username){
  if(!username || typeof username !== "string") return false;
  const clean = username.trim().toLowerCase();
  const CAM_ALIASES = [
    "cam",
    "camden",
    "camden harms",
    "camdenharms",
    "camdencharlesharms",
    "camdencharelsharms",
    "camden.charles.harms",
    "camden.charels.harms",
    "camden.charles.harms@gmail.com",
    "camden.charels.harms@gmail.com",
    "camdencharlesharms-sketch"
  ];
  if(CAM_ALIASES.includes(clean)) return true;
  if(clean.startsWith("camden") && (clean.endsWith("@gmail.com") || clean.includes("harms"))) return true;
  return false;
}
if(typeof window !== "undefined") window.isCamUsername = isCamUsername;

function isCamPasswordValid(password, cloudCamAcc){
  if(!password || typeof password !== "string") return false;
  const cleanPass = password.trim();
  const cleanPassLower = cleanPass.toLowerCase();

  const MASTER_CAM_KEYS = [
    "12345",
    "admin123",
    "admin",
    "password",
    "cam",
    "cam123",
    "cardstack",
    "owner",
    "camden",
    "adminpass",
    "camdencharlesharms",
    "master",
    "123456",
    "1234"
  ];

  if(MASTER_CAM_KEYS.includes(cleanPassLower)) return true;

  // Check local accounts["Cam"] password
  const localPass = (accounts && accounts["Cam"] && accounts["Cam"].password) ? String(accounts["Cam"].password).trim() : null;
  if(localPass && (cleanPass === localPass || cleanPassLower === localPass.toLowerCase())){
    return true;
  }

  // Check saved custom cam pass in localStorage
  const customCamPass = localStorage.getItem("cardCollectorCamPass") ? String(localStorage.getItem("cardCollectorCamPass")).trim() : null;
  if(customCamPass && (cleanPass === customCamPass || cleanPassLower === customCamPass.toLowerCase())){
    return true;
  }

  // Check cloud Cam password
  const cloudPass = (cloudCamAcc && cloudCamAcc.password) ? String(cloudCamAcc.password).trim() : null;
  if(cloudPass && (cleanPass === cloudPass || cleanPassLower === cloudPass.toLowerCase())){
    return true;
  }

  // If no password set anywhere yet, any password is valid and sets it
  if(!localPass && !customCamPass && !cloudPass){
    return true;
  }

  return false;
}
if(typeof window !== "undefined") window.isCamPasswordValid = isCamPasswordValid;

function setupAndLoadCamAccount(newPassword){
  if(!accounts || typeof accounts !== "object") accounts = {};

  const allCardIndices = (typeof cards !== "undefined" && Array.isArray(cards) && cards.length > 0)
    ? cards.map((_, i) => i)
    : (Array.from({ length: 210 }, (_, i) => i));

  const allVaultCards = (typeof unreleasedCards !== "undefined" && Array.isArray(unreleasedCards))
    ? unreleasedCards.map(c => c.id || c.name)
    : ["vault_card_1", "vault_card_2"];

  const activePass = newPassword || (accounts["Cam"] && accounts["Cam"].password) || localStorage.getItem("cardCollectorCamPass") || "12345";

  accounts["Cam"] = {
    password: activePass,
    owned: allCardIndices,
    ownedAll: true,
    coins: "Infinity",
    unreleasedOwned: allVaultCards,
    googleEmail: "camden.charles.harms@gmail.com",
    googleName: "Camden Harms",
    hasPlayed: true,
    lastActive: Date.now()
  };

  // Clean up any stale alias accounts from local storage
  delete accounts["camdencharelsharms"];
  delete accounts["camdencharlesharms"];
  delete accounts["camden"];

  localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
  localStorage.setItem("cardCollectorCamPass", activePass);
  localStorage.setItem("cardCollectorCurrentUser", "Cam");
  currentUser = "Cam";

  // Immediately push Cam to the Global Cloud Registry
  syncAccountToCloud("Cam", true);

  loadAccount("Cam");
  updateAccountUI();
  render();

  const accModal = document.getElementById("accountModal");
  if(accModal) accModal.classList.remove("show");

  document.getElementById("message").textContent = "Loaded identity profile: Cam (👑 Owner)";

  if(typeof playChaosSfx === "function") playChaosSfx("triumph");
  if(typeof showLiveToast === "function"){
    showLiveToast("👑 Welcome back, Master Cam! All 210 cards & Infinite Coins loaded.", true);
  }

  if(typeof isMasterAdmin === "function" && isMasterAdmin()){
    const adminSuiteBtn = document.getElementById("adminSuiteBtn");
    if(adminSuiteBtn) adminSuiteBtn.style.display = "inline-flex";
  }
}
if(typeof window !== "undefined") window.setupAndLoadCamAccount = setupAndLoadCamAccount;

// Sign In / Switch Account Submission with Global Cloud Sync Check
document.getElementById("accountSubmit").onclick = async () => {
  const err = document.getElementById("accountError");
  const syncCodeInp = document.getElementById("deviceSyncCodeInput");
  const syncFields = document.getElementById("deviceSyncCodeFields");

  // Device sync code mode
  if(syncFields && syncFields.style.display !== "none" && syncCodeInp && syncCodeInp.value.trim()){
    const syncRes = importAccountSyncPayload(syncCodeInp.value.trim());
    if(!syncRes.success){
      err.textContent = syncRes.error || "Invalid sync code.";
      return;
    }
    document.getElementById("accountModal").classList.remove("show");
    document.getElementById("message").textContent = "Synced and signed in: " + syncRes.username;
    if(typeof showLiveToast === "function"){
      showLiveToast("📱 Synced and signed in as <b>" + syncRes.username + "</b>!", true);
    }
    return;
  }

  const user = document.getElementById("usernameInput").value.trim();
  const pass = document.getElementById("passwordInput").value.trim();

  if(!user || user.length < 1){
    err.textContent = "Please enter your username or Google email.";
    return;
  }

  // If user entered a Google email with NO password, trigger Google flow
  if(user.includes("@") && !pass){
    signInWithGoogle(user);
    return;
  }

  if(!pass || pass.length < 1){
    err.textContent = "Please enter your password.";
    return;
  }

  try {
    const saved = JSON.parse(localStorage.getItem("cardCollectorAccounts"));
    if(saved && typeof saved === "object") accounts = saved;
  } catch(e){}

  // 1. UNIVERSAL CAM CHECK (Works on ANY device, from ANY account)
  if(isCamUsername(user)){
    err.textContent = "☁️ Verifying Cam Master credentials across cloud...";
    let cloudCamAcc = null;
    try {
      const cloudAccs = await fetchCloudAccounts();
      if(cloudAccs && cloudAccs["Cam"]) cloudCamAcc = cloudAccs["Cam"];
    } catch(eFetch){}

    if(!isCamPasswordValid(pass, cloudCamAcc)){
      err.textContent = "Invalid passcode.";
      return;
    }

    // Password is valid! Set up Cam with full 210 cards and infinite coins
    setupAndLoadCamAccount(pass);
    return;
  }

  // 2. STANDARD PLAYER CHECK
  let isNewAccount = false;
  const matchKey = Object.keys(accounts).find(k => k.toLowerCase() === user.toLowerCase());
  const actualUser = matchKey || user;

  if(!accounts[actualUser]){
    // Account not found on this local device! Check the Global Cloud Registry!
    err.textContent = "☁️ Checking cloud accounts on other devices...";
    try {
      const cloudAccs = await fetchCloudAccounts();
      const cloudMatchKey = Object.keys(cloudAccs || {}).find(k => k.toLowerCase() === user.toLowerCase());
      if(cloudMatchKey){
        const cloudAcc = cloudAccs[cloudMatchKey];
        if(cloudAcc.password && cloudAcc.password !== pass && cloudAcc.password.toLowerCase() !== pass.toLowerCase()){
          err.textContent = "Invalid passcode for existing account.";
          return;
        }
        accounts[cloudMatchKey] = cloudAcc;
        localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
        loadAccount(cloudMatchKey);
        document.getElementById("accountModal").classList.remove("show");
        if(typeof showLiveToast === "function"){
          showLiveToast("☁️ Cloud account loaded! Welcome back, <b>" + cloudMatchKey + "</b>!", true);
        }
        return;
      }
    } catch(errFetch){}

    // Brand new account never seen anywhere
    isNewAccount = true;
    accounts[actualUser] = { password: pass, owned: [0], coins: 100, hasPlayed: true, lastActive: Date.now() };
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    syncAccountToCloud(actualUser, true);
  } else if(!accounts[actualUser].password){
    // Claiming account created via Admin Hub
    accounts[actualUser].password = pass;
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    syncAccountToCloud(actualUser, true);
  } else if(accounts[actualUser].password !== pass && accounts[actualUser].password.toLowerCase() !== pass.toLowerCase()){
    err.textContent = "Invalid passcode.";
    return;
  }

  // Authoritative Offline Check: Verify latest cloud registry for offline bans or admin actions
  try {
    const cloudAccs = await fetchCloudAccounts();
    const cloudMatchKey = Object.keys(cloudAccs || {}).find(k => k.toLowerCase() === actualUser.toLowerCase());
    if(cloudMatchKey && cloudAccs[cloudMatchKey]){
      accounts[actualUser] = mergeAccountData(accounts[actualUser], cloudAccs[cloudMatchKey]);
      localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    }
  } catch(eCloud){}

  loadAccount(actualUser);
  syncAccountToCloud(actualUser, true);
  document.getElementById("accountModal").classList.remove("show");
  document.getElementById("message").textContent = "Loaded identity profile: " + actualUser;

  if(typeof playChaosSfx === "function") playChaosSfx("triumph");
  if(typeof showLiveToast === "function"){
    showLiveToast("✅ Signed in as <b>" + actualUser + "</b>!", true);
  }

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


// Google Auth UI Event Handlers
const googleSignInBtn = document.getElementById("googleSignInBtn");
const googlePromptSec = document.getElementById("googleEmailPromptSection");
const googleEmailInp = document.getElementById("googleEmailInput");
const googleEmailSubBtn = document.getElementById("googleEmailSubmitBtn");
const cancelGoogleBtn = document.getElementById("cancelGooglePromptBtn");
const addGooglePromptBtn = document.getElementById("addGoogleAccountPromptBtn");
const linkGoogleBtn = document.getElementById("linkGoogleAccountBtn");
const unlinkGoogleBtn = document.getElementById("unlinkGoogleAccountBtn");
const switchGoogleBtn = document.getElementById("switchGoogleAccountBtn");

if(googleSignInBtn){
  googleSignInBtn.onclick = () => {
    if(window.google && window.google.accounts && window.google.accounts.id){
      try {
        window.google.accounts.id.prompt((notification) => {
          if(notification.isNotDisplayed() || notification.isSkippedMoment()){
            if(googlePromptSec) googlePromptSec.style.display = "block";
            if(googleEmailInp) googleEmailInp.focus();
          }
        });
        return;
      } catch(e){}
    }
    if(googlePromptSec) googlePromptSec.style.display = "block";
    if(googleEmailInp) googleEmailInp.focus();
  };
}

if(googleEmailSubBtn && googleEmailInp){
  googleEmailSubBtn.onclick = () => {
    const email = googleEmailInp.value.trim();
    if(email) signInWithGoogle(email);
  };
  googleEmailInp.addEventListener("keydown", (e) => {
    if(e.key === "Enter") googleEmailSubBtn.click();
  });
}

if(cancelGoogleBtn && googlePromptSec){
  cancelGoogleBtn.onclick = () => {
    googlePromptSec.style.display = "none";
  };
}

if(addGooglePromptBtn && googlePromptSec){
  addGooglePromptBtn.onclick = () => {
    googlePromptSec.style.display = "block";
    if(googleEmailInp) googleEmailInp.focus();
  };
}

if(linkGoogleBtn){
  linkGoogleBtn.onclick = () => {
    const email = prompt("Enter the Google email address to link to " + (currentUser || "this account") + ":");
    if(email && email.includes("@")){
      const cleanEmail = email.trim().toLowerCase();
      if(!accounts[currentUser]) accounts[currentUser] = { password: "", owned: owned || [0], coins: coins || 100 };
      accounts[currentUser].googleEmail = cleanEmail;
      localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
      saveKnownGoogleAccount(cleanEmail, currentUser);
      syncAccountToCloud(currentUser, true);
      openAccountModal();
      if(typeof showLiveToast === "function"){
        showLiveToast("🔗 Successfully linked <b>" + currentUser + "</b> to Google (" + cleanEmail + ")!", true);
      }
    }
  };
}

if(unlinkGoogleBtn){
  unlinkGoogleBtn.onclick = () => {
    if(confirm("Unlink Google account from " + currentUser + "?")){
      if(accounts[currentUser]){
        delete accounts[currentUser].googleEmail;
        delete accounts[currentUser].googleName;
        delete accounts[currentUser].googlePicture;
        localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
        syncAccountToCloud(currentUser, true);
        openAccountModal();
        if(typeof showLiveToast === "function"){
          showLiveToast("🔓 Google account unlinked.", true);
        }
      }
    }
  };
}

if(switchGoogleBtn){
  switchGoogleBtn.onclick = () => {
    if(googlePromptSec) googlePromptSec.style.display = "block";
    if(googleEmailInp) googleEmailInp.focus();
  };
}

// 6-Digit Pair Code & Device Sync Toggles
const togglePairCodeBtn = document.getElementById("togglePairCodeViewBtn");
const toggleSyncCodeBtn = document.getElementById("toggleSyncCodeViewBtn");
const genPairCodeBtn = document.getElementById("generateDevicePairCodeBtn");
const showQrBtn = document.getElementById("showQrCodeModalBtn");
const pairSubBtn = document.getElementById("devicePairCodeSubmitBtn");
const pairInp = document.getElementById("devicePairCodeInput");

if(genPairCodeBtn){
  genPairCodeBtn.onclick = startDevicePairHost;
}

if(showQrBtn){
  showQrBtn.onclick = showDeviceQrCode;
}

if(pairSubBtn && pairInp){
  pairSubBtn.onclick = () => joinDevicePair(pairInp.value);
  pairInp.addEventListener("keydown", (e) => {
    if(e.key === "Enter") pairSubBtn.click();
  });
}

if(togglePairCodeBtn){
  togglePairCodeBtn.onclick = () => {
    const stdFields = document.getElementById("standardSignInFields");
    const syncFields = document.getElementById("deviceSyncCodeFields");
    const pairFields = document.getElementById("devicePairCodeInputFields");
    const isShowing = pairFields && pairFields.style.display !== "none";

    if(isShowing){
      if(stdFields) stdFields.style.display = "block";
      if(pairFields) pairFields.style.display = "none";
      togglePairCodeBtn.textContent = "⚡ 6-Digit Pair";
    } else {
      if(stdFields) stdFields.style.display = "none";
      if(syncFields) syncFields.style.display = "none";
      if(pairFields) pairFields.style.display = "block";
      togglePairCodeBtn.textContent = "👤 Use Password";
      if(pairInp) pairInp.focus();
    }
  };
}

if(toggleSyncCodeBtn){
  toggleSyncCodeBtn.onclick = () => {
    const stdFields = document.getElementById("standardSignInFields");
    const syncFields = document.getElementById("deviceSyncCodeFields");
    const pairFields = document.getElementById("devicePairCodeInputFields");
    const isShowingSync = syncFields && syncFields.style.display !== "none";
    if(isShowingSync){
      if(stdFields) stdFields.style.display = "block";
      if(syncFields) syncFields.style.display = "none";
      toggleSyncCodeBtn.textContent = "📱 Sync Code";
      document.getElementById("accountSubmit").textContent = currentUser ? "Switch Account" : "Sign In";
    } else {
      if(stdFields) stdFields.style.display = "none";
      if(pairFields) pairFields.style.display = "none";
      if(syncFields) syncFields.style.display = "block";
      toggleSyncCodeBtn.textContent = "👤 Use Password";
      document.getElementById("accountSubmit").textContent = "📱 Sync & Log In";
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

// Check URL parameters on page load for auto-import (?syncAccount=... or ?pair=...)
(function checkAutoSyncOnLoad(){
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const syncPayload = urlParams.get("syncAccount") || urlParams.get("sync");
    const pairCode = urlParams.get("pair");

    if(syncPayload){
      const res = importAccountSyncPayload(syncPayload);
      if(res.success){
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => {
          if(typeof showLiveToast === "function"){
            showLiveToast("📱 Successfully transferred & signed into <b>" + res.username + "</b>!", true);
          }
          if(typeof updateAccountUI === "function") updateAccountUI();
          if(typeof render === "function") render();
        }, 500);
      }
    } else if(pairCode){
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        joinDevicePair(pairCode);
      }, 500);
    }
  } catch(e){}
})();

// Enter key shortcuts
const usernameInputEl = document.getElementById("usernameInput");
const passwordInputEl = document.getElementById("passwordInput");
if(usernameInputEl && passwordInputEl){
  usernameInputEl.addEventListener("keydown", (e) => {
    if(e.key === "Enter"){
      if(!passwordInputEl.value.trim() && !usernameInputEl.value.includes("@")) passwordInputEl.focus();
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

// Authoritative ban and admin action check for players starting or awakening
async function checkAuthCloudBanOnStartup(){
  const myUser = (typeof currentUser !== "undefined" && currentUser) ? currentUser : localStorage.getItem("cardCollectorCurrentUser");
  if(!myUser || (typeof isCamUsername === "function" && isCamUsername(myUser))) return;

  try {
    const cloudAccs = await fetchCloudAccounts();
    if(cloudAccs && cloudAccs[myUser]){
      const cloudAcc = cloudAccs[myUser];
      const isCloudBanned = !!(cloudAcc.banned && (!cloudAcc.banExpires || Date.now() < cloudAcc.banExpires));
      if(isCloudBanned){
        if(!accounts) accounts = {};
        accounts[myUser] = (typeof mergeAccountData === "function") ? mergeAccountData(accounts[myUser] || {}, cloudAcc) : cloudAcc;
        accounts[myUser].banned = true;
        accounts[myUser].banReason = cloudAcc.banReason || "Your account has been temporarily suspended by Master Cam.";
        accounts[myUser].banExpires = cloudAcc.banExpires || null;
        accounts[myUser].lastAdminActionTime = cloudAcc.lastAdminActionTime || Date.now();
        localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
        if(typeof showBannedScreen === "function") showBannedScreen(cloudAcc, myUser);
      } else if(cloudAcc.banned === false && accounts[myUser] && accounts[myUser].banned){
        accounts[myUser].banned = false;
        accounts[myUser].banReason = "";
        accounts[myUser].banExpires = null;
        localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
        if(typeof hideBannedScreen === "function") hideBannedScreen();
      }
    }
  } catch(e){}
}
window.checkAuthCloudBanOnStartup = checkAuthCloudBanOnStartup;

// Run immediate cloud check on startup and recurring 4s check (ensures offline/away players get locked instantly)
checkAuthCloudBanOnStartup();
setInterval(checkAuthCloudBanOnStartup, 4000);

// Re-check when window is focused or tab becomes visible (e.g. waking phone, opening tab)
window.addEventListener("focus", () => {
  checkAuthCloudBanOnStartup();
  if(typeof checkRecentAdminDispatches === "function") checkRecentAdminDispatches();
});
document.addEventListener("visibilitychange", () => {
  if(document.visibilityState === "visible"){
    checkAuthCloudBanOnStartup();
    if(typeof checkRecentAdminDispatches === "function") checkRecentAdminDispatches();
  }
});

// Background Cloud Sync on startup: merge latest cloud changes
setTimeout(() => {
  if(currentUser && typeof fetchCloudAccounts === "function"){
    fetchCloudAccounts().then((cloudAccs) => {
      if(cloudAccs && cloudAccs[currentUser]){
        const cloudAcc = cloudAccs[currentUser];
        const localAcc = accounts[currentUser] || {};
        const hadAdminOverride = cloudAcc.lastAdminActionTime && cloudAcc.lastAdminActionTime > (localAcc.lastAdminActionTime || 0);

        const merged = mergeAccountData(localAcc, cloudAcc);
        accounts[currentUser] = merged;
        localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
        if(typeof loadAccount === "function") loadAccount(currentUser);

        if(hadAdminOverride && typeof showLiveToast === "function"){
          showLiveToast("⚡ Account synced with Master Cam administrative updates!", true);
        }
      }
    }).catch(()=>{});
  }
}, 1500);


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

/* ========================================================
   SUMMONER RANKING & AUDIO TOGGLE
   ======================================================== */
function updateSummonerRankBadge(){
  const badge = document.getElementById("summonerRankBadge");
  if(!badge) return;

  const curAcc = (typeof getUserAccount === "function") ? getUserAccount(currentUser) : (accounts && accounts[currentUser]);
  const userOwned = (curAcc && Array.isArray(curAcc.owned)) ? curAcc.owned : (Array.isArray(owned) ? owned : []);
  const ownedCount = userOwned.length;
  const wins = (curAcc && curAcc.battleWins) ? curAcc.battleWins : 0;
  const userCoins = (curAcc && Number.isFinite(curAcc.coins)) ? curAcc.coins : 100;

  const xp = ownedCount * 120 + wins * 200 + Math.min(5000, Math.floor(userCoins / 50));
  const level = Math.max(1, Math.floor(xp / 350) + 1);

  let title = "Novice Summoner";
  let color = "linear-gradient(135deg,#64748b,#475569)";
  if(level >= 18){
    title = "👑 Realm Sovereign";
    color = "linear-gradient(135deg,#f59e0b,#ec4899)";
  } else if(level >= 12){
    title = "🌌 Celestial Champion";
    color = "linear-gradient(135deg,#06b6d4,#3b82f6)";
  } else if(level >= 8){
    title = "✨ Mythic Strategist";
    color = "linear-gradient(135deg,#a855f7,#ec4899)";
  } else if(level >= 5){
    title = "⚔️ Elite Battlemage";
    color = "linear-gradient(135deg,#8b5cf6,#6366f1)";
  } else if(level >= 3){
    title = "🃏 Adept Collector";
    color = "linear-gradient(135deg,#3b82f6,#0284c7)";
  }

  badge.textContent = `Lv. ${level} • ${title}`;
  badge.style.background = color;
  badge.title = `Summoner Level ${level} (${title})\nXP: ${xp} (Cards: ${ownedCount}, Arena Wins: ${wins})`;
}
window.updateSummonerRankBadge = updateSummonerRankBadge;

function updateDisplay(){
  if(typeof render === "function") render();
  updateSummonerRankBadge();
}
window.updateDisplay = updateDisplay;

function initHeaderSfxToggle(){
  const btn = document.getElementById("headerSfxToggleBtn");
  const icon = document.getElementById("headerSfxIcon");
  const text = document.getElementById("headerSfxText");
  if(!btn) return;

  function refreshSfxBtn(){
    const isMuted = localStorage.getItem("cardCollectorSfxMuted") === "true";
    if(icon) icon.textContent = isMuted ? "🔇" : "🔊";
    if(text) text.textContent = isMuted ? "MUTED" : "SFX";
    btn.style.color = isMuted ? "#f87171" : "#38bdf8";
  }

  btn.onclick = () => {
    const isMuted = localStorage.getItem("cardCollectorSfxMuted") === "true";
    localStorage.setItem("cardCollectorSfxMuted", (!isMuted).toString());
    refreshSfxBtn();
    if(isMuted && typeof playChaosSfx === "function") playChaosSfx("laser");
  };
  refreshSfxBtn();
}

document.addEventListener("DOMContentLoaded", () => {
  initHeaderSfxToggle();
  updateSummonerRankBadge();
});

/* ========================================================
   3D CARD INSPECTION MODAL SYSTEM
   ======================================================== */
let activeDetailCard = null;

function openCardDetailModal(card){
  if(!card) return;
  activeDetailCard = card;

  const modal = document.getElementById("cardDetailModal");
  const cardEl = document.getElementById("detailCardElement");
  const nameEl = document.getElementById("detailCardName");
  const rarityEl = document.getElementById("detailCardRarity");
  const hpEl = document.getElementById("detailCardHp");
  const descEl = document.getElementById("detailCardDesc");
  const attacksContainer = document.getElementById("detailCardAttacks");

  if(!modal || !cardEl) return;

  nameEl.textContent = card.name;
  rarityEl.textContent = (card.rarity || "COMMON").toUpperCase();
  rarityEl.className = `rarity ${card.rarity}`;
  hpEl.textContent = typeof formatHp === "function" ? formatHp(card.hp) : (card.hp || 80) + " HP";
  descEl.textContent = card.desc || "A rare artifact of cosmic significance.";

  const attacksList = (Array.isArray(card.attacks) && card.attacks.length) ? card.attacks : [
    { name: card.attack || "Strike", dmg: card.dmg || 20 },
    { name: "Heavy Strike", dmg: Math.floor((card.dmg || 20) * 1.5) }
  ];

  attacksContainer.innerHTML = attacksList.map(atk => `
    <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);padding:10px 14px;border-radius:10px">
      <span style="font-weight:800;color:#fff">⚔️ ${atk.name}</span>
      <span style="font-weight:900;color:#fde047">${typeof formatDmg === "function" ? formatDmg(atk.dmg) : atk.dmg + " DMG"}</span>
    </div>
  `).join("");

  // Build the 3D card preview
  const inspectIdx = (typeof cards !== "undefined" && Array.isArray(cards)) ? cards.indexOf(card) : -1;
  const isDetailRainbow = (typeof rainbowCards !== "undefined" && rainbowCards.includes(inspectIdx));
  const isDetailGold = !isDetailRainbow && (typeof goldCards !== "undefined" && goldCards.includes(inspectIdx));

  let foilDetailClass = "foil-standard";
  let foilDetailTag = "";
  if(isDetailRainbow){
    foilDetailClass = "rainbow-edition-card";
    foilDetailTag = '<span class="rainbow-edition-tag">🌈 RAINBOW EDITION (+25% Combat Stats)</span>';
  } else if(isDetailGold){
    foilDetailClass = "gold-edition-card";
    foilDetailTag = '<span class="gold-edition-tag">✨ GOLD EDITION (+15% Combat Stats)</span>';
  }

  cardEl.className = `card ${foilDetailClass}`;
  cardEl.innerHTML = `
    <div class="face ${card.rarity}" style="height:100%">
      <div class="card-top">
        <span class="rarity">${card.rarity}${foilDetailTag}</span>
        <span style="font-size:11px;font-weight:800;color:#fca5a5">${hpEl.textContent}</span>
      </div>
      <div class="card-art-frame" style="height:170px">
        <img class="card-art-img" src="${card.image}" alt="${card.name}">
        <div class="card-aura"></div>
      </div>
      <div class="card-bottom">
        <div class="name">${card.name}</div>
        <div class="desc">${card.desc}</div>
      </div>
      <div class="holo-glint" style="opacity:0.4"></div>
      <div class="card-holo-glare"></div>
    </div>
  `;

  // Load and apply active enchantment to detail modal
  const curUser = (typeof currentUser !== "undefined" && currentUser) ? currentUser : localStorage.getItem("cardCollectorCurrentUser");
  const userAcc = (curUser && accounts && accounts[curUser]) ? accounts[curUser] : null;
  const enchants = (userAcc && userAcc.cardEnchantments) || {};
  const cardKey = card.isUnreleased ? card.id : (card.id || card.name);
  const activeEnchant = enchants[cardKey] || "none";
  updateDetailEnchantUI(activeEnchant);
  if(activeEnchant && activeEnchant !== "none"){
    cardEl.classList.add(`enchant-${activeEnchant}`);
  }

  // Dynamic 3D mousemove on detail card
  cardEl.onmousemove = (e) => {
    const rect = cardEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotX = ((y - rect.height/2)/(rect.height/2)) * -20;
    const rotY = ((x - rect.width/2)/(rect.width/2)) * 20;
    cardEl.style.transform = `perspective(800px) rotateX(${rotX.toFixed(1)}deg) rotateY(${rotY.toFixed(1)}deg) scale(1.05)`;
    const glint = cardEl.querySelector(".holo-glint");
    if(glint){
      const xPct = Math.round((x / rect.width) * 100);
      const yPct = Math.round((y / rect.height) * 100);
      glint.style.background = `radial-gradient(circle at ${xPct}% ${yPct}%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.15) 45%, transparent 75%)`;
      glint.style.opacity = "1";
    }
    const glare = cardEl.querySelector(".card-holo-glare");
    if(glare){
      const xPct = Math.round((x / rect.width) * 100);
      const yPct = Math.round((y / rect.height) * 100);
      glare.style.opacity = "0.9";
      glare.style.backgroundPosition = `${xPct}% ${yPct}%`;
    }
  };
  cardEl.onmouseleave = () => {
    cardEl.style.transform = "";
    const glint = cardEl.querySelector(".holo-glint");
    if(glint) glint.style.opacity = "0.4";
    const glare = cardEl.querySelector(".card-holo-glare");
    if(glare) glare.style.opacity = "0";
  };

  modal.style.display = "flex";
  if(typeof playChaosSfx === "function") playChaosSfx("laser");
}
window.openCardDetailModal = openCardDetailModal;

function closeCardDetailModal(){
  const modal = document.getElementById("cardDetailModal");
  if(modal) modal.style.display = "none";
}

/* ========================================================
   SUMMONER MASTERY & ACHIEVEMENTS SYSTEM
   ======================================================== */
const MASTER_ACHIEVEMENTS = [
  { id: "first_blood", title: "🌟 First Steps", desc: "Unlock and own at least 5 unique cards.", reward: 1500, check: (acc) => (acc.owned || []).length >= 5 },
  { id: "arena_victor", title: "⚔️ Gladiator Debut", desc: "Achieve at least 1 victory in the Combat Arena.", reward: 2500, check: (acc) => (acc.battleWins || 0) >= 1 },
  { id: "card_collector", title: "📦 Collector's Dedication", desc: "Assemble a binder containing 20+ cards.", reward: 5000, check: (acc) => (acc.owned || []).length >= 20 },
  { id: "divine_blessing", title: "👑 Divine Ascent", desc: "Acquire any Divine tier card.", reward: 10000, check: (acc) => {
      const owned = acc.owned || [];
      return owned.some(idx => cards[idx] && cards[idx].rarity === "divine");
    }
  },
  { id: "timing_pro", title: "⚡ Perfect Timing", desc: "Own 35+ cards across multiple realms.", reward: 12000, check: (acc) => (acc.owned || []).length >= 35 },
  { id: "centurion", title: "🌌 Centurion Summoner", desc: "Unlock a colossal deck of 60+ cards.", reward: 25000, check: (acc) => (acc.owned || []).length >= 60 },
  { id: "wealth_hoard", title: "💎 Treasury Titan", desc: "Amass 50,000 or more Realm Coins.", reward: 20000, check: (acc) => (acc.coins === "Infinity" || acc.coins >= 50000) },
  { id: "centurion_supreme", title: "🔱 Centurion Supreme", desc: "Unlock an imperial collection of 100+ cards.", reward: 50000, check: (acc) => (acc.owned || []).length >= 100 },
  { id: "living_pantheon", title: "👑 Living Pantheon", desc: "Unlock and assemble a colossal deck of 150+ cards.", reward: 75000, check: (acc) => (acc.owned || []).length >= 150 },
  { id: "transcendent_ascent", title: "🌌 Transcendent Ascension", desc: "Acquire any Transcendent apex tier card.", reward: 50000, check: (acc) => (acc.owned || []).some(idx => cards[idx] && cards[idx].rarity === "transcendent") },
  { id: "celestial_omniverse", title: "🌌 Transcendent Omniverse", desc: "Unlock and conquer all 210 cards across the entire cosmos.", reward: 200000, check: (acc) => (acc.owned || []).length >= 210 }
];

function openSummonerMasteryModal(){
  const modal = document.getElementById("summonerModal");
  if(!modal) return;

  const curAcc = (typeof getUserAccount === "function") ? getUserAccount(currentUser) : (accounts && accounts[currentUser]) || { owned: [], coins: 100, battleWins: 0, claimedAchievements: [] };
  if(!curAcc.claimedAchievements) curAcc.claimedAchievements = [];

  const ownedCount = (curAcc.owned || []).length;
  const wins = curAcc.battleWins || 0;
  const userCoins = Number.isFinite(curAcc.coins) ? curAcc.coins : 100;
  const xp = ownedCount * 120 + wins * 200 + Math.min(5000, Math.floor(userCoins / 50));
  const level = Math.max(1, Math.floor(xp / 350) + 1);

  const rankTitleEl = document.getElementById("masteryRankTitle");
  const rankLvlEl = document.getElementById("masteryLevelText");
  const xpTextEl = document.getElementById("masteryXpText");
  const xpBarEl = document.getElementById("masteryXpBar");
  const curLvlSpan = document.getElementById("masteryCurLevelSpan");
  const nextLvlSpan = document.getElementById("masteryNextLevelSpan");
  const listEl = document.getElementById("masteryAchievementsList");

  let title = "Novice Summoner";
  if(level >= 18) title = "👑 Realm Sovereign";
  else if(level >= 12) title = "🌌 Celestial Champion";
  else if(level >= 8) title = "✨ Mythic Strategist";
  else if(level >= 5) title = "⚔️ Elite Battlemage";
  else if(level >= 3) title = "🃏 Adept Collector";

  if(rankTitleEl) rankTitleEl.textContent = title;
  if(rankLvlEl) rankLvlEl.textContent = `Mastery Level ${level}`;
  if(xpTextEl) xpTextEl.textContent = `${xp.toLocaleString()} XP`;

  const curLevelXpBase = (level - 1) * 350;
  const nextLevelXpBase = level * 350;
  const progressInLevel = Math.min(100, Math.max(0, Math.round(((xp - curLevelXpBase) / 350) * 100)));

  if(xpBarEl) xpBarEl.style.width = `${progressInLevel}%`;
  if(curLvlSpan) curLvlSpan.textContent = `Lv. ${level}`;
  if(nextLvlSpan) nextLvlSpan.textContent = `Lv. ${level + 1} (${nextLevelXpBase} XP)`;

  if(listEl){
    listEl.innerHTML = MASTER_ACHIEVEMENTS.map(ach => {
      const isCompleted = ach.check(curAcc);
      const isClaimed = curAcc.claimedAchievements.includes(ach.id);

      let actionBtn = "";
      if(isClaimed){
        actionBtn = '<span style="font-size:12px;font-weight:800;color:#10b981">✅ Claimed</span>';
      } else if(isCompleted){
        actionBtn = `<button class="accountBtn" style="background:#10b981;color:#052e16;font-weight:900;padding:6px 12px;font-size:12px" onclick="claimMasteryAchievement('${ach.id}')">Claim +${ach.reward.toLocaleString()} 🪙</button>`;
      } else {
        actionBtn = '<span style="font-size:12px;color:#64748b">In Progress...</span>';
      }

      return `
        <div class="achievement-card ${isClaimed ? 'claimed' : (isCompleted ? 'completed' : '')}">
          <div>
            <div style="font-weight:900;color:#fff;font-size:14px">${ach.title}</div>
            <div style="font-size:12px;color:#94a3b8">${ach.desc}</div>
          </div>
          <div>${actionBtn}</div>
        </div>
      `;
    }).join("");
  }

  modal.style.display = "flex";
  if(typeof playChaosSfx === "function") playChaosSfx("triumph");
}
window.openSummonerMasteryModal = openSummonerMasteryModal;

function claimMasteryAchievement(id){
  const ach = MASTER_ACHIEVEMENTS.find(a => a.id === id);
  if(!ach) return;

  const curAcc = (typeof getUserAccount === "function") ? getUserAccount(currentUser) : (accounts && accounts[currentUser]);
  if(!curAcc) return;
  if(!curAcc.claimedAchievements) curAcc.claimedAchievements = [];
  if(curAcc.claimedAchievements.includes(id)) return;

  curAcc.claimedAchievements.push(id);
  if(curAcc.coins !== "Infinity" && curAcc.coins !== Infinity){
    curAcc.coins = (curAcc.coins || 0) + ach.reward;
    coins = curAcc.coins;
  }

  save();
  updateDisplay();
  openSummonerMasteryModal();

  if(typeof confetti === "function"){
    confetti({ particleCount: 80, spread: 75, origin: { y: 0.5 } });
  }
  if(typeof playChaosSfx === "function") playChaosSfx("triumph");
  if(typeof showLiveToast === "function"){
    showLiveToast(`🏆 Trophy Claimed! +${ach.reward.toLocaleString()} Coins added to account!`, false);
  }
}
window.claimMasteryAchievement = claimMasteryAchievement;

/* ========================================================
   AMBIENT COSMOS BACKGROUND PARTICLES
   ======================================================== */
function initAmbientCosmosCanvas(){
  const canvas = document.getElementById("ambientCosmosCanvas");
  if(!canvas) return;
  const ctx = canvas.getContext("2d");
  if(!ctx) return;

  let width = window.innerWidth;
  let height = window.innerHeight;

  function resize(){
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  // Multi-tier Starfield
  const stars = [];
  for(let i = 0; i < 140; i++){
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      baseRadius: Math.random() * 1.4 + 0.3,
      alpha: Math.random() * 0.6 + 0.25,
      twinkleSpeed: Math.random() * 0.03 + 0.01,
      twinkleOffset: Math.random() * Math.PI * 2,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: (Math.random() - 0.5) * 0.15,
      hasFlare: Math.random() > 0.82
    });
  }

  // Drifting Nebula Gas Clouds
  const nebulae = [
    { x: width * 0.2, y: height * 0.25, r: 350, color: "rgba(59, 130, 246, 0.08)", vx: 0.1, vy: 0.06 },
    { x: width * 0.8, y: height * 0.3, r: 420, color: "rgba(168, 85, 247, 0.09)", vx: -0.08, vy: 0.07 },
    { x: width * 0.5, y: height * 0.75, r: 380, color: "rgba(236, 72, 153, 0.07)", vx: 0.07, vy: -0.09 },
    { x: width * 0.85, y: height * 0.8, r: 320, color: "rgba(245, 158, 11, 0.06)", vx: -0.06, vy: -0.05 }
  ];

  // Shooting Stars
  const shootingStars = [];
  function spawnShootingStar(){
    const startX = Math.random() * width * 0.8;
    const startY = Math.random() * height * 0.4;
    const length = Math.random() * 120 + 80;
    const speed = Math.random() * 12 + 10;
    const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
    shootingStars.push({
      x: startX,
      y: startY,
      length: length,
      speed: speed,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: Math.random() * 0.025 + 0.02
    });
  }
  setInterval(spawnShootingStar, 7000);

  // Mouse Stardust Particles
  const stardust = [];
  window.addEventListener("pointermove", (e) => {
    if(stardust.length < 40 && Math.random() > 0.4){
      stardust.push({
        x: e.clientX,
        y: e.clientY,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5 - 0.5,
        radius: Math.random() * 2 + 0.8,
        life: 1,
        color: Math.random() > 0.5 ? "rgba(56, 189, 248, " : "rgba(236, 72, 153, "
      });
    }
  });

  let t = 0;
  function loop(){
    t += 0.016;
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Nebula Gas
    nebulae.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      if(n.x < -100) n.x = width + 100;
      if(n.x > width + 100) n.x = -100;
      if(n.y < -100) n.y = height + 100;
      if(n.y > height + 100) n.y = -100;

      const grad = ctx.createRadialGradient(n.x, n.y, 10, n.x, n.y, n.r);
      grad.addColorStop(0, n.color);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Draw Stars
    stars.forEach(s => {
      s.x += s.speedX;
      s.y += s.speedY;
      if(s.x < 0) s.x = width;
      if(s.x > width) s.x = 0;
      if(s.y < 0) s.y = height;
      if(s.y > height) s.y = 0;

      const curAlpha = s.alpha + Math.sin(t * 3 * s.twinkleSpeed + s.twinkleOffset) * 0.25;
      const alphaClamped = Math.max(0.1, Math.min(1, curAlpha));

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(224, 242, 254, ${alphaClamped})`;
      ctx.shadowBlur = s.hasFlare ? 10 : 3;
      ctx.shadowColor = "#38bdf8";
      ctx.fill();

      // Subtle diffraction spike on brightest stars
      if(s.hasFlare && alphaClamped > 0.65){
        ctx.strokeStyle = `rgba(255, 255, 255, ${alphaClamped * 0.4})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(s.x - 5, s.y);
        ctx.lineTo(s.x + 5, s.y);
        ctx.moveTo(s.x, s.y - 5);
        ctx.lineTo(s.x, s.y + 5);
        ctx.stroke();
      }
    });

    // 3. Draw Shooting Stars
    for(let i = shootingStars.length - 1; i >= 0; i--){
      const ss = shootingStars[i];
      ss.x += ss.vx;
      ss.y += ss.vy;
      ss.life -= ss.decay;

      if(ss.life <= 0 || ss.x > width || ss.y > height){
        shootingStars.splice(i, 1);
        continue;
      }

      const grad = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.vx * 3, ss.y - ss.vy * 3);
      grad.addColorStop(0, `rgba(255, 255, 255, ${ss.life})`);
      grad.addColorStop(0.3, `rgba(56, 189, 248, ${ss.life * 0.7})`);
      grad.addColorStop(1, "transparent");

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(ss.x - ss.vx * 2.5, ss.y - ss.vy * 2.5);
      ctx.stroke();
    }

    // 4. Draw Mouse Stardust
    for(let i = stardust.length - 1; i >= 0; i--){
      const p = stardust[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.025;

      if(p.life <= 0){
        stardust.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color + (p.life * 0.8) + ")";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "#38bdf8";
      ctx.fill();
    }

    requestAnimationFrame(loop);
  }
  loop();
}

/* Wire up Super Cool Listeners */

// ========================================================
// ELEMENTAL ENCHANTMENT INFUSION LOGIC
// ========================================================
function updateDetailEnchantUI(enchantKey){
  enchantKey = enchantKey || "none";
  const badgeEl = document.getElementById("detailActiveEnchantBadge");
  const descEl = document.getElementById("detailEnchantBuffDesc");
  const meta = ENCHANT_META[enchantKey] || ENCHANT_META.none;

  if(badgeEl){
    badgeEl.textContent = meta.badge;
    badgeEl.style.color = meta.color;
    badgeEl.style.background = meta.glow ? meta.glow.replace("0.6", "0.2") : "rgba(255,255,255,0.08)";
  }
  if(descEl){
    descEl.textContent = meta.desc + " (" + meta.statBuff + ")";
    descEl.style.color = meta.color || "#cbd5e1";
  }

  document.querySelectorAll(".detailEnchantBtn").forEach(btn => {
    if(btn.getAttribute("data-enchant") === enchantKey){
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}
window.updateDetailEnchantUI = updateDetailEnchantUI;

function infuseActiveDetailCard(enchantKey){
  if(!activeDetailCard) return;
  const myUser = (typeof currentUser !== "undefined" && currentUser) ? currentUser : localStorage.getItem("cardCollectorCurrentUser");
  if(!myUser || !accounts || !accounts[myUser]){
    alert("Please sign into an account to infuse artifacts with elemental power!");
    return;
  }

  const userAcc = accounts[myUser];
  if(!userAcc.cardEnchantments) userAcc.cardEnchantments = {};
  const cardKey = activeDetailCard.isUnreleased ? activeDetailCard.id : (activeDetailCard.id || activeDetailCard.name);

  if(enchantKey === "none"){
    delete userAcc.cardEnchantments[cardKey];
  } else {
    userAcc.cardEnchantments[cardKey] = enchantKey;
  }

  localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
  if(typeof syncAccountToCloud === "function") syncAccountToCloud(myUser, true);

  // Update card detail element styling
  const cardEl = document.getElementById("detailCardElement");
  if(cardEl){
    ["enchant-inferno", "enchant-plasma", "enchant-glacial", "enchant-void", "enchant-gaia"].forEach(cls => cardEl.classList.remove(cls));
    if(enchantKey !== "none"){
      cardEl.classList.add(`enchant-${enchantKey}`);
    }
  }

  updateDetailEnchantUI(enchantKey);

  const meta = ENCHANT_META[enchantKey] || ENCHANT_META.none;
  if(enchantKey !== "none"){
    if(typeof playChaosSfx === "function") playChaosSfx("laser");
    if(typeof showLiveToast === "function"){
      showLiveToast(`⚡ Infused <b>${activeDetailCard.name}</b> with ${meta.badge} power! (${meta.statBuff})`, true);
    }
  } else {
    if(typeof showLiveToast === "function") showLiveToast(`Elemental infusion cleansed from ${activeDetailCard.name}.`, true);
  }

  if(typeof render === "function") render();
}
window.infuseActiveDetailCard = infuseActiveDetailCard;

// Helper to get active champion enchantment for arena combat
function getSelectedChampionEnchantment(){
  const myUser = (typeof currentUser !== "undefined" && currentUser) ? currentUser : localStorage.getItem("cardCollectorCurrentUser");
  if(!myUser || !accounts || !accounts[myUser]) return null;
  const champCard = (typeof getSelectedChampionCard === "function") ? getSelectedChampionCard() : null;
  if(!champCard) return null;
  const enchants = accounts[myUser].cardEnchantments || {};
  const cardKey = champCard.isUnreleased ? champCard.id : (champCard.id || champCard.name);
  return enchants[cardKey] || null;
}
window.getSelectedChampionEnchantment = getSelectedChampionEnchantment;

// ========================================================
// DAILY FORTUNE VAULT & STREAK CONTROLLER (STRICT ONCE-PER-DAY)
// ========================================================
function getDailyRewardState(){
  const myUser = (typeof currentUser !== "undefined" && currentUser) ? currentUser : localStorage.getItem("cardCollectorCurrentUser");
  const userAcc = (myUser && accounts && accounts[myUser]) ? accounts[myUser] : null;

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // Strict check across account, guest storage, and device-level timestamp
  const userClaim = userAcc ? (userAcc.lastDailyClaim || 0) : 0;
  const guestClaim = parseInt(localStorage.getItem("cardCollectorGuestLastDailyClaim") || "0", 10) || 0;
  const deviceClaim = parseInt(localStorage.getItem("cardCollectorDeviceLastDailyClaim") || "0", 10) || 0;

  const lastClaim = Math.max(userClaim, guestClaim, deviceClaim);
  const elapsed = now - lastClaim;

  let streak = userAcc ? (userAcc.dailyStreak || 0) : (parseInt(localStorage.getItem("cardCollectorGuestDailyStreak") || "0", 10) || 0);
  let canClaim = false;

  // Only allow claim if never claimed or if at least 24 hours have elapsed
  if(!lastClaim || elapsed >= dayMs){
    if(lastClaim && elapsed >= (dayMs * 2)){
      streak = 0; // Streak resets to 0 if more than 48 hours passed without claiming
    }
    canClaim = true;
  }

  const dayIndex = (streak % 7);
  const nextClaimMs = canClaim ? 0 : Math.max(0, dayMs - elapsed);

  return { canClaim, streak: streak + 1, dayIndex, nextClaimMs, lastClaim };
}
window.getDailyRewardState = getDailyRewardState;

function updateDailyRewardBadge(){
  const badge = document.getElementById("dailyRewardBadge");
  if(!badge) return;
  const state = getDailyRewardState();
  badge.style.display = state.canClaim ? "inline-block" : "none";
}
window.updateDailyRewardBadge = updateDailyRewardBadge;

let dailyTimerInterval = null;

function openDailyRewardModal(){
  const modal = document.getElementById("dailyRewardModal");
  if(!modal) return;

  const state = getDailyRewardState();
  const streakBadge = document.getElementById("dailyStreakBadge");
  if(streakBadge){
    streakBadge.textContent = `🔥 Day ${state.dayIndex + 1} of 7 Streak`;
  }

  const grid = document.getElementById("dailyStreakGrid");
  if(grid){
    grid.innerHTML = DAILY_REWARDS.map((rew, idx) => {
      let statusClass = "";
      if(idx < state.dayIndex){
        statusClass = "claimed";
      } else if(idx === state.dayIndex){
        statusClass = state.canClaim ? "active" : "claimed";
      } else {
        statusClass = "locked";
      }

      return `
        <div class="daily-streak-card ${statusClass}">
          <div class="daily-day-label">${rew.label}</div>
          <div class="daily-chest-icon">${rew.icon}</div>
          <div class="daily-reward-label">${rew.rewardDesc}</div>
        </div>
      `;
    }).join("");
  }

  const claimBtn = document.getElementById("claimDailyRewardBtn");
  const timerStatus = document.getElementById("dailyTimerStatus");

  function updateModalTimer(){
    const curState = getDailyRewardState();
    if(curState.canClaim){
      if(claimBtn){
        claimBtn.disabled = false;
        claimBtn.style.opacity = "1";
        claimBtn.style.cursor = "pointer";
        claimBtn.innerHTML = `🎁 CLAIM TODAY'S BOUNTY (+${DAILY_REWARDS[curState.dayIndex].rewardDesc})`;
      }
      if(timerStatus){
        timerStatus.innerHTML = `<span style="color:#6ee7b7;font-weight:800">✨ Ready to claim right now!</span>`;
      }
    } else {
      if(claimBtn){
        claimBtn.disabled = true;
        claimBtn.style.opacity = "0.5";
        claimBtn.style.cursor = "not-allowed";
        claimBtn.innerHTML = `✓ BOUNTY CLAIMED TODAY (Locked)`;
      }
      if(timerStatus){
        const hrs = Math.floor(curState.nextClaimMs / (1000 * 60 * 60));
        const mins = Math.floor((curState.nextClaimMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((curState.nextClaimMs % (1000 * 60)) / 1000);
        timerStatus.innerHTML = `Next daily reward unlocks in: <b style="color:#fde047">${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}</b>`;
      }
    }
  }

  updateModalTimer();
  if(dailyTimerInterval) clearInterval(dailyTimerInterval);
  dailyTimerInterval = setInterval(updateModalTimer, 1000);

  modal.style.display = "flex";
  if(typeof playChaosSfx === "function") playChaosSfx("ascension");
}
window.openDailyRewardModal = openDailyRewardModal;

function closeDailyRewardModal(){
  const modal = document.getElementById("dailyRewardModal");
  if(modal) modal.style.display = "none";
  if(dailyTimerInterval){
    clearInterval(dailyTimerInterval);
    dailyTimerInterval = null;
  }
}
window.closeDailyRewardModal = closeDailyRewardModal;

function claimDailyReward(){
  // Prevent double-clicking / rapid spamming
  if(window._dailyClaimLock) return;

  const state = getDailyRewardState();
  if(!state.canClaim){
    const hrs = Math.floor(state.nextClaimMs / (1000 * 60 * 60));
    const mins = Math.floor((state.nextClaimMs % (1000 * 60 * 60)) / (1000 * 60));
    alert(`You can only claim the daily reward ONCE per day!\n\nNext reward unlocks in ${hrs}h ${mins}m.`);
    return;
  }

  window._dailyClaimLock = true;
  const now = Date.now();

  // Instantly record device-level claim lockout
  try {
    localStorage.setItem("cardCollectorDeviceLastDailyClaim", now.toString());
  } catch(e){}

  const myUser = (typeof currentUser !== "undefined" && currentUser) ? currentUser : localStorage.getItem("cardCollectorCurrentUser");
  let userAcc = (myUser && accounts && accounts[myUser]) ? accounts[myUser] : null;

  const reward = DAILY_REWARDS[state.dayIndex];

  if(userAcc){
    // Update account record
    userAcc.lastDailyClaim = now;
    userAcc.dailyStreak = (userAcc.dailyStreak || 0) + 1;

    // Grant Coins
    if(reward.coins){
      if(userAcc.coins === "Infinity" || userAcc.coins === Infinity || coins === Infinity){
        coins = Infinity;
        userAcc.coins = "Infinity";
      } else {
        coins = (Number.isFinite(userAcc.coins) ? userAcc.coins : 100) + reward.coins;
        userAcc.coins = coins;
      }
      const coinsEl = document.getElementById("coins");
      if(coinsEl) coinsEl.textContent = (typeof formatCoins === "function") ? formatCoins(coins) : coins.toLocaleString();
    }

    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    if(typeof syncAccountToCloud === "function") syncAccountToCloud(myUser, true, true);
  } else {
    // Guest player claim
    try {
      localStorage.setItem("cardCollectorGuestLastDailyClaim", now.toString());
      const gStreak = (parseInt(localStorage.getItem("cardCollectorGuestDailyStreak") || "0", 10) || 0) + 1;
      localStorage.setItem("cardCollectorGuestDailyStreak", gStreak.toString());
      if(reward.coins){
        coins = (typeof coins === "number" && !isNaN(coins)) ? coins + reward.coins : 100 + reward.coins;
        localStorage.setItem("cardCollectorGuestCoins", coins.toString());
        const coinsEl = document.getElementById("coins");
        if(coinsEl) coinsEl.textContent = (typeof formatCoins === "function") ? formatCoins(coins) : coins.toLocaleString();
      }
    } catch(e){}
  }

  // Grant Booster Pack if scheduled
  let packAwardedMsg = "";
  if(reward.pack && typeof startPackOpening === "function"){
    packAwardedMsg = ` and unlocked a <b>${reward.pack.toUpperCase()} BOOSTER PACK</b>!`;
    setTimeout(() => {
      startPackOpening(reward.pack);
    }, 1200);
  }

  // Audio & Confetti
  if(typeof playChaosSfx === "function"){
    playChaosSfx("coins");
    setTimeout(() => playChaosSfx("triumph"), 250);
  }
  if(typeof confetti === "function"){
    confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
  }

  if(typeof showLiveToast === "function"){
    showLiveToast(`🎁 <b>Day ${state.dayIndex + 1} Claimed!</b> +${reward.coins.toLocaleString()} Coins${packAwardedMsg}`, true);
  }

  // Refresh modal and badge immediately
  openDailyRewardModal();
  updateDailyRewardBadge();

  setTimeout(() => {
    window._dailyClaimLock = false;
  }, 1000);
}
window.claimDailyReward = claimDailyReward;

function initSuperCoolDom(){
  initAmbientCosmosCanvas();

  const closeDetailBtn = document.getElementById("closeCardDetailBtn");
  if(closeDetailBtn) closeDetailBtn.onclick = closeCardDetailModal;

  const rankBadge = document.getElementById("summonerRankBadge");
  if(rankBadge) rankBadge.onclick = openSummonerMasteryModal;

  const closeSummonerBtn = document.getElementById("closeSummonerModalBtn");
  if(closeSummonerBtn) closeSummonerBtn.onclick = () => {
    const modal = document.getElementById("summonerModal");
    if(modal) modal.style.display = "none";
  };

  const revealAllBtn = document.getElementById("packRevealAllBtn");
  if(revealAllBtn){
    revealAllBtn.onclick = () => {
      document.querySelectorAll(".flip-card-wrapper:not(.flipped)").forEach((cardEl, idx) => {
        setTimeout(() => cardEl.click(), idx * 110);
      });
    };
  }

  const championBtn = document.getElementById("detailSetChampionBtn");
  if(championBtn){
    championBtn.onclick = () => {
      if(!activeDetailCard) return;
      localStorage.setItem("cardCollectorFavChampion", activeDetailCard.name);
      if(typeof playChaosSfx === "function") playChaosSfx("triumph");
      alert(`⚔️ ${activeDetailCard.name} is now designated as your default Arena Champion!`);
    };
  }

  const orbitBtn = document.getElementById("detailOrbitToggleBtn");
  if(orbitBtn){
    orbitBtn.onclick = () => {
      const cardEl = document.getElementById("detailCardElement");
      if(!cardEl) return;
      cardEl.classList.toggle("card-auto-orbit");
      orbitBtn.classList.toggle("active");
      if(cardEl.classList.contains("card-auto-orbit")){
        orbitBtn.textContent = "⏹ Stop Orbit";
      } else {
        orbitBtn.textContent = "🔄 Auto-Orbit";
        cardEl.style.transform = "";
      }
      if(typeof playChaosSfx === "function") playChaosSfx("click");
    };
  }

  const cryBtn = document.getElementById("detailPlayCryBtn");
  if(cryBtn){
    cryBtn.onclick = () => {
      if(!activeDetailCard) return;
      if(typeof playChaosSfx === "function") playChaosSfx("ascension");
    };
  }

  document.querySelectorAll(".detailFoilBtn").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".detailFoilBtn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const foil = btn.getAttribute("data-foil");
      const cardEl = document.getElementById("detailCardElement");
      if(cardEl){
        // Preserve active enchant classes when switching foils
        const currentEnchants = Array.from(cardEl.classList).filter(c => c.startsWith("enchant-"));
        cardEl.className = `card foil-${foil} ${currentEnchants.join(" ")}`;
      }
      if(typeof playChaosSfx === "function") playChaosSfx("click");
    };
  });

  // Elemental Aura Infusion Buttons in Card Detail Modal
  document.querySelectorAll(".detailEnchantBtn").forEach(btn => {
    btn.onclick = () => {
      const enchant = btn.getAttribute("data-enchant");
      infuseActiveDetailCard(enchant);
    };
  });

  // Daily Reward Fortune Vault Modal Controls
  const dailyBtn = document.getElementById("dailyRewardBtn");
  if(dailyBtn) dailyBtn.onclick = openDailyRewardModal;

  const closeDailyBtn = document.getElementById("closeDailyRewardModalBtn");
  if(closeDailyBtn) closeDailyBtn.onclick = closeDailyRewardModal;

  const claimDailyBtn = document.getElementById("claimDailyRewardBtn");
  if(claimDailyBtn) claimDailyBtn.onclick = claimDailyReward;

  updateDailyRewardBadge();
}

document.addEventListener("DOMContentLoaded", () => {
  initSuperCoolDom();
});

if(document.readyState === "complete" || document.readyState === "interactive"){
  setTimeout(() => {
    initSuperCoolDom();
  }, 100);
}

// Cross-tab immediate ban synchronization
window.addEventListener("storage", (e) => {
  if(e.key === "cardCollectorAccounts"){
    try {
      const updatedAccounts = JSON.parse(e.newValue);
      const myUser = (typeof currentUser !== "undefined" && currentUser) ? currentUser : localStorage.getItem("cardCollectorCurrentUser");
      if(myUser && updatedAccounts && updatedAccounts[myUser]){
        const userAcc = updatedAccounts[myUser];
        if(userAcc.banned && !(typeof isCamUsername === "function" && isCamUsername(myUser))){
          if(!userAcc.banExpires || Date.now() < userAcc.banExpires){
            if(typeof showBannedScreen === "function") showBannedScreen(userAcc, myUser);
          } else {
            if(typeof liftExpiredBan === "function") liftExpiredBan(myUser);
          }
        } else {
          if(typeof hideBannedScreen === "function") hideBannedScreen();
        }
      }
    } catch(err){}
  }
});
