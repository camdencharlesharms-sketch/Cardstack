/* Presence & Real-Time Player Synchronization Mesh */

// Unique presence peer ID for Master Admin Cam
const CAM_PRESENCE_PEER_ID = "cardstack_hub_presence_cam_v1";

// BroadcastChannel for instant same-browser / multi-tab synchronization
const presenceBroadcast = (typeof BroadcastChannel !== "undefined") ? new BroadcastChannel("cardstack_presence_bus") : null;

// Pool of active PeerJS connections (for Cam to send real-time gifts to online players)
window.activePresencePeers = window.activePresencePeers || {};

let presencePeer = null;
let presenceConnToCam = null;
let presenceHeartbeatTimer = null;

// Initialize Presence Mesh
function initPresenceSystem(){
  if(typeof Peer === "undefined") return;

  const isCam = (typeof isMasterAdmin === "function") && isMasterAdmin();

  if(isCam){
    setupCamHostPresence();
  } else {
    setupClientPresence();
  }
}

// Master Admin Cam: Hosts presence beacon to receive registrations and heartbeats
function setupCamHostPresence(){
  if(presencePeer && !presencePeer.destroyed) return;

  try {
    presencePeer = new Peer(CAM_PRESENCE_PEER_ID, { debug: 1 });

    presencePeer.on("open", (id)=>{
      console.log("[Presence] Master Cam presence beacon active with ID:", id);
      updateLivePresenceDisplay();
    });

    presencePeer.on("connection", (conn)=>{
      conn.on("data", (data)=>{
        handleCamReceivedPresenceData(conn, data);
      });

      conn.on("close", ()=>{
        if(conn.peerUser && window.activePresencePeers[conn.peerUser] === conn){
          delete window.activePresencePeers[conn.peerUser];
          updateLivePresenceDisplay();
          if(typeof refreshAdminPlayerData === "function") refreshAdminPlayerData();
        }
      });

      conn.on("error", ()=>{});
    });

    presencePeer.on("error", (err)=>{
      // If ID is taken (e.g. Cam has another tab open), fall back gracefully
      console.log("[Presence] Host beacon note:", err.type);
    });
  } catch(e){
    console.error("[Presence] Host init error:", e);
  }
}

// Normal Players / Clients: Connect to Cam's presence beacon
function setupClientPresence(){
  if(presencePeer && !presencePeer.destroyed) return;

  try {
    presencePeer = new Peer({ debug: 1 });

    presencePeer.on("open", ()=>{
      connectToCamBeacon();
    });

    presencePeer.on("error", (err)=>{
      console.log("[Presence] Client peer error:", err.type);
    });
  } catch(e){}
}

function connectToCamBeacon(){
  if(!presencePeer || presencePeer.destroyed) return;
  if(presenceConnToCam && presenceConnToCam.open) return;

  try {
    presenceConnToCam = presencePeer.connect(CAM_PRESENCE_PEER_ID, { reliable: true });

    presenceConnToCam.on("open", ()=>{
      // Announce identity immediately
      announcePresenceToCam(false);

      // Start periodic heartbeat every 15s
      clearInterval(presenceHeartbeatTimer);
      presenceHeartbeatTimer = setInterval(()=>{
        announcePresenceToCam(false);
      }, 15000);
    });

    presenceConnToCam.on("data", (data)=>{
      if(!data) return;
      if(data.type === "admin_dispatch"){
        handleIncomingAdminDispatch(data.action);
      } else if(data.type === "studio_card_created"){
        handleIncomingStudioCardCreated(data.card);
      } else if(data.type === "sync_studio_cards" && Array.isArray(data.cards)){
        data.cards.forEach(handleIncomingStudioCardCreated);
      }
    });

    presenceConnToCam.on("close", ()=>{
      presenceConnToCam = null;
      // Reconnect attempt in 12s
      setTimeout(connectToCamBeacon, 12000);
    });

    presenceConnToCam.on("error", ()=>{
      presenceConnToCam = null;
    });
  } catch(e){}
}

function announcePresenceToCam(isNew = false){
  const name = currentUser || "Guest";
  if(!name || name === "Guest") return;

  const payload = {
    type: isNew ? "account_register" : "presence_heartbeat",
    user: name,
    isNew: !!isNew,
    coins: (typeof coins !== "undefined") ? coins : 100,
    owned: (typeof owned !== "undefined") ? owned : [],
    lastActive: Date.now()
  };

  if(presenceConnToCam && presenceConnToCam.open){
    try { presenceConnToCam.send(payload); } catch(e){}
  }

  // Also broadcast across same-device tabs
  if(presenceBroadcast){
    try { presenceBroadcast.postMessage(payload); } catch(e){}
  }
}

// Master Cam processes incoming network message
function handleCamReceivedPresenceData(conn, data){
  if(!data || !data.user) return;
  const username = data.user.trim();
  if(!username || username.toLowerCase() === ADMIN_USERNAME.toLowerCase()) return;

  conn.peerUser = username;
  window.activePresencePeers[username] = conn;

  let isBrandNew = false;
  if(!accounts[username]){
    isBrandNew = true;
    accounts[username] = {
      password: "",
      owned: Array.isArray(data.owned) ? data.owned : [],
      coins: Number.isFinite(data.coins) ? data.coins : 100,
      hasPlayed: true,
      lastActive: Date.now()
    };
  } else {
    accounts[username].lastActive = Date.now();
    accounts[username].hasPlayed = true;
    if(Number.isFinite(data.coins)) accounts[username].coins = data.coins;
    if(Array.isArray(data.owned)){
      // Merge owned cards so client heartbeats never wipe cards gifted by Cam
      const currentOwned = Array.isArray(accounts[username].owned) ? accounts[username].owned : [];
      accounts[username].owned = Array.from(new Set([...currentOwned, ...data.owned]));
    }
  }

  localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));

  if(data.isNew || isBrandNew){
    showLiveToast(`🎉 New Player Registered: <b>${username}</b>`, true);
  }

  // Always synchronize full player gifts, vault cards, balance & studio cards back to connected player
  try {
    const userAcc = accounts[username];
    if(userAcc && conn && conn.open){
      const customs = (typeof getCustomCardsFromStorage === "function") ? getCustomCardsFromStorage() : [];
      conn.send({
        type: "admin_dispatch",
        target: username,
        action: {
          type: "sync_player_full_state",
          owned: userAcc.owned || [],
          coins: userAcc.coins,
          unreleasedOwned: userAcc.unreleasedOwned || [],
          unreleasedCards: (typeof unreleasedCards !== "undefined" && Array.isArray(unreleasedCards)) ? unreleasedCards : [],
          customCards: customs
        }
      });
    }
  } catch(e){}

  updateLivePresenceDisplay();
  if(typeof refreshAdminPlayerData === "function") refreshAdminPlayerData();
}

// BroadcastChannel receiver (same browser, multi-tab instant sync)
if(presenceBroadcast){
  presenceBroadcast.onmessage = (event)=>{
    const data = event.data;
    if(!data) return;

    if(data.type === "account_register" || data.type === "presence_heartbeat"){
      const username = data.user;
      if(!username || username.toLowerCase() === ADMIN_USERNAME.toLowerCase()) return;

      let isBrandNew = false;
      if(!accounts[username]){
        isBrandNew = true;
        accounts[username] = {
          password: "",
          owned: Array.isArray(data.owned) ? data.owned : [],
          coins: Number.isFinite(data.coins) ? data.coins : 100,
          hasPlayed: true,
          lastActive: Date.now()
        };
      } else {
        accounts[username].lastActive = Date.now();
        accounts[username].hasPlayed = true;
        if(Number.isFinite(data.coins)) accounts[username].coins = data.coins;
        if(Array.isArray(data.owned)){
          const currentOwned = Array.isArray(accounts[username].owned) ? accounts[username].owned : [];
          accounts[username].owned = Array.from(new Set([...currentOwned, ...data.owned]));
        }
      }

      localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));

      if((data.isNew || isBrandNew) && (typeof isMasterAdmin === "function") && isMasterAdmin()){
        showLiveToast(`🎉 New Player Registered: <b>${username}</b>`, true);
      }

      updateLivePresenceDisplay();
      if(typeof refreshAdminPlayerData === "function") refreshAdminPlayerData();
    } else if(data.type === "admin_dispatch"){
      if(currentUser && data.target && data.target.toLowerCase() === currentUser.toLowerCase()){
        handleIncomingAdminDispatch(data.action);
      }
    } else if(data.type === "studio_card_created"){
      handleIncomingStudioCardCreated(data.card);
    }
  };
}

// Listen to storage events from other windows
window.addEventListener("storage", (e)=>{
  if(e.key === "cardCollectorAccounts" && e.newValue){
    try {
      accounts = JSON.parse(e.newValue) || {};
      if(currentUser && accounts[currentUser]){
        if(Array.isArray(accounts[currentUser].owned)){
          owned = accounts[currentUser].owned.map(x => parseInt(x, 10)).filter(n => !isNaN(n));
        }
        if(Number.isFinite(accounts[currentUser].coins)){
          coins = accounts[currentUser].coins;
        }
        if(typeof render === "function") render();
      }
      updateLivePresenceDisplay();
      if(typeof refreshAdminPlayerData === "function") refreshAdminPlayerData();
    } catch(err){}
  }
});

// Toast notification helper
function showLiveToast(msg, isSuccess = true){
  let toast = document.getElementById("gameLiveToast");
  if(!toast){
    toast = document.createElement("div");
    toast.id = "gameLiveToast";
    toast.style.cssText = "position:fixed;top:20px;right:20px;z-index:999999;background:rgba(15,23,42,0.96);border:1px solid #10b981;box-shadow:0 0 25px rgba(16,185,129,0.4);color:#f8fafc;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:700;display:flex;align-items:center;gap:10px;transform:translateY(-100px);opacity:0;transition:all 0.35s cubic-bezier(0.16,1,0.3,1);pointer-events:none";
    document.body.appendChild(toast);
  }
  toast.innerHTML = msg;
  toast.style.borderColor = isSuccess ? "#10b981" : "#f43f5e";
  toast.style.boxShadow = isSuccess ? "0 0 25px rgba(16,185,129,0.4)" : "0 0 25px rgba(244,63,94,0.4)";
  toast.style.transform = "translateY(0)";
  toast.style.opacity = "1";
  clearTimeout(toast._timer);
  toast._timer = setTimeout(()=>{
    toast.style.transform = "translateY(-100px)";
    toast.style.opacity = "0";
  }, 4500);
}

// Gifting dispatch: sends real-time updates to target player
function broadcastAdminActionToTarget(targetUser, actionData){
  if(!targetUser) return;

  // 1. Same-device multi-tab broadcast
  if(presenceBroadcast){
    try {
      presenceBroadcast.postMessage({
        type: "admin_dispatch",
        target: targetUser,
        action: actionData
      });
    } catch(e){}
  }

  // 2. PeerJS remote connection (case-insensitive)
  if(window.activePresencePeers){
    let peerConn = window.activePresencePeers[targetUser];
    if(!peerConn){
      const matchK = Object.keys(window.activePresencePeers).find(k => k.toLowerCase() === targetUser.toLowerCase());
      if(matchK) peerConn = window.activePresencePeers[matchK];
    }
    if(peerConn && peerConn.open){
      try {
        peerConn.send({
          type: "admin_dispatch",
          target: targetUser,
          action: actionData
        });
      } catch(e){}
    }
  }
}

// Client receives gift or admin action
function handleIncomingAdminDispatch(actionData){
  if(!actionData) return;

  if(actionData.type === "sync_player_full_state"){
    let changed = false;
    // 1. Sync custom cards
    if(Array.isArray(actionData.customCards)){
      actionData.customCards.forEach(c => {
        if(!cards.some(existing => (existing.id && c.id && existing.id === c.id) || existing.name.toLowerCase() === c.name.toLowerCase())){
          cards.push(c);
          changed = true;
        }
      });
      if(changed && typeof saveCustomCardsToStorage === "function") saveCustomCardsToStorage();
    }
    // 2. Sync unreleased cards
    if(Array.isArray(actionData.unreleasedCards)){
      actionData.unreleasedCards.forEach(vc => {
        const vId = vc.id || vc.name;
        if(typeof unreleasedCards !== "undefined" && Array.isArray(unreleasedCards)){
          if(!unreleasedCards.some(existing => (existing.id || existing.name) === vId)){
            unreleasedCards.push(vc);
            try { localStorage.setItem("cardCollectorUnreleasedCards", JSON.stringify(unreleasedCards)); } catch(e){}
          }
        }
      });
    }
    // 3. Sync player owned cards (union merge)
    if(Array.isArray(actionData.owned)){
      actionData.owned.forEach(idx => {
        const numIdx = parseInt(idx, 10);
        if(!isNaN(numIdx) && !owned.some(x => parseInt(x, 10) === numIdx)){
          owned.push(numIdx);
          changed = true;
        }
      });
    }
    // 4. Sync unreleased owned cards
    if(currentUser && accounts[currentUser]){
      if(!accounts[currentUser].unreleasedOwned) accounts[currentUser].unreleasedOwned = [];
      if(Array.isArray(actionData.unreleasedOwned)){
        actionData.unreleasedOwned.forEach(vId => {
          if(!accounts[currentUser].unreleasedOwned.includes(vId)){
            accounts[currentUser].unreleasedOwned.push(vId);
            changed = true;
          }
        });
      }
      if(Number.isFinite(actionData.coins) && actionData.coins > (accounts[currentUser].coins || 0)){
        coins = actionData.coins;
        accounts[currentUser].coins = coins;
        changed = true;
      }
      accounts[currentUser].owned = owned;
    }
    if(changed){
      save();
      render();
    }
    return;
  }
  if(actionData.type === "gift_coins"){
    const amt = actionData.amount || 0;
    coins += amt;
    if(accounts[currentUser]) accounts[currentUser].coins = coins;
    save();
    render();
    showLiveToast(`🎁 Master Admin Cam gifted you <b>+${amt.toLocaleString()} Coins</b>! 🪙`, true);
  } else if(actionData.type === "set_coins"){
    coins = actionData.amount || 0;
    if(accounts[currentUser]) accounts[currentUser].coins = coins;
    save();
    render();
    showLiveToast(`🪙 Master Admin Cam updated your treasury to <b>${coins.toLocaleString()} Coins</b>!`, true);
  } else if(actionData.type === "gift_card"){
    const cIdx = actionData.cardIndex;
    const cardObj = actionData.card || (typeof cards !== "undefined" ? cards[cIdx] : null);
    let resolvedIndex = (typeof cIdx === "number" && !isNaN(cIdx)) ? cIdx : -1;

    if(cardObj && typeof cards !== "undefined"){
      const existingIdx = cards.findIndex(c => (c.id && cardObj.id && c.id === cardObj.id) || c.name.toLowerCase() === cardObj.name.toLowerCase());
      if(existingIdx !== -1){
        resolvedIndex = existingIdx;
      } else {
        cards.push(cardObj);
        if(typeof saveCustomCardsToStorage === "function") saveCustomCardsToStorage();
        resolvedIndex = cards.length - 1;
      }
    }

    if(resolvedIndex >= 0){
      if(!owned.some(x => parseInt(x, 10) === resolvedIndex)){
        owned.push(resolvedIndex);
      }
      if(currentUser && accounts[currentUser]){
        if(!accounts[currentUser].owned) accounts[currentUser].owned = [];
        if(!accounts[currentUser].owned.some(x => parseInt(x, 10) === resolvedIndex)){
          accounts[currentUser].owned.push(resolvedIndex);
        }
      }
      save();
      render();
      const cardName = cardObj ? cardObj.name : (cards[resolvedIndex] ? cards[resolvedIndex].name : "New Card");
      showLiveToast(`🎁 Master Admin Cam granted you card: <b>${cardName}</b>!`, true);
    }
  } else if(actionData.type === "revoke_card"){
    const cIdx = actionData.cardIndex;
    owned = owned.filter(x => parseInt(x, 10) !== cIdx);
    if(accounts[currentUser]) accounts[currentUser].owned = owned;
    save();
    render();
    showLiveToast(`Card recalled by Master Admin.`, false);
  } else if(actionData.type === "unlock_all"){
    owned = cards.map((_, i) => i);
    if(accounts[currentUser]) accounts[currentUser].owned = owned;
    save();
    render();
    showLiveToast(`🎉 Master Admin Cam unlocked all cards in the game for you!`, true);
  } else if(actionData.type === "wipe_cards"){
    owned = [];
    if(accounts[currentUser]) accounts[currentUser].owned = [];
    save();
    render();
    showLiveToast(`Card collection cleared by Master Admin.`, false);
  } else if(actionData.type === "gift_vault_card"){
    const vCard = actionData.card;
    if(vCard){
      const cardId = vCard.id || vCard.name;
      if(typeof unreleasedCards !== "undefined" && Array.isArray(unreleasedCards)){
        if(!unreleasedCards.some(c => (c.id || c.name) === cardId)){
          unreleasedCards.push(vCard);
          try { localStorage.setItem("cardCollectorUnreleasedCards", JSON.stringify(unreleasedCards)); } catch(e){}
        }
      }
      if(currentUser){
        if(!accounts[currentUser]) accounts[currentUser] = { owned: [], coins: 100, unreleasedOwned: [] };
        if(!accounts[currentUser].unreleasedOwned) accounts[currentUser].unreleasedOwned = [];
        if(!accounts[currentUser].unreleasedOwned.includes(cardId)){
          accounts[currentUser].unreleasedOwned.push(cardId);
        }
      }
      save();
      render();
      showLiveToast(`🎁 Master Admin Cam gifted you Exclusive Vault Card: <b>${vCard.name}</b>! 🔒`, true);
    }
  } else if(actionData.type === "revoke_vault_card"){
    const cardId = actionData.cardId;
    if(accounts[currentUser] && Array.isArray(accounts[currentUser].unreleasedOwned)){
      accounts[currentUser].unreleasedOwned = accounts[currentUser].unreleasedOwned.filter(x => x !== cardId);
      save();
      render();
      showLiveToast(`Exclusive vault card recalled by Master Admin.`, false);
    }
  }
}

// Update UI displays (header badge, Admin Hub presence bar)
function updateLivePresenceDisplay(){
  const homeBadge = document.getElementById("homeOnlineBadge");
  const countEl = document.getElementById("adminLiveOnlineCount");
  const chipsEl = document.getElementById("adminLiveOnlineChips");

  const validNames = Object.keys(accounts).filter(n => typeof isValidGameAccount === "function" ? isValidGameAccount(n, accounts[n]) : true);
  const onlineNames = validNames.filter(n => typeof isAccountOnline === "function" ? isAccountOnline(n) : false);

  if(homeBadge){
    homeBadge.textContent = `🟢 ${onlineNames.length}`;
    homeBadge.title = `${onlineNames.length} player(s) online`;
  }

  if(!countEl || !chipsEl) return;

  countEl.textContent = `${onlineNames.length} Online`;
  chipsEl.innerHTML = "";

  if(onlineNames.length === 0){
    chipsEl.innerHTML = `<span style="font-size:11px;color:#94a3b8">No other players currently active</span>`;
    return;
  }

  onlineNames.forEach(name => {
    const isMaster = name.toLowerCase() === ADMIN_USERNAME.toLowerCase();
    const isCurrent = currentUser && currentUser.toLowerCase() === name.toLowerCase();
    const data = accounts[name] || {};
    const chip = document.createElement("div");
    chip.style.cssText = "display:inline-flex;align-items:center;gap:6px;background:rgba(0,0,0,0.45);border:1px solid rgba(16,185,129,0.35);padding:3px 10px;border-radius:999px;font-size:11px;cursor:pointer;transition:transform 0.15s";
    chip.title = `Click to select ${name} for gifting & admin controls`;
    chip.innerHTML = `
      <span style="width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 6px #10b981"></span>
      <b style="color:${isMaster ? '#fb7185' : '#f1f5f9'}">${name}${isCurrent ? ' (You)' : ''}</b>
      <span style="color:#fbbf24">🪙 ${(data.coins || 0).toLocaleString()}</span>
    `;
    chip.onmouseenter = ()=>{ chip.style.transform = "scale(1.05)"; };
    chip.onmouseleave = ()=>{ chip.style.transform = "scale(1)"; };
    chip.onclick = ()=>{
      if(typeof selectPlayerInAllAdminDropdowns === "function"){
        selectPlayerInAllAdminDropdowns(name);
      }
    };
    chipsEl.appendChild(chip);
  });
}

// Auto-init when DOM is ready
if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", initPresenceSystem);
} else {
  initPresenceSystem();
}

// Card Studio Synchronization
function handleIncomingStudioCardCreated(card){
  if(!card || !card.name) return;
  if(!cards.some(c => (c.id && c.id === card.id) || c.name.toLowerCase() === card.name.toLowerCase())){
    cards.push(card);
    if(typeof saveCustomCardsToStorage === "function") saveCustomCardsToStorage();
    if(typeof initCardSelect === "function") initCardSelect();
    if(typeof render === "function") render();
    showLiveToast(`✨ New Card Studio card published: <b>${card.name}</b> (${card.rarity})! Now available in booster packs!`, true);
  }
}

function broadcastStudioCardCreated(card){
  if(!card) return;
  if(presenceBroadcast){
    try {
      presenceBroadcast.postMessage({
        type: "studio_card_created",
        card
      });
    } catch(e){}
  }
  if(window.activePresencePeers && typeof window.activePresencePeers === "object"){
    Object.keys(window.activePresencePeers).forEach(peerUser => {
      try {
        window.activePresencePeers[peerUser].send({
          type: "studio_card_created",
          card
        });
      } catch(e){}
    });
  }
}
