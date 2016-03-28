# ripple
Experimental repl

jQuery typescript definition found at:

https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/jquery/jquery.d.ts

```
(define do (function (x y) y))

(define zero? (function (x) (= x 0)))

(define replicate
  (function (n x)
    (let helper
      (function (f a n x)
        (if (zero? n)
          a
          (do
            (push a x)
            (f f a (- n 1) x))))
      (helper helper (array) n x))))

(replicate 5 "hi")
```

Dynamic scoping test:

```
(define l (function () (log y)))

(let y "hi" (l))
```

Lexical scoping test:

```
(define k (function (x) (function () (log x))))

((k "hi"))
```

Quadratic formula:

```
(define quadratic
  (function (a b c)
    (/ (+ (negate b)
          (sqrt (- (* b b) (* 4 (* a c)))))
       (* 2 a))))
```