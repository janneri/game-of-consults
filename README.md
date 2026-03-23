# 🎮 Game of Consults

A competitive programming game where you write Scheme code for an AI bot (consultant), submit it to the server, and watch it compete for money by learning skills and completing projects. The server interprets your bot's code: each round, it provides the full game state as input and expects your code to return a single move (action) in response.

## Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation
```bash
npm install
npm run build
npm start
```
The server will start at `http://localhost:3000`. Open this URL in your browser to see the game visualization.

### Register Bots and Play
```bash
# Register example bots
./send_all_bots.sh
# Or register a single bot
curl -X POST "http://localhost:3000/register-bot?name=MyBot" \
  --data-binary @bots/hard-market-bot.scm
```
Then click **"Start Game"** in the browser to begin the competition!

## Game Overview

- **Write Scheme code for your bot** (R5RS)
- **Submit your bots code to the server**
- Each round, the server interprets your code, giving it the current game state and expecting a single move (action) as a return value
- Bots compete to earn the most money by completing projects
- Bots learn skills by taking courses
- Energy management is critical – burned-out bots are eliminated!
- After 20 rounds, the bot with the most money wins

The game simulates a consulting marketplace with four areas:
- **Education** – Take courses to learn skills
- **Relaxation** – Rest to restore energy
- **Easy Market** – Complete simple projects for steady income
- **Hard Market** – Tackle complex projects for big rewards

## Bot Development

You write your bot as Scheme code and submit it to the server. The server will interpret your code, providing the current game state as input and expecting your code to return a single move (action) each round. See [Bot Development Guide](bots/bot_development_guide.md) for all instructions on creating, testing, and submitting your bot, as well as the full Scheme API and example strategies.

## Game Mechanics

- Projects require specific skills and can be completed solo or collaboratively
- Courses teach skills and cost energy
- Resting restores energy
- Invalid actions or running out of energy penalize bots

## Areas Explained

### 📚 Education Area
- Take courses to learn skills (costs energy, no money required)
- Multiple skills can be learned from one course

### 🌴 Relaxation Area
- Rest to restore energy (+10 to +30 per turn)
- Various activities available (beer, yoga, coffee, etc.)
- No money earned, but essential to avoid burnout

### 💼 Easy Market
- Simple projects requiring 1-2 basic skills
- Rewards: $50-100 per project
- Lower energy requirements
- Good for steady income

### 🏢 Hard Market
- Complex projects requiring 3-5 advanced skills
- Rewards: $200-250 per project
- Higher energy costs
- Risk vs. reward

## Turn Resolution

Each round:
1. Bots act in random order
2. Each bot receives the full game state
3. Bot executes and returns one action
4. All actions are processed
5. Projects with enough offers are completed
6. Rewards are distributed
7. Energy is updated
8. Next round begins

## Project Structure

```
gameofconsults/
├── src/                  # Game logic and server
├── bots/                 # Example bots and bot development guide
├── public/               # Game UI
└── README.md             # This file
```

## Running Tests

```bash
npm test
node test-bot-interpreter.js
```

## License

MIT License - Feel free to use and modify!

---

**Ready to compete? Write your bot and may the best consultant win! 🏆**
