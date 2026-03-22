;; Hard Market Bot - Focuses exclusively on high-value hard market projects
;; Analyzes hard project requirements and learns those skills aggressively

(let* ((me (self state))
       (my-energy (energy me))
       (my-money (money me))
       (my-area (area me))
       (my-skills (cdr (assoc 'skills me))))

  ;; Helper: Get first missing skill for a project
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
    ;; Rest when energy is below 40 (need good buffer for hard projects)
    ((< my-energy 40)
     (if (eq? my-area "relaxation")
         (rest)
         (move "relaxation")))

    ;; Check if we can do any hard market projects
    ((not (find (lambda (p)
                  (and (eq? (project-area p) "hard-market")
                       (has-enough-skills me p)))
                (projects state)))
     ;; Can't do hard projects yet - learn what's needed
     (if (eq? my-area "education")
         (let* ((hard-proj (find (lambda (p) (eq? (project-area p) "hard-market"))
                                 (projects state)))
                (missing (if hard-proj (get-missing-skill hard-proj) #f)))
           (if missing
               ;; Study course for the missing skill
               (let ((course (find-course-for-skill (car missing))))
                 (if course
                     (study (course-id course))
                     (study "ml-advanced")))
               ;; No hard projects exist yet, build advanced skills
               (study "ml-advanced")))
         (move "education")))

    ;; We have skills for hard market - go hunt big projects!
    (else
     (if (eq? my-area "hard-market")
         (let ((proj (find (lambda (p)
                             (and (eq? (project-area p) "hard-market")
                                  (has-enough-skills me p)))
                           (projects state))))
           (if proj
               (offer-project (project-id proj))
               ;; No doable hard projects right now, learn more
               (move "education")))
         (move "hard-market")))))
