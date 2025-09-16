// script_fixed.js
// Versión mejorada del tablero y lógica básica (campo, mano, combate mínimo)
// Requiere scriptAttack.js cargado antes.
// Usa cards.json si existe en la misma carpeta; si no, genera cartas dummy.

let allCards = [];
let decks = {1: [], 2: []};
let hands = {1: [], 2: []};
let board = {
  1: { active: null, bench: [], discard: [], deck: [] },
  2: { active: null, bench: [], discard: [], deck: [] }
};
let currentPlayer = 1;
let gameStarted = false;
let hasAttachedEnergy = {1:false,2:false};
let trainerPlayed = {1:false,2:false};
const MAX_BENCH = 5;
const INITIAL_HAND = 5;

// Utility
function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]} return a }

function log(msg){
  const logDiv = document.getElementById('log');
  const time = new Date().toLocaleTimeString();
  logDiv.innerHTML = `<div>[${time}] ${escapeHtml(msg)}</div>` + logDiv.innerHTML;
}

function escapeHtml(str){ if(!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }

// Load cards.json if available
fetch('cards.json').then(r=>r.json()).then(data=>{ allCards = data; log('cards.json loaded: '+allCards.length+' cards'); }).catch(e=>{
  log('No cards.json found — using dummy cards'); allCards = generateDummyCards(60);
}).finally(()=>{
  document.getElementById('start-game').onclick = ()=>startGame();
  // auto start for convenience
  // startGame();
});

function generateDummyCards(n){
  const types=['Fire','Water','Grass','Lightning','Psychic','Fighting','Colorless'];
  let arr=[];
  for(let i=0;i<n;i++){
    arr.push({ id:'dummy'+i, name:'Card '+(i+1), type:types[i%types.length], hp:50, attacks:[{name:'Tackle',damage:'10',cost:['Colorless']}], image:''});
  }
  return arr;
}

// Create instance of a pokemon on board
let instanceCounter = 1;
function createPokemonInstance(card){
  return {
    instanceId: 'inst'+(instanceCounter++),
    card: JSON.parse(JSON.stringify(card)), // clone
    currentHp: card.hp || 0,
    energies: [], // array of strings like 'Fire','Water','Colorless'
    damageTaken: 0,
    status: null,
    evolvedFrom: null
  };
}

// Initialize decks and hands
function startGame(){
  // reset
  for(let p=1;p<=2;p++){
    board[p].bench = [];
    board[p].active = null;
    board[p].discard = [];
    board[p].deck = [];
    hands[p] = [];
    hasAttachedEnergy[p] = false;
    trainerPlayed[p] = false;
  }
  currentPlayer = 1;
  gameStarted = true;

  // Build decks (take shuffled copy of allCards and repeat if needed)
  let pool = shuffle(allCards.slice());
  for(let p=1;p<=2;p++){
    let deck = [];
    while(deck.length < 40){
      if(pool.length === 0){ pool = shuffle(allCards.slice()) }
      deck.push(pool.pop());
    }
    board[p].deck = deck;
    document.getElementById('deck-count-'+p).textContent = 'Deck: '+board[p].deck.length;
  }

  // initial draws
  for(let p=1;p<=2;p++){
    for(let i=0;i<INITIAL_HAND;i++) drawFromDeckToHand(p);
  }

  renderAll();
  log('Initial hands dealt. Each player must place at least one Basic Pokémon as active before coin flip.');
  // do not proceed to coin flip until both have active set
}

// Draw helpers
function drawFromDeckToHand(player){
  const d = board[player].deck;
  if(d.length === 0){ log('Deck empty for '+player); return null; }
  const card = d.pop();
  hands[player].push(card);
  document.getElementById('deck-count-'+player).textContent = 'Deck: '+d.length;
  renderHands();
  return card;
}

// Render functions
function renderAll(){
  renderHands();
  renderBoard(1);
  renderBoard(2);
  document.getElementById('turn-indicator').textContent = 'Turn: Player '+currentPlayer + (gameStarted ? (hasAttachedEnergy[currentPlayer] ? ' (used energy)' : '') : '');
}

function renderHands(){
  for(let p=1;p<=2;p++){
    const handDiv = document.getElementById('hand'+p);
    handDiv.innerHTML = '';
    hands[p].forEach((card, idx)=>{
      const node = createCardNode(card);
      // hand-specific buttons
      const btns = node.querySelector('.card-buttons');
      // always allow inspect
      const inspect = document.createElement('button'); inspect.textContent='Inspect'; inspect.onclick=(e)=>{ e.stopPropagation(); showCardDetails(card); };
      btns.appendChild(inspect);

      // If card looks like a Pokemon (has hp) provide Play Active/Bench options
      if(card.hp){
        const playA = document.createElement('button'); playA.textContent='Play (Active)';
        playA.onclick = (e)=>{ e.stopPropagation(); playPokemonFromHand(p, idx, 'active'); };
        btns.appendChild(playA);

        const playB = document.createElement('button'); playB.textContent='Play (Bench)';
        playB.onclick = (e)=>{ e.stopPropagation(); playPokemonFromHand(p, idx, 'bench'); };
        btns.appendChild(playB);
      } else if (isEnergyCard(card)){
        const attach = document.createElement('button'); attach.textContent='Attach Energy';
        attach.onclick = (e)=>{ e.stopPropagation(); attachEnergyFromHand(p, idx); };
        btns.appendChild(attach);
      } else {
        const playTrainer = document.createElement('button'); playTrainer.textContent='Play Trainer';
        playTrainer.onclick = (e)=>{ e.stopPropagation(); playTrainerFromHand(p, idx); };
        btns.appendChild(playTrainer);
      }

      handDiv.appendChild(node);
    });
  }
}

function createCardNode(card){
  const tpl = document.getElementById('card-template');
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.querySelector('img.card-img').src = card.image || placeholderFor(card);
  node.querySelector('.card-name').textContent = card.name || '(no name)';
  node.querySelector('.card-hp').textContent = card.hp ? ('HP: '+card.hp) : '';
  // energies area empty in hand
  node.querySelector('.card-energies').innerHTML = '';
  return node;
}

function placeholderFor(card){
  // small colored placeholder if no image
  return 'data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='200' height='280'><rect width='100%' height='100%' fill='%23111'/><text x='10' y='20' font-size='14' fill='%23fff'>${card.name || ''}</text></svg>`);
}

// Field rendering
function renderBoard(player){
  // Active
  const activeSlot = document.getElementById('active-'+player);
  activeSlot.innerHTML = '';
  const active = board[player].active;
  if(!active){
    activeSlot.classList.add('empty');
    activeSlot.innerHTML = '<div style="opacity:0.6">Active slot empty</div>';
  } else {
    activeSlot.classList.remove('empty');
    const node = createCardNode(active.card);
    node.querySelector('.card-hp').textContent = 'HP: '+active.currentHp;
    // energies display
    const energiesDiv = node.querySelector('.card-energies'); energiesDiv.innerHTML = '';
    active.energies.forEach(e=>{ const s=document.createElement('span'); s.textContent=e; s.style.fontSize='11px'; s.style.padding='2px 6px'; s.style.border='1px solid rgba(255,255,255,0.08)'; s.style.borderRadius='6px'; energiesDiv.appendChild(s); });
    // buttons for active
    const btns = node.querySelector('.card-buttons');
    const attackBtn = document.createElement('button'); attackBtn.textContent='Attack'; attackBtn.onclick = (e)=>{ e.stopPropagation(); openAttackMenu(player); };
    btns.appendChild(attackBtn);

    const evolveBtn = document.createElement('button'); evolveBtn.textContent='Evolve'; evolveBtn.onclick = (e)=>{ e.stopPropagation(); promptEvolveFromHand(player, 'active'); };
    btns.appendChild(evolveBtn);

    const inspect = document.createElement('button'); inspect.textContent='Inspect'; inspect.onclick=(e)=>{ e.stopPropagation(); showCardDetails(active.card); };
    btns.appendChild(inspect);

    activeSlot.appendChild(node);
  }

  // Bench
  const benchDiv = document.getElementById('bench-'+player);
  benchDiv.innerHTML = '';
  for(let i=0;i<MAX_BENCH;i++){
    const slot = document.createElement('div');
    slot.className='bench-slot';
    if(board[player].bench[i]){
      const inst = board[player].bench[i];
      const node = createCardNode(inst.card);
      node.querySelector('.card-hp').textContent = 'HP: '+inst.currentHp;
      const energiesDiv = node.querySelector('.card-energies'); energiesDiv.innerHTML='';
      inst.energies.forEach(e=>{ const s=document.createElement('span'); s.textContent=e; s.style.fontSize='11px'; s.style.padding='2px 6px'; s.style.border='1px solid rgba(255,255,255,0.08)'; s.style.borderRadius='6px'; energiesDiv.appendChild(s); });
      const btns = node.querySelector('.card-buttons');
      const switchBtn = document.createElement('button'); switchBtn.textContent='Make Active'; switchBtn.onclick = (e)=>{ e.stopPropagation(); promoteBenchToActive(player,i); };
      btns.appendChild(switchBtn);
      const evolveBtn = document.createElement('button'); evolveBtn.textContent='Evolve'; evolveBtn.onclick=(e)=>{ e.stopPropagation(); promptEvolveFromHand(player, 'bench', i); };
      btns.appendChild(evolveBtn);
      slot.appendChild(node);
    } else {
      slot.innerHTML = '<div style="opacity:0.5">Bench slot</div>';
      slot.style.width = '110px';
      slot.style.height = '140px';
      slot.style.display = 'flex';
      slot.style.alignItems = 'center';
      slot.style.justifyContent = 'center';
    }
    benchDiv.appendChild(slot);
  }

  document.getElementById('discard-count-'+player).textContent = 'Discard: '+board[player].discard.length;
}

// Actions: play pokemon from hand
function playPokemonFromHand(player, handIndex, zone){
  if(currentPlayer !== player){ log('No es tu turno.'); return; }
  const card = hands[player][handIndex];
  if(!card || !card.hp){ log('Selected card is not a Pokémon.'); return; }
  if(zone==='active'){
    if(board[player].active){ log('Active slot already occupied.'); return; }
    const inst = createPokemonInstance(card);
    board[player].active = inst;
  } else {
    if(board[player].bench.length >= MAX_BENCH){ log('Bench full.'); return; }
    const inst = createPokemonInstance(card);
    board[player].bench.push(inst);
  }
  // remove from hand
  hands[player].splice(handIndex,1);
  renderAll();
  log('Player '+player+' played '+card.name+' to '+zone);
}

// Attach energy from hand to a target
function isEnergyCard(card){
  // try to detect energy card heuristically
  if(!card) return false;
  if(card.supertype && card.supertype.toLowerCase().includes('energy')) return true;
  if(card.name && card.name.toLowerCase().includes('energy')) return true;
  if(card.subtype && card.subtype.toLowerCase().includes('energy')) return true;
  return false;
}

function attachEnergyFromHand(player, handIndex){
  if(currentPlayer !== player){ log('No es tu turno.'); return; }
  if(hasAttachedEnergy[player]){ log('Ya has unido una energía este turno.'); return; }
  const card = hands[player][handIndex];
  if(!isEnergyCard(card)){
    // if not an energy card, allow attaching by prompting type
    const t = prompt('This card is not detected as an Energy card. Type of energy to attach (e.g. Fire, Water, Grass, Colorless):', 'Colorless');
    if(!t) return;
    // choose target: active or bench index
    chooseEnergyTarget(player, handIndex, t);
    return;
  }
  // determine energy type
  let type = 'Colorless';
  if(card.energyType) type = card.energyType;
  else if(card.name){ const m = card.name.match(/(Fire|Water|Grass|Lightning|Psychic|Fighting|Colorless)/i); if(m) type = (m[1].charAt(0).toUpperCase()+m[1].slice(1)); }
  chooseEnergyTarget(player, handIndex, type);
}

function chooseEnergyTarget(player, handIndex, type){
  // simple UI: attach to active if exists, else first bench slot if exists
  if(!board[player].active && board[player].bench.length===0){ log('No Pokémon in play to attach energy to.'); return; }
  let target = null, zone='active', benchIndex=0;
  if(board[player].active){
    target = board[player].active;
    zone = 'active';
  } else {
    target = board[player].bench[0];
    zone = 'bench'; benchIndex=0;
  }
  // attach
  target.energies.push(type);
  // remove card from hand
  hands[player].splice(handIndex,1);
  hasAttachedEnergy[player]=true;
  renderAll();
  log('Attached '+type+' energy to '+target.card.name);
}

// Play trainer card (simple implementation)
function playTrainerFromHand(player, handIndex){
  if(currentPlayer !== player){ log('No es tu turno.'); return; }
  if(trainerPlayed[player]){ log('Already played a Trainer this turn.'); return; }
  const card = hands[player][handIndex];
  // move trainer to discard (simple effect: draw a card if name contains 'Professor' as demo)
  if(card.name && card.name.toLowerCase().includes('professor')){
    drawFromDeckToHand(player);
    log('Played Trainer '+card.name+' — drew a card.');
  } else {
    log('Played Trainer '+card.name);
  }
  board[player].discard.push(card);
  hands[player].splice(handIndex,1);
  trainerPlayed[player]=true;
  renderAll();
}

// Promote bench to active
function promoteBenchToActive(player, benchIndex){
  if(currentPlayer !== player){ log('No es tu turno.'); return; }
  if(!board[player].bench[benchIndex]){ log('No Pokémon in selected bench slot.'); return; }
  const chosen = board[player].bench.splice(benchIndex,1)[0];
  if(board[player].active){
    // move existing active to bench (if space), else send to discard
    const old = board[player].active;
    if(board[player].bench.length < MAX_BENCH){ board[player].bench.push(old); }
    else board[player].discard.push(old.card);
  }
  board[player].active = chosen;
  renderAll();
  log('Player '+player+' promoted '+chosen.card.name+' to active.');
}

// Evolve by choosing an evolution card from hand that will replace target (no strict checks)
function promptEvolveFromHand(player, zone, benchIndex=null){
  // find evolution cards in hand (stage != 'Basic' or name different)
  const evoIndexes = hands[player].map((c,i)=> ({c,i})).filter(x=> x.c && x.c.hp && x.c.stage && x.c.stage!=='Basic').map(x=>x.i);
  if(evoIndexes.length===0){ log('No evolution cards in hand.'); return; }
  const pick = evoIndexes[0]; // pick first for simplicity — could be UI to choose
  const evoCard = hands[player][pick];
  let targetInstance = null;
  if(zone==='active'){ if(!board[player].active){ log('No active Pokémon to evolve.'); return; } targetInstance = board[player].active; }
  else { if(!board[player].bench[benchIndex]){ log('No bench Pokémon in that slot to evolve.'); return; } targetInstance = board[player].bench[benchIndex]; }
  // replace: keep energies and damage, set evolvedFrom
  const newInst = createPokemonInstance(evoCard);
  newInst.energies = targetInstance.energies.splice(0);
  newInst.damageTaken = targetInstance.damageTaken || 0;
  newInst.evolvedFrom = targetInstance.card.name;
  // put new instance in place
  if(zone==='active') board[player].active = newInst; else board[player].bench[benchIndex] = newInst;
  // remove evo card from hand -> to discard (officially it goes to play on top, previous goes to grave? but we just consume)
  hands[player].splice(pick,1);
  board[player].discard.push(targetInstance.card);
  renderAll();
  log(player+' evolved '+targetInstance.card.name+' into '+evoCard.name);
}

// Attack menu and flow
function openAttackMenu(player){
  if(currentPlayer !== player){ log('No es tu turno.'); return; }
  const attacker = board[player].active;
  const defender = board[player===1?2:1].active;
  if(!attacker || !defender){ log('Both players must have an active Pokémon to attack.'); return; }
  if(!attacker.card.attacks || attacker.card.attacks.length===0){ log('No attacks available for '+attacker.card.name); return; }
  // build a simple prompt to choose attack
  const choices = attacker.card.attacks.map((a,i)=> `${i+1}) ${a.name} (${a.damage || '-'})`).join('\n');
  const pick = prompt('Choose attack number:\n'+choices,'1');
  const idx = parseInt(pick)-1;
  if(isNaN(idx) || idx<0 || idx>=attacker.card.attacks.length){ log('Invalid attack selection'); return; }
  // Build minimal objects expected by scriptAttack.useAttack
  const atkObj = {
    attacks: attacker.card.attacks,
    energies: attacker.energies,
    type: attacker.card.type,
    name: attacker.card.name,
    hp: attacker.currentHp,
    weakness: attacker.card.weakness,
    resistance: attacker.card.resistance
  };
  const defObj = {
    attacks: defender.card.attacks,
    energies: defender.energies,
    type: defender.card.type,
    name: defender.card.name,
    hp: defender.currentHp,
    weakness: defender.card.weakness,
    resistance: defender.card.resistance
  };
  // Use the provided engine (scriptAttack.js)
  const result = useAttack(atkObj, idx, defObj);
  // update defender hp
  defender.currentHp = defObj.hp;
  log(result);
  // check faint
  if(defender.currentHp <= 0){
    log(defender.card.name + ' fainted! Moving to discard.');
    board[player===1?2:1].discard.push(defender.card);
    board[player===1?2:1].active = null;
  }
  renderAll();
}

// Basic deck-hand-play actions: draw, end turn
function drawCard(player){
  if(currentPlayer !== player){ log('No es tu turno.'); return; }
  drawFromDeckToHand(player);
}

function endTurn(){
  // reset per-turn flags, change player
  hasAttachedEnergy[currentPlayer]=false;
  trainerPlayed[currentPlayer]=false;
  currentPlayer = currentPlayer===1?2:1;
  log('Turn switched. Now Player '+currentPlayer);
  renderAll();
}

// Helpers: show details
function showCardDetails(card){
  let html = card.name + '\n';
  if(card.hp) html += 'HP: '+card.hp+'\n';
  if(card.attacks) html += 'Attacks: '+card.attacks.map(a=>a.name+' ('+(a.damage||'-')+')').join(', ');
  alert(html);
}

// Expose some functions for inline buttons
window.drawCard = drawCard;
window.endTurn = endTurn;
window.startGame = startGame;
window.playPokemonFromHand = playPokemonFromHand;
window.attachEnergyFromHand = attachEnergyFromHand;
window.playTrainerFromHand = playTrainerFromHand;
window.promoteBenchToActive = promoteBenchToActive;
window.openAttackMenu = openAttackMenu;
window.promptEvolveFromHand = promptEvolveFromHand;


initGame();




