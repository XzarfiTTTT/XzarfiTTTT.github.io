// --- Private Multiplayer (Socket.IO over ngrok) ---

// Read server/room from URL so you don't redeploy when ngrok URL changes
const _params = new URLSearchParams(location.search);
const SERVER_URL = _params.get('server') || 'https://6cbfe665b773.ngrok-free.app';
const DEFAULT_ROOM = _params.get('room') || 'public';

let socket = null;
let mySide = null;      // 'X' or 'O'
let mpState = null;     // { board: [...], turn: 'X'|'O' }

window.startPrivateMultiplayer = function startPrivateMultiplayer() {
  document.getElementById('app').innerHTML = `
    <h2>Online Private Multiplayer</h2>
    <label>Room:
      <input id="roomInput" value="${DEFAULT_ROOM}" style="width: 140px">
    </label>
    <div style="margin:12px 0">
      <button id="joinX">Join as X</button>
      <button id="joinO">Join as O</button>
      <button id="backBtn">Back</button>
    </div>
    <p style="font-size:12px">Server: <code>${SERVER_URL}</code><br>
    Tip: pass a server with <code>?server=https://YOUR-TUNNEL.ngrok-free.app</code> and a room with <code>&room=friends</code>.</p>
  `;

  document.getElementById('backBtn').onclick = () => {
    if (window.renderStartScreen) window.renderStartScreen();
  };
  document.getElementById('joinX').onclick = () => joinRoom('X');
  document.getElementById('joinO').onclick = () => joinRoom('O');
};

function joinRoom(side) {
  mySide = side;
  const roomId = document.getElementById('roomInput').value.trim() || 'public';

  // connect
  socket = io(SERVER_URL, { transports: ['websocket'] }); // use wss via https
  socket.on('connect', () => {
    socket.emit('join', roomId);
  });

  // receive authoritative state from server
  socket.on('state', (state) => {
    mpState = state; // {board:Array(9), turn:'X'|'O'}
    renderBoardMP(roomId);
  });

  socket.on('disconnect', () => {
    const ti = document.getElementById('turnInfo');
    if (ti) ti.textContent += ' (disconnected)';
  });
}

function renderBoardMP(roomId) {
  let html = `
    <h2>Room: ${roomId} • You are ${mySide}</h2>
    <div id="ttt-board" class="ttt-board">
  `;
  for (let i = 0; i < 9; i++) {
    const v = mpState.board[i];
    html += `<div class="cell" data-idx="${i}">${v ? v : ''}</div>`;
  }
  html += `</div>
    <h3 id="turnInfo">Turn: ${mpState.turn}</h3>
    <button id="resetBtn">Reset</button>
    <button id="leaveBtn">Leave</button>
  `;
  document.getElementById('app').innerHTML = html;

  // click to play
  document.querySelectorAll('.cell').forEach(cell => {
    cell.onclick = () => {
      const idx = +cell.getAttribute('data-idx');
      if (!mpState || mpState.board[idx]) return;     // occupied
      if (mySide !== mpState.turn) return;            // not your turn
      socket.emit('move', { roomId, index: idx });    // server updates & broadcasts new state
    };
  });

  document.getElementById('resetBtn').onclick = () => socket.emit('reset', roomId);
  document.getElementById('leaveBtn').onclick = () => {
    if (window.renderStartScreen) window.renderStartScreen();
  };
}

