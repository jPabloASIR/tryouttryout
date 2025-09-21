// === script.js fusionado y mejorado ===

// -------------------- VARIABLES GLOBALES --------------------
let decks = {1: [], 2: []};
let hands = {1: [], 2: []};
let fields = {
  1: { active: null, bench: [], discard: [] },
  2: { active: null, bench: [], discard: [] }
};
let currentPlayer = 1;
let gameStarted = false;
const MAX_BENCH = 5;

// -------------------- INICIALIZACIÓN --------------------
let allCards = [];
fetch('cards.json').then(r=>r.json()).then(data=>{
  allCards = data;
  initGame();
}).catch(e=>{
  console.warn('cards.json not found, using dummy');
  for(let i=1;i<=60;i++){
    allCards.push({id:'d'+i,name:'Card '+i,hp:50,stage:'Basic',type:'Colorless',attacks:[],image:''});
  }
  initGame();
});

function initGame(){
  // reset
  for(let p=1;p<=2;p++){
    decks[p] = [];
    hands[p] = [];
    fields[p] = { active: null, bench: [], discard: [] };
  }

  // build decks
  const pool = (Array.isArray(allCards) && allCards.length>0) ? allCards.slice() : null;
  for(let p=1;p<=2;p++){
    if(pool){
      const d = [];
      while(d.length < 40){
        const copy = pool.slice().sort(()=>Math.random()-0.5);
        d.push(...copy);
      }
      decks[p] = d.slice(0, Math.min(60, d.length));
    } else {
      for(let i=1;i<=40;i++) {
        decks[p].push({ id: 'dummy'+i, name: 'Dummy '+i, hp: 50, stage: 'Basic', image: '' });
      }
    } 
  }

  // Prize cards
  for (let i = 1; i <= 2; i++) {
    prizes[i] = [];
    for (let j = 0; j < 6; j++) {
      if (decks[i].length > 0) {
        prizes[i].push(decks[i].shift());
      }
    }
  }
  renderPrizes();  

  // initial draw
  for(let p=1;p<=2;p++){
    for(let i=0;i<5;i++){
      if (typeof drawCardAuto === 'function') drawCardAuto(p);
      else if(decks[p].length > 0) hands[p].push(decks[p].shift());
    }
  }

  // estado inicial
  currentPlayer = 1;
  gameStarted = true;

  // render UI
  renderHands();
  renderFields();
  const ti = document.getElementById('turn-indicator');
  if(ti) ti.textContent = `Turn: Player ${currentPlayer}`;
  log(`Game started! Turn of Player ${currentPlayer}`);
}


  // Empezar con el turno del Jugador 1
  currentPlayer = 1;
  log("Game started! Turn of Player 1");

}


  // initial state
  currentPlayer = 1;
  gameStarted = true;

  // update UI & log
  renderHands();
  renderFields();
  log('Game initialized. Each player has 5 cards.');
  const ti = document.getElementById('turn-indicator');
  if(ti) ti.textContent = `Turn: Player ${currentPlayer}`;
  log(`Turn of Player ${currentPlayer}`);
}

// conecta botón "Start / Restart Game" (añade esto una sola vez)
const startBtn = document.getElementById('start-game');
if(startBtn) startBtn.addEventListener('click', () => {
  initGame();
});


  currentPlayer = 1;
  gameStarted = true;
  renderHands();
  renderFields();
  log('Game initialized. Each player has 5 cards. Place a Basic Pokémon as Active.');


// -------------------- LOG --------------------
function log(message){
  const logDiv = document.getElementById('log') || document.body;
  const entry = document.createElement('div');
  entry.textContent = message;
  logDiv.prepend(entry);
}

// -------------------- ROBO DE CARTAS --------------------
function drawCardAuto(player){
  if(!decks[player] || decks[player].length===0){ log('Deck empty for player '+player); return null; }
  const card = decks[player].shift();
  hands[player].push(card);
  return card;
}

function drawCard(player){
  if(!gameStarted){ log('Game not started'); return; }
  if(player !== currentPlayer){ log('Not your turn'); return; }
  if(decks[player].length===0){ log('Deck empty'); return; }
  const card = decks[player].shift();
  hands[player].push(card);
  renderHands();
  log('Player '+player+' drew a card: '+card.name);
}

// -------------------- RENDER --------------------
function renderHands(){
  for(let p=1;p<=2;p++){
    const handDiv = document.getElementById('hand'+p);
    if(!handDiv) continue;
    handDiv.innerHTML = '';
    hands[p].forEach((card, idx)=>{
      const div = document.createElement('div');
      div.className = 'card';
      div.style.minWidth = '120px';
      div.style.cursor = 'pointer';
      div.innerHTML = `
        <img src="${card.image || ''}" alt="${card.name}" style="width:100px; border-radius:6px;">
        <div style="font-weight:bold; font-size:12px">${card.name}</div>
      `;
      div.onclick = ()=> playCard(p, idx);
      handDiv.appendChild(div);
    });
  }
}

function renderFields(){
  for(let p=1;p<=2;p++){
    const fieldDiv = document.getElementById('field'+p);
    if(!fieldDiv) continue;
    fieldDiv.innerHTML = '';
    // Active
    const activeBox = document.createElement('div');
    activeBox.style.border = '1px solid rgba(255,255,255,0.08)';
    activeBox.style.borderRadius = '8px';
    activeBox.style.padding = '8px';
    activeBox.style.marginBottom = '8px';
    activeBox.style.minHeight = '200px';
    activeBox.style.display = 'flex';
    activeBox.style.flexDirection = 'column';
    activeBox.style.alignItems = 'center';
    if(fields[p].active){
      const inst = fields[p].active;
      activeBox.innerHTML = `
        <img src="${inst.card.image || ''}" alt="${inst.card.name}" style="width:150px; border-radius:8px;">
        <div style="font-weight:bold">${inst.card.name} (Active)</div>
        <div>HP: ${inst.currentHp}</div>
      `;
      const btns = document.createElement('div'); btns.style.marginTop='6px';
      const attackBtn = document.createElement('button'); attackBtn.textContent='Attack'; attackBtn.onclick = ()=> attack(p);
      const evolveBtn = document.createElement('button'); evolveBtn.textContent='Evolve'; evolveBtn.onclick = ()=> evolveFromHand(p, 'active');
      const inspectBtn = document.createElement('button'); inspectBtn.textContent='Inspect'; inspectBtn.onclick = ()=> alert(JSON.stringify(inst.card,null,2));
      [attackBtn, evolveBtn, inspectBtn].forEach(b=>{ b.style.background='#000'; b.style.color='#fff'; b.style.margin='4px'; });
      btns.appendChild(attackBtn); btns.appendChild(evolveBtn); btns.appendChild(inspectBtn);
      activeBox.appendChild(btns);
    } else {
      activeBox.innerHTML = `<div style="opacity:0.6">Active slot empty</div>`;
    }
    fieldDiv.appendChild(activeBox);

    // Bench
    const benchBox = document.createElement('div');
    benchBox.style.display='flex'; benchBox.style.gap='8px'; benchBox.style.flexWrap='wrap';
    for(let i=0;i<5;i++){
      const slot = document.createElement('div');
      slot.style.minWidth='100px'; slot.style.minHeight='150px'; slot.style.border='1px dashed rgba(255,255,255,0.06)'; 
      slot.style.borderRadius='6px'; slot.style.display='flex'; slot.style.flexDirection='column'; 
      slot.style.alignItems='center'; slot.style.justifyContent='center';
      if(fields[p].bench[i]){
        const b = fields[p].bench[i];
        slot.innerHTML = `
          <img src="${b.card.image || ''}" alt="${b.card.name}" style="width:100px; border-radius:6px;">
          <div style="font-size:12px; font-weight:bold">${b.card.name}</div>
          <div style="font-size:12px">HP: ${b.currentHp}</div>
        `;
        const btn = document.createElement('button'); btn.textContent='Make Active'; btn.style.background='#000'; btn.style.color='#fff'; btn.onclick = ()=> makeActive(p,i);
        slot.appendChild(btn);
      } else {
        slot.textContent = 'Bench slot';
      }
      benchBox.appendChild(slot);
    }
    fieldDiv.appendChild(benchBox);
  }
}

// -------------------- JUGAR CARTAS --------------------
function playCard(player, index){
  const card = hands[player][index];
  if(!card){ log('No card'); return; }
  if(card.hp){
    if(!fields[player].active){
      if(card.stage && card.stage !== 'Basic'){ alert('Only Basic Pokémon can be placed directly as active.'); return; }
      const inst = { card: card, currentHp: card.hp, energies: [], damageTaken:0, evolvedFrom: null };
      fields[player].active = inst;
      hands[player].splice(index,1);
      renderHands(); renderFields();
      log('Player '+player+' placed '+card.name+' as active.');
      return;
    }
    if(fields[player].bench.length >= MAX_BENCH){ alert('Bench full'); return; }
    if(card.stage && card.stage !== 'Basic'){ alert('Only Basic Pokémon can be played to bench directly.'); return; }
    const inst = { card: card, currentHp: card.hp, energies: [], damageTaken:0, evolvedFrom: null };
    fields[player].bench.push(inst);
    hands[player].splice(index,1);
    renderHands(); renderFields();
    log('Player '+player+' placed '+card.name+' to bench.');
    return;
  } else {
    if(card.supertype && card.supertype.toLowerCase().includes('energy')){
      if(fields[player].active){ fields[player].active.energies.push(card.energyType||'Colorless'); hands[player].splice(index,1); renderAll(); log('Attached energy to active'); return; }
      if(fields[player].bench[0]){ fields[player].bench[0].energies.push(card.energyType||'Colorless'); hands[player].splice(index,1); renderAll(); log('Attached energy to bench'); return; }
      alert('No Pokémon to attach energy to');
      return;
    } else {
      fields[player].discard.push(card);
      hands[player].splice(index,1);
      renderHands(); renderFields();
      log('Played trainer '+card.name);
      return;
    }
  }
}

function makeActive(player, benchIndex){
  if(!fields[player].bench[benchIndex]){ log('No bench pokemon'); return; }
  const inst = fields[player].bench.splice(benchIndex,1)[0];
  if(fields[player].active){
    const old = fields[player].active;
    if(fields[player].bench.length < MAX_BENCH) fields[player].bench.push(old);
    else fields[player].discard.push(old.card);
  }
  fields[player].active = inst;
  renderFields();
  log('Player '+player+' promoted '+inst.card.name+' to active');
}

function evolveFromHand(player, zone, benchIndex){
  const evolutions = hands[player].map((c,i)=>({c,i})).filter(x=> x.c && x.c.stage && x.c.stage !== 'Basic');
  if(evolutions.length===0){ alert('No evolution cards in hand'); return; }
  const pick = evolutions[0];
  const evoCard = pick.c;
  let target = null;
  if(zone === 'active'){ target = fields[player].active; if(!target){ alert('No active to evolve'); return; } }
  else { target = fields[player].bench[benchIndex]; if(!target){ alert('No bench target'); return; } }
  if(evoCard.evolvesFrom && evoCard.evolvesFrom !== target.card.name && evoCard.evolvesFrom !== target.card.id){ alert('Evolution mismatch'); return; }
  const newInst = { card: evoCard, currentHp: evoCard.hp || target.currentHp, energies: target.energies.slice(), damageTaken: target.damageTaken || 0, evolvedFrom: target.card.name };
  if(zone === 'active') fields[player].active = newInst; else fields[player].bench[benchIndex] = newInst;
  fields[player].discard.push(target.card);
  hands[player].splice(pick.i,1);
  renderFields(); renderHands();
  log('Player '+player+' evolved '+target.card.name+' into '+evoCard.name);
}

// -------------------- ATAQUE --------------------
function attack(player){
  if(currentPlayer !== player){ log('Not your turn'); return; }
  const attacker = fields[player].active;
  const defender = fields[player===1?2:1].active;
  if(!attacker || !defender){ alert('Both players need active Pokémon to attack'); return; }
  if(!attacker.card.attacks || attacker.card.attacks.length===0){ alert('No attacks'); return; }
  const choices = attacker.card.attacks.map((a,i)=>`${i+1}) ${a.name} (${a.damage||'-'})`).join('\n');
  const pick = prompt('Choose attack:\n'+choices,'1');
  const idx = parseInt(pick)-1;
  if(isNaN(idx) || idx < 0 || idx >= attacker.card.attacks.length){ alert('Invalid'); return; }
  const atkObj = { name: attacker.card.name, attacks: attacker.card.attacks, energies: attacker.energies, type: attacker.card.type, hp: attacker.currentHp, weakness: attacker.card.weakness, resistance: attacker.card.resistance };
  const defObj = { name: defender.card.name, attacks: defender.card.attacks, energies: defender.energies, type: defender.card.type, hp: defender.currentHp, weakness: defender.card.weakness, resistance: defender.card.resistance };
  const res = useAttack(atkObj, idx, defObj);
  defender.currentHp = defObj.hp;
  log(res);
  if(defender.currentHp <= 0){
    log(defender.card.name + ' fainted and is moved to discard');
    fields[player===1?2:1].discard.push(defender.card);
    fields[player===1?2:1].active = null;
  }
  renderFields();
}

// -------------------- TURNOS --------------------
function endTurn() {
  if (typeof gameStarted !== 'undefined' && !gameStarted) {
    log('Game not started');
    return;
  }

  // Cambiar jugador
  currentPlayer = currentPlayer === 1 ? 2 : 1;

  // Mostrar en log y actualizar indicador
  log(`Turn of Player ${currentPlayer}`);
  const ti = document.getElementById('turn-indicator');
  if (ti) ti.textContent = `Turn: Player ${currentPlayer}`;

  // Robar carta automáticamente al empezar el turno del nuevo jugador
  if (decks[currentPlayer] && decks[currentPlayer].length > 0) {
    const card = decks[currentPlayer].shift();
    hands[currentPlayer].push(card);
    log(`Player ${currentPlayer} drew ${card.name}`);
  } else {
    log(`Player ${currentPlayer} cannot draw — deck is empty!`);
  }

  // Re-render UI
  if (typeof renderHands === 'function') renderHands();
  if (typeof renderFields === 'function') renderFields();
}

// Aseguramos que la función esté expuesta globalmente
window.endTurn = endTurn;

// -------------------- Attach fallback listeners (por si el HTML no llama correctamente) --------------------
document.addEventListener('DOMContentLoaded', () => {
  // Si hay botones que contienen "Terminar turno" / "End Turn", les ponemos listener
  document.querySelectorAll('button').forEach(btn => {
    const t = (btn.textContent || '').trim().toLowerCase();
    if (t === 'terminar turno' || t === 'end turn' || t === 'terminar' || t === 'end') {
      // evitar añadir dos listeners si ya existe
      if (!btn._endTurnBound) {
        btn.addEventListener('click', (e) => { e.preventDefault(); endTurn(); });
        btn._endTurnBound = true;
      }
    }
  });

  // Si tienes botón Start/Restart con id start-game, asegurar que llama a initGame
  const startBtn = document.getElementById('start-game');
  if (startBtn && !startBtn._startBound) {
    startBtn.addEventListener('click', () => { if (typeof initGame === 'function') initGame(); });
    startBtn._startBound = true;
  }
});


// -------------------- MOTOR DE ATAQUES --------------------
function checkEnergy(pokemon, attack){
  if(!attack || !attack.cost || attack.cost.length === 0) return true;
  const energyCopy = [...(pokemon.energies || [])];
  for(const cost of attack.cost){
    if(cost === 'Colorless'){
      if(energyCopy.length === 0) return false;
      energyCopy.shift();
      continue;
    }
    const idx = energyCopy.indexOf(cost);
    if(idx === -1) return false;
    energyCopy.splice(idx,1);
  }
  return true;
}

function calculateDamage(attacker, attack, defender){
  let base = parseInt(attack.damage) || 0;
  if(typeof attack.damage === 'string' && attack.damage.includes('+')){
    const costType = (attack.cost && attack.cost[0]) || null;
    if(costType){
      const extra = (attacker.energies || []).filter(e=>e===costType).length - (attack.cost.length || 0);
      if(extra > 0) base += extra*10;
    }
  }
  if(defender.weakness && defender.weakness.type && attacker.type === defender.weakness.type){
    base *= 2;
  }
  if(defender.resistance && defender.resistance.type && attacker.type === defender.resistance.type){
    const val = typeof defender.resistance.value === 'number' ? defender.resistance.value : parseInt(defender.resistance.value) || 30;
    base = Math.max(0, base - val);
  }
  return base;
}

function applyEffect(attack){
  if(!attack || !attack.effect) return {};
  const ef = String(attack.effect).toLowerCase();
  if(ef.includes('flip a coin')){
    const coin = Math.random() < 0.5 ? 'heads' : 'tails';
    return { coin };
  }
  return {};
}

function useAttack(attacker, attackIndex, defender){
  const attack = attacker.attacks[attackIndex];
  if(!attack) return 'Invalid attack';
  if(!checkEnergy(attacker, attack)) return attacker.name + ' does not have enough energy to use ' + attack.name;
  const eff = applyEffect(attack);
  if(eff.coin && attack.effect && attack.effect.toLowerCase().includes('if heads') && eff.coin === 'tails') return attack.name + ' failed (coin)';
  const dmg = calculateDamage(attacker, attack, defender);
  defender.hp -= dmg;
  if(defender.hp < 0) defender.hp = 0;
  let msg = attacker.name + ' used ' + attack.name + ' and dealt ' + dmg + ' damage to ' + defender.name + '.';
  if(defender.hp === 0) msg += ' ' + defender.name + ' fainted!';
  return msg;
}

// -------------------- EXPOSICIÓN GLOBAL --------------------
window.drawCard = drawCard;
window.playCard = playCard;
window.endTurn = endTurn;

function renderPrizes() {
  for (let i = 1; i <= 2; i++) {
    const prizesDiv = document.getElementById(`prizes${i}`);
    prizesDiv.innerHTML = '';
    prizes[i].forEach(() => {
      const img = document.createElement('img');
      img.src = "https://images.pokemontcg.io/back.png"; // reverso genérico
      prizesDiv.appendChild(img);
    });
  }
}

