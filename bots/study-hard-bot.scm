;; The game supplies `state` as a snapshot each turn. `self` picks this bot
;; from it; helpers like `area` and `skill` read values from the bot.
;; `let*` creates local names in order, so later values can use earlier ones.
(let* ((me (self state))
       (my-area (area me))
       ;; `skill` returns this bot's level for a skill (0 if it has none).
       (python-level (skill me "python"))
       ;; `projects` returns all projects. `find` checks each one using the
       ;; `lambda` function; `and` requires both conditions to be true.
       ;; The result is a project or #f when no project matches.
       (project (find (lambda (p)
                        (and (string=? (project-area p) "easy-market")
                             (has-enough-skills me p)))
                      (projects state))))
  ;; `cond` checks branches in order. `<` compares the numeric skill level.
  (cond
    ;; Study python-basics if this bot has not learned Python yet.
    ((< python-level 1)
     (if (string=? my-area "education")
         (study "python-basics")
         (move "education")))
    ;; If a project was found, offer using its ID.
    (project
     (offer-project (project-id project)))
    ;; Rest if already in the market but no suitable project is available.
    ((string=? my-area "easy-market")
     (rest))
    ;; Otherwise move to the market.
    (else
     (move "easy-market"))))
