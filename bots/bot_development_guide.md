# Game of Consultants Bot Implementation Guide

## Introduction to Scheme (R5RS)

Bots are written in Scheme, a simple and expressive Lisp dialect. Here are some basics to get you started:

- **Comments:** Use a semicolon: `; this is a comment`
- **Variables:** `(define x 5)`
- **Lists:** `'(1 2 3)` or `(list 1 2 3)`
- **Accessing list elements:** `(car lst)` gets the first element, `(cdr lst)` gets the rest.
- **Association lists (alists):** Many game objects (like bots) are represented as lists of key-value pairs: `((name . "Bot1") (money . 100))`
- **Accessing values in alists:** `(cdr (assoc 'money bot))` gets the money value from a bot object.
- **Equality:** `(eq? a b)` for symbols, `(equal? a b)` for general equality, `(string=? a b)` for strings.
- **let vs let***: Both are used for local variable bindings. `let` evaluates all bindings in parallel (so later bindings can't use earlier ones), while `let*` evaluates them sequentially (so each binding can use the previous ones). Example:
  - `(let ((a 1) (b 2)) ...)` — `a` and `b` are independent.
  - `(let* ((a 1) (b (+ a 2))) ...)` — `b` can use `a`.

For more, see: [R5RS Scheme Quick Reference](https://schemers.org/Documents/Standards/R5RS/)

## Understanding the Game State

The game provides a `state` variable to your bot each turn. The original game-state and bot types are defined in [src/types.ts](../src/types.ts), but the interpreter converts the data into Scheme association lists (alists). An alist is a list of key-value pairs: for example, `(energy . 74)` means that the `energy` key has the value `74`.

Here is a small example of the Scheme data passed to a bot. A real game can have many bots, projects, and courses:

```scheme
(define state
  '((currentBotName . "Ada")
    (round . 3)
    (bots .
      (((id . "bot-1")
        (name . "Ada")
        (money . 120)
        (energy . 74)
        (skills . ((python . 1) (ml . 1)))
        (area . "education")
        (offers . ()))
       ((id . "bot-2")
        (name . "Lin")
        (money . 95)
        (energy . 60)
        (skills . ((python . 2)))
        (area . "easy-market")
        (offers . ()))))
    (projects .
      (((id . "p1")
        (area . "easy-market")
        (requiredSkills . ((python . 1)))
        (reward . 80)
        (roundsLeft . 4)
        (offers . ()))))
    (courses .
      (((id . "python-basics")
        (name . "Python Basics")
        (skillsGained . ((python . 1)))
        (energyCost . 5))))
    (areas . ("education" "relaxation" "easy-market" "hard-market"))
    (maxRounds . 20)
    (phase . "play")))
```

Example bots use the provided helper functions to access data in the game state. 
For example, `(self state)` returns your bot's object, and `(energy (self state))` gets its energy. 

You can also access data directly using `assoc` and `cdr`.
For example, `(cdr (assoc 'bots state))` gets the bot list. 
The values in alists are accessed with `assoc` and `cdr`, while the provided helpers offer shorter alternatives.

## Accessing Data in the Game State

You can use the provided helper functions, or access data directly. Here are examples:

### Using Helper Functions
```scheme
(let* ((me (self state))
       (my-money (money me))
       (my-energy (energy me)))
  ...)
```

### Accessing Data Directly
```scheme
(let* ((me (self state))
       (my-money (cdr (assoc 'money me)))
       (my-energy (cdr (assoc 'energy me)))
       (my-skill-level (cdr (assoc 'skills me))))
  ...)
```

#### Accessing Nested Data
- To get your python skill:
```scheme
(let* ((skills (cdr (assoc 'skills me)))
       (python-skill (cdr (assoc "python" skills))))
  python-skill)
```
- To get the first project’s reward:
```scheme
(let* ((projects (projects state))
       (first-project (car projects))
       (reward (cdr (assoc 'reward first-project))))
  reward)
```

## Should I Use Helper Functions?

Helper functions like `(money bot)` and `(energy bot)` are provided for convenience and readability, especially for beginners. However, you can always access attributes directly using `assoc` and `cdr` as shown above. You do not have to use a helper for every attribute—choose whichever style you prefer.

## 1. Writing Your Bot

- Bots are written in Scheme (R5RS) and submitted as `.scm` files.
- Name your local bot `bots/my-name.scm`; files beginning with `my` are ignored by Git.
- Your bot's code must return **one action per turn** (move, rest, study, offer-project, or chat).
- The game injects a `state` variable and several helpers for you. You do **not** need to define these yourself.

### Example Bot Code
```scheme
(let* ((me (self state))
       (my-energy (energy me))
       (my-area (area me)))
  (if (< my-energy 30)
      (if (string=? my-area "relaxation")
          (rest)
          (move "relaxation"))
      (move "easy-market")))
```

The starter bots use these same building blocks: `let*` stores values, `if` and `cond` choose what to do, and helpers such as `move`, `rest`, and `study` return actions.

### Available Helper Functions
- **Bot Info**
  - `(self state)` — Returns your bot's object.
  - `(energy bot)` — Bot's energy.
  - `(money bot)` — Bot's money.
  - `(area bot)` — Bot's current area.
  - `(skill bot skill-name)` — Bot's skill level (0 if not present).
- **Game Info**
  - `(projects state)` — List of all projects (alias for `get-projects`).
  - `(courses state)` — List of all available courses.
- **Actions**
  - `(rest)` — Returns a rest action.
  - `(move area-name)` — Move to an area.
  - `(study course-id)` — Study a course (takes course ID, NOT skill name).
  - `(offer-project project-id)` — Offer to work on a project.
  - `(chat message)` — Send a chat message.
- **Project/Course Helpers**
  - `(has-enough-skills bot project)` — Returns `#t` if `bot` has all required skills for `project`, else `#f`.
  - `(project-area project)` — Returns the area of a project.
  - `(project-id project)` — Returns the id of a project.
  - `(course-id course)` — Returns the id of a course.
  - `(course-name course)` — Returns the name of a course.
  - `(course-skills course)` — Returns the skills gained from a course.
  - `(course-energy-cost course)` — Returns the energy cost of a course.
  - `(find-course-for-skill state skill-name)` — Finds a course that teaches a specific skill.
- **Utility**
  - `(find pred lst)` — Returns the first element in `lst` for which `pred` returns `#t`, or `#f` if none.
    - See the example bot code above for how to use `find` in practice.
    - Note: Scheme (R5RS) does not include a built-in find or filter function in its standard library

### Available Courses
Courses teach multiple skills at once:
- `python-basics` → python +1 (5 energy)
- `python-advanced` → python +2 (8 energy)
- `javascript-fundamentals` → javascript +1 (5 energy)
- `javascript-advanced` → javascript +2 (8 energy)
- `ml-intro` → ml +1, python +1 (7 energy)
- `ml-advanced` → ml +2, python +1 (10 energy)
- `devops-basics` → devops +1 (5 energy)
- `devops-advanced` → devops +2, docker +1 (9 energy)
- `rest-api-design` → rest +2 (6 energy)
- `docker-mastery` → docker +2, devops +1 (8 energy)
- `kubernetes-fundamentals` → kubernetes +2, docker +1, devops +1 (12 energy)
- `fullstack-bootcamp` → python +1, javascript +1, rest +1 (10 energy)

## 2. Action Return Format
Your bot **must** return one of the following actions (as a list):
- `(rest)`
- `(move "area-name")`
- `(study "course-id")`
- `(offer-project "project-id")`
- `(chat "message")`

**Always use double quotes for strings.**

## 3. Testing Your Bot Locally

A test-bench script is provided to check your bot before submitting it to the game server.

### How to Test All Bots
From the project root, run:
```sh
node test-bot-interpreter.js
```
This will test all `.scm` files in the `bots/` directory and print a summary.

### How to Test a Single Bot
```sh
node test-bot-interpreter.js bots/my-name.scm
```

- The script will print `OK` if your bot returns a valid action, or `FAIL`/`ERROR` if not.
- If your bot times out or returns an invalid action, check your logic and ensure you use the helpers as described above.

### Scenario Test Bench
Run the scenario test bench against your bot:
```sh
npm run test:bot -- bots/my-name.scm
```

It builds the project, loads the `.scm` file, and runs it against several predefined game states. For each state it prints the bot's energy, area, skills, available projects and courses, some potentially good moves, and the bot's response. Each case is marked `SUCCESS` if the action is applicable or `FAILED` if it is invalid for that state; a summary lists both groups at the end. `SUCCESS` does not mean the move is strategically optimal.

## 4. Debugging Tips
- Make sure you use only the provided helpers for accessing state and actions.
- Do not define your own `state` or helper functions with the same names.
- If you see a timeout, your code may be stuck in a loop or waiting for a value that does not exist.
- Use simple logic and test incrementally.

## 5. Submitting Your Bot
- Once your bot passes the test-bench, you can submit it to the game server using the provided registration method (see main project docs).

## 6. Registering Your Bot with the Server

Once your bot passes the test-bench, you can register it with the game server using the provided script:

### Usage
From the project root, run:
```sh
./send_bot.sh bots/my-name.scm "Your Bot Name" [server-url]
```
- Replace `my-name.scm` with your bot's filename.
- Replace `Your Bot Name` with the name you want to appear in the game.
- The server URL is optional and defaults to `http://localhost:3000`. To submit to Azure, pass the app URL, for example `https://gameofconsultants-tampere.azurewebsites.net`.

The script sends your bot's code and name to the selected server. If registration is successful, you will see a confirmation message.

If you see an error, check that:
- The server is running (`./start.sh`)
- Your bot code is valid and passes the test-bench
- The bot name is unique
