// Mazos, manos y campos
let decks = {1: [], 2: []};
let hands = {1: [], 2: []};
let fields = {1: [], 2: []};
let currentPlayer = 1;

// Cargar JSON con todas las cartas
fetch("cards.json")
  .then(response => response.json())
  .then(data => {
    allCards = data;
    initGame();  // solo iniciamos cuando se haya cargado el JSON
  });

// Inicializar mazos
function initDecks() {
  for (let i = 1; i <= 2; i++) {
    decks[i] = [];
    // por ahora, mazo de 40 cartas cogidas al azar del JSON
    for (let j = 0; j < 40; j++) {
      const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
      decks[i].push({...randomCard});
    }
  }
}

// Mostrar mensaje en log
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
      // Mostrar imagen
      const img = document.createElement('img');
      img.src = card.image;
      img.alt = card.name;
      img.style.width = "100px";
      img.style.cursor = "pointer";
      img.onclick = () => playCard(i, index);
      cardDiv.appendChild(img);
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
      const img = document.createElement('img');
      img.src = card.image;
      img.alt = card.name;
      img.style.width = "120px";
      cardDiv.appendChild(img);
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
}

// Inicializar juego
function initGame() {
  initDecks();
  hands[1] = [];
  hands[2] = [];
  fields[1] = [];
  fields[2] = [];
  currentPlayer = 1;

  // Robo inicial de 5 cartas
  for (let i = 1; i <= 2; i++) {
    for (let j = 0; j < 5; j++) {
      const card = decks[i].shift();
      hands[i].push(card);
    }
  }

  log(`Turno del Jugador ${currentPlayer}`);
  renderHands();
  renderFields();
}

initGame();


