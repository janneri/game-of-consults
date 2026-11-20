;; The game supplies `state` each turn: a snapshot containing bots, projects,
;; courses, and other game data. `self` selects this bot from that snapshot.
;; `let*` stores values under readable names, evaluating bindings in order.
(let* ((me (self state))
       (my-energy (energy me))
       (my-area (area me))
       ;; `projects` gets the project list. `find` tests each project with the
       ;; function made by `lambda`; it returns the first match or #f.
       ;; `project-area` reads a project's area, and `has-enough-skills`
       ;; checks this bot against that project's requirements.
       (project (find (lambda (p)
                        (and (string=? (project-area p) "hard-market")
                             (has-enough-skills me p)))
                      (projects state))))
  ;; `cond` tests each condition in order and returns the action for the first
  ;; true condition.
  (cond
    ;; Save energy: rest if already in relaxation, otherwise move there.
    ((< my-energy 30)
     (if (string=? my-area "relaxation")
         (rest)
         (move "relaxation")))
    ;; `find` returned a project; get its ID and offer to work on it.
    (project
     (offer-project (project-id project)))
    ;; Learn from a course by passing its ID to `study`.
    ((string=? my-area "education")
     (study "ml-intro"))
    ;; If there is no suitable project yet, go to education.
    (else
     (move "education"))))
