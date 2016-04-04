# ripple
Experimental repl

jQuery typescript definition found at:

https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/jquery/jquery.d.ts

```
(def zero? (fn (x) (= x 0)))

(def replicate
  (fn (n x)
    (let helper
      (fn (f c n x)
        (if (zero? n)
          c
          (f f (cons x c) (- n 1) x)))
      (helper helper null n x))))

(replicate 5 "hi")
```

Dynamic scoping test:

```
(def l (fn () (log y)))

(let y "hi" (l))
```

Lexical scoping test:

```
(def k (fn (x) (fn () (log x))))

((k "hi"))
```

Quadratic formula:

```
(def quadratic
  (fn (a b c)
    (/ (+ (negate b)
          (sqrt (- (* b b) (* 4 (* a c)))))
       (* 2 a))))

(quadratic 2 5 1)
```