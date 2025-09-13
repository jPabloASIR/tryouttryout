// Mazos, manos y campos
let decks = {1: [], 2: []};
let hands = {1: [], 2: []};
let fields = {1: [], 2: []};
let currentPlayer = 1;

// Inicializar mazos
function initDecks() {
  for (let i = 1; i <= 2; i++) {
    decks[i] = [];
    for (let j = 1; j <= 10; j++) {
      decks[i].push({name: `Carta ${j}`});
    }
  }
}

// Mostrar mensaje
function log(message) {
  const logDiv = document.getElementById('log');
  logDiv.textContent = message;
}

// Dibujar cartas en mano
function renderHands() {
  for (let i = 1; i <= 2; i++) {
    const handDiv = document.getElementById(`hand${i}`);
    handDiv.innerHTML = '';
    hands[i].forEach((card, index) => {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'card';
      cardDiv.textContent = card.name;
      cardDiv.onclick = () => playCard(i, index);
      handDiv.appendChild(cardDiv);
    });
  }
}

// Dibujar cartas en campo
function renderFields() {
  for (let i = 1; i <= 2; i++) {
    const fieldDiv = document.getElementById(`field${i}`);
    fieldDiv.innerHTML = '';
    fields[i].forEach((card) => {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'card';
      cardDiv.textContent = card.name;
      fieldDiv.appendChild(cardDiv);
    });
  }
}

// Robar carta
function drawCard(player) {
  if (currentPlayer !== player) {
    log("No es tu turno!");
    return;
  }
  if (decks[player].length === 0) {
    log("Mazo vacío!");
    return;
  }
  const card = decks[player].shift();
  hands[player].push(card);
  log(`Jugador ${player} robó ${card.name}`);
  renderHands();
}

// Jugar carta
function playCard(player, index) {
  if (currentPlayer !== player) {
    log("No es tu turno!");
    return;
  }
  const card = hands[player].splice(index, 1)[0];
  fields[player].push(card);
  log(`Jugador ${player} jugó ${card.name}`);
  renderHands();
  renderFields();
}

// Terminar turno
function endTurn() {
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  log(`Turno del Jugador ${currentPlayer}`);
  // Opcional: actualizar botones visibles según el turno
}

// Inicializar juego
function initGame() {
  initDecks();
  hands[1] = [];
  hands[2] = [];
  fields[1] = [];
  fields[2] = [];
  currentPlayer = 1;
  log(`Turno del Jugador ${currentPlayer}`);
  renderHands();
  renderFields();
}

initGame();
