# Firebase Multiplayer Support

## Features

- **Firebase Realtime Database** powers the multiplayer matchmaking, room management, and game state sync.
- **Matchmaking Queue:** Players enter a queue and are paired automatically. Only two players per room.
- **Character & Image Selection:** Each player picks their character and image. Buttons are disabled after picking, and a waiting message is shown until both have picked.
- **Game Start:** The game board appears only after both players have picked their character and image.
- **Turn Sync:** Only the current player can make a move. Clear status messages indicate whose turn it is. Moves are locked until the state updates.
- **Player Leaves:** If a player leaves the room, the other player is notified and returned to the main menu.
- **Robust Sync:** All state changes are handled via Firebase listeners, so both clients always see the latest state. Stale data and out-of-sync issues are prevented.

## How it Works

1. **Find Match:** Click "Firebase Multiplayer" and then "Find Match". You will be paired with another player in the queue.
2. **Character Selection:** Both players pick their character and image. You cannot pick more than once.
3. **Game Play:** The game starts when both are ready. Only one move per turn is allowed.
4. **Leaving:** If a player leaves, the other is notified and sent back to the menu.

## Good Practices

- All UI is designed to prevent double-picking, double-moves, and stale state.
- All game and player state is stored in Firebase and updated in real time.
- The code is robust against disconnects, reloads, and race conditions.

---

Enjoy playing  Tic-Tac-Toe with friends online!
#  Tic-Tac-Toe

This is a web-based Tic-Tac-Toe game themed with characters. Players can choose their favorite character and image from the assets, and play against another player or the computer.

## Features
- Play Tic-Tac-Toe with  character images
- Choose from a wide variety of character images for each player
- 2 Player mode: Both players select their character and image
- 1 Player mode: Play against the computer, which picks a random character and image
- Fun sound effects for turns, wins, and draws
- Responsive, kid-friendly UI

## How to Play
1. Open `index.html` in your browser.
2. Choose either "2 Player" or "1 Player" mode.
3. For each player, select a character and then an image for your game piece.
4. In 1 Player mode, the computer will randomly select its character and image.
5. Take turns clicking on the board to place your image. First to get 3 in a row wins!

## Assets
All character images are in the `assets/` folder, organized by character name.

## Sound
Sound effects are implemented in `sound.js` and play for turns, wins, and draws.

## Customization
You can add more images to the `assets/` folders to expand the character selection.

---
Made for fun! No affiliation with Paw Patrol or Spin Master.
