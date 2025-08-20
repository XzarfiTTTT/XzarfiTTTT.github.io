// Sound functions are now in sound.js
document.getElementById('app').innerHTML = `
  <h1>Paw Patrol Tic-Tac-Toe</h1>
  <button id="startBtn">Start Game</button>
`;

document.getElementById('startBtn').onclick = () => {
  alert('Game start screen will go here!');
};

// --- Game State ---
let players = [
  { name: 'Player 1', character: null, image: null },
  { name: 'Player 2', character: null, image: null }
];
let currentPlayer = 0;

let board = Array(9).fill(null);
let gameActive = false;

// Dynamically generated character list
const characters = [
  { name: 'Marshall', folder: 'marshal', images: [ 'marshal.jpg','marshal2.jpg','marshal3.jpg','marshal4.jpg','marshal5.jpg','marshal6.jpg','marshal7.jpg','marshal8.jpg','marshal9.jpg','marshal10.jpg','marshal11.jpg','marshal12.jpg','marshal13.jpg','marshal14.jpg' ] },
  { name: 'Skye', folder: 'skye', images: [ 'skye.jpg','skye2.jpg','skye3.jpg','skye4.jpg','skye5.jpg','skye6.jpg','skye7.jpg','skye8.jpg','skye9.jpg','skye10.jpg','skye11.jpg','skye12.jpg','skye13.jpg' ] },
  { name: 'Chase', folder: 'chase', images: [ 'chase.jpg','chase2.jpg','chase3.jpg','chase4.jpg','chase5.jpg','chase6.jpg' ] },
  { name: 'Everest', folder: 'everest', images: [ 'everest.jpg','everest2.jpg','everest3.jpg' ] },
  { name: 'Rocky', folder: 'rocky', images: [ 'rocky.jpg','rocky1.jpg','rocky2.jpg','rocky3.jpg','rocky4.jpg','rocky5.jpg','rocky6.jpg','rocky7.jpg','rocky8.jpg','rocky9.jpg','rocky10.jpg','rocky11.jpg','rocky12.jpg' ] },
  { name: 'Rubble', folder: 'rubble', images: [ 'rubble.jpg','rubble1.jpg','rubble2.jpg','rubble3.jpg','rubble4.jpg','rubble5.jpg','rubble6.jpg','rubble7.jpg','rubble8.jpg','rubble10.jpg','rubble11.jpg','rubble12.jpg','rubble14.jpg','rubble15.jpg','rubble16.jpg','gravel.jpg','gravel1.jpg','hubcap.jpg' ] },
  { name: 'Zuma', folder: 'zuma', images: [ 'zuma.jpg','zuma2.jpg','zuma3.jpg','zuma4.jpg','zuma5.jpg','zuma6.jpg','zuma7.jpg','zuma8.jpg','zuma9.jpg','zuma10.jpg' ] },
  { name: 'Ella', folder: 'ella', images: [ 'ella.jpg' ] },
  { name: 'Liberty', folder: 'liberty', images: [ 'liberty.jpg' ] },
  { name: 'Merpups', folder: 'merpups', images: [ 'merpup1.jpg','merpup2.jpg','merpup3.jpg' ] },
  { name: 'Nano', folder: 'nano', images: [ 'nano.jpg' ] },
  { name: 'Tracker', folder: 'tracker', images: [ 'tracker.jpg','tracker2.jpg' ] }
];

function renderStartScreen() {
  document.getElementById('app').innerHTML = `
    <h1>Paw Patrol Tic-Tac-Toe</h1>
    <button id="onePlayerBtn">1 Player</button>
    <button id="twoPlayerBtn">2 Player</button>
    <button id="multiPlayerBtn">Private Multiplayer</button>
  `;
  document.getElementById('onePlayerBtn').onclick = () => {
    renderCharacterSelect1P();
  };
  document.getElementById('twoPlayerBtn').onclick = renderCharacterSelect;
  document.getElementById('multiPlayerBtn').onclick = () => {
  if (typeof window.startPrivateMultiplayer === 'function') {
    window.startPrivateMultiplayer();
  } else {
    console.error('multiplayer.js not loaded (startPrivateMultiplayer missing).');
    alert('Multiplayer module failed to load.');
  }
};
}
// Multiplayer logic moved to multiplayer.js
window.renderStartScreen = renderStartScreen;
// --- 1 Player Mode ---
function renderCharacterSelect1P() {
  document.getElementById('app').innerHTML = `
    <h2>Player: Choose your character</h2>
    <div id="charSelect1P" class="char-select"></div>
    <button id="backBtn">Back</button>
  `;
  const charDiv = document.getElementById('charSelect1P');
  characters.forEach((char, idx) => {
    const mainImg = char.images[0];
    if (!mainImg) return;
    const btn = document.createElement('button');
    btn.innerHTML = `<img src="assets/${char.folder}/${mainImg}" alt="${char.name}" width="80"><br>${char.name}`;
    btn.onclick = () => {
      players[0].charIdx = idx;
      renderImageSelect1P(idx);
    };
    charDiv.appendChild(btn);
  });
  document.getElementById('backBtn').onclick = renderStartScreen;
}

function renderImageSelect1P(charIdx) {
  const char = characters[charIdx];
  document.getElementById('app').innerHTML = `
    <h2>Player: Choose your ${char.name} picture</h2>
    <div id="imgSelect1P" class="char-select"></div>
    <button id="backBtn">Back</button>
  `;
  const imgDiv = document.getElementById('imgSelect1P');
  char.images.forEach((img, i) => {
    const btn = document.createElement('button');
    btn.innerHTML = `<img src="assets/${char.folder}/${img}" alt="${char.name}" width="80">`;
    btn.onclick = () => {
      players[0].character = char.name;
      players[0].image = `assets/${char.folder}/${img}`;
      players[0].charIdx = charIdx;
      // Computer picks random character/image (not same as player)
      let compIdx;
      do {
        compIdx = Math.floor(Math.random() * characters.length);
      } while (compIdx === charIdx);
      const compChar = characters[compIdx];
      const compImg = compChar.images[Math.floor(Math.random() * compChar.images.length)];
      players[1].character = compChar.name;
      players[1].image = `assets/${compChar.folder}/${compImg}`;
      players[1].charIdx = compIdx;
      startGame1P();
    };
    imgDiv.appendChild(btn);
  });
  document.getElementById('backBtn').onclick = renderCharacterSelect1P;
}

function startGame1P() {
  board = Array(9).fill(null);
  currentPlayer = 0;
  gameActive = true;
  renderBoard1P();
}

function renderBoard1P() {
  let html = `
    <h2>${players[0].character} (You) vs ${players[1].character} (Computer)</h2>
    <div id="ttt-board" class="ttt-board">
  `;
  for (let i = 0; i < 9; i++) {
    html += `<div class="cell" data-idx="${i}">`;
    if (board[i] !== null) {
      html += `<img src="${players[board[i]].image}" alt="${players[board[i]].character}" width="60">`;
    }
    html += `</div>`;
  }
  html += '</div>';
  html += `<h3 id="turnInfo">${currentPlayer === 0 ? players[0].character + "'s turn (You)" : players[1].character + "'s turn (Computer)"}</h3>`;
  html += `<button id="restartBtn">Restart</button>`;
  document.getElementById('app').innerHTML = html;

  document.querySelectorAll('.cell').forEach(cell => {
    cell.onclick = onCellClick1P;
  });
  document.getElementById('restartBtn').onclick = renderStartScreen;
}

function onCellClick1P(e) {
  const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
  if (!gameActive || board[idx] !== null || currentPlayer !== 0) return;
  board[idx] = 0;
  playTurnSound();
  renderBoard1P();
  if (checkWin(0)) {
    gameActive = false;
    playWinSound();
    setTimeout(() => {
      document.getElementById('turnInfo').innerText = `${players[0].character} wins!`;
    }, 50);
    return;
  }
  if (board.every(cell => cell !== null)) {
    gameActive = false;
    playDrawSound();
    setTimeout(() => {
      document.getElementById('turnInfo').innerText = `It's a draw!`;
    }, 50);
    return;
  }
  currentPlayer = 1;
  // Only now, after player's turn, let computer move
  setTimeout(() => {
    computerMove();
  }, 500);
}

function computerMove() {
  if (!gameActive) return;
  // Pick a random empty cell
  const empty = board.map((v, i) => v === null ? i : null).filter(i => i !== null);
  if (empty.length === 0) return;
  const idx = empty[Math.floor(Math.random() * empty.length)];
  board[idx] = 1;
  playTurnSound();
  renderBoard1P();
  if (checkWin(1)) {
    gameActive = false;
    playWinSound();
    setTimeout(() => {
      document.getElementById('turnInfo').innerText = `${players[1].character} wins!`;
    }, 50);
    return;
  }
  if (board.every(cell => cell !== null)) {
    gameActive = false;
    playDrawSound();
    setTimeout(() => {
      document.getElementById('turnInfo').innerText = `It's a draw!`;
    }, 50);
    return;
  }
  currentPlayer = 0;
  // Do not call renderBoard1P again here; wait for player's click
}


function renderCharacterSelect() {
  document.getElementById('app').innerHTML = `
    <h2>Player 1: Choose your character</h2>
    <div id="charSelect1" class="char-select"></div>
  `;
  const charDiv = document.getElementById('charSelect1');
  characters.forEach((char, idx) => {
    // Use the first image in the folder for the main selection
    const mainImg = char.images[0];
    if (!mainImg) return;
    const btn = document.createElement('button');
    btn.innerHTML = `<img src="assets/${char.folder}/${mainImg}" alt="${char.name}" width="80"><br>${char.name}`;
    btn.onclick = () => {
      players[0].charIdx = idx;
      renderImageSelect(0, idx);
    };
    charDiv.appendChild(btn);
  });
}

function renderImageSelect(playerIdx, charIdx) {
  const char = characters[charIdx];
  document.getElementById('app').innerHTML = `
    <h2>${players[playerIdx].name}: Choose your ${char.name} picture</h2>
    <div id="imgSelect" class="char-select"></div>
    <button id="backBtn">Back</button>
  `;
  const imgDiv = document.getElementById('imgSelect');
  char.images.forEach((img, i) => {
    const btn = document.createElement('button');
    btn.innerHTML = `<img src="assets/${char.folder}/${img}" alt="${char.name}" width="80">`;
    btn.onclick = () => {
      players[playerIdx].character = char.name;
      players[playerIdx].image = `assets/${char.folder}/${img}`;
      if (playerIdx === 0) {
        players[0].charIdx = charIdx;
        renderCharacterSelect2(charIdx);
      } else {
        startGame();
      }
    };
    imgDiv.appendChild(btn);
  });
  document.getElementById('backBtn').onclick = () => {
    if (playerIdx === 0) {
      renderCharacterSelect();
    } else {
      renderCharacterSelect2(players[0].charIdx);
    }
  };
}

function renderCharacterSelect2(takenIdx) {
  document.getElementById('app').innerHTML = `
    <h2>Player 2: Choose your character</h2>
    <div id="charSelect2" class="char-select"></div>
    <button id="backBtn">Back</button>
  `;
  const charDiv = document.getElementById('charSelect2');
  characters.forEach((char, idx) => {
    if (idx === takenIdx) return; // Don't allow same character
    const mainImg = char.images[0];
    if (!mainImg) return;
    const btn = document.createElement('button');
    btn.innerHTML = `<img src="assets/${char.folder}/${mainImg}" alt="${char.name}" width="80"><br>${char.name}`;
    btn.onclick = () => {
      players[1].charIdx = idx;
      renderImageSelect(1, idx);
    };
    charDiv.appendChild(btn);
  });
  document.getElementById('backBtn').onclick = () => {
    renderImageSelect(0, players[0].charIdx);
  };
}

function startGame() {
  board = Array(9).fill(null);
  currentPlayer = 0;
  gameActive = true;
  renderBoard();
}

function renderBoard() {
  let html = `
    <h2>${players[0].character} vs ${players[1].character}</h2>
    <div id="ttt-board" class="ttt-board">
  `;
  for (let i = 0; i < 9; i++) {
    html += `<div class="cell" data-idx="${i}">`;
    if (board[i] !== null) {
      html += `<img src="${players[board[i]].image}" alt="${players[board[i]].character}" width="60">`;
    }
    html += `</div>`;
  }
  html += '</div>';
  html += `<h3 id="turnInfo">${players[currentPlayer].character}'s turn</h3>`;
  html += `<button id="restartBtn">Restart</button>`;
  document.getElementById('app').innerHTML = html;

  document.querySelectorAll('.cell').forEach(cell => {
    cell.onclick = onCellClick;
  });
  document.getElementById('restartBtn').onclick = renderStartScreen;
}

function playSound(type) {
  // Simple beep using Web Audio API
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = type === 'win' ? 880 : 440;
    g.gain.value = 0.1;
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.2);
    o.onended = () => ctx.close();
  } catch (e) {}
}

function onCellClick(e) {
  const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
  if (!gameActive || board[idx] !== null) return;
  board[idx] = currentPlayer;
  playTurnSound();
  renderBoard(); // Show the move first
  if (checkWin(currentPlayer)) {
    gameActive = false;
    playWinSound();
    setTimeout(() => {
      document.getElementById('turnInfo').innerText = `${players[currentPlayer].character} wins!`;
    }, 50);
    return;
  }
  if (board.every(cell => cell !== null)) {
    gameActive = false;
    playDrawSound();
    setTimeout(() => {
      document.getElementById('turnInfo').innerText = `It's a draw!`;
    }, 50);
    return;
  }
  currentPlayer = 1 - currentPlayer;
  // Only re-render for next turn
  setTimeout(renderBoard, 50);
}

function checkWin(playerIdx) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6] // diags
  ];
  return wins.some(line => line.every(idx => board[idx] === playerIdx));
}

// --- Initial Render ---
renderStartScreen();
