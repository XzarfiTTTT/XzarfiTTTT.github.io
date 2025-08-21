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
import { getDatabase, ref, push, set, onValue, remove, get, child, onDisconnect, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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
    console.log('Joining room, current players:', players);
    
    // Claim a slot if not already claimed
    if (!players[0]) {
      fbPlayerNum = 0;
      players[0] = { name: `Player 1`, character: null, image: null, charIdx: null };
      console.log('Assigned as Player 1 (index 0)');
    } else if (!players[1]) {
      fbPlayerNum = 1;
      players[1] = { name: `Player 2`, character: null, image: null, charIdx: null };
      console.log('Assigned as Player 2 (index 1)');
    } else {
      console.log('Room is full!');
      document.getElementById('fbStatus').innerText = 'Room full!';
      return;
    }
    set(fbRoomRef, { ...(val || {}), players, waiting: false });
    if (fbUnsub) fbUnsub();
    fbUnsub = onValue(fbRoomRef, (snap) => {
      const state = snap.val();
      if (!state) {
        // Room deleted (opponent left)
        document.getElementById('app').innerHTML = '<h2>Opponent left the game.</h2><button id="backBtn">Back to Menu</button>';
        document.getElementById('backBtn').onclick = () => window.startFirebaseMultiplayer();
        return;
      }
      fbPlayers = state.players || fbPlayers;
      
      // Ensure board is always a proper array, not a sparse object
      // Robust board reconstruction from Firebase
      fbBoard = Array(9).fill(null);
      if (state.board) {
        if (Array.isArray(state.board)) {
          // Copy array elements, ensuring we have exactly 9 elements
          for (let i = 0; i < 9; i++) {
            fbBoard[i] = state.board[i] !== undefined ? state.board[i] : null;
          }
        } else {
          // Convert Firebase object back to array, ensuring all indices exist
          Object.keys(state.board).forEach(key => {
            const index = parseInt(key);
            if (index >= 0 && index < 9) {
              fbBoard[index] = state.board[key];
            }
          });
        }
      }
      
      console.log('Board reconstruction complete:', fbBoard, 'Length:', fbBoard.length);
      
      fbCurrentPlayer = state.currentPlayer ?? 0;
      fbGameActive = state.gameActive ?? false;
      
      // Store winner info globally so render function can access it
      window.fbGameWinner = state.winner;
      
      console.log('Firebase state update:', {
        myPlayerNum: fbPlayerNum,
        players: fbPlayers.length,
        player0: fbPlayers[0] ? {char: fbPlayers[0].character, image: !!fbPlayers[0].image} : 'null',
        player1: fbPlayers[1] ? {char: fbPlayers[1].character, image: !!fbPlayers[1].image} : 'null',
        board: fbBoard,
        currentPlayer: fbCurrentPlayer,
        gameActive: fbGameActive,
        winner: state.winner
      });
      
      // Robust state-driven UI flow:
      if (!state.players || state.players.length < 2) {
        console.log('Not enough players, showing waiting screen');
        renderFirebaseWaitingScreen();
        return;
      }
      // If this player hasn't picked character, show character select
      if (!fbPlayers[fbPlayerNum]?.character) {
        console.log(`Player ${fbPlayerNum} needs to pick character`);
        renderFirebaseCharacterSelect();
        return;
      }
      // If this player hasn't picked image, show image select
      if (!fbPlayers[fbPlayerNum]?.image) {
        console.log(`Player ${fbPlayerNum} needs to pick image`);
        renderFirebaseImageSelect(fbPlayers[fbPlayerNum].charIdx);
        return;
      }
      // If both players have picked character and image, but game not started, start it
      if (
        fbPlayers[0]?.character && fbPlayers[1]?.character &&
        fbPlayers[0]?.image && fbPlayers[1]?.image &&
        !fbGameActive && !state.winner
      ) {
        console.log('Both players ready, starting game!');
        set(fbRoomRef, { ...state, gameActive: true });
        return;
      }
      // If both players have characters and images, show the game board (active or finished)
      if (
        fbPlayers[0]?.character && fbPlayers[1]?.character &&
        fbPlayers[0]?.image && fbPlayers[1]?.image
      ) {
        console.log('Both players have selections, showing game board');
        renderFirebaseBoard();
        return;
      }
      // Fallback: waiting screen
      console.log('Fallback: showing waiting screen');
      renderFirebaseWaitingScreen();
      // Show player left message if opponent leaves
      if (state.players && state.players.length === 2) {
        const other = 1 - fbPlayerNum;
        if (!state.players[other]) {
          document.getElementById('app').innerHTML = '<h2>Opponent left the game.</h2><button id="backBtn">Back to Menu</button>';
          document.getElementById('backBtn').onclick = () => window.startFirebaseMultiplayer();
        }
      }
    });
  });
}

function renderFirebaseWaitingScreen() {
  let html = '';
  if (window.fbRoomId) html += `<div id="roomNameDisplay" style="font-size:13px; color:#555; margin-bottom:4px;">Room: ${window.fbRoomId}</div>`;
  html += `<h2>Waiting for opponent to join...</h2>`;
  html += `<button id="leaveBtn">Leave Room</button>`;
  document.getElementById('app').innerHTML = html;
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
let fbCharSelectTimeout = null;
let fbImgSelectTimeout = null;

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
  let charSelectTime = 30;
  document.getElementById('app').innerHTML = `
    <h2>${fbPlayerNum === 0 ? 'Player 1' : 'Player 2'}: Choose your character</h2>
    <div id="fbCharSelect" class="char-select"></div>
    <div id="fbStatus" style="margin:12px 0; color:#333; font-weight:bold;"></div>
    <div id="fbTimer" style="margin:8px 0; color:#555;"></div>
    <button id="backBtn">Back</button>
  `;
  // Always clear previous timer
  if (fbCharSelectTimeout) clearInterval(fbCharSelectTimeout);
  const charDiv = document.getElementById('fbCharSelect');
  window.characters.forEach((char, idx) => {
    const mainImg = char.images[0];
    if (!mainImg) return;
    const btn = document.createElement('button');
    btn.innerHTML = `<img src="assets/${char.folder}/${mainImg}" alt="${char.name}" width="80"><br>${char.name}`;
    btn.disabled = alreadyPicked;
    btn.onclick = () => {
      if (alreadyPicked) return;
      clearInterval(fbCharSelectTimeout);
      // Only set character and charIdx, NOT the image yet - that comes in image selection
      fbPlayers[fbPlayerNum] = { 
        ...fbPlayers[fbPlayerNum], 
        character: char.name, 
        charIdx: idx,
        image: null // Clear any previous image
      };
      console.log(`Player ${fbPlayerNum} picked character: ${char.name}`);
      set(fbRoomRef, { players: fbPlayers, board: fbBoard, currentPlayer: 0, gameActive: false });
    };
    charDiv.appendChild(btn);
  });
  document.getElementById('backBtn').onclick = () => window.startFirebaseMultiplayer();
  // Show waiting message if already picked
  if (alreadyPicked) {
    document.getElementById('fbStatus').innerText = 'Waiting for other player to pick...';
    // Block further input until both picked
    if (fbPlayers[0]?.character && fbPlayers[1]?.character) {
      renderFirebaseImageSelect(fbPlayers[fbPlayerNum].charIdx);
    }
  } else {
    // Start countdown timer for auto-pick
    let timer = charSelectTime;
    document.getElementById('fbTimer').innerText = `Auto-pick in ${timer} seconds...`;
    fbCharSelectTimeout = setInterval(() => {
      timer--;
      if (timer > 0) {
        document.getElementById('fbTimer').innerText = `Auto-pick in ${timer} seconds...`;
      } else {
        clearInterval(fbCharSelectTimeout);
        // Auto-pick first available character (but not image yet)
        let idx = 0;
        fbPlayers[fbPlayerNum] = { 
          ...fbPlayers[fbPlayerNum], 
          character: window.characters[idx].name, 
          charIdx: idx,
          image: null 
        };
        console.log(`Auto-picked character for Player ${fbPlayerNum}: ${window.characters[idx].name}`);
        set(fbRoomRef, { players: fbPlayers, board: fbBoard, currentPlayer: 0, gameActive: false });
      }
    }, 1000);
  }
}

function renderFirebaseImageSelect(charIdx) {
  const char = window.characters[charIdx];
  let imgSelectTime = 30;
  let html = '';
  if (window.fbRoomId) html += `<div id="roomNameDisplay" style="font-size:13px; color:#555; margin-bottom:4px;">Room: ${window.fbRoomId}</div>`;
  html += `<h2>${fbPlayers[fbPlayerNum].name}: Choose your ${char.name} picture</h2>`;
  html += `<div id="fbImgSelect" class="char-select"></div>`;
  html += `<div id="fbStatus" style="margin:12px 0; color:#333; font-weight:bold;"></div>`;
  html += `<div id="fbTimer" style="margin:8px 0; color:#555;"></div>`;
  html += `<button id="backBtn">Back</button>`;
  document.getElementById('app').innerHTML = html;
  // Always clear previous timer
  if (fbImgSelectTimeout) clearInterval(fbImgSelectTimeout);
  const imgDiv = document.getElementById('fbImgSelect');
  let alreadyPicked = fbPlayers[fbPlayerNum] && fbPlayers[fbPlayerNum].image;
  char.images.forEach((img, i) => {
    const btn = document.createElement('button');
    btn.innerHTML = `<img src="assets/${char.folder}/${img}" alt="${char.name}" width="80">`;
    btn.disabled = alreadyPicked;
    btn.onclick = () => {
      if (alreadyPicked) return;
      clearInterval(fbImgSelectTimeout);
      fbPlayers[fbPlayerNum].image = `assets/${char.folder}/${img}`;
      set(fbRoomRef, { players: fbPlayers, board: fbBoard, currentPlayer: 0, gameActive: false });
    };
    imgDiv.appendChild(btn);
  });
  document.getElementById('backBtn').onclick = () => renderFirebaseCharacterSelect();
  // Show waiting message if already picked
  if (alreadyPicked) {
    document.getElementById('fbStatus').innerText = 'Waiting for other player to pick...';
    // Block further input until both picked
    if (fbPlayers[0]?.image && fbPlayers[1]?.image) {
      // Both picked, advance to game (handled by state listener)
    }
  } else {
    // Start countdown timer for auto-pick
    let timer = imgSelectTime;
    document.getElementById('fbTimer').innerText = `Auto-pick in ${timer} seconds...`;
    fbImgSelectTimeout = setInterval(() => {
      timer--;
      if (timer > 0) {
        document.getElementById('fbTimer').innerText = `Auto-pick in ${timer} seconds...`;
      } else {
        clearInterval(fbImgSelectTimeout);
        // Auto-pick first available image
        fbPlayers[fbPlayerNum].image = `assets/${char.folder}/${char.images[0]}`;
        set(fbRoomRef, { players: fbPlayers, board: fbBoard, currentPlayer: 0, gameActive: false });
      }
    }, 1000);
  }
}

function renderFirebaseBoard() {
  let html = '';
  if (window.fbRoomId) html += `<div id="roomNameDisplay" style="font-size:13px; color:#555; margin-bottom:4px;">Room: ${window.fbRoomId}</div>`;
  html += `<h2>${fbPlayers[0]?.character || 'Player 1'} vs ${fbPlayers[1]?.character || 'Player 2'}</h2>`;
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
  if (fbGameActive) {
    if (fbCurrentPlayer === fbPlayerNum) {
      html += `<div id="fbStatus" style="margin:12px 0; color:#2E7D32; font-weight:bold; font-size:16px;">🎮 Your turn! Choose a cell</div>`;
    } else {
      html += `<div id="fbStatus" style="margin:12px 0; color:#FF6B35; font-weight:bold; font-size:16px;">⏳ Waiting for ${fbPlayers[fbCurrentPlayer]?.character || 'opponent'}...</div>`;
    }
  } else {
    // Game ended - show winner announcement
    const winner = window.fbGameWinner;
    if (winner === 'draw') {
      html += `<div id="fbStatus" style="margin:12px 0; color:#FFA500; font-weight:bold; font-size:18px;">🤝 It's a Draw!</div>`;
    } else if (winner !== undefined) {
      const winnerPlayer = fbPlayers[winner];
      const winnerName = winnerPlayer?.character || `Player ${winner}`;
      html += `<div id="fbStatus" style="margin:12px 0; color:#4CAF50; font-weight:bold; font-size:18px;">🎉 ${winnerName} Wins! 🎉</div>`;
    } else {
      html += `<div id="fbStatus" style="margin:12px 0; color:#666; font-weight:bold;">Game ended</div>`;
    }
  }
  html += `<button id="restartBtn">Restart</button>`;
  html += `<button id="leaveBtn">Leave Room</button>`;
  document.getElementById('app').innerHTML = html;

  console.log(`Attaching click handlers - current player: ${fbCurrentPlayer}, my player: ${fbPlayerNum}, game active: ${fbGameActive}`);
  document.querySelectorAll('.cell').forEach(cell => {
    cell.onclick = (e) => onFirebaseCellClick(e);
    
    // Add visual feedback for clickable cells
    const idx = parseInt(cell.getAttribute('data-idx'));
    if (fbBoard[idx] === null && fbCurrentPlayer === fbPlayerNum && fbGameActive) {
      cell.style.cursor = 'pointer';
      cell.style.border = '2px solid #4CAF50';
      cell.title = 'Click to make your move!';
      console.log(`Cell ${idx} is clickable for player ${fbPlayerNum}`);
    } else {
      cell.style.cursor = 'default';
      cell.style.border = '1px solid #ddd';
      if (fbBoard[idx] !== null) {
        cell.title = 'Cell already taken';
      } else if (fbCurrentPlayer !== fbPlayerNum) {
        cell.title = 'Wait for your turn';
      }
    }
  });
  
  document.getElementById('restartBtn').onclick = () => {
    console.log('Restarting game...');
    // Reset the game state
    const resetState = {
      players: fbPlayers,
      board: Array(9).fill(null),
      currentPlayer: 0,
      gameActive: true
    };
    delete resetState.winner;
    set(fbRoomRef, resetState);
  };
  document.getElementById('leaveBtn').onclick = () => {
    if (fbUnsub) fbUnsub();
    // Remove player from room
    get(fbRoomRef).then(snap => {
      const val = snap.val();
      if (val && val.players) {
        val.players[fbPlayerNum] = null;
        set(fbRoomRef, { ...val, players: val.players });
        // If both players left, remove room
        if (!val.players[0] && !val.players[1]) {
          remove(fbRoomRef);
        }
      }
    });
    fbRoomId = null;
    fbRoomRef = null;
    fbUnsub = null;
    if (window.renderStartScreen) window.renderStartScreen();
  };
  // ...existing code...
}

function onFirebaseCellClick(e) {
  console.log(`Click attempt - Player: ${fbPlayerNum}, Current turn: ${fbCurrentPlayer}, Game active: ${fbGameActive}`);
  
  // Only allow moves if it's this player's turn and game is active
  if (!fbGameActive) {
    console.log('Game not active, click ignored');
    return;
  }
  if (fbCurrentPlayer !== fbPlayerNum) {
    console.log(`Not your turn - current: ${fbCurrentPlayer}, you: ${fbPlayerNum}`);
    return;
  }
  
  const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
  
  // Ensure we have a proper 9-element board before checking the cell
  const currentBoard = Array(9).fill(null);
  for (let i = 0; i < 9; i++) {
    currentBoard[i] = fbBoard[i] !== undefined ? fbBoard[i] : null;
  }
  
  console.log(`Checking cell ${idx}: board[${idx}] = ${currentBoard[idx]}, full board:`, currentBoard);
  
  if (currentBoard[idx] !== null && currentBoard[idx] !== undefined) {
    console.log(`Cell ${idx} already taken by player ${currentBoard[idx]}`);
    return; // Cell already taken
  }
  
  console.log(`Player ${fbPlayerNum} making move at position ${idx}`);
  
  // Make the move locally first - ensure we have a proper 9-element array
  const newBoard = Array(9).fill(null);
  for (let i = 0; i < 9; i++) {
    newBoard[i] = currentBoard[i] !== undefined ? currentBoard[i] : null;
  }
  newBoard[idx] = fbPlayerNum;
  
  console.log('New board after move:', newBoard);
  
  // Check for winner
  const winner = checkFirebaseWin(newBoard);
  const isDraw = winner === 'draw';
  const gameEnded = winner !== null;
  
  console.log('Win check result:', { winner, isDraw, gameEnded, boardState: newBoard });
  
  // Play sounds for game ending
  if (gameEnded) {
    if (isDraw) {
      // Play draw sound if available
      if (typeof playDrawSound === 'function') playDrawSound();
    } else {
      // Play win sound if available  
      if (typeof playWinSound === 'function') playWinSound();
    }
  } else {
    // Play turn sound for regular moves
    if (typeof playTurnSound === 'function') playTurnSound();
  }
  
  // Calculate next player (if game continues)
  const nextPlayer = gameEnded ? fbCurrentPlayer : (1 - fbCurrentPlayer);
  
  console.log(`Move calculation: currentPlayer was ${fbCurrentPlayer}, nextPlayer will be ${nextPlayer}, gameEnded: ${gameEnded}`);
  
  // Update Firebase with the new state - ensure board is always a complete array
  const completeBoard = Array(9).fill(null);
  for (let i = 0; i < 9; i++) {
    completeBoard[i] = newBoard[i] !== undefined ? newBoard[i] : null;
  }
  
  const updates = {
    players: fbPlayers,
    board: completeBoard,
    currentPlayer: nextPlayer,
    gameActive: !gameEnded
  };
  
  if (gameEnded && winner !== null && winner !== 'draw') {
    updates.winner = winner;
  }
  
  console.log('Updating Firebase with complete board:', completeBoard, 'Updates:', updates);
  set(fbRoomRef, updates);
}

function checkFirebaseWin(board) {
  // Ensure we have a proper 9-element array
  const normalizedBoard = Array(9).fill(null);
  for (let i = 0; i < 9; i++) {
    normalizedBoard[i] = board[i] !== undefined ? board[i] : null;
  }
  
  console.log('WIN CHECK: Analyzing board:', normalizedBoard);
  
  const wins = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6] // diags
  ];
  
  // Check for Player 0 win
  if (wins.some(line => line.every(idx => normalizedBoard[idx] === 0))) {
    console.log('🎉 WINNER FOUND: Player 0!');
    return 0;
  }
  
  // Check for Player 1 win  
  if (wins.some(line => line.every(idx => normalizedBoard[idx] === 1))) {
    console.log('🎉 WINNER FOUND: Player 1!');
    return 1;
  }
  
  // Check for draw - all cells filled
  const filledCells = normalizedBoard.filter(cell => cell !== null).length;
  if (filledCells === 9) {
    console.log('🤝 DRAW detected - all 9 cells filled, no winner');
    return 'draw';
  }
  
  console.log(`➡️ Game continues - ${filledCells}/9 cells filled`);
  return null;
}

export { db, ref, push, set, onValue, remove, get, child, onDisconnect };
