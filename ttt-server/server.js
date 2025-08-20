const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors({ origin: ['https://xzarfitttt.github.io'] })); // your GitHub Pages origin
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: ['https://xzarfitttt.github.io'] } });

const rooms = new Map(); // roomId -> { board:Array(9), turn:'X'|'O' }

io.on('connection', (socket) => {
  socket.on('join', (roomId) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) rooms.set(roomId, { board: Array(9).fill(null), turn: 'X' });
    io.to(roomId).emit('state', rooms.get(roomId));
  });

  socket.on('move', ({ roomId, index }) => {
    const r = rooms.get(roomId);
    if (!r || r.board[index] || winner(r.board)) return;
    r.board[index] = r.turn;
    r.turn = r.turn === 'X' ? 'O' : 'X';
    io.to(roomId).emit('state', r);
  });

  socket.on('reset', (roomId) => {
    rooms.set(roomId, { board: Array(9).fill(null), turn: 'X' });
    io.to(roomId).emit('state', rooms.get(roomId));
  });
});

function winner(b){
  return [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
    .some(([a,b2,c]) => b[a] && b[a]===b[b2] && b[a]===b[c]);
}

server.listen(3000, () => console.log('Server on :3000'));
