import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { GameEngine } from './game-engine';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const gameEngine = new GameEngine();

// Setup game engine callbacks for broadcasting

gameEngine.setOnStateChange(() => {
  io.emit('gameState', gameEngine.getState());
});
gameEngine.setOnGameEnd(() => {
  io.emit('gameOver', gameEngine.getState());
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Bot registration endpoint - allow at any time
app.post('/register-bot', express.text({ type: '*/*' }), (req, res) => {
  const name = req.query.name;
  const code = req.body;

  // Validation
  if (typeof name !== 'string' || name.length === 0 || name.length > 12) {
    return res.status(400).json({ error: 'Name must be a non-empty string up to 12 characters.' });
  }
  if (typeof code !== 'string' || code.trim().length === 0) {
    return res.status(400).json({ error: 'Code must be non-empty plain text.' });
  }
  // Check uniqueness (case-insensitive)
  const bots = gameEngine.getState().bots;
  if (bots.some(bot => bot.name.toLowerCase() === name.toLowerCase())) {
    return res.status(400).json({ error: 'Name must be unique.' });
  }

  // Register bot
  const ok = gameEngine.registerBot({ name, code });
  if (!ok) {
    return res.status(500).json({ error: 'Failed to register bot.' });
  }
  res.json({ ok: true, message: `Bot ${name} registered successfully!` });
});

// Remove bot endpoint
app.post('/remove-bot', (req, res) => {
  const name = req.query.name;
  if (typeof name !== 'string' || name.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid bot name.' });
  }
  const ok = gameEngine.removeBot(name);
  if (!ok) {
    return res.status(404).json({ error: 'Bot not found.' });
  }
  res.json({ ok: true, message: `Bot ${name} removed.` });
});

// Start game endpoint
app.post('/start-game', (req, res) => {
  const started = gameEngine.startGame();
  if (!started) {
    const state = gameEngine.getState();
    if (state.phase !== 'start') {
      return res.status(400).json({ error: 'Game already started or ended.' });
    }
    if (state.bots.length === 0) {
      return res.status(400).json({ error: 'Cannot start game with no bots. Register at least one bot first.' });
    }
    return res.status(500).json({ error: 'Failed to start game.' });
  }
  res.json({ ok: true, message: 'Game started!' });
});

// Reset game endpoint
app.post('/reset-game', (req, res) => {
  gameEngine.resetGame();
  res.json({ ok: true, message: 'Game reset to start phase.' });
});

// Game state endpoint (for testing/debugging)
app.get('/game-state', (req, res) => {
  res.json(gameEngine.getState());
});

// Replay game endpoint: reset stats but keep bots
app.post('/replay-game', (req, res) => {
  gameEngine.replayGame();
  res.json({ ok: true, message: 'Game replayed with same bots.' });
});

io.on('connection', (socket) => {
  // Send initial game state
  socket.emit('gameState', gameEngine.getState());
  // TODO: Listen for events if needed
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Game server running on http://localhost:${PORT}`);
});
