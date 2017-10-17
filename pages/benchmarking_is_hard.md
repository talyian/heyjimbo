## kNN in F# (Benchmarking is hard) ##

I was reading over some old blog posts and stumbled upon a series of blog posts at [Comparing a Machine Learning Algorithm Implemented in F# and OCaml](http://philtomson.github.io/blog/2014/05/29/comparing-a-machine-learning-algorithm-implemented-in-f-number-and-ocaml/) and [kNN Algorithm in golang and Haskell](http://akgupta.ca/blog/2014/06/21/k-nn-algorithm-in-golang-and-haskell/) on "kNN example code" in golang and Haskell. Others on the /r/haskell reddit have already pointed out the apples-to-peaches comparison going on here, but I think this is a fine way to illustrate a few gotchas / features of F# that may not be super obvious.

To begin, here are some of the numbers on my machine: In the interests of "benchmarking is hard" and isolating just run time, these times do not include compile times (`fsc` is an order of magnitude slower) Also, the .NET runtime should be faster than Mono, but I haven't tested on a Windows machine.

    $ time ./golang-k-nn
    real 0m4.265s
    $ time ./golang-k-nn-speedup
    real 0.790s
    $ time mono fsharp-k-nn.exe
    real 18.803s

### Optimizing this F# code:

At the core of the code, the kNN classifier just calls a `distance` function to compare two images, and selects the minimum value. This means any optimizations to the `distance` function go a long way towards net speedup of the code base. Here's the original F# code:

    let distance (p1: int[]) (p2: int[]) =
        Math.Sqrt (float(Array.sum (Array.map2 ( fun a b -> (pown (a-b) 2)) p1 p2) ))

First off, `pown foo 2` is going to be slower than `foo * foo`, F# does not optimize for that special case. Switching that out instantly gives us a 150% speed improvement:

    let distance (p1: int[]) (p2: int[]) =
        Math.Sqrt (float(Array.sum (Array.map2 ( fun a b -> (a-b) * (a-b))) p1 p2) ))

    $ time mono fsharp-k-nn.exe
    > real 11.934s

Secondly, F# doesn't inline functions terribly well -- imperative-style code and tail-recursive functions tend to both generate much more efficient IL than `Array.map` and `Array.sum`. Here's a tail recursive version:

    let distance (p1: int[]) (p2: int[]) =
        let rec iterate s = function
            | -1 -> sqrt (float s)
            | n -> let v = p1.[n] - p2.[n] in iterate (s + v * v) (n-1)
        iterate 0 (p1.Length-1)

    $ time mono fsharp-k-nn.exe
    > real 4.541s

Aha! We're in the ballpark of the naive golang implementation. Which makes sense, because the above code does basically the same sequence of operations as the golang version (except it should be slightly faster since it operates on int arrays instead of float arrays)

Now, lets see if we can apply the extra set of optimizations in the sped-up golang version to our F# code:

#### Goroutines

The optimized go version parallelizes the computation using goroutines, going from this:

    total := 0
    for _, test := range validationSample {
        if is_correct(test) {
            total++
        }
    }

to this:

    total := 0
    channel := make(chan float32)

    for _, test := range validationSample {
        go func(t) {
            if is_correct(t) {
                channel <- 1
            } else {
                channel <- 0
            }
        })(test)
    }
    for i := 0; i < len(validationSample); i++ {
        total += <- channel
    }

#### Async

FSharp's analog to goroutines is the `async` ~~Monad~~ computation expression. To parallelize the classification of validationSample, we change:

    let num_correct =
        validationsample
        |> Array.map (fun p -> if (classify p.Pixels ) = p.Label then 1 else 0)
        |> Array.sum

by changing the map to return a an array of async objects, which `Async.Parallel` dispatches to a task queue and `Async.RunSynchronously` unwraps back into a simple `int[]` object.

    let num_correct =
        validationSample
        |> Array.map (fun p -> async { return if (classify p.Pixels ) = p.Label then 1 else 0 })
        |> Async.Parallel
        |> Async.RunSynchronously
        |> Array.sum

    $ time mono fsharp-k-nn.exe
    real    0m2.194s

Alternatively, the `FSharp.Collections.ParallelSeq` module from the Powerpack would be useful here, providing an in-place substitution into our original code:

    let num_correct =
        validationsample
        |> PSeq.map (fun p -> if (classify p.Pixels ) = p.Label then 1 else 0)
        |> PSeq.sum

Changing our distance function further cuts the time down

    let distance (p1: int[]) (p2: int[]) bailout =
        ....
        | n -> if s > bailout then s else let v = p1.[n] - p2.[n] in iterate (s + v * v) (n-1)

    real 1.724s

#### Conclusion

At this point, we've improved the time from the inital F# version over ten-fold from 18s to 1.7s, by inlining the expensive parts of the `distance` function and using the same techniques that were applied to the golang implementation. To further approach the speed of C, work could be done by writing vectorized code using the new System.Numerics.Vector libraries.

<script src=/hljs/highlight.js> </script>
