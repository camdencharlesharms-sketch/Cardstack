/* Arena & Combat Engine (AI + Multiplayer P2P) */
let selectedChampionIndex = null;
let battlePlayerCard = null;
let battleOppCard = null;
let battlePlayerHp = 100;
let battleOppHp = 100;
let isPlayerTurn = true;
let isMultiplayerMode = false;
let peer = null;
let p2pConnection = null;
let myRoomCode = "";
let localArenaChannel = null;
let isLocalChannelMode = false;

// STUN configuration for reliable cross-network WebRTC traversal
const PEER_CONFIG = {
  debug: 1,
  config: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" }
    ]
  }
};

try {
  if(typeof BroadcastChannel !== "undefined"){
    localArenaChannel = new BroadcastChannel("cardstack_arena_local_bridge");
  }
} catch(e){}

function checkIsMasterAdmin(){
  return (typeof isMasterAdmin === "function") && isMasterAdmin();
}

function getSelectedChampionCard(){
  if(typeof selectedChampionIndex === "string" && selectedChampionIndex.startsWith("vault_")){
    const vId = selectedChampionIndex.replace("vault_", "");
    const found = (typeof findVaultCardByIdOrName === "function")
      ? findVaultCardByIdOrName(vId)
      : (Array.isArray(unreleasedCards) ? unreleasedCards.find(uc => (uc.id || uc.name) === vId) : null);
    if(found) return found;
  }
  if(selectedChampionIndex !== null && cards[selectedChampionIndex]){
    return cards[selectedChampionIndex];
  }
  if(Array.isArray(owned) && owned.length > 0 && cards[owned[0]]){
    return cards[owned[0]];
  }
  return cards[0];
}
window.getSelectedChampionCard = getSelectedChampionCard;

function renderArenaCardPicker(){
  const carousel = document.getElementById("arenaCardDeckCarousel");
  if(!carousel) return;
  carousel.innerHTML = "";

  const isCam = checkIsMasterAdmin();
  let availableCards = [];

  if(Array.isArray(owned)){
    owned.forEach(idx => {
      const numIdx = parseInt(idx, 10);
      if(!isNaN(numIdx) && cards[numIdx]){
        if(!availableCards.some(ac => ac.card === cards[numIdx])){
          availableCards.push({ card: cards[numIdx], index: numIdx, isVault: false });
        }
      }
    });
  }

  // Allow Master Cam and players who were gifted exclusive vault cards to wield them in battle
  const userAcc = (typeof getUserAccount === "function") ? getUserAccount(currentUser) : (currentUser ? accounts[currentUser] : null);
  const curUserVaultOwned = (userAcc && Array.isArray(userAcc.unreleasedOwned))
    ? userAcc.unreleasedOwned
    : (isCam && accounts["Cam"] && Array.isArray(accounts["Cam"].unreleasedOwned) ? accounts["Cam"].unreleasedOwned : []);

  if(Array.isArray(curUserVaultOwned) && Array.isArray(unreleasedCards)){
    curUserVaultOwned.forEach(id => {
      const vCard = (typeof findVaultCardByIdOrName === "function")
        ? findVaultCardByIdOrName(id)
        : unreleasedCards.find(uc => (uc.id && uc.id === id) || (uc.name && uc.name === id) || (uc.id || uc.name) === id);
      if(vCard && !availableCards.some(ac => ac.card === vCard)){
        availableCards.push({ card: vCard, index: "vault_" + (vCard.id || vCard.name), isVault: true });
      }
    });
  }

  // Starter champion fallback so EVERY new player / guest can battle immediately!
  if(availableCards.length === 0){
    const starterCard = cards.find(c => !c.isUnreleased) || cards[0];
    const starterIdx = (starterCard && cards.indexOf(starterCard) >= 0) ? cards.indexOf(starterCard) : 0;
    if(starterCard){
      availableCards.push({ card: starterCard, index: starterIdx, isVault: false, isStarter: true });
    }
  }

  if(availableCards.length === 0) return;

  if(selectedChampionIndex === null || !availableCards.some(ac => ac.index === selectedChampionIndex)){
    selectedChampionIndex = availableCards[0].index;
  }

  availableCards.forEach(item => {
    const c = item.card;
    const isSelected = item.index === selectedChampionIndex;
    const cardItem = document.createElement("div");
    cardItem.className = `arena-pick-item ${isSelected ? 'selected' : ''}`;
    
    const cardAttacks = (Array.isArray(c.attacks) && c.attacks.length > 0)
      ? c.attacks
      : [{ name: "Quick Strike", dmg: 18 }, { name: "Power Burst", dmg: 30 }];

    const atkList = cardAttacks.map(a => `<div style="display:flex;justify-content:space-between;font-size:9.5px;color:#cbd5e1"><span>⚔️ ${a.name}</span><b style="color:#fbbf24">${a.dmg}</b></div>`).join("");

    const vaultBadge = item.isVault ? '<span style="color:#f43f5e;font-size:8px;font-weight:900;background:rgba(244,63,94,0.15);padding:1px 4px;border-radius:3px">VAULT</span>' : (item.isStarter ? '<span style="color:#38bdf8;font-size:8px;font-weight:900;background:rgba(56,189,248,0.15);padding:1px 4px;border-radius:3px">STARTER</span>' : '');

    cardItem.innerHTML = `
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:9px;font-weight:900;text-transform:uppercase">
          <span style="color:#38bdf8">${c.rarity || 'Common'} ${vaultBadge}</span>
          <span style="color:#fca5a5">${typeof formatHp === "function" ? formatHp(c.hp) : (c.hp || 80) + " HP"}</span>
        </div>
        <img src="${c.image || ''}" style="width:100%;height:80px;object-fit:cover;border-radius:8px;margin:6px 0;border:1px solid rgba(255,255,255,0.1)">
        <b style="font-size:13px;display:block;text-align:center">${c.name}</b>
      </div>
      <div style="background:rgba(0,0,0,0.4);padding:6px;border-radius:6px">
        ${atkList}
      </div>
    `;

    cardItem.onclick = ()=>{
      selectedChampionIndex = item.index;
      renderArenaCardPicker();
    };

    carousel.appendChild(cardItem);
  });

  const selectedItem = availableCards.find(ac => ac.index === selectedChampionIndex) || availableCards[0];
  const activeCard = selectedItem.card;
  battlePlayerCard = activeCard;
  const badgeEl = document.getElementById("selectedChampionBadge");
  if(badgeEl){
    badgeEl.textContent = `Selected: ${activeCard.name} (${typeof formatHp === "function" ? formatHp(activeCard.hp) : (activeCard.hp || 80) + " HP"})${selectedItem.isVault ? ' [Vault Card]' : (selectedItem.isStarter ? ' [Starter]' : '')}`;
  }
}

document.getElementById("arenaBtn").onclick = ()=>{
  if(isLockdownMode && (typeof isMasterAdmin === "function" && !isMasterAdmin())){
    alert("🚨 SERVER LOCKDOWN IN EFFECT!\n\nAll battle matches and arena entries are currently locked down by administration.");
    return;
  }
  if(isMaintenanceMode && (typeof hasAdminAccess === "function" && !hasAdminAccess())){
    alert("The battle arena is offline for maintenance.");
    return;
  }
  renderArenaCardPicker();
  resetArenaViews();
  const battleModal = document.getElementById("battleModal");
  if(battleModal) battleModal.classList.add("show");
};

function resetArenaViews(){
  const hub = document.getElementById("arenaHubArea");
  const hostWait = document.getElementById("arenaHostWaitArea");
  const joinArea = document.getElementById("arenaJoinArea");
  const battleField = document.getElementById("battleFieldArea");
  const victoryBanner = document.getElementById("victoryBanner");

  if(hub) hub.style.display = "flex";
  if(hostWait) hostWait.style.display = "none";
  if(joinArea) joinArea.style.display = "none";
  if(battleField) battleField.style.display = "none";
  if(victoryBanner) victoryBanner.classList.remove("show", "outcome-win", "outcome-lose");

  const joinBtn = document.getElementById("confirmJoinCodeBtn");
  if(joinBtn){
    joinBtn.textContent = "Connect & Fight";
    joinBtn.disabled = false;
  }
}

document.getElementById("closeBattleBtn").onclick = ()=>{
  cleanupPeer();
  const battleModal = document.getElementById("battleModal");
  if(battleModal) battleModal.classList.remove("show");
};

document.getElementById("forfeitBattleBtn").onclick = ()=>{
  if(isMultiplayerMode){
    if(p2pConnection && p2pConnection.open){
      try { p2pConnection.send({ type: "forfeit" }); } catch(e){}
    } else if(isLocalChannelMode && localArenaChannel){
      try { localArenaChannel.postMessage({ type: "forfeit", room: myRoomCode }); } catch(e){}
    }
  }
  cleanupPeer();
  const battleModal = document.getElementById("battleModal");
  if(battleModal) battleModal.classList.remove("show");
  resetArenaViews();
};

function cleanupPeer(){
  isMultiplayerMode = false;
  isLocalChannelMode = false;
  if(p2pConnection){
    try { p2pConnection.close(); } catch(e){}
  }
  if(peer){
    try { peer.destroy(); } catch(e){}
  }
  peer = null;
  p2pConnection = null;
}

function startSoloBattle(){
  if(isLockdownMode && (typeof isMasterAdmin === "function" && !isMasterAdmin())){
    alert("🚨 SERVER LOCKDOWN IN EFFECT!\n\nMatches cannot be started during server lockdown.");
    return;
  }
  cleanupPeer();
  battlePlayerCard = getSelectedChampionCard();
  isMultiplayerMode = false;

  const publicCards = cards.filter(c => !c.isUnreleased);
  const aiPool = publicCards.length > 0 ? publicCards : cards;

  // Guarantee facing a NEW, different opponent
  let eligiblePool = aiPool;
  if(battleOppCard && aiPool.length > 1){
    eligiblePool = aiPool.filter(c => {
      const isSameCard = (c === battleOppCard);
      const isSameName = (c.name && battleOppCard.name && c.name.toLowerCase() === battleOppCard.name.toLowerCase());
      const isSameId = (c.id && battleOppCard.id && c.id === battleOppCard.id);
      return !isSameCard && !isSameName && !isSameId;
    });
    if(eligiblePool.length === 0) eligiblePool = aiPool;
  }

  const aiIdx = Math.floor(Math.random() * eligiblePool.length);
  battleOppCard = eligiblePool[aiIdx];

  setupCombatInterface("YOUR CHAMPION", "AI COMBATANT", true);
  appendBattleLog(`<div style="color:#38bdf8">⚔️ Combat started! Your <b>${battlePlayerCard.name}</b> vs AI's <b>${battleOppCard.name}</b>.</div>`);
}
window.startSoloBattle = startSoloBattle;

// 1. Start AI Match
document.getElementById("startAiMatchBtn").onclick = startSoloBattle;

// 2. Host Multiplayer Match (Generates a 6-digit code)
document.getElementById("hostMatchBtn").onclick = ()=>{
  if(isLockdownMode && (typeof isMasterAdmin === "function" && !isMasterAdmin())){
    alert("🚨 SERVER LOCKDOWN IN EFFECT!\n\nHosting online matches is currently prohibited during server lockdown.");
    return;
  }
  battlePlayerCard = getSelectedChampionCard();
  isMultiplayerMode = true;
  isLocalChannelMode = false;

  myRoomCode = Math.floor(100000 + Math.random() * 900000).toString();
  document.getElementById("roomCodeDisplay").textContent = myRoomCode;

  document.getElementById("arenaHubArea").style.display = "none";
  document.getElementById("arenaHostWaitArea").style.display = "flex";

  cleanupPeer();
  isMultiplayerMode = true;

  // Listen on local BroadcastChannel for instant same-browser multi-tab connection
  if(localArenaChannel){
    localArenaChannel.onmessage = (e)=>{
      const data = e.data;
      if(!data) return;
      if(data.type === "local_join" && data.room === myRoomCode && isMultiplayerMode && !p2pConnection){
        isLocalChannelMode = true;
        battleOppCard = data.card || cards[0];
        const challengerName = data.user || "Challenger";

        localArenaChannel.postMessage({
          type: "local_init_reply",
          room: myRoomCode,
          card: battlePlayerCard,
          user: currentUser || "Host",
          customCards: (typeof getCustomCardsFromStorage === "function") ? getCustomCardsFromStorage() : []
        });

        setupCombatInterface("YOU (HOST)", challengerName.toUpperCase(), true);
        appendBattleLog(`<div style="color:#4ade80">⚔️ Connected locally to: <b>${challengerName}</b>!</div>`);
      } else if(isLocalChannelMode && data.room === myRoomCode){
        handleIncomingBattleData(data, true);
      }
    };
  }

  // Cross-device PeerJS WebRTC
  if(typeof Peer === "undefined"){
    console.warn("PeerJS library unavailable, relying on local channel");
    return;
  }

  try {
    peer = new Peer("aetheria-" + myRoomCode, PEER_CONFIG);

    peer.on("open", ()=>{
      console.log("Host ready on code:", myRoomCode);
    });

    peer.on("connection", (conn)=>{
      p2pConnection = conn;
      setupP2PListeners(true);
    });

    peer.on("error", (err)=>{
      console.warn("Host peer notice:", err.type);
    });
  } catch(e){
    console.error("Peer init failed:", e);
  }
};

document.getElementById("cancelHostBtn").onclick = ()=>{
  cleanupPeer();
  resetArenaViews();
};

// 3. Join Match with Code
document.getElementById("showJoinMatchBtn").onclick = ()=>{
  battlePlayerCard = getSelectedChampionCard();
  isMultiplayerMode = true;

  document.getElementById("arenaHubArea").style.display = "none";
  document.getElementById("arenaJoinArea").style.display = "flex";
  const input = document.getElementById("joinCodeInput");
  if(input){
    input.value = "";
    input.focus();
  }
};

document.getElementById("cancelJoinBtn").onclick = resetArenaViews;

document.getElementById("confirmJoinCodeBtn").onclick = ()=>{
  if(isLockdownMode && (typeof isMasterAdmin === "function" && !isMasterAdmin())){
    alert("🚨 SERVER LOCKDOWN IN EFFECT!\n\nJoining online matches is currently prohibited during server lockdown.");
    return;
  }
  const rawCode = document.getElementById("joinCodeInput").value.trim();
  const code = rawCode.replace(/\s+/g, "");
  if(code.length !== 6 || isNaN(code)){
    alert("Please enter a valid 6-digit battle code.");
    return;
  }

  battlePlayerCard = getSelectedChampionCard();
  isMultiplayerMode = true;
  myRoomCode = code;

  const joinBtn = document.getElementById("confirmJoinCodeBtn");
  joinBtn.textContent = "Connecting...";
  joinBtn.disabled = true;

  cleanupPeer();
  isMultiplayerMode = true;

  let hasConnected = false;

  // Try local BroadcastChannel first for instant multi-tab testing
  if(localArenaChannel){
    localArenaChannel.onmessage = (e)=>{
      const data = e.data;
      if(!data) return;
      if(data.type === "local_init_reply" && data.room === code && !hasConnected){
        hasConnected = true;
        isLocalChannelMode = true;
        clearTimeout(joinTimeout);
        joinBtn.textContent = "Connect & Fight";
        joinBtn.disabled = false;

        battleOppCard = data.card || cards[0];
        const hostName = data.user || "Host";
        setupCombatInterface("YOU (CHALLENGER)", hostName.toUpperCase(), false);
        appendBattleLog(`<div style="color:#4ade80">⚔️ Connected locally to Host: <b>${hostName}</b>! Host attacks first.</div>`);
      } else if(isLocalChannelMode && data.room === code){
        handleIncomingBattleData(data, false);
      }
    };

    localArenaChannel.postMessage({
      type: "local_join",
      room: code,
      card: battlePlayerCard,
      user: currentUser || "Challenger",
      customCards: (typeof getCustomCardsFromStorage === "function") ? getCustomCardsFromStorage() : []
    });
  }

  // Cross-device PeerJS WebRTC with timeout
  const joinTimeout = setTimeout(()=>{
    if(!hasConnected){
      joinBtn.textContent = "Connect & Fight";
      joinBtn.disabled = false;
      alert(`Could not connect to room ${code}. Make sure the host has opened the lobby with this 6-digit code!`);
      cleanupPeer();
      resetArenaViews();
    }
  }, 12000);

  if(typeof Peer === "undefined"){
    return;
  }

  try {
    peer = new Peer(PEER_CONFIG);

    peer.on("open", ()=>{
      p2pConnection = peer.connect("aetheria-" + code, { reliable: true });

      const onConnectReady = ()=>{
        if(hasConnected) return;
        hasConnected = true;
        clearTimeout(joinTimeout);
        joinBtn.textContent = "Connect & Fight";
        joinBtn.disabled = false;

        setupP2PListeners(false);
        p2pConnection.send({
          type: "init",
          card: battlePlayerCard,
          user: currentUser || "Challenger",
          customCards: (typeof getCustomCardsFromStorage === "function") ? getCustomCardsFromStorage() : []
        });
      };

      if(p2pConnection.open){
        onConnectReady();
      } else {
        p2pConnection.on("open", onConnectReady);
      }

      p2pConnection.on("error", (err)=>{
        if(!hasConnected){
          clearTimeout(joinTimeout);
          joinBtn.textContent = "Connect & Fight";
          joinBtn.disabled = false;
          alert("Connection error: " + (err.message || err.type || "Check arena code"));
          cleanupPeer();
          resetArenaViews();
        }
      });
    });

    peer.on("error", (err)=>{
      if(!hasConnected){
        clearTimeout(joinTimeout);
        joinBtn.textContent = "Connect & Fight";
        joinBtn.disabled = false;
        alert("Unable to reach room code. Make sure the host is currently in the lobby.");
        cleanupPeer();
        resetArenaViews();
      }
    });
  } catch(e){
    console.error("Peer connect error:", e);
  }
};

function handleIncomingBattleData(data, isHost){
  if(data.type === "init"){
    battleOppCard = data.card || cards[0];
    const challengerName = data.user || "Challenger";

    if(challengerName && challengerName !== "Challenger" && challengerName !== "Host"){
      const acc = (typeof getUserAccount === "function") ? getUserAccount(challengerName) : accounts[challengerName];
      if(!acc){
        accounts[challengerName] = { password: "", owned: [0], coins: 100, hasPlayed: true, lastActive: Date.now() };
      } else {
        acc.hasPlayed = true;
        acc.lastActive = Date.now();
      }
      localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    }

    if(Array.isArray(data.customCards) && data.customCards.length > 0){
      syncIncomingCustomCards(data.customCards);
    }

    if(isHost){
      if(p2pConnection && p2pConnection.open){
        p2pConnection.send({
          type: "init_reply",
          card: battlePlayerCard,
          user: currentUser || "Host",
          customCards: (typeof getCustomCardsFromStorage === "function") ? getCustomCardsFromStorage() : []
        });
      }
      setupCombatInterface("YOU (HOST)", challengerName.toUpperCase(), true);
      appendBattleLog(`<div style="color:#4ade80">⚔️ Connected! Fighting rival player: <b>${challengerName}</b>.</div>`);
    }
  } else if(data.type === "init_reply"){
    battleOppCard = data.card || cards[0];
    const hostName = data.user || "Host";

    if(Array.isArray(data.customCards) && data.customCards.length > 0){
      syncIncomingCustomCards(data.customCards);
    }

    if(hostName && hostName !== "Challenger" && hostName !== "Host"){
      const acc = (typeof getUserAccount === "function") ? getUserAccount(hostName) : accounts[hostName];
      if(!acc){
        accounts[hostName] = { password: "", owned: [0], coins: 100, hasPlayed: true, lastActive: Date.now() };
      } else {
        acc.hasPlayed = true;
        acc.lastActive = Date.now();
      }
      localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
    }

    setupCombatInterface("YOU (CHALLENGER)", hostName.toUpperCase(), false);
    appendBattleLog(`<div style="color:#4ade80">⚔️ Connected to Host! <b>${hostName}</b> strikes first.</div>`);
  } else if(data.type === "attack"){
    const isAtkInf = (typeof isInfiniteValue === "function" && isInfiniteValue(data.dmg)) || data.dmg === "Infinity";
    const attackName = data.attackName || "Strike";

    triggerBattleAnimation("ai", "player");

    if(isAtkInf){
      battlePlayerHp = 0;
      updateBattleHpBars();
      appendBattleLog(`💥 <b>${battleOppCard.name}</b> hit you with <span style="color:#fca5a5">${attackName}</span> dealing <b style="color:#ef4444">⚡ ∞ INFINITE DAMAGE (INSTANT KO)!</b>`);
      appendBattleLog(`💀 <b style="color:#ef4444">DEFEAT!</b> Your champion was knocked out!`);
      triggerDefeat();
      return;
    }

    if(typeof isInfiniteValue === "function" && isInfiniteValue(battlePlayerHp)){
      updateBattleHpBars();
      appendBattleLog(`🛡️ <b>${battleOppCard.name}</b> attacked with <span style="color:#fca5a5">${attackName}</span>, but your champion has <b style="color:#38bdf8">∞ INFINITE HP</b> and took 0 damage!`);
      isPlayerTurn = true;
      setAttacksDisabled(false);
      document.getElementById("turnInstructionText").textContent = "Your turn! Choose an attack:";
      appendBattleLog(`<span style="color:#38bdf8">It's your turn to strike!</span>`);
      return;
    }

    const dmg = Number(data.dmg) || 15;
    battlePlayerHp = Math.max(0, battlePlayerHp - dmg);
    updateBattleHpBars();
    appendBattleLog(`⚔️ <b>${battleOppCard.name}</b> hit you with <span style="color:#fca5a5">${attackName}</span> for <b>${dmg}</b> damage!`);

    if(battlePlayerHp <= 0){
      appendBattleLog(`💀 <b style="color:#ef4444">DEFEAT!</b> Your champion was knocked out!`);
      triggerDefeat();
    } else {
      isPlayerTurn = true;
      setAttacksDisabled(false);
      document.getElementById("turnInstructionText").textContent = "Your turn! Choose an attack:";
      appendBattleLog(`<span style="color:#38bdf8">It's your turn to strike!</span>`);
    }
  } else if(data.type === "rematch_request"){
    appendBattleLog(`<div style="color:#fbbf24">🔄 Opponent requested a rematch! Setting up next battle...</div>`);
    if(isHost){
      if(p2pConnection && p2pConnection.open){
        p2pConnection.send({ type: "rematch_start" });
      } else if(isLocalChannelMode && localArenaChannel){
        localArenaChannel.postMessage({ type: "rematch_start", room: myRoomCode });
      }
      setupCombatInterface("YOU (HOST)", (battleOppCard ? battleOppCard.name.toUpperCase() : "RIVAL"), true);
    } else {
      setupCombatInterface("YOU (CHALLENGER)", (battleOppCard ? battleOppCard.name.toUpperCase() : "HOST"), false);
    }
  } else if(data.type === "rematch_start"){
    setupCombatInterface("YOU (CHALLENGER)", (battleOppCard ? battleOppCard.name.toUpperCase() : "HOST"), false);
    appendBattleLog(`<div style="color:#4ade80">⚔️ Rematch started!</div>`);
  } else if(data.type === "forfeit"){
    triggerVictory();
    appendBattleLog(`🏆 <b style="color:#4ade80">OPPONENT SURRENDERED!</b> You won the arena duel!`);
    setAttacksDisabled(true);
  }
}

function setupP2PListeners(isHost){
  if(!p2pConnection) return;

  p2pConnection.on("data", (data)=>{
    if(data) handleIncomingBattleData(data, isHost);
  });

  p2pConnection.on("close", ()=>{
    appendBattleLog(`<div style="color:#ef4444">⚠️ Rival player disconnected from the arena.</div>`);
    if(isMultiplayerMode && battleOppHp > 0 && battlePlayerHp > 0){
      triggerVictory();
    }
  });

  p2pConnection.on("error", (err)=>{
    console.warn("P2P connection error:", err);
  });
}

function setupCombatInterface(playerTitle, oppTitle, playerStartsFirst){
  if(!battlePlayerCard) battlePlayerCard = cards[0];
  if(!battleOppCard) battleOppCard = cards[1] || cards[0];

  battlePlayerHp = (typeof isInfiniteValue === "function" && isInfiniteValue(battlePlayerCard.hp)) ? Infinity : (battlePlayerCard.hp || 85);
  battleOppHp = (typeof isInfiniteValue === "function" && isInfiniteValue(battleOppCard.hp)) ? Infinity : (battleOppCard.hp || 85);
  isPlayerTurn = playerStartsFirst;

  const victoryBanner = document.getElementById("victoryBanner");
  if(victoryBanner) victoryBanner.classList.remove("show", "outcome-win", "outcome-lose");

  const pCard = document.getElementById("playerFighterCard");
  const aCard = document.getElementById("aiFighterCard");
  if(pCard) pCard.classList.remove("lunge-right", "lunge-left", "hit-shake");
  if(aCard) aCard.classList.remove("lunge-right", "lunge-left", "hit-shake");

  document.getElementById("playerLabelTag").textContent = playerTitle;
  document.getElementById("oppLabelTag").textContent = oppTitle;

  document.getElementById("playerBattleImg").src = battlePlayerCard.image || "";
  document.getElementById("playerBattleName").textContent = battlePlayerCard.name || "Champion";

  document.getElementById("aiBattleImg").src = battleOppCard.image || "";
  document.getElementById("aiBattleName").textContent = battleOppCard.name || "Opponent";

  const attacksContainer = document.getElementById("playerAttacksContainer");
  attacksContainer.innerHTML = "";
  const playerAttacks = (Array.isArray(battlePlayerCard.attacks) && battlePlayerCard.attacks.length > 0)
    ? battlePlayerCard.attacks
    : [{ name: "Quick Strike", dmg: 18 }, { name: "Power Burst", dmg: 32 }];

  playerAttacks.forEach((atk) => {
    const btn = document.createElement("button");
    btn.className = "attack-btn";
    const isInf = (typeof isInfiniteValue === "function" && isInfiniteValue(atk.dmg)) || atk.dmg === "Infinity";
    const dmgLabel = isInf ? "∞ INFINITE DMG" : (typeof formatDmg === "function" ? formatDmg(atk.dmg) : `${atk.dmg} DMG`);
    btn.innerHTML = `<span>⚔️ <b>${atk.name}</b></span> <span style="color:${isInf ? "#f43f5e;font-weight:900" : "#fbbf24"}">${dmgLabel}</span>`;
    btn.onclick = () => performPlayerAttack(atk);
    attacksContainer.appendChild(btn);
  });

  updateBattleHpBars();
  document.getElementById("battleLog").innerHTML = "";

  document.getElementById("arenaHubArea").style.display = "none";
  document.getElementById("arenaHostWaitArea").style.display = "none";
  document.getElementById("arenaJoinArea").style.display = "none";
  document.getElementById("battleFieldArea").style.display = "flex";

  setAttacksDisabled(!isPlayerTurn);
  document.getElementById("turnInstructionText").textContent = isPlayerTurn ? "Your turn! Choose an attack:" : "Opponent's turn. Waiting...";
}

function setAttacksDisabled(disabled){
  const btns = document.querySelectorAll(".attack-btn");
  btns.forEach(b => b.disabled = disabled);
}

function updateBattleHpBars(){
  const isPlayerInf = (typeof isInfiniteValue === "function" && (isInfiniteValue(battlePlayerHp) || (battlePlayerCard && isInfiniteValue(battlePlayerCard.hp))));
  const isOppInf = (typeof isInfiniteValue === "function" && (isInfiniteValue(battleOppHp) || (battleOppCard && isInfiniteValue(battleOppCard.hp))));

  const maxPlayerHp = isPlayerInf ? "Infinity" : ((battlePlayerCard && battlePlayerCard.hp) ? battlePlayerCard.hp : 85);
  const maxOppHp = isOppInf ? "Infinity" : ((battleOppCard && battleOppCard.hp) ? battleOppCard.hp : 85);

  const playerPct = isPlayerInf ? (battlePlayerHp > 0 ? 100 : 0) : Math.max(0, (battlePlayerHp / maxPlayerHp) * 100);
  const oppPct = isOppInf ? (battleOppHp > 0 ? 100 : 0) : Math.max(0, (battleOppHp / maxOppHp) * 100);

  document.getElementById("playerHpBar").style.width = playerPct + "%";
  document.getElementById("aiHpBar").style.width = oppPct + "%";

  document.getElementById("playerHpText").textContent = isPlayerInf
    ? (battlePlayerHp > 0 ? "∞ / ∞ HP" : "0 / ∞ HP")
    : `${Math.max(0, battlePlayerHp)} / ${maxPlayerHp} HP`;

  document.getElementById("aiHpText").textContent = isOppInf
    ? (battleOppHp > 0 ? "∞ / ∞ HP" : "0 / ∞ HP")
    : `${Math.max(0, battleOppHp)} / ${maxOppHp} HP`;
}

function appendBattleLog(msg){
  const log = document.getElementById("battleLog");
  if(!log) return;
  const line = document.createElement("div");
  line.innerHTML = msg;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

function triggerBattleAnimation(attacker, defender){
  const atkEl = attacker === "player" ? document.getElementById("playerFighterCard") : document.getElementById("aiFighterCard");
  const defEl = defender === "player" ? document.getElementById("playerFighterCard") : document.getElementById("aiFighterCard");

  if(!atkEl || !defEl) return;

  const lungeClass = attacker === "player" ? "lunge-right" : "lunge-left";

  atkEl.classList.remove("lunge-right", "lunge-left");
  defEl.classList.remove("hit-shake");

  void atkEl.offsetWidth;
  void defEl.offsetWidth;

  atkEl.classList.add(lungeClass);
  setTimeout(()=>{
    defEl.classList.add("hit-shake");
  }, 120);

  setTimeout(()=>{
    atkEl.classList.remove(lungeClass);
    defEl.classList.remove("hit-shake");
  }, 450);
}

function triggerVictory(){
  const baseReward = 25;
  const reward = baseReward * eventCoinMultiplier;
  coins += reward;
  save();
  render();

  const victoryBanner = document.getElementById("victoryBanner");
  if(victoryBanner){
    victoryBanner.classList.remove("outcome-lose");
    victoryBanner.classList.add("show", "outcome-win");
  }

  const titleEl = document.getElementById("battleOutcomeTitle");
  if(titleEl) titleEl.textContent = "🏆 You Win!";

  const labelEl = document.getElementById("victoryCoinsLabel");
  if(labelEl) labelEl.textContent = `+${reward} Coins Added to Your Account! 🪙 ${eventCoinMultiplier > 1 ? `(${eventCoinMultiplier}x Event Bonus!)` : ""}`;

  setAttacksDisabled(true);
  const turnText = document.getElementById("turnInstructionText");
  if(turnText) turnText.textContent = "Match Finished!";

  try {
    if(victoryBanner) victoryBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch(e){}
}

function triggerDefeat(){
  const victoryBanner = document.getElementById("victoryBanner");
  if(victoryBanner){
    victoryBanner.classList.remove("outcome-win");
    victoryBanner.classList.add("show", "outcome-lose");
  }

  const titleEl = document.getElementById("battleOutcomeTitle");
  if(titleEl) titleEl.textContent = "💀 Defeated!";

  const labelEl = document.getElementById("victoryCoinsLabel");
  if(labelEl) labelEl.textContent = "Your champion was knocked out. Better luck next time!";

  setAttacksDisabled(true);
  const turnText = document.getElementById("turnInstructionText");
  if(turnText) turnText.textContent = "Match Finished!";

  try {
    if(victoryBanner) victoryBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch(e){}
}

function performPlayerAttack(attackObj){
  if(!isPlayerTurn || battlePlayerHp <= 0 || battleOppHp <= 0) return;

  triggerBattleAnimation("player", "ai");

  const isAtkInf = (typeof isInfiniteValue === "function" && isInfiniteValue(attackObj.dmg)) || attackObj.dmg === "Infinity";

  if(isAtkInf){
    battleOppHp = 0;
    updateBattleHpBars();
    appendBattleLog(`💥 <b>${battlePlayerCard.name}</b> executed <span style="color:#fca5a5">${attackObj.name}</span> dealing <b style="color:#ef4444">⚡ ∞ INFINITE DAMAGE (INSTANT KO)!</b>`);

    if(isMultiplayerMode){
      if(p2pConnection && p2pConnection.open){
        p2pConnection.send({ type: "attack", attackName: attackObj.name, dmg: "Infinity" });
      } else if(isLocalChannelMode && localArenaChannel){
        localArenaChannel.postMessage({ type: "attack", room: myRoomCode, attackName: attackObj.name, dmg: "Infinity" });
      }
    }

    triggerVictory();
    appendBattleLog(`🏆 <b style="color:#4ade80">YOU WON!</b> Earned <span style="color:#fbbf24">+${25 * eventCoinMultiplier} Coins</span>!`);
    return;
  }

  const isOppHpInf = (typeof isInfiniteValue === "function" && isInfiniteValue(battleOppHp));
  const playerDmg = Math.floor(attackObj.dmg * (0.85 + Math.random() * 0.3));

  if(isOppHpInf){
    appendBattleLog(`🛡️ <b>${battleOppCard.name}</b> has <b style="color:#38bdf8">∞ INFINITE HP</b> and absorbed ${attackObj.name} with 0 damage!`);
  } else {
    battleOppHp = Math.max(0, battleOppHp - playerDmg);
    appendBattleLog(`💥 <b>${battlePlayerCard.name}</b> executed <span style="color:#fca5a5">${attackObj.name}</span> dealing <b>${playerDmg}</b> damage!`);
  }
  updateBattleHpBars();

  if(isMultiplayerMode){
    if(p2pConnection && p2pConnection.open){
      p2pConnection.send({ type: "attack", attackName: attackObj.name, dmg: isOppHpInf ? 0 : playerDmg });
    } else if(isLocalChannelMode && localArenaChannel){
      localArenaChannel.postMessage({ type: "attack", room: myRoomCode, attackName: attackObj.name, dmg: isOppHpInf ? 0 : playerDmg });
    }
  }

  if(battleOppHp <= 0){
    triggerVictory();
    appendBattleLog(`🏆 <b style="color:#4ade80">YOU WON!</b> Earned <span style="color:#fbbf24">+${25 * eventCoinMultiplier} Coins</span>!`);
    return;
  }

  isPlayerTurn = false;
  setAttacksDisabled(true);
  document.getElementById("turnInstructionText").textContent = "Opponent is strategizing...";

  if(!isMultiplayerMode){
    setTimeout(()=>{
      if(battleOppHp <= 0) return;

      const oppAttacks = (Array.isArray(battleOppCard.attacks) && battleOppCard.attacks.length > 0)
        ? battleOppCard.attacks
        : [{ name: "Quick Strike", dmg: 18 }, { name: "Power Burst", dmg: 32 }];

      const aiAttack = oppAttacks[Math.floor(Math.random() * oppAttacks.length)];
      const isAiAtkInf = (typeof isInfiniteValue === "function" && isInfiniteValue(aiAttack.dmg)) || aiAttack.dmg === "Infinity";

      triggerBattleAnimation("ai", "player");

      if(isAiAtkInf){
        battlePlayerHp = 0;
        updateBattleHpBars();
        appendBattleLog(`💥 <b>AI's ${battleOppCard.name}</b> unleashed <span style="color:#fca5a5">${aiAttack.name}</span> dealing <b style="color:#ef4444">⚡ ∞ INFINITE DAMAGE (INSTANT KO)!</b>`);
        appendBattleLog(`💀 <b style="color:#ef4444">DEFEAT!</b> Your champion was knocked out!`);
        triggerDefeat();
        return;
      }

      if(typeof isInfiniteValue === "function" && isInfiniteValue(battlePlayerHp)){
        updateBattleHpBars();
        appendBattleLog(`🛡️ <b>AI's ${battleOppCard.name}</b> used <span style="color:#fca5a5">${aiAttack.name}</span>, but your champion has <b style="color:#38bdf8">∞ INFINITE HP</b> and took 0 damage!`);
        isPlayerTurn = true;
        setAttacksDisabled(false);
        document.getElementById("turnInstructionText").textContent = "Your turn! Choose an attack:";
        appendBattleLog(`<span style="color:#38bdf8">It's your turn to strike!</span>`);
        return;
      }

      const aiDmg = Math.floor(aiAttack.dmg * (0.85 + Math.random() * 0.3));
      battlePlayerHp = Math.max(0, battlePlayerHp - aiDmg);
      updateBattleHpBars();
      appendBattleLog(`🤖 <b>AI's ${battleOppCard.name}</b> used <span style="color:#fca5a5">${aiAttack.name}</span> dealing <b>${aiDmg}</b> damage!`);

      if(battlePlayerHp <= 0){
        appendBattleLog(`💀 <b style="color:#ef4444">DEFEAT!</b> Your champion was knocked out!`);
        triggerDefeat();
        return;
      }

      isPlayerTurn = true;
      setAttacksDisabled(false);
      document.getElementById("turnInstructionText").textContent = "Your turn! Choose an attack:";
      appendBattleLog(`<span style="color:#38bdf8">It's your turn to strike!</span>`);
    }, 1100);
  }
}

// God Mode Admin Attack
document.getElementById("godModeStrikeBtn").onclick = ()=>{
  if(!hasAdminAccess()) return;
  performPlayerAttack({ name: "⚡ OMNIPOTENT GOD STRIKE", dmg: 9999 });
};

function syncIncomingCustomCards(incomingCards){
  if(!Array.isArray(incomingCards) || incomingCards.length === 0) return;
  let addedAny = false;
  incomingCards.forEach(inc => {
    if(!inc || !inc.name || inc.isUnreleased) return;
    if(!cards.some(c => c.name.toLowerCase() === inc.name.toLowerCase())){
      const cleanCard = {
        name: inc.name,
        image: inc.image,
        rarity: inc.rarity,
        desc: inc.desc,
        hp: inc.hp || 100,
        attacks: Array.isArray(inc.attacks) ? inc.attacks : [
          { name: "Strike", dmg: 20 },
          { name: "Burst", dmg: 35 }
        ],
        isUnreleased: false,
        isCustom: true
      };
      cards.push(cleanCard);
      addedAny = true;
    }
  });
  if(addedAny){
    if(typeof saveCustomCardsToStorage === "function") saveCustomCardsToStorage();
    if(typeof render === "function") render();
    if(typeof initCardSelect === "function") initCardSelect();
  }
}

const playAgainBtn = document.getElementById("battlePlayAgainBtn");
if(playAgainBtn){
  playAgainBtn.onclick = ()=>{
    if(isLockdownMode && (typeof isMasterAdmin === "function" && !isMasterAdmin())){
      alert("🚨 SERVER LOCKDOWN IN EFFECT!\n\nNew matches cannot be started during server lockdown.");
      resetArenaViews();
      return;
    }
    const victoryBanner = document.getElementById("victoryBanner");
    if(victoryBanner) victoryBanner.classList.remove("show", "outcome-win", "outcome-lose");

    if(isMultiplayerMode){
      if(p2pConnection && p2pConnection.open){
        p2pConnection.send({ type: "rematch_request" });
        appendBattleLog(`<div style="color:#38bdf8">🔄 Sent rematch request to opponent...</div>`);
        document.getElementById("turnInstructionText").textContent = "Waiting for rival to accept rematch...";
      } else if(isLocalChannelMode && localArenaChannel){
        localArenaChannel.postMessage({ type: "rematch_request", room: myRoomCode });
        appendBattleLog(`<div style="color:#38bdf8">🔄 Sent rematch request to opponent...</div>`);
        document.getElementById("turnInstructionText").textContent = "Waiting for rival to accept rematch...";
      } else {
        cleanupPeer();
        startSoloBattle();
      }
    } else {
      cleanupPeer();
      startSoloBattle();
    }
  };
}

const backToCardsBtn = document.getElementById("battleBackToCardsBtn");
if(backToCardsBtn){
  backToCardsBtn.onclick = ()=>{
    cleanupPeer();
    const victoryBanner = document.getElementById("victoryBanner");
    if(victoryBanner) victoryBanner.classList.remove("show", "outcome-win", "outcome-lose");
    const battleModal = document.getElementById("battleModal");
    if(battleModal) battleModal.classList.remove("show");
    resetArenaViews();
    if(typeof render === "function") render();

    const targetEl = document.getElementById("grid") || document.querySelector(".controls");
    if(targetEl){
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
}
