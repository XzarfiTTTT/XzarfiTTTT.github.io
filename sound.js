// --- Simple Sound Effects ---
function playBeep(freq) {
	try {
		const ctx = new (window.AudioContext || window.webkitAudioContext)();
		const o = ctx.createOscillator();
		const g = ctx.createGain();
		o.type = 'sine';
		o.frequency.value = freq;
		g.gain.value = 0.1;
		o.connect(g).connect(ctx.destination);
		o.start();
		o.stop(ctx.currentTime + 0.2);
		o.onended = () => ctx.close();
	} catch (e) {}
}

function playWinSound() {
	// Play a short melody for victory
	const melody = [880, 1046, 1318, 1046, 880];
	melody.forEach((freq, i) => {
		setTimeout(() => playBeep(freq), i * 180);
	});
}

function playDrawSound() { playBeep(440); }
function playTurnSound() { playBeep(660); }
