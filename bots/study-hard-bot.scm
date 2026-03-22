;; Study Hard Bot - Maximizes education and skill acquisition
;; Learns many skills then works on the most valuable projects available

(let* ((me (self state))
       (my-energy (energy me))
       (my-money (money me))
       (my-area (area me))
       (my-skills (cdr (assoc 'skills me)))
       (total-skill-points (apply + (map cdr my-skills))))

  ;; Helper: Find highest value project we can't yet do
  (define (find-best-learning-target)
    (let ((all-projs (projects state)))
      (find (lambda (p)
              (not (has-enough-skills me p)))
            (sort all-projs (lambda (a b)
                              (> (cdr (assoc 'reward a))
                                 (cdr (assoc 'reward b))))))))

  ;; Helper: Get missing skill from project
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
    ;; Rest when energy is below 30 (we study hard, rest less!)
    ((< my-energy 30)
     (if (eq? my-area "relaxation")
         (rest)
         (move "relaxation")))

    ;; Study until we have 12+ total skill points
    ((< total-skill-points 12)
     (if (eq? my-area "education")
         (let* ((target (find-best-learning-target))
                (missing (if target (get-missing-skill target) #f)))
           (if missing
               (let ((course (find-course-for-skill (car missing))))
                 (if course
                     (study (course-id course))
                     (study "kubernetes-fundamentals")))
               ;; Build diverse skills
               (study "kubernetes-fundamentals")))
         (move "education")))

    ;; Once educated, work on the most valuable projects we can do
    ((> my-energy 55)
     (if (eq? my-area "hard-market")
         (let ((proj (find (lambda (p)
                             (and (eq? (project-area p) "hard-market")
                                  (has-enough-skills me p)))
                           (projects state))))
           (if proj
               (offer-project (project-id proj))
               (move "easy-market")))
         (move "hard-market")))

    ;; Fallback to easy market
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
