// Ensure window.characters is available for multiplayer character select
if (!window.characters) {
  window.characters = [
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
}
// Firebase configuration for multiplayer

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove, get, child, onDisconnect } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC6GoSYb_wCSlGxvw48ETD6cJnvBJISNLA",
  authDomain: "xzarfitttt.firebaseapp.com",
  databaseURL: "https://xzarfitttt-default-rtdb.firebaseio.com",
  projectId: "xzarfitttt",
  storageBucket: "xzarfitttt.appspot.com",
  messagingSenderId: "1006659868459",
  appId: "1:1006659868459:web:0f09e7a9650ca5e682576e"
};


const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- Firebase Multiplayer Logic ---
// This function mirrors the 2-player character selection and gameplay, but syncs state via Firebase
window.startFirebaseMultiplayer = function startFirebaseMultiplayer() {
  // Step 1: Enter matchmaking queue
  document.getElementById('app').innerHTML = `
    <h2>Firebase Multiplayer</h2>
    <div style="margin:12px 0">
      <button id="fbQueueBtn">Find Match</button>
      <button id="backBtn">Back</button>
    </div>
    <div id="fbStatus" style="font-size:12px"></div>
    <ul id="queueList" style="font-size:12px"></ul>
  `;
  document.getElementById('backBtn').onclick = () => {
    if (window.renderStartScreen) window.renderStartScreen();
  };
  document.getElementById('fbQueueBtn').onclick = () => {
    enterFirebaseQueue();
  };
};

let fbQueueRef = null;
let fbQueueUnsub = null;
let fbQueueId = null;
let fbQueueMatchListener = null;

function enterFirebaseQueue() {
  // Generate a unique id for this player
  fbQueueId = 'q_' + Math.random().toString(36).substr(2, 9);
  fbQueueRef = ref(db, 'fbqueue/' + fbQueueId);
  // Use serverTimestamp for reliable ordering
  set(fbQueueRef, { ts: { ".sv": "timestamp" } });
  // Clean up if user disconnects
  onDisconnect(fbQueueRef).remove();
  renderFirebaseQueueWaiting();
  // Listen for queue changes (atomic match)
  if (fbQueueUnsub) fbQueueUnsub();
  fbQueueUnsub = onValue(ref(db, 'fbqueue'), async (snap) => {
    const queue = snap.val() || {};
    // Sort by server timestamp (oldest first)
    const ids = Object.keys(queue).filter(id => queue[id] && queue[id].ts).sort((a, b) => queue[a].ts - queue[b].ts);
    document.getElementById('queueList').innerHTML = ids.map(id => `<li>${id === fbQueueId ? 'You' : 'Player'}</li>`).join('');
    // If at least 2 in queue, match the two oldest
    if (ids.length >= 2 && ids.includes(fbQueueId)) {
      const [id1, id2] = ids;
      // Only the oldest creates the room
      if (fbQueueId === id1) {
        const roomId = 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        await set(ref(db, 'fbrooms/' + roomId), { players: [null, null], board: Array(9).fill(null), currentPlayer: 0, gameActive: false, waiting: false, match: [id1, id2] });
        // Write match info to both queue entries so both can see
        await set(ref(db, 'fbqueue/' + id1 + '/matchRoom'), roomId);
        await set(ref(db, 'fbqueue/' + id2 + '/matchRoom'), roomId);
        // Remove both from queue after a short delay to allow both to read
        setTimeout(() => {
          remove(ref(db, 'fbqueue/' + id1));
          remove(ref(db, 'fbqueue/' + id2));
        }, 1000);
      }
    }
  });
  // Listen for matchRoom assignment
  if (fbQueueMatchListener) fbQueueMatchListener();
  fbQueueMatchListener = onValue(fbQueueRef, (snap) => {
    const val = snap.val();
    if (val && val.matchRoom) {
      // Matched! Join the room
      if (fbQueueUnsub) fbQueueUnsub();
      if (fbQueueMatchListener) fbQueueMatchListener();
      joinFirebaseRoom(val.matchRoom);
    }
  });
}

function renderFirebaseQueueWaiting() {
  document.getElementById('app').innerHTML = `
    <h2>Waiting for opponent...</h2>
    <div id="fbStatus" style="font-size:12px"></div>
    <ul id="queueList" style="font-size:12px"></ul>
    <button id="leaveBtn">Leave Queue</button>
  `;
  document.getElementById('leaveBtn').onclick = () => {
    if (fbQueueRef) remove(fbQueueRef);
    if (fbQueueUnsub) fbQueueUnsub();
    if (fbQueueMatchListener) fbQueueMatchListener();
    fbQueueRef = null;
    fbQueueUnsub = null;
    fbQueueMatchListener = null;
    fbQueueId = null;
    if (window.renderStartScreen) window.renderStartScreen();
  };
}

function createFirebaseMatchRoom(id1, id2) {
  // Deprecated: now handled atomically in queue logic
  // (kept for backward compatibility, but not used)
}

function joinFirebaseRoom(roomId) {
  fbRoomId = roomId;
  fbRoomRef = ref(db, 'fbrooms/' + roomId);
  get(fbRoomRef).then(snap => {
    let val = snap.val();
    let players = (val && val.players) ? val.players.slice() : [null, null];
    // Claim a slot if not already claimed
    if (!players[0]) {
      fbPlayerNum = 0;
      players[0] = { name: `Player 1`, character: null, image: null, charIdx: null };
    } else if (!players[1]) {
      fbPlayerNum = 1;
      players[1] = { name: `Player 2`, character: null, image: null, charIdx: null };
    } else {
      document.getElementById('fbStatus').innerText = 'Room full!';
      return;
    }
    set(fbRoomRef, { ...(val || {}), players, waiting: false });
    if (fbUnsub) fbUnsub();
    fbUnsub = onValue(fbRoomRef, (snap) => {
      const state = snap.val();
      if (!state) return;
      fbPlayers = state.players || fbPlayers;
      fbBoard = state.board || fbBoard;
      fbCurrentPlayer = state.currentPlayer ?? 0;
      fbGameActive = state.gameActive ?? false;
      // If room has two slots, always show character select
      if (state.players && state.players.length === 2) {
        renderFirebaseCharacterSelect();
      } else {
        renderFirebaseWaitingScreen();
      }
      // Start game if both have picked character and image
      if (
        state.players &&
        state.players.length === 2 &&
        state.players[0].character && state.players[1].character &&
        state.players[0].image && state.players[1].image &&
        !fbGameActive
      ) {
        set(fbRoomRef, { ...state, gameActive: true });
      }
      // Show board if game is active
      if (
        fbGameActive &&
        state.players &&
        state.players[0].character && state.players[1].character &&
        state.players[0].image && state.players[1].image
      ) {
        renderFirebaseBoard();
      }
    });
  });
}

function renderFirebaseWaitingScreen() {
  document.getElementById('app').innerHTML = `
    <h2>Waiting for opponent to join...</h2>
    <button id="leaveBtn">Leave Room</button>
  `;
  document.getElementById('leaveBtn').onclick = () => {
    if (fbUnsub) fbUnsub();
    // Clean up room if alone
    if (fbRoomRef) {
      get(fbRoomRef).then(snap => {
        const val = snap.val();
        if (val && (!val.players[0] || !val.players[1])) {
          remove(fbRoomRef);
        }
      });
    }
    fbRoomId = null;
    fbRoomRef = null;
    fbUnsub = null;
    if (window.renderStartScreen) window.renderStartScreen();
  };
}

let fbRoomId = null;
let fbPlayerNum = null; // 0 or 1
let fbRoomRef = null;
let fbUnsub = null;
let fbPlayers = [
  { name: 'Player 1', character: null, image: null, charIdx: null },
  { name: 'Player 2', character: null, image: null, charIdx: null }
];
let fbBoard = Array(9).fill(null);
let fbCurrentPlayer = 0;
let fbGameActive = false;

function startFirebaseCharacterSelect(roomId) {
  fbRoomId = roomId;
  fbRoomRef = ref(db, 'fbrooms/' + roomId);
  // Try to join as player 1 or 2
  get(fbRoomRef).then(snap => {
    let val = snap.val();
    if (!val || !val.players) {
      // First player
      fbPlayerNum = 0;
      set(fbRoomRef, { players: [null, null], board: Array(9).fill(null), currentPlayer: 0, gameActive: false });
    } else if (val.players[0] && val.players[1]) {
      document.getElementById('fbStatus').innerText = 'Room full!';
      return;
    } else {
      fbPlayerNum = val.players[0] ? 1 : 0;
    }
    renderFirebaseCharacterSelect();
    if (fbUnsub) fbUnsub();
    fbUnsub = onValue(fbRoomRef, (snap) => {
      const state = snap.val();
      if (!state) return;
      fbPlayers = state.players || fbPlayers;
      fbBoard = state.board || fbBoard;
      fbCurrentPlayer = state.currentPlayer ?? 0;
      fbGameActive = state.gameActive ?? false;
      if (fbPlayers[0] && fbPlayers[1] && !fbGameActive) {
        // Both players picked, start game
        set(fbRoomRef, { ...state, gameActive: true });
      }
      if (fbGameActive) renderFirebaseBoard();
    });
  });
}

function renderFirebaseCharacterSelect() {
  let alreadyPicked = fbPlayers[fbPlayerNum] && fbPlayers[fbPlayerNum].character;
  document.getElementById('app').innerHTML = `
    <h2>${fbPlayerNum === 0 ? 'Player 1' : 'Player 2'}: Choose your character</h2>
    <div id="fbCharSelect" class="char-select"></div>
    <div id="fbStatus" style="margin:12px 0; color:#333; font-weight:bold;"></div>
    <button id="backBtn">Back</button>
  `;
  const charDiv = document.getElementById('fbCharSelect');
  window.characters.forEach((char, idx) => {
    const mainImg = char.images[0];
    if (!mainImg) return;
    const btn = document.createElement('button');
    btn.innerHTML = `<img src="assets/${char.folder}/${mainImg}" alt="${char.name}" width="80"><br>${char.name}`;
    btn.disabled = alreadyPicked;
    btn.onclick = () => {
      if (alreadyPicked) return;
      fbPlayers[fbPlayerNum] = { ...fbPlayers[fbPlayerNum], character: char.name, image: `assets/${char.folder}/${mainImg}`, charIdx: idx };
      set(fbRoomRef, { players: fbPlayers, board: fbBoard, currentPlayer: 0, gameActive: false });
      renderFirebaseImageSelect(idx);
    };
    charDiv.appendChild(btn);
  });
  document.getElementById('backBtn').onclick = () => window.startFirebaseMultiplayer();
  // Show waiting message if already picked
  if (alreadyPicked) {
    document.getElementById('fbStatus').innerText = 'Waiting for other player to pick...';
  }
}

function renderFirebaseImageSelect(charIdx) {
  const char = window.characters[charIdx];
  document.getElementById('app').innerHTML = `
    <h2>${fbPlayers[fbPlayerNum].name}: Choose your ${char.name} picture</h2>
    <div id="fbImgSelect" class="char-select"></div>
    <button id="backBtn">Back</button>
  `;
  const imgDiv = document.getElementById('fbImgSelect');
  let alreadyPicked = fbPlayers[fbPlayerNum] && fbPlayers[fbPlayerNum].image;
  char.images.forEach((img, i) => {
    const btn = document.createElement('button');
    btn.innerHTML = `<img src="assets/${char.folder}/${img}" alt="${char.name}" width="80">`;
    btn.disabled = alreadyPicked;
    btn.onclick = () => {
      if (alreadyPicked) return;
      fbPlayers[fbPlayerNum].image = `assets/${char.folder}/${img}`;
      set(fbRoomRef, { players: fbPlayers, board: fbBoard, currentPlayer: 0, gameActive: false });
    };
    imgDiv.appendChild(btn);
  });
  document.getElementById('backBtn').onclick = () => renderFirebaseCharacterSelect();
  // Show waiting message if already picked
  if (alreadyPicked) {
    let status = document.createElement('div');
    status.style = 'margin:12px 0; color:#333; font-weight:bold;';
    status.innerText = 'Waiting for other player to pick...';
    imgDiv.parentNode.insertBefore(status, imgDiv.nextSibling);
  }
}

function renderFirebaseBoard() {
  let html = `<h2>${fbPlayers[0]?.character || 'Player 1'} vs ${fbPlayers[1]?.character || 'Player 2'}</h2>`;
  html += `<div id="ttt-board" class="ttt-board">`;
  for (let i = 0; i < 9; i++) {
    html += `<div class="cell" data-idx="${i}">`;
    if (fbBoard[i] !== null && fbPlayers[fbBoard[i]]) {
      html += `<img src="${fbPlayers[fbBoard[i]].image}" alt="${fbPlayers[fbBoard[i]].character}" width="60">`;
    }
    html += `</div>`;
  }
  html += '</div>';
  html += `<h3 id="turnInfo">${fbPlayers[fbCurrentPlayer]?.character || ''}'s turn</h3>`;
  // Show clear status for whose turn it is
  html += `<div id="fbStatus" style="margin:12px 0; color:#333; font-weight:bold;">${fbCurrentPlayer === fbPlayerNum ? 'Your turn!' : 'Waiting for opponent...'}</div>`;
  html += `<button id="restartBtn">Restart</button>`;
  html += `<button id="leaveBtn">Leave Room</button>`;
  document.getElementById('app').innerHTML = html;

  document.querySelectorAll('.cell').forEach(cell => {
    cell.onclick = (e) => onFirebaseCellClick(e);
  });
  document.getElementById('restartBtn').onclick = () => {
    set(fbRoomRef, { players: fbPlayers, board: Array(9).fill(null), currentPlayer: 0, gameActive: true });
  };
  document.getElementById('leaveBtn').onclick = () => {
    if (fbUnsub) fbUnsub();
    // Clean up room if alone
    if (fbRoomRef) {
      get(fbRoomRef).then(snap => {
        const val = snap.val();
        if (val && (!val.players[0] || !val.players[1])) {
          remove(fbRoomRef);
        }
      });
    }
    fbRoomId = null;
    fbRoomRef = null;
    fbUnsub = null;
    if (window.renderStartScreen) window.renderStartScreen();
  };
}

function onFirebaseCellClick(e) {
  if (!fbGameActive) return;
  const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
  if (fbBoard[idx] !== null) return;
  if (fbCurrentPlayer !== fbPlayerNum) return;
  // Prevent multiple moves until state updates
  document.querySelectorAll('.cell').forEach(cell => cell.onclick = null);
  // Make move
  const newBoard = fbBoard.slice();
  newBoard[idx] = fbPlayerNum;
  const winner = checkFirebaseWin(newBoard);
  let nextPlayer = 1 - fbCurrentPlayer;
  let gameActive = winner === null;
  set(fbRoomRef, { players: fbPlayers, board: newBoard, currentPlayer: nextPlayer, gameActive });
  if (winner !== null) {
    setTimeout(() => {
      document.getElementById('turnInfo').innerText = winner === 'draw' ? "It's a draw!" : `${fbPlayers[winner].character} wins!`;
    }, 50);
  }
}

function checkFirebaseWin(board) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const line of wins) {
    const [a,b,c] = line;
    if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  if (board.every(cell => cell !== null)) return 'draw';
  return null;
}

export { db, ref, push, set, onValue, remove, get, child, onDisconnect };
