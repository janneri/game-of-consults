# Game of Consults – Admin Guide

This guide explains how to configure, run, and manage a Game of Consults session as an administrator.

## 1. Prerequisites
- Node.js 18+ installed
- npm or yarn

## 2. Installation
```bash
npm install
npm run build
```

## 3. Starting the Game Server
```bash
npm start
```
- The server runs at `http://localhost:3000` by default.
- Open this URL in your browser to access the game UI.

## 4. Game Configuration

### Game Length
- By default, the game runs for **20 rounds**.
- To change the number of rounds, edit the `playRounds` property in `src/game-engine.ts`:
  ```typescript
  private playRounds = 20;  // Change to 50, 100, etc.
  ```

### Round Duration
- Each round lasts **2 seconds** by default.
- To adjust, edit `roundDelayMs` in `src/game-engine.ts`:
  ```typescript
  private roundDelayMs = 2000;  // Milliseconds between rounds
  ```

### Areas and Courses
- Areas and courses are defined in `src/constants.ts`.
- You can add or modify areas and courses to customize the game experience.

### Project Difficulty and Rewards
- Project parameters (required skills, rewards, due dates) are generated in `src/game-engine.ts`.
- You can adjust logic in `generateProject` to change project variety and challenge.

## 5. Registering Bots
- Use the provided scripts to register bots:
  - Register all example bots:
    ```bash
    ./send_all_bots.sh
    ```
  - Register a single bot:
    ```bash
    ./send_bot.sh bots/your-bot.scm "Your Bot Name"
    ```
- Bots must have unique names.

## 6. Running and Managing a Game Session
1. **Start the server:**
   ```bash
   npm start
   ```
2. **Open the UI** in a browser (projector-friendly for events).
3. **Register bots** using the scripts above.
4. **Click "Start Game"** in the UI to begin.
5. The game will run automatically for the configured number of rounds.
6. **Monitor the game** via the UI, which displays bot status, events, and leaderboards.

## 7. Resetting the Game
- To reset for a new session, restart the server or use the UI's reset button (if available).
- All bots and state will be cleared.

## 8. Troubleshooting
- **Bot not registering?** Ensure the server is running and the bot name is unique.
- **Game not starting?** At least one bot must be registered before starting.
- **Errors in the console?** Check for TypeScript errors or missing dependencies.

## 9. Customization
- You can extend the game by adding new skills, courses, areas, or special events.
- For advanced changes, modify the logic in `src/game-engine.ts` and `src/constants.ts`.

---

For bot development instructions, see [bots/bot_development_guide.md](bots/bot_development_guide.md).
