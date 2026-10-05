/* Presence & Real-Time Player Synchronization Mesh */

// Unique presence peer ID for Master Admin Cam
const CAM_PRESENCE_PEER_ID = "cardstack_hub_presence_cam_v1";

// BroadcastChannel for instant same-browser / multi-tab synchronization
const presenceBroadcast = (typeof BroadcastChannel !== "undefined") ? new BroadcastChannel("cardstack_presence_bus") : null;

// Pool of active PeerJS connections (for Cam to send real-time gifts to online players)
window.activePresencePeers = window.activePresencePeers || {};

function broadcastToAllPresencePeers(payload){
  if(!payload) return;
  if(presenceBroadcast){
    try { presenceBroadcast.postMessage(payload); } catch(e){}
  }
  if(window.activePresencePeers && typeof window.activePresencePeers === "object"){
    Object.keys(window.activePresencePeers).forEach(peerUser => {
      try {
        const peerConn = window.activePresencePeers[peerUser];
        if(peerConn && peerConn.open){
          peerConn.send(payload);
        }
      } catch(e){}
    });
  }
}
if(typeof window !== "undefined") window.broadcastToAllPresencePeers = broadcastToAllPresencePeers;

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
      window.allConnectedPresenceConns = window.allConnectedPresenceConns || new Set();
      window.allConnectedPresenceConns.add(conn);

      conn.on("open", ()=>{
        // Immediately synchronize all public studio cards to newly connected peer (even before heartbeat!)
        const customs = (typeof getCustomCardsFromStorage === "function") ? getCustomCardsFromStorage() : [];
        if(customs && customs.length > 0){
          try {
            conn.send({
              type: "sync_studio_cards",
              cards: customs
            });
          } catch(e){}
        }
        // Send current lockdown state
        try {
          conn.send({
            type: "sync_lockdown_mode",
            isLockdown: !!isLockdownMode
          });
        } catch(e){}
      });

      conn.on("data", (data)=>{
        handleCamReceivedPresenceData(conn, data);
      });

      conn.on("close", ()=>{
        if(window.allConnectedPresenceConns) window.allConnectedPresenceConns.delete(conn);
        if(conn.peerUser && window.activePresencePeers[conn.peerUser] === conn){
          delete window.activePresencePeers[conn.peerUser];
          updateLivePresenceDisplay();
          if(typeof refreshAdminPlayerData === "function") refreshAdminPlayerData();
        }
      });

      conn.on("error", ()=>{
        if(window.allConnectedPresenceConns) window.allConnectedPresenceConns.delete(conn);
      });
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
      try {
        presenceConnToCam.send({ type: "request_studio_cards" });
      } catch(e){}

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
      } else if(data.type === "sync_sub_admins"){
        if(data.subAdminRoles && typeof data.subAdminRoles === "object"){
          subAdminRoles = data.subAdminRoles;
          localStorage.setItem("cardCollectorSubAdmins", JSON.stringify(subAdminRoles));
          if(typeof updateAccountUI === "function") updateAccountUI();
          if(typeof refreshAdminPlayerData === "function") refreshAdminPlayerData();
        }
      } else if(data.type === "studio_card_created"){
        handleIncomingStudioCardCreated(data.card);
      } else if(data.type === "sync_studio_cards" && Array.isArray(data.cards)){
        data.cards.forEach(handleIncomingStudioCardCreated);
      } else if(data.type === "sync_lockdown_mode"){
        handleIncomingLockdownSync(data.isLockdown);
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
  const isGuest = (!name || name === "Guest");

  const payload = {
    type: isNew ? "account_register" : "presence_heartbeat",
    user: isGuest ? "Guest" : name,
    isGuest: isGuest,
    isNew: !!isNew,
    coins: (typeof coins !== "undefined") ? coins : 100,
    owned: (typeof owned !== "undefined") ? owned : [],
    lastActive: Date.now()
  };

  if(presenceConnToCam && presenceConnToCam.open){
    try { presenceConnToCam.send(payload); } catch(e){}
  }

  // Also broadcast across same-device tabs
  if(presenceBroadcast && !isGuest){
    try { presenceBroadcast.postMessage(payload); } catch(e){}
  }
}

// Master Cam processes incoming network message
function handleCamReceivedPresenceData(conn, data){
  if(!data) return;
  if(data.type === "subadmin_action_relay"){
    handleSubAdminActionRelay(conn, data);
    return;
  }
  if(data.type === "studio_card_created" && data.card){
    handleIncomingStudioCardCreated(data.card);
    if(typeof isMasterAdmin === "function" && isMasterAdmin()){
      broadcastStudioCardCreated(data.card);
    }
    return;
  }
  if(data.type === "request_studio_cards" || data.isGuest){
    const customs = (typeof getCustomCardsFromStorage === "function") ? getCustomCardsFromStorage() : [];
    if(customs && customs.length > 0 && conn && conn.open){
      try {
        conn.send({
          type: "sync_studio_cards",
          cards: customs
        });
      } catch(e){}
    }
    if(data.isGuest) return;
  }
  if(!data.user) return;
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
          customCards: customs,
          subAdminRoles: (typeof subAdminRoles !== "undefined" && typeof subAdminRoles === "object") ? subAdminRoles : {}
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
    } else if(data.type === "sync_sub_admins"){
      if(data.subAdminRoles && typeof data.subAdminRoles === "object"){
        subAdminRoles = data.subAdminRoles;
        localStorage.setItem("cardCollectorSubAdmins", JSON.stringify(subAdminRoles));
        if(typeof updateAccountUI === "function") updateAccountUI();
        if(typeof refreshAdminPlayerData === "function") refreshAdminPlayerData();
      }
    } else if(data.type === "subadmin_action_relay"){
      if(typeof isMasterAdmin === "function" && isMasterAdmin()){
        handleSubAdminActionRelay(null, data);
      }
    } else if(data.type === "admin_dispatch"){
      if(currentUser && data.target && data.target.toLowerCase() === currentUser.toLowerCase()){
        handleIncomingAdminDispatch(data.action);
      }
    } else if(data.type === "studio_card_created"){
      handleIncomingStudioCardCreated(data.card);
    } else if(data.type === "sync_lockdown_mode"){
      handleIncomingLockdownSync(data.isLockdown);
    }
  };
}

// Listen to storage events from other windows
window.addEventListener("storage", (e)=>{
  if(e.key === "cardCollectorAccounts" && e.newValue){
    try {
      accounts = JSON.parse(e.newValue) || {};
      try {
        const freshUnrel = JSON.parse(localStorage.getItem("cardCollectorUnreleasedCards"));
        if(Array.isArray(freshUnrel)) unreleasedCards = freshUnrel;
      } catch(err){}
      
      const userAcc = (typeof getUserAccount === "function") ? getUserAccount(currentUser) : (currentUser ? accounts[currentUser] : null);
      if(userAcc){
        if(Array.isArray(userAcc.owned)){
          owned = userAcc.owned.map(x => parseInt(x, 10)).filter(n => !isNaN(n));
        }
        if(Number.isFinite(userAcc.coins)){
          coins = userAcc.coins;
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

// Sub-Admin action relay handler executed on Master Cam
function handleSubAdminActionRelay(conn, data){
  if(!data || !data.from || !data.target || !data.action) return;
  const fromUser = data.from.trim();
  const targetUser = data.target.trim();
  const action = data.action;

  // Verify sender has active subadmin permissions
  const role = (typeof getSubAdminRole === "function") ? getSubAdminRole(fromUser) : (subAdminRoles ? subAdminRoles[fromUser] : null);
  if(!role || !role.active){
    console.warn("[Presence] Unauthorized subadmin action from:", fromUser);
    return;
  }

  try {
    const fresh = JSON.parse(localStorage.getItem("cardCollectorAccounts"));
    if(fresh && typeof fresh === "object") accounts = fresh;
  } catch(e){}

  if(!accounts[targetUser]){
    accounts[targetUser] = { password: "", owned: [0], coins: 100, hasPlayed: true, lastActive: Date.now() };
  }

  if(action.type === "gift_coins"){
    const amt = parseInt(action.amount, 10);
    if(isNaN(amt) || amt <= 0) return;

    const today = new Date().toDateString();
    if(role.lastGiftDate !== today){
      role.lastGiftDate = today;
      role.giftedToday = 0;
    }
    if((role.giftedToday + amt) > role.dailyCap){
      return;
    }

    role.giftedToday += amt;
    localStorage.setItem("cardCollectorSubAdmins", JSON.stringify(subAdminRoles));

    accounts[targetUser].coins = (accounts[targetUser].coins || 0) + amt;
    localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));

    broadcastAdminActionToTarget(targetUser, action);

    if(typeof broadcastToAllPresencePeers === "function"){
      broadcastToAllPresencePeers({
        type: "sync_sub_admins",
        subAdminRoles: subAdminRoles
      });
    }

    showLiveToast(`🛡️ Sub-Admin <b>${fromUser}</b> gifted <b>+${amt.toLocaleString()} Coins</b> to <b>${targetUser}</b>!`, true);
    if(typeof refreshAdminPlayerData === "function") refreshAdminPlayerData();
  } else if(action.type === "gift_card"){
    const cIdx = parseInt(action.cardIndex, 10);
    if(isNaN(cIdx) || !role.canGiftSkins) return;

    const isAllowed = !role.allowedSkinIds || role.allowedSkinIds.length === 0 || role.allowedSkinIds.some(id => parseInt(id, 10) === cIdx);
    if(!isAllowed) return;

    if(!Array.isArray(accounts[targetUser].owned)) accounts[targetUser].owned = [];
    if(!accounts[targetUser].owned.includes(cIdx)){
      accounts[targetUser].owned.push(cIdx);
      localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    }

    broadcastAdminActionToTarget(targetUser, action);
    const cardName = action.card ? action.card.name : (cards[cIdx] ? cards[cIdx].name : `Card #${cIdx}`);
    showLiveToast(`🛡️ Sub-Admin <b>${fromUser}</b> gifted skin <b>${cardName}</b> to <b>${targetUser}</b>!`, true);
    if(typeof refreshAdminPlayerData === "function") refreshAdminPlayerData();
  }
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

  // 2. If sender is Sub-Admin and not Master, forward relay to Master Cam
  if((typeof isSubAdmin === "function" && isSubAdmin()) && !(typeof isMasterAdmin === "function" && isMasterAdmin())){
    const activeCamConn = (presenceConnToCam && presenceConnToCam.open) ? presenceConnToCam : (typeof window !== "undefined" && window.presenceConnToCam && window.presenceConnToCam.open ? window.presenceConnToCam : null);
    if(activeCamConn){
      try {
        activeCamConn.send({
          type: "subadmin_action_relay",
          from: currentUser,
          target: targetUser,
          action: actionData
        });
      } catch(e){}
    }
    if(presenceBroadcast){
      try {
        presenceBroadcast.postMessage({
          type: "subadmin_action_relay",
          from: currentUser,
          target: targetUser,
          action: actionData
        });
      } catch(e){}
    }
  }

  // 3. PeerJS remote connection (used by Master Cam to dispatch to active connections)
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
    if(actionData.subAdminRoles && typeof actionData.subAdminRoles === "object"){
      subAdminRoles = actionData.subAdminRoles;
      try { localStorage.setItem("cardCollectorSubAdmins", JSON.stringify(subAdminRoles)); } catch(e){}
      if(typeof updateAccountUI === "function") updateAccountUI();
      if(typeof refreshAdminPlayerData === "function") refreshAdminPlayerData();
    }
    if(changed){
      save();
      render();
    }
    return;
  }
  if(actionData.type === "update_subadmin_role"){
    if(actionData.allRoles && typeof actionData.allRoles === "object"){
      subAdminRoles = actionData.allRoles;
    }
    if(currentUser && actionData.role){
      subAdminRoles[currentUser] = actionData.role;
    }
    try { localStorage.setItem("cardCollectorSubAdmins", JSON.stringify(subAdminRoles)); } catch(e){}
    if(typeof updateAccountUI === "function") updateAccountUI();
    if(typeof refreshAdminPlayerData === "function") refreshAdminPlayerData();
    showLiveToast(`🛡️ You have been appointed as a <b>Sub-Admin</b> by Master Cam!`, true);
    return;
  } else if(actionData.type === "revoke_subadmin_role"){
    if(actionData.allRoles && typeof actionData.allRoles === "object"){
      subAdminRoles = actionData.allRoles;
    } else if(currentUser){
      delete subAdminRoles[currentUser];
    }
    try { localStorage.setItem("cardCollectorSubAdmins", JSON.stringify(subAdminRoles)); } catch(e){}
    if(typeof updateAccountUI === "function") updateAccountUI();
    if(typeof refreshAdminPlayerData === "function") refreshAdminPlayerData();
    showLiveToast(`Admin privileges revoked by Master Cam.`, false);
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
      const userAcc = (typeof getUserAccount === "function") ? getUserAccount(currentUser) : (currentUser ? accounts[currentUser] : null);
      if(userAcc){
        if(!userAcc.owned) userAcc.owned = [];
        if(!userAcc.owned.some(x => parseInt(x, 10) === resolvedIndex)){
          userAcc.owned.push(resolvedIndex);
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
    const userAcc = (typeof getUserAccount === "function") ? getUserAccount(currentUser) : (currentUser ? accounts[currentUser] : null);
    if(userAcc) userAcc.owned = owned;
    save();
    render();
    showLiveToast(`Card recalled by Master Admin.`, false);
  } else if(actionData.type === "unlock_all"){
    owned = cards.map((_, i) => i);
    const userAcc = (typeof getUserAccount === "function") ? getUserAccount(currentUser) : (currentUser ? accounts[currentUser] : null);
    if(userAcc) userAcc.owned = owned;
    save();
    render();
    showLiveToast(`🎉 Master Admin Cam unlocked all cards in the game for you!`, true);
  } else if(actionData.type === "wipe_cards"){
    owned = [];
    const userAcc = (typeof getUserAccount === "function") ? getUserAccount(currentUser) : (currentUser ? accounts[currentUser] : null);
    if(userAcc) userAcc.owned = [];
    save();
    render();
    showLiveToast(`Card collection cleared by Master Admin.`, false);
  } else if(actionData.type === "gift_vault_card"){
    const vCard = actionData.card;
    if(vCard){
      if(typeof unreleasedCards !== "undefined" && Array.isArray(unreleasedCards)){
        const existingIdx = unreleasedCards.findIndex(c => {
          if(!c) return false;
          return (vCard.id && c.id && c.id === vCard.id) ||
                 (vCard.name && c.name && c.name.toLowerCase() === vCard.name.toLowerCase());
        });
        if(existingIdx === -1){
          unreleasedCards.push(vCard);
        } else {
          unreleasedCards[existingIdx] = vCard;
        }
        try { localStorage.setItem("cardCollectorUnreleasedCards", JSON.stringify(unreleasedCards)); } catch(e){}
      }
      const userAcc = (typeof getUserAccount === "function") ? getUserAccount(currentUser) : (currentUser ? accounts[currentUser] : null);
      if(userAcc){
        if(!userAcc.unreleasedOwned) userAcc.unreleasedOwned = [];
        if(vCard.id && !userAcc.unreleasedOwned.includes(vCard.id)) userAcc.unreleasedOwned.push(vCard.id);
        if(vCard.name && !userAcc.unreleasedOwned.includes(vCard.name)) userAcc.unreleasedOwned.push(vCard.name);
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
  const existingIdx = cards.findIndex(c => (c.id && card.id && c.id === card.id) || c.name.toLowerCase() === card.name.toLowerCase());
  if(existingIdx >= 0){
    cards[existingIdx] = Object.assign({}, cards[existingIdx], card);
  } else {
    cards.push(card);
  }
  if(typeof saveCustomCardsToStorage === "function") saveCustomCardsToStorage();
  if(typeof initCardSelect === "function") initCardSelect();
  if(typeof render === "function") render();
  showLiveToast(`🎨 New Card Studio card published: <b>${card.name}</b> (${card.rarity}) is now visible in the Cards Section and booster packs!`, true);
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
  if(window.allConnectedPresenceConns && window.allConnectedPresenceConns.size){
    window.allConnectedPresenceConns.forEach(conn => {
      try {
        if(conn && conn.open){
          conn.send({
            type: "studio_card_created",
            card
          });
        }
      } catch(e){}
    });
  }
  const isCam = (typeof isMasterAdmin === "function") && isMasterAdmin();
  if(!isCam){
    const camConn = (presenceConnToCam && presenceConnToCam.open) ? presenceConnToCam : (window.presenceConnToCam && window.presenceConnToCam.open ? window.presenceConnToCam : null);
    if(camConn){
      try {
        camConn.send({
          type: "studio_card_created",
          card
        });
      } catch(e){}
    }
  }
}


// Hook called whenever account logs in or switches
window.onUserAccountSwitched = function(username){
  if(!username) return;
  const isCam = (typeof isMasterAdmin === "function") && isMasterAdmin();

  if(isCam){
    if(!presencePeer || presencePeer.destroyed || presencePeer.id !== CAM_PRESENCE_PEER_ID){
      if(presencePeer && !presencePeer.destroyed){
        try { presencePeer.destroy(); } catch(e){}
        presencePeer = null;
      }
      setupCamHostPresence();
    }
  } else {
    if(presencePeer && presencePeer.id === CAM_PRESENCE_PEER_ID){
      try { presencePeer.destroy(); } catch(e){}
      presencePeer = null;
    }
    setupClientPresence();
    setTimeout(() => {
      announcePresenceToCam(false);
    }, 400);
  }

  // Also broadcast on BroadcastChannel
  if(presenceBroadcast && username.toLowerCase() !== ADMIN_USERNAME.toLowerCase()){
    try {
      presenceBroadcast.postMessage({
        type: "presence_heartbeat",
        user: username,
        owned: owned,
        coins: coins
      });
    } catch(e){}
  }
};

function broadcastLockdownMode(isLockdown){
  const payload = {
    type: "sync_lockdown_mode",
    isLockdown: !!isLockdown
  };
  if(presenceBroadcast){
    try { presenceBroadcast.postMessage(payload); } catch(e){}
  }
  if(window.activePresencePeers && typeof window.activePresencePeers === "object"){
    Object.keys(window.activePresencePeers).forEach(peerUser => {
      try {
        window.activePresencePeers[peerUser].send(payload);
      } catch(e){}
    });
  }
  if(window.allConnectedPresenceConns && window.allConnectedPresenceConns.size){
    window.allConnectedPresenceConns.forEach(conn => {
      try {
        if(conn && conn.open) conn.send(payload);
      } catch(e){}
    });
  }
}
if(typeof window !== "undefined") window.broadcastLockdownMode = broadcastLockdownMode;

function handleIncomingLockdownSync(isLockdown){
  isLockdownMode = !!isLockdown;
  localStorage.setItem("cardCollectorLockdown", isLockdownMode.toString());
  if(typeof window !== "undefined") window.isLockdownMode = isLockdownMode;
  if(typeof updatePackPriceLabels === "function") updatePackPriceLabels();
  
  const lockBanner = document.getElementById("lockdownBanner");
  if(lockBanner) lockBanner.style.display = isLockdownMode ? "block" : "none";

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

  if(isLockdownMode && (typeof isMasterAdmin === "function" && !isMasterAdmin())){
    const battleModal = document.getElementById("battleModal");
    if(battleModal && battleModal.classList.contains("show")){
      battleModal.classList.remove("show");
      alert("🚨 The server has entered Lockdown Mode! Arena battles have been suspended by administration.");
    }
  }

  showLiveToast(isLockdownMode 
    ? "🚨 SERVER LOCKDOWN ACTIVATED: Matches and Booster Packs are now blocked." 
    : "✅ Server lockdown lifted! Normal operations restored.", 
    true
  );
}
if(typeof window !== "undefined") window.handleIncomingLockdownSync = handleIncomingLockdownSync;
