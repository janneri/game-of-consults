;; Easy Market Bot - Focuses exclusively on safe, easy market projects
;; Maintains high energy and learns exactly what easy projects need

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

  ;; Helper: Find a course that teaches a specific skill
  (define (find-course-teaching skill-name)
    (find (lambda (c)
            (let ((gains (cdr (assoc 'skillsGained c))))
              (assoc skill-name gains)))
          (courses state)))

  (cond
    ;; Keep energy very high - rest if below 50 (conservative!)
    ((< my-energy 50)
     (if (eq? my-area "relaxation")
         (rest)
         (move "relaxation")))

    ;; Check if we can do any easy project
    ((not (find (lambda (p)
                  (and (eq? (project-area p) "easy-market")
                       (has-enough-skills me p)))
                (projects state)))
     ;; Can't do easy projects - learn exactly what's needed
     (if (eq? my-area "education")
         (let* ((easy-proj (find (lambda (p) (eq? (project-area p) "easy-market"))
                                 (projects state)))
                (missing-skill (if easy-proj (get-missing-skill easy-proj) #f)))
           (if missing-skill
               ;; Learn the missing skill
               (let ((course (find-course-teaching (car missing-skill))))
                 (if course
                     (study (course-id course))
                     (study "fullstack-bootcamp")))
               ;; No target found, get basic skills
               (study "python-basics")))
         (move "education")))

    ;; Work on easy market projects only - play it safe!
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
