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

function renderArenaCardPicker(){
  const carousel = document.getElementById("arenaCardDeckCarousel");
  carousel.innerHTML = "";

  if(owned.length === 0) return;
  if(selectedChampionIndex === null || !owned.includes(selectedChampionIndex)){
    selectedChampionIndex = owned[0];
  }

  owned.forEach(idx => {
    const c = cards[idx];
    const isSelected = idx === selectedChampionIndex;
    const cardItem = document.createElement("div");
    cardItem.className = `arena-pick-item ${isSelected ? 'selected' : ''}`;
    
    const atkList = c.attacks.map(a => `<div style="display:flex;justify-content:space-between;font-size:9.5px;color:#cbd5e1"><span>⚔️ ${a.name}</span><b style="color:#fbbf24">${a.dmg}</b></div>`).join("");

    cardItem.innerHTML = `
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:9px;font-weight:900;text-transform:uppercase">
          <span style="color:#38bdf8">${c.rarity}</span>
          <span style="color:#fca5a5">${c.hp || 80} HP</span>
        </div>
        <img src="${c.image}" style="width:100%;height:80px;object-fit:cover;border-radius:8px;margin:6px 0;border:1px solid rgba(255,255,255,0.1)">
        <b style="font-size:13px;display:block;text-align:center">${c.name}</b>
      </div>
      <div style="background:rgba(0,0,0,0.4);padding:6px;border-radius:6px">
        ${atkList}
      </div>
    `;

    cardItem.onclick = ()=>{
      selectedChampionIndex = idx;
      renderArenaCardPicker();
    };

    carousel.appendChild(cardItem);
  });

  const activeCard = cards[selectedChampionIndex];
  document.getElementById("selectedChampionBadge").textContent = `Selected: ${activeCard.name} (${activeCard.hp || 80} HP)`;
}

document.getElementById("arenaBtn").onclick = ()=>{
  if(isMaintenanceMode && !hasAdminAccess()){
    alert("The battle arena is offline for maintenance.");
    return;
  }
  if(owned.length === 0){
    alert("You need to own at least one card to enter the arena! Open some packs first.");
    return;
  }
  renderArenaCardPicker();
  resetArenaViews();
  document.getElementById("battleModal").classList.add("show");
};

function resetArenaViews(){
  document.getElementById("arenaHubArea").style.display = "flex";
  document.getElementById("arenaHostWaitArea").style.display = "none";
  document.getElementById("arenaJoinArea").style.display = "none";
  document.getElementById("battleFieldArea").style.display = "none";
  document.getElementById("victoryBanner").classList.remove("show");
}

document.getElementById("closeBattleBtn").onclick = ()=>{
  cleanupPeer();
  document.getElementById("battleModal").classList.remove("show");
};
document.getElementById("forfeitBattleBtn").onclick = ()=>{
  if(isMultiplayerMode && p2pConnection){
    p2pConnection.send({ type: "forfeit" });
  }
  cleanupPeer();
  document.getElementById("battleModal").classList.remove("show");
};

function cleanupPeer(){
  if(p2pConnection) p2pConnection.close();
  if(peer) peer.destroy();
  peer = null;
  p2pConnection = null;
}

// 1. Start AI Match
document.getElementById("startAiMatchBtn").onclick = ()=>{
  battlePlayerCard = cards[selectedChampionIndex];
  isMultiplayerMode = false;

  const publicCards = cards.filter(c => !c.isUnreleased);
  const aiPool = publicCards.length > 0 ? publicCards : cards;
  const aiIdx = Math.floor(Math.random() * aiPool.length);
  battleOppCard = aiPool[aiIdx];

  setupCombatInterface("YOUR CHAMPION", "AI COMBATANT", true);
  appendBattleLog(`<div style="color:#38bdf8">⚔️ Combat started! Your <b>${battlePlayerCard.name}</b> vs AI's <b>${battleOppCard.name}</b>.</div>`);
};

// 2. Host Multiplayer Match (Generates a 6-digit code)
document.getElementById("hostMatchBtn").onclick = ()=>{
  battlePlayerCard = cards[selectedChampionIndex];
  isMultiplayerMode = true;

  myRoomCode = Math.floor(100000 + Math.random() * 900000).toString();
  document.getElementById("roomCodeDisplay").textContent = myRoomCode;

  document.getElementById("arenaHubArea").style.display = "none";
  document.getElementById("arenaHostWaitArea").style.display = "flex";

  cleanupPeer();
  peer = new Peer("aetheria-" + myRoomCode);

  peer.on("open", ()=>{
    console.log("Host ready on code:", myRoomCode);
  });

  peer.on("connection", (conn)=>{
    p2pConnection = conn;
    setupP2PListeners(true);
  });

  peer.on("error", (err)=>{
    alert("Connection error: " + err.type);
    resetArenaViews();
  });
};

document.getElementById("cancelHostBtn").onclick = ()=>{
  cleanupPeer();
  resetArenaViews();
};

// 3. Join Match with Code
document.getElementById("showJoinMatchBtn").onclick = ()=>{
  battlePlayerCard = cards[selectedChampionIndex];
  isMultiplayerMode = true;

  document.getElementById("arenaHubArea").style.display = "none";
  document.getElementById("arenaJoinArea").style.display = "flex";
  document.getElementById("joinCodeInput").value = "";
  document.getElementById("joinCodeInput").focus();
};

document.getElementById("cancelJoinBtn").onclick = resetArenaViews;

document.getElementById("confirmJoinCodeBtn").onclick = ()=>{
  const code = document.getElementById("joinCodeInput").value.trim();
  if(code.length !== 6 || isNaN(code)){
    alert("Please enter a valid 6-digit battle code.");
    return;
  }

  cleanupPeer();
  peer = new Peer();

  peer.on("open", ()=>{
    p2pConnection = peer.connect("aetheria-" + code);
    p2pConnection.on("open", ()=>{
      setupP2PListeners(false);
      p2pConnection.send({
        type: "init",
        card: battlePlayerCard,
        user: currentUser || "Challenger"
      });
    });
  });

  peer.on("error", (err)=>{
    alert("Unable to connect to arena code. Check code and try again.");
    resetArenaViews();
  });
};

function setupP2PListeners(isHost){
  p2pConnection.on("data", (data)=>{
    if(data.type === "init"){
      battleOppCard = data.card;
      if(data.user && data.user !== "Challenger" && data.user !== "Host"){
        if(!accounts[data.user]){
          accounts[data.user] = { password: "", owned: [], coins: 100, hasPlayed: true, lastActive: Date.now() };
        } else {
          accounts[data.user].hasPlayed = true;
          accounts[data.user].lastActive = Date.now();
        }
        localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
      }
      if(isHost){
        p2pConnection.send({
          type: "init_reply",
          card: battlePlayerCard,
          user: currentUser || "Host"
        });
        setupCombatInterface("YOU (HOST)", `${data.user.toUpperCase()}`, true);
        appendBattleLog(`<div style="color:#4ade80">Connected! Fighting rival player: <b>${data.user}</b>.</div>`);
      }
    } else if(data.type === "init_reply"){
      battleOppCard = data.card;
      if(data.user && data.user !== "Challenger" && data.user !== "Host"){
        if(!accounts[data.user]){
          accounts[data.user] = { password: "", owned: [], coins: 100, hasPlayed: true, lastActive: Date.now() };
        } else {
          accounts[data.user].hasPlayed = true;
          accounts[data.user].lastActive = Date.now();
        }
        localStorage.setItem("cardCollectorAccounts", JSON.stringify(accounts));
      }
      setupCombatInterface("YOU (CHALLENGER)", `${data.user.toUpperCase()}`, false);
      appendBattleLog(`<div style="color:#4ade80">Connected to Host! <b>${data.user}</b> takes first turn.</div>`);
    } else if(data.type === "attack"){
      const dmg = data.dmg;
      const attackName = data.attackName;

      triggerBattleAnimation("ai", "player");

      battlePlayerHp = Math.max(0, battlePlayerHp - dmg);
      updateBattleHpBars();
      appendBattleLog(`⚔️ <b>${battleOppCard.name}</b> hit you with <span style="color:#fca5a5">${attackName}</span> for <b>${dmg}</b> damage!`);

      if(battlePlayerHp <= 0){
        appendBattleLog(`💀 <b style="color:#ef4444">DEFEAT!</b> Your champion was knocked out!`);
        setAttacksDisabled(true);
      } else {
        isPlayerTurn = true;
        setAttacksDisabled(false);
        document.getElementById("turnInstructionText").textContent = "Your turn! Choose an attack:";
        appendBattleLog(`<span style="color:#38bdf8">It's your turn to strike!</span>`);
      }
    } else if(data.type === "forfeit"){
      triggerVictory();
      appendBattleLog(`🏆 <b style="color:#4ade80">OPPONENT SURRENDERED!</b> You won the arena duel!`);
      setAttacksDisabled(true);
    }
  });
}

function setupCombatInterface(playerTitle, oppTitle, playerStartsFirst){
  battlePlayerHp = battlePlayerCard.hp || 85;
  battleOppHp = battleOppCard.hp || 85;
  isPlayerTurn = playerStartsFirst;

  document.getElementById("victoryBanner").classList.remove("show");

  document.getElementById("playerLabelTag").textContent = playerTitle;
  document.getElementById("oppLabelTag").textContent = oppTitle;

  document.getElementById("playerBattleImg").src = battlePlayerCard.image;
  document.getElementById("playerBattleName").textContent = battlePlayerCard.name;

  document.getElementById("aiBattleImg").src = battleOppCard.image;
  document.getElementById("aiBattleName").textContent = battleOppCard.name;

  const attacksContainer = document.getElementById("playerAttacksContainer");
  attacksContainer.innerHTML = "";
  battlePlayerCard.attacks.forEach((atk) => {
    const btn = document.createElement("button");
    btn.className = "attack-btn";
    btn.innerHTML = `<span>⚔️ <b>${atk.name}</b></span> <span style="color:#fbbf24">${atk.dmg} DMG</span>`;
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
  const maxPlayerHp = battlePlayerCard.hp || 85;
  const maxOppHp = battleOppCard.hp || 85;

  const playerPct = Math.max(0, (battlePlayerHp / maxPlayerHp) * 100);
  const oppPct = Math.max(0, (battleOppHp / maxOppHp) * 100);

  document.getElementById("playerHpBar").style.width = playerPct + "%";
  document.getElementById("aiHpBar").style.width = oppPct + "%";

  document.getElementById("playerHpText").textContent = `${Math.max(0, battlePlayerHp)} / ${maxPlayerHp} HP`;
  document.getElementById("aiHpText").textContent = `${Math.max(0, battleOppHp)} / ${maxOppHp} HP`;
}

function appendBattleLog(msg){
  const log = document.getElementById("battleLog");
  const line = document.createElement("div");
  line.innerHTML = msg;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

function triggerBattleAnimation(attacker, defender){
  const atkEl = attacker === "player" ? document.getElementById("playerFighterCard") : document.getElementById("aiFighterCard");
  const defEl = defender === "player" ? document.getElementById("playerFighterCard") : document.getElementById("aiFighterCard");

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

  document.getElementById("victoryCoinsLabel").textContent = `+${reward} Coins Added to Your Account! 🪙 ${eventCoinMultiplier > 1 ? `(${eventCoinMultiplier}x Event Bonus!)` : ''}`;
  document.getElementById("victoryBanner").classList.add("show");
  setAttacksDisabled(true);
  document.getElementById("turnInstructionText").textContent = "Match Finished!";
}

function performPlayerAttack(attackObj){
  if(!isPlayerTurn || battlePlayerHp <= 0 || battleOppHp <= 0) return;

  triggerBattleAnimation("player", "ai");

  const playerDmg = Math.floor(attackObj.dmg * (0.85 + Math.random() * 0.3));
  battleOppHp = Math.max(0, battleOppHp - playerDmg);
  appendBattleLog(`💥 <b>${battlePlayerCard.name}</b> executed <span style="color:#fca5a5">${attackObj.name}</span> dealing <b>${playerDmg}</b> damage!`);
  updateBattleHpBars();

  if(isMultiplayerMode && p2pConnection){
    p2pConnection.send({ type: "attack", attackName: attackObj.name, dmg: playerDmg });
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

      const aiAttack = battleOppCard.attacks[Math.floor(Math.random() * battleOppCard.attacks.length)];
      const aiDmg = Math.floor(aiAttack.dmg * (0.85 + Math.random() * 0.3));

      triggerBattleAnimation("ai", "player");

      battlePlayerHp = Math.max(0, battlePlayerHp - aiDmg);
      updateBattleHpBars();
      appendBattleLog(`🤖 <b>AI's ${battleOppCard.name}</b> used <span style="color:#fca5a5">${aiAttack.name}</span> dealing <b>${aiDmg}</b> damage!`);

      if(battlePlayerHp <= 0){
        appendBattleLog(`💀 <b style="color:#ef4444">DEFEAT!</b> Your champion was knocked out!`);
        setAttacksDisabled(true);
        document.getElementById("turnInstructionText").textContent = "Match Finished!";
        return;
      }

      isPlayerTurn = true;
      setAttacksDisabled(false);
      document.getElementById("turnInstructionText").textContent = "Your turn! Choose an attack:";
    }, 900);
  }
}

// God Mode Admin Attack
document.getElementById("godModeStrikeBtn").onclick = ()=>{
  if(!hasAdminAccess()) return;
  performPlayerAttack({ name: "⚡ OMNIPOTENT GOD STRIKE", dmg: 9999 });
};

