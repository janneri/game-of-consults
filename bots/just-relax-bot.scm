;; Just Relax Bot - Prioritizes rest and relaxation, only works when energy is high
;; Takes minimal courses and does easy projects casually

(let* ((me (self state))
       (my-energy (energy me))
       (my-money (money me))
       (my-area (area me))
       (my-skills (cdr (assoc 'skills me))))

  ;; Helper: Get missing skill from a project
  (define (get-missing-skill proj)
    (let ((reqs (cdr (assoc 'requiredSkills proj))))
      (find (lambda (req)
              (let* ((skill (car req))
                     (level (cdr req))
                     (my-level (let ((pair (assoc skill my-skills)))
                                 (if pair (cdr pair) 0))))
                (< my-level level)))
            reqs)))

  ;; Helper: Find course for skill
  (define (find-course-for-skill skill-name)
    (find (lambda (c)
            (let ((gains (cdr (assoc 'skillsGained c))))
              (assoc skill-name gains)))
          (courses state)))

  (cond
    ;; Rest a LOT - if below 70 energy, chill out!
    ((< my-energy 70)
     (if (eq? my-area "relaxation")
         (rest)
         (move "relaxation")))

    ;; Only work if we can already do a project (minimal learning)
    ((not (find (lambda (p)
                  (and (eq? (project-area p) "easy-market")
                       (has-enough-skills me p)))
                (projects state)))
     ;; Need minimal skills - just get the basics
     (if (eq? my-area "education")
         (let* ((easy-proj (find (lambda (p) (eq? (project-area p) "easy-market"))
                                 (projects state)))
                (missing (if easy-proj (get-missing-skill easy-proj) #f)))
           (if missing
               (let ((course (find-course-for-skill (car missing))))
                 (if course
                     (study (course-id course))
                     (study "python-basics")))
               (study "python-basics")))
         (move "education")))

    ;; Only work on easy projects, and only when well-rested
    ((> my-energy 80)
     (if (eq? my-area "easy-market")
         (let ((proj (find (lambda (p)
                            (and (eq? (project-area p) "easy-market")
                                 (has-enough-skills me p)))
                          (projects state))))
           (if proj
               (offer-project (project-id proj))
               (move "relaxation")))
         (move "easy-market")))

    ;; Default: just relax!
    (else
      (if (eq? my-area "relaxation")
          (rest)
          (move "relaxation")))))
