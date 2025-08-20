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
    if (!val || !val.players) {
      // First player
      fbPlayerNum = 0;
      set(fbRoomRef, { players: [null, null], board: Array(9).fill(null), currentPlayer: 0, gameActive: false, waiting: true });
    } else if (val.players[0] && val.players[1]) {
      document.getElementById('fbStatus').innerText = 'Room full!';
      return;
    } else {
      fbPlayerNum = val.players[0] ? 1 : 0;
      // Set waiting to false, both players present
      set(fbRoomRef, { ...val, waiting: false });
    }
    if (fbUnsub) fbUnsub();
    fbUnsub = onValue(fbRoomRef, (snap) => {
      const state = snap.val();
      if (!state) return;
      fbPlayers = state.players || fbPlayers;
      fbBoard = state.board || fbBoard;
      fbCurrentPlayer = state.currentPlayer ?? 0;
      fbGameActive = state.gameActive ?? false;
      // Only show waiting if truly alone (no other player joined yet)
      if (state.players && state.players.length === 2 && state.players[0] === null && state.players[1] === null && state.waiting) {
        renderFirebaseWaitingScreen();
      } else if (!state.players || state.players.length !== 2) {
        renderFirebaseWaitingScreen();
      } else {
        // Always show character select if either slot is unpicked
        if (!fbPlayers[fbPlayerNum] || !fbPlayers[1 - fbPlayerNum]) {
          renderFirebaseCharacterSelect();
        } else if (!fbGameActive) {
          set(fbRoomRef, { ...state, gameActive: true });
        } else if (fbGameActive) {
          renderFirebaseBoard();
        }
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
  document.getElementById('app').innerHTML = `
    <h2>${fbPlayerNum === 0 ? 'Player 1' : 'Player 2'}: Choose your character</h2>
    <div id="fbCharSelect" class="char-select"></div>
    <button id="backBtn">Back</button>
  `;
  const charDiv = document.getElementById('fbCharSelect');
  window.characters.forEach((char, idx) => {
    const mainImg = char.images[0];
    if (!mainImg) return;
    const btn = document.createElement('button');
    btn.innerHTML = `<img src="assets/${char.folder}/${mainImg}" alt="${char.name}" width="80"><br>${char.name}`;
    btn.onclick = () => {
      fbPlayers[fbPlayerNum] = { name: `Player ${fbPlayerNum+1}`, character: char.name, image: `assets/${char.folder}/${mainImg}`, charIdx: idx };
      set(fbRoomRef, { players: fbPlayers, board: fbBoard, currentPlayer: 0, gameActive: false });
      renderFirebaseImageSelect(idx);
    };
    charDiv.appendChild(btn);
  });
  document.getElementById('backBtn').onclick = () => window.startFirebaseMultiplayer();
}

function renderFirebaseImageSelect(charIdx) {
  const char = window.characters[charIdx];
  document.getElementById('app').innerHTML = `
    <h2>${fbPlayers[fbPlayerNum].name}: Choose your ${char.name} picture</h2>
    <div id="fbImgSelect" class="char-select"></div>
    <button id="backBtn">Back</button>
  `;
  const imgDiv = document.getElementById('fbImgSelect');
  char.images.forEach((img, i) => {
    const btn = document.createElement('button');
    btn.innerHTML = `<img src="assets/${char.folder}/${img}" alt="${char.name}" width="80">`;
    btn.onclick = () => {
      fbPlayers[fbPlayerNum].image = `assets/${char.folder}/${img}`;
      set(fbRoomRef, { players: fbPlayers, board: fbBoard, currentPlayer: 0, gameActive: false });
    };
    imgDiv.appendChild(btn);
  });
  document.getElementById('backBtn').onclick = () => renderFirebaseCharacterSelect();
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
