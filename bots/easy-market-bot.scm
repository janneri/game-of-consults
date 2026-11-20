;; The game gives the bot a `state` snapshot on every turn. It contains the
;; current bots, projects, courses, and other game data.
;; `self` selects this bot from the state. `let*` gives names to values, in
;; order, so each value can use the names above it.
(let* ((me (self state))
       (my-energy (energy me))
       (my-area (area me))
       ;; `projects` returns the project's list. `find` checks them one at a
       ;; time; this `lambda` is a function that receives one project as `p`.
       ;; A match must be in the easy market and this bot must have its skills.
       ;; `find` returns the first matching project, or #f if there is none.
       (project (find (lambda (p)
                        (and (string=? (project-area p) "easy-market")
                             (has-enough-skills me p)))
                      (projects state))))
  ;; `cond` checks these cases from top to bottom and runs the first match.
  (cond
    ;; If energy is low, rest when already relaxing; otherwise go there.
    ((< my-energy 30)
     (if (string=? my-area "relaxation")
         (rest)
         (move "relaxation")))
    ;; A found project is true; `project-id` gets its ID for the offer action.
    (project
     (offer-project (project-id project)))
    ;; `study` takes a course ID, not a skill name.
    ((string=? my-area "education")
     (study "python-basics"))
    ;; Rest while waiting for an easy project to appear.
    ((string=? my-area "easy-market")
     (rest))
    ;; Otherwise go to the area where easy projects are handled.
    (else
     (move "easy-market"))))
