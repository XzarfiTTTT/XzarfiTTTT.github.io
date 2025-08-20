// Simple in-game chat for Firebase multiplayer
import { db, ref, push, onValue } from "./firebase.js";

let chatRoomRef = null;
let chatUnsub = null;

export function initChat(roomId, playerName) {
  chatRoomRef = ref(db, `fbrooms/${roomId}/chat`);
  const chatBox = document.createElement('div');
  chatBox.id = 'chatBox';
  chatBox.style = 'border:1px solid #aaa; background:#fff; padding:8px; margin:8px 0; max-width:320px; font-size:14px;';
  chatBox.innerHTML = `
    <div id="chatMessages" style="height:100px; overflow-y:auto; margin-bottom:6px;"></div>
    <input id="chatInput" type="text" maxlength="100" placeholder="Type a message..." style="width:70%"> <button id="chatSend">Send</button>
  `;
  setTimeout(() => {
    document.getElementById('app').appendChild(chatBox);
    document.getElementById('chatSend').onclick = sendMsg;
    document.getElementById('chatInput').onkeydown = (e) => { if (e.key === 'Enter') sendMsg(); };
  }, 100);

  function sendMsg() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;
    push(chatRoomRef, { name: playerName, msg, ts: Date.now() });
    input.value = '';
  }

  if (chatUnsub) chatUnsub();
  chatUnsub = onValue(chatRoomRef, (snap) => {
    const messages = snap.val() || {};
    const sorted = Object.values(messages).sort((a,b) => a.ts-b.ts);
    const msgDiv = document.getElementById('chatMessages');
    if (!msgDiv) return;
    msgDiv.innerHTML = sorted.map(m => `<div><b>${m.name}:</b> ${m.msg}</div>`).join('');
    msgDiv.scrollTop = msgDiv.scrollHeight;
  });
}

export function destroyChat() {
  if (chatUnsub) chatUnsub();
  const chatBox = document.getElementById('chatBox');
  if (chatBox) chatBox.remove();
}
