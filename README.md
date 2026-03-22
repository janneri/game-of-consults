# 🎮 Game of Consults

A competitive programming game where developers create AI bots (consultants) that compete for money by learning skills and completing projects. Bots are written in Scheme and battle it out in a simulated consulting market!

## 📖 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [For Game Admins](#for-game-admins)
- [For Bot Developers](#for-bot-developers)
- [Game Mechanics](#game-mechanics)
- [Example Bots](#example-bots)

---

## Overview

**Game of Consults** is a turn-based strategy game where:
- 🤖 Players write bots in **Scheme** (a Lisp dialect)
- 💰 Bots compete to earn the most money by completing projects
- 📚 Bots learn skills by taking courses
- ⚡ Energy management is critical - burned-out bots are eliminated!
- 🏆 After 20 rounds, the bot with the most money wins

The game simulates a consulting marketplace with four areas:
- **📚 Education** - Take courses to learn skills
- **🌴 Relaxation** - Rest to restore energy
- **💼 Easy Market** - Complete simple projects for steady income
- **🏢 Hard Market** - Tackle complex projects for big rewards

---

## Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Start the game server
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

---

## For Game Admins

### Running a Game Session

1. **Start the server:**
   ```bash
   npm start
   ```
   Opens server at `http://localhost:3000`

2. **Open the UI** in a browser (works great on a projector!)

3. **Register bots** - Players submit their bots via curl commands or the provided scripts

4. **Start the game** - Click the "▶️ Start Game" button when ready

5. **Watch the action** - The UI shows real-time bot movements, project completions, and leaderboard

6. **Game ends automatically** after 20 rounds

7. **Replay** - Click "Replay" to run the same bots again, or "Reset" to clear everything

### Game Configuration

Edit these constants in `src/constants.ts`:

```typescript
// Number of rounds
export const INITIAL_BOT_MONEY = 0;      // Starting money
export const INITIAL_BOT_ENERGY = 100;   // Starting energy
export const PROJECT_SUCCESS_ENERGY_COST = 10;  // Energy per project
```

Edit `src/game-engine.ts` to change rounds:
```typescript
private playRounds = 20;  // Change to desired number of rounds
```

### Managing Bots

**During Start Phase:**
- Bots can be registered at any time
- Remove bots by clicking the × button next to their name
- Reset game to clear all bots and start fresh

**During Play Phase:**
- New bots can still be registered and will join immediately
- Watch the "Recent Activity" feed to see what bots are doing

**Game Controls:**
- ▶️ **Start Game** - Begins the 20-round competition (requires at least 1 bot)
- 🔄 **Reset Game** - Clears all bots and returns to start phase
- 🔁 **Replay** - Runs the same bots again (appears after game ends)

### Troubleshooting

**Bots not appearing?**
```bash
# Check if bot registration succeeded
curl -X POST "http://localhost:3000/register-bot?name=TestBot" \
  --data-binary @bots/easy-market-bot.scm
```

**Server won't start?**
```bash
# Rebuild the project
npm run build
npm start
```

**Bots behaving strangely?**
```bash
# Test bot syntax locally
node test-bot-interpreter.js bots/your-bot.scm
```

---

## For Bot Developers

### Writing Your First Bot

Bots are written in **Scheme** (R5RS compatible via BiwaScheme). Your bot receives the game state and must return one action per turn.

#### Minimal Example

```scheme
;; Simple bot that learns Python then does easy projects
(let* ((me (self state))
       (my-energy (energy me))
       (my-area (area me))
       (python-level (skill me "python")))
  (cond
    ;; Low energy? Go rest
    ((< my-energy 40)
     (if (eq? my-area "relaxation")
         (rest)
         (move "relaxation")))
    
    ;; Need Python skills? Go learn
    ((< python-level 2)
     (if (eq? my-area "education")
         (study "python-basics")
         (move "education")))
    
    ;; Otherwise, work on easy projects
    (else
      (if (eq? my-area "easy-market")
          (let ((proj (find (lambda (p)
                              (and (eq? (project-area p) "easy-market")
                                   (has-enough-skills me p)))
                            (projects state))))
            (if proj
                (offer-project (project-id proj))
                (rest)))
          (move "easy-market")))))
```

### Available Actions

Your bot must return ONE action per turn:

```scheme
(rest)                      ; Rest in relaxation area
(move "area-name")          ; Move to: education, relaxation, easy-market, hard-market
(study "course-id")         ; Take a course (see Available Courses below)
(offer-project project-id)  ; Work on a project
(chat "message")            ; Say something (optional, for fun!)
```

### Available Courses

Courses teach multiple skills at once:

| Course ID | Course Name | Skills Gained | Energy Cost |
|-----------|-------------|---------------|-------------|
| `python-basics` | Python Basics | python +1 | 5 |
| `python-advanced` | Advanced Python | python +2 | 8 |
| `javascript-fundamentals` | JavaScript Fundamentals | javascript +1 | 5 |
| `javascript-advanced` | Advanced JavaScript | javascript +2 | 8 |
| `ml-intro` | ML Introduction | ml +1, python +1 | 7 |
| `ml-advanced` | Advanced ML | ml +2, python +1 | 10 |
| `devops-basics` | DevOps Basics | devops +1 | 5 |
| `devops-advanced` | Advanced DevOps | devops +2, docker +1 | 9 |
| `azure-cloud` | Azure Cloud | azure +2 | 6 |
| `docker-mastery` | Docker Mastery | docker +2, devops +1 | 8 |
| `kubernetes-fundamentals` | Kubernetes Fundamentals | kubernetes +2, docker +1, devops +1 | 12 |
| `fullstack-bootcamp` | Full Stack Bootcamp | python +1, javascript +1, azure +1 | 10 |

💡 **Pro Tip:** Use `fullstack-bootcamp` to get 3 skills at once!

### Helper Functions

The game provides these built-in functions:

#### Getting Information
```scheme
(self state)                    ; Get your bot object
(energy bot)                    ; Get bot's energy (0-100)
(money bot)                     ; Get bot's money
(area bot)                      ; Get bot's current area
(skill bot "skill-name")        ; Get bot's skill level (0 if not learned)
(projects state)                ; Get all available projects
(courses state)                 ; Get all available courses
```

#### Checking Project Compatibility
```scheme
(has-enough-skills bot project)          ; Returns #t if you can do the project
(project-area project)                   ; Get project's area
(project-id project)                     ; Get project's ID
(course-id course)                       ; Get course's ID
(course-name course)                     ; Get course's name
(find pred list)                         ; Find first matching item
(filter pred list)                       ; Filter list by predicate
(sort list less-than?)                   ; Sort list
(length list)                            ; Get list length
```

### Smart Bot Strategy

Here's a smarter bot that analyzes projects and learns what's needed:

```scheme
;; Adaptive bot that learns based on available projects
(let* ((me (self state))
       (my-energy (energy me))
       (my-area (area me))
       (my-skills (cdr (assoc 'skills me))))

  ;; Helper: Find what skill we're missing for a project
  (define (get-missing-skill proj)
    (let ((reqs (cdr (assoc 'requiredSkills proj))))
      (find (lambda (req)
              (let* ((skill (car req))
                     (level (cdr req))
                     (my-level (let ((pair (assoc skill my-skills)))
                                 (if pair (cdr pair) 0))))
                (< my-level level)))
            reqs)))

  ;; Helper: Find course that teaches a skill
  (define (find-course-for-skill skill-name)
    (find (lambda (c)
            (let ((gains (cdr (assoc 'skillsGained c))))
              (assoc skill-name gains)))
          (courses state)))

  (cond
    ;; Rest when low energy
    ((< my-energy 40)
     (if (eq? my-area "relaxation")
         (rest)
         (move "relaxation")))

    ;; Can we do any projects? If not, learn!
    ((not (find (lambda (p) (has-enough-skills me p)) (projects state)))
     (if (eq? my-area "education")
         ;; Find what skill we need
         (let* ((target-proj (car (projects state)))
                (missing (if target-proj (get-missing-skill target-proj) #f)))
           (if missing
               (let ((course (find-course-for-skill (car missing))))
                 (if course
                     (study (course-id course))
                     (study "fullstack-bootcamp")))
               (study "fullstack-bootcamp")))
         (move "education")))

    ;; Work on projects!
    (else
      (if (eq? my-area "easy-market")
          (let ((proj (find (lambda (p)
                              (and (eq? (project-area p) "easy-market")
                                   (has-enough-skills me p)))
                            (projects state))))
            (if proj
                (offer-project (project-id proj))
                (rest)))
          (move "easy-market")))))
```

### Testing Your Bot

Before submitting, test your bot locally:

```bash
# Test a single bot
node test-bot-interpreter.js bots/your-bot.scm

# Test all bots
node test-bot-interpreter.js
```

If your bot passes the test, it's ready to register!

### Registering Your Bot

```bash
# Option 1: Use the provided script
./send_bot.sh bots/your-bot.scm "YourBotName"

# Option 2: Use curl directly
curl -X POST "http://localhost:3000/register-bot?name=YourBotName" \
  --data-binary @bots/your-bot.scm
```

**Bot Name Rules:**
- Must be unique (case-insensitive)
- Max 12 characters
- Appears in the UI and leaderboard

### Energy Management Tips

⚡ **Energy is crucial!** Here's what costs energy:

| Action | Energy Cost |
|--------|-------------|
| Moving between areas | -2 |
| Taking a course | -5 to -12 (varies by course) |
| Completing a project | -10 |
| Failed project | -3 |
| Invalid action | -2 |
| Resting in relaxation | +10 to +30 (random) |

**Strategy:** Keep energy above 40 to ensure you can complete projects (cost: 10) and move (cost: 2) without burning out!

### Project Rewards

💰 Projects in different areas have different rewards:

- **Easy Market**: $50-100 per project, requires 1-2 simple skills
- **Hard Market**: $200-250 per project, requires 3-5 advanced skills

**Collaboration:** Multiple bots can work on the same project together! If the combined skills meet requirements, all bots split the reward equally.

---

## Game Mechanics

### Game Flow

1. **Start Phase** - Bots register, admin starts when ready
2. **Play Phase** - 20 rounds of competition (2 seconds per round)
3. **End Phase** - Leaderboard shows final rankings

### Areas Explained

#### 📚 Education Area
- Take courses to learn skills
- Courses cost energy but are free (no money cost)
- Multiple skills can be learned from one course
- Example: `fullstack-bootcamp` teaches Python, JavaScript, and Azure
- UI shows all available courses with their skill gains

#### 🌴 Relaxation Area
- Rest to restore energy (+10 to +30 per turn)
- Various activities available: beer 🍺, yoga 🧘, coffee ☕, etc.
- No money earned, but essential to avoid burnout!
- UI shows available activities and their energy restoration

#### 💼 Easy Market
- Simple projects requiring 1-2 basic skills
- Rewards: $50-100 per project
- Lower energy requirements
- Good for steady income
- UI shows available projects with skill requirements

#### 🏢 Hard Market
- Complex projects requiring 3-5 advanced skills
- Rewards: $200-250 per project
- Higher energy costs
- Risk vs. reward - are you skilled enough?
- UI shows available projects with skill requirements

### Turn Resolution

Each round:
1. Bots act in **random order**
2. Each bot receives the full game state
3. Bot executes and returns one action
4. All actions are processed
5. Projects with enough offers are completed
6. Rewards are distributed
7. Energy is updated
8. Next round begins

### Winning Strategies

**🎯 Efficient Learning**
- Start with `fullstack-bootcamp` to get 3 skills quickly
- Look at what skills projects actually need
- Don't over-study - get to work ASAP!

**⚡ Energy Management**
- Rest when energy drops below 40
- Projects cost 10 energy - plan ahead!
- Balance work and rest cycles

**💰 Money Making**
- Easy projects = safe, steady income
- Hard projects = risky but lucrative
- Consider collaborating with other bots

---

## For Game Admins

### Setup and Running

```bash
# First time setup
npm install
npm run build

# Start the server
npm start
# or use the shortcut
./start.sh
```

Server runs at `http://localhost:3000` - open in browser for the game UI.

### Running a Competition

1. **Prepare** - Have players write their bots ahead of time
2. **Collect** - Players place their `.scm` files in the `bots/` folder
3. **Register** - Run `./send_all_bots.sh` or let players register via curl
4. **Start** - Click "▶️ Start Game" in the UI
5. **Watch** - Enjoy the show! Game runs for 20 rounds (~40 seconds)
6. **Replay** - Click "🔁 Replay" to run again, or "🔄 Reset" to start fresh

### Controlling the Game

#### In the UI:
- **Start Game** - Begins the competition (start phase only, requires ≥1 bot)
- **Reset Game** - Clears all bots and returns to start (available anytime)
- **Replay** - Re-runs the same bots from scratch (end phase only)

#### Via API:
```bash
# Start game
curl -X POST http://localhost:3000/start-game

# Reset game
curl -X POST http://localhost:3000/reset-game

# Replay game
curl -X POST http://localhost:3000/replay-game

# Remove a bot
curl -X POST "http://localhost:3000/remove-bot?name=BotName"

# Get current state (for debugging)
curl http://localhost:3000/game-state
```

### Configuration

**Change number of rounds:**
Edit `src/game-engine.ts`:
```typescript
private playRounds = 20;  // Change to 50, 100, etc.
```

**Change round speed:**
Edit `src/game-engine.ts`:
```typescript
private roundDelayMs = 2000;  // Milliseconds between rounds
```

Then rebuild: `npm run build`

### Troubleshooting

**Port 3000 already in use?**
```bash
# Kill existing server
pkill -f "node dist/server.js"
# or change port
PORT=3001 npm start
```

**UI not updating?**
- Check browser console for WebSocket errors
- Refresh the page
- Restart the server

**Bots getting eliminated?**
- Check they're managing energy properly (rest when < 40)
- Verify they're using valid course IDs
- Check Recent Activity feed for error messages

---

## For Bot Developers

### Bot Development Workflow

1. **Write** your bot in Scheme (`.scm` file)
2. **Test** locally: `node test-bot-interpreter.js bots/your-bot.scm`
3. **Register** with server: `./send_bot.sh bots/your-bot.scm "YourName"`
4. **Watch** it compete!

### Bot Structure

```scheme
;; Your bot receives 'state' variable automatically
;; Return ONE action per turn

(let* ((me (self state))           ; Get your bot
       (my-energy (energy me))     ; Get your energy
       (my-area (area me)))        ; Get your location
  
  (cond
    ;; Add your decision logic here
    ((< my-energy 40) (rest))
    ((eq? my-area "education") (study "python-basics"))
    (else (move "easy-market"))))
```

### State Access Functions

```scheme
;; Bot information
(self state)                  ; Your bot object
(energy bot)                  ; Energy level (0-100)
(money bot)                   ; Money amount
(area bot)                    ; Current area
(skill bot "skill-name")      ; Skill level (0 if not learned)

;; Game queries
(projects state)              ; All available projects
(courses state)               ; All available courses
(find pred list)              ; Find first matching element

;; Project helpers
(project-area proj)           ; Get project's area
(project-id proj)             ; Get project's ID
(has-enough-skills bot proj)  ; Can you complete this project?

;; Course helpers
(course-id course)            ; Get course ID
(course-name course)          ; Get course name
(course-skills course)        ; Get skills gained
(course-energy-cost course)   ; Get energy cost
```

### Common Patterns

#### Pattern 1: Rest when tired
```scheme
((< my-energy 40)
 (if (eq? my-area "relaxation")
     (rest)
     (move "relaxation")))
```

#### Pattern 2: Learn what you need
```scheme
;; Check if you can do any projects
((not (find (lambda (p) (has-enough-skills me p)) (projects state)))
 (if (eq? my-area "education")
     (study "fullstack-bootcamp")  ; Get skills!
     (move "education")))
```

#### Pattern 3: Work on projects
```scheme
;; Find a project you can do
(let ((proj (find (lambda (p)
                    (and (eq? (project-area p) "easy-market")
                         (has-enough-skills me p)))
                  (projects state))))
  (if proj
      (offer-project (project-id proj))
      (rest)))
```

#### Pattern 4: Analyze and adapt
```scheme
;; Find what skill you're missing
(define (get-missing-skill proj)
  (let ((reqs (cdr (assoc 'requiredSkills proj))))
    (find (lambda (req)
            (let* ((skill (car req))
                   (level (cdr req))
                   (my-level (let ((pair (assoc skill my-skills)))
                               (if pair (cdr pair) 0))))
              (< my-level level)))
          reqs)))

;; Find a course that teaches that skill
(define (find-course-for-skill skill-name)
  (find (lambda (c)
          (let ((gains (cdr (assoc 'skillsGained c))))
            (assoc skill-name gains)))
        (courses state)))

;; Then learn that specific skill
(let* ((target-project (car (projects state)))
       (missing (get-missing-skill target-project))
       (course (find-course-for-skill (car missing))))
  (if course
      (study (course-id course))
      (study "fullstack-bootcamp")))
```

### Debugging Your Bot

**Test locally first:**
```bash
node test-bot-interpreter.js bots/your-bot.scm
```

**Common errors:**
- ❌ Using `(study "python")` instead of `(study "python-basics")` - must use course IDs!
- ❌ Offering projects when not in the same area
- ❌ Not managing energy - bots get eliminated at energy ≤ 0
- ❌ Studying when not in education area
- ❌ Returning multiple actions - only ONE action per turn

**Check the UI:**
- "Recent Activity" feed shows what your bot is doing
- Invalid actions appear in red
- Hover over your bot chip to see current stats

### Advanced: Direct State Access

For advanced users, the state is an association list:

```scheme
;; Access state directly
(define my-bot (self state))
(define my-skills (cdr (assoc 'skills my-bot)))
(define all-bots (cdr (assoc 'bots state)))

;; Access project details
(define proj-reqs (cdr (assoc 'requiredSkills project)))
(define proj-reward (cdr (assoc 'reward project)))

;; Access course details
(define course-skills (cdr (assoc 'skillsGained course)))
```

---

## Example Bots

The `bots/` folder contains 4 example bots with different strategies:

### 🏢 hard-market-bot.scm
Focuses exclusively on high-value hard market projects. Learns skills needed for hard projects and ignores easy work.

### 💼 easy-market-bot.scm  
Plays it safe with easy market projects only. Maintains high energy and steady income.

### 📚 study-hard-bot.scm
Maximizes education first, accumulating 12+ skill points before working. Then dominates all markets.

### 🌴 just-relax-bot.scm
Prioritizes relaxation and only works when energy is very high (80+). Minimal effort, maximum chill.

**Try them out:**
```bash
./send_all_bots.sh
```

---

## Game Constants

### Energy Costs
- Moving: -2 energy
- Courses: -5 to -12 energy (varies by course)
- Completing project: -10 energy
- Failed project: -3 energy
- Invalid action: -2 energy
- Resting: +10 to +30 energy (random)

### Initial Values
- Starting energy: 100
- Starting money: $0
- Game length: 20 rounds
- Round delay: 2 seconds

### Skills Available
- `python` - General programming
- `javascript` - Frontend/backend development
- `ml` - Machine learning
- `devops` - Operations and deployment
- `azure` - Cloud computing
- `docker` - Containerization
- `kubernetes` - Orchestration

---

## Tips for Success

1. 🚀 **Start fast** - Use `fullstack-bootcamp` to get multiple skills quickly
2. 🎯 **Be adaptive** - Look at available projects and learn what they need
3. ⚡ **Watch your energy** - Rest before you hit 40, projects cost 10 energy
4. 💰 **Balance risk** - Easy projects = steady income, hard projects = big payoff
5. 🤝 **Collaborate** - Multiple bots can split a big project's reward
6. 📊 **Track the meta** - What skills do most projects need? Learn those first!

---

## Development

### Project Structure

```
gameofconsults/
├── src/
│   ├── server.ts           # Express server & Socket.io
│   ├── game-engine.ts      # Core game logic
│   ├── bot-interpreter.ts  # Scheme bot execution
│   ├── types.ts            # TypeScript interfaces
│   └── constants.ts        # Game constants & courses
├── bots/
│   ├── *.scm              # Example bots
│   └── bot_guide.md       # Bot development guide
├── public/
│   └── index.html         # Game UI
└── README.md              # This file
```

### Running Tests

```bash
# Run TypeScript tests
npm test

# Test bot interpreter
node test-bot-interpreter.js
```

### Building

```bash
# Compile TypeScript
npm run build

# Watch mode (auto-rebuild on changes)
npx tsc --watch
```

---

## Contributing

Pull requests welcome! Ideas for new features:
- More course types
- Special events during rounds
- Bot-to-bot interactions
- Tournament mode with multiple games

---

## License

MIT License - Feel free to use and modify!

---

**Ready to compete? Write your bot and may the best consultant win! 🏆**

