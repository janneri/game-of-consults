;; The game provides `state`, a snapshot of the current turn. `self` gets this
;; bot's data from it, and `energy` and `area` read two of that bot's values.
;; `let*` gives these values short names for the rest of the program.
(let* ((me (self state))
       (my-energy (energy me))
       (my-area (area me)))
  ;; `cond` checks each condition in order and takes the first matching action.
  (cond
    ;; `string=?` compares strings. In relaxation, the `rest` helper returns
    ;; the action that restores energy.
    ((string=? my-area "relaxation")
     (rest))
    ;; `<` compares numbers. If energy is low, use `move` to change areas.
    ((< my-energy 70)
     (move "relaxation"))
    ;; When energy is high, move to the easy market.
    (else
     (move "easy-market"))))
