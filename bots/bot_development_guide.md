# Game of Consults Bot Implementation Guide

This guide explains how to create, test, and debug Scheme bots for the Game of Consults platform.

## 1. Writing Your Bot

- Bots are written in Scheme (R5RS) and submitted as `.scm` files.
- Your bot's code must return **one action per turn** (move, rest, study, offer-project, or chat).
- The game injects a `state` variable and several helpers for you. You do **not** need to define these yourself.

### Example Bot Structure
```scheme
(define (choose-move state)
  (let* ((me (self state))
         (proj (find (lambda (p)
                       (and (eq? (project-area p) "easy-market")
                            (has-enough-skills me p)))
                     (projects state))))
    (if proj
        (offer-project (project-id proj))
        (rest))))
(choose-move state)
```

### Example: Chatting
```scheme
(chat "Hello, world!")
```
This will make your bot say something in the chat for that turn (instead of moving, resting, etc).

### Available Helper Functions
- `(self state)` — Returns your bot's object.
- `(energy bot)` — Bot's energy.
- `(money bot)` — Bot's money.
- `(area bot)` — Bot's current area.
- `(skill bot skill-name)` — Bot's skill level (0 if not present).
- `(projects state)` — List of all projects (alias for `get-projects`).
- `(courses state)` — List of all available courses.
- `(rest)` — Returns a rest action.
- `(move area-name)` — Move to an area.
- `(study course-id)` — Study a course (takes course ID, NOT skill name).
- `(offer-project project-id)` — Offer to work on a project.
- `(find pred lst)` — Returns the first element in `lst` for which `pred` returns `#t`, or `#f` if none.
- `(has-enough-skills bot project)` — Returns `#t` if `bot` has all required skills for `project`, else `#f`.
- `(project-area project)` — Returns the area of a project.
- `(project-id project)` — Returns the id of a project.
- `(course-id course)` — Returns the id of a course.
- `(course-name course)` — Returns the name of a course.
- `(course-skills course)` — Returns the skills gained from a course.
- `(course-energy-cost course)` — Returns the energy cost of a course.
- `(find-course-for-skill state skill-name)` — Finds a course that teaches a specific skill.

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
node test-bot-interpreter.js bots/your-bot.scm
```

- The script will print `OK` if your bot returns a valid action, or `FAIL`/`ERROR` if not.
- If your bot times out or returns an invalid action, check your logic and ensure you use the helpers as described above.

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
./send_bot.sh bots/your-bot.scm "Your Bot Name"
```
- Replace `your-bot.scm` with your bot's filename.
- Replace `Your Bot Name` with the name you want to appear in the game.

The script will send your bot's code and name to the server at http://localhost:3000. If registration is successful, you will see a confirmation message.

If you see an error, check that:
- The server is running (`./start.sh`)
- Your bot code is valid and passes the test-bench
- The bot name is unique

---
