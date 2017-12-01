# Lambdas and Closures

## Lambdas

A **lambda** is a function. The lambda calculus is math on functions.

For the purpose of this post, I make no distinction between named functions and unnamed functions, although some languages will use the word "lambda" to refer only to unnamed functions, and some languages treat anonymous functions differently from named functions.

    # These two formulations in Python are equivalent, as far as we're concerned
    def foobar(a, b):
       return a + b + c

    foobar = lambda a, b: a + b + c

### Free and Bound Parameters

	c = 1
	def outerFunction(d):
		e  = 1
		def foobar(a, b):
			return a + b + c + d + e

In the above example, a function (`foobar`) has a set of bound parameters (`a` and `b`) that are passed to it from the caller

The function also has a set of free parameters (`c`, `d`, `e`) that are taken from its lexical environment.

### Closures

#### Transitive Closures in Math (Optional analogue from set theory)

A set is open with respect to an relation if for some members of the set, applying the relation yields a member outside of the set. For example, the set {cities in Florida} is open with respect to the relation {is connected by an interstate highway to} since some cities in Florida are connected to cities outside of Florida by highways. (think of the relation as a function getAllDirectlyConnectedCities(city) )

A set is closed if it isn't open. For example, the set of {all cities in the United States} is closed with respect to {is connected by an interstate highway} because all interstate highways will put you into another American city. [If you're following along, you should be thinking now that the set of all american cities is open with respect to {is connected by a road of any type} since some roads go into Canada and Mexico].

A transitive closure for a relation over an open set is the minimal closed set that contains it. You can construct it by repeated applying the relation and adding the resulting members to your set. For example, the closure of the relation {connected by an interstate highway} over the set {Miami} probably gets you {all major cities in the contiguous 48 states} once you add in {all the cities connected to Miami}, all the cities connected to those cities, and so on until you get no more new cities in your set. In comparison, the closure of the same relation over the set {Honolulu} results in some set of Hawaiian cities including places like Waipahu and Aeia.

#### Closures In Computing

You can think of a function as a block of code instructions existing side-by-side with a a set of variables that the instructions depend on. As mentioned in the Lambda section, the variables can be either free or bound. A function with free variables is open, and a function with only bound variables is closed.

Now, closed functions are simple. They work like how we normally think of functions - you put in a value, you get out a result. After the function is finished running, none of the local variables are needed anymore.  Open functions depend on their environment, and so if we want to preserve lexical scoping we have to keep track of the environment that function was defined in. Sometimes this means the environment needs to persist even after it would normally be destroyed. 

	def A(p):
		def B():
			return 10 * p
		return B

	b1 = A(1)
	b2 = A(2)
	b1() == 10
	b2() == 20

Note that b1 and b2 are lambda variables refer to the exact same block of code. However, their environments are different, and so they return different results. Moreover, these functions are in scope even after each invocation of `A` has returned, so the lifetime of `p` must be extended past the end of the function `A`. How does the language implement this? The answer is we convert the "open" function B into a "closed" function B_closed that encapsulates its environmental variables (i.e. the value of `p` at the time B was defined). In OOP languages like Python, a class is the natural way to express "function with attached variables".  The compiler could generate something like the following.

	class B_closed:
	   # constructor for a callable that keeps track of environment state.
	   def __init__(self, environment):
		   self.environment = environment
	   def call(self):
		   return 10 * self.environment.p

	def A(p):
	   return B_closed({"p": p})

	b1 = A(1)
	b2 = A(2)
	b1.call() == 10
	b2.call() == 20

## Summary

* A lambda is a function. In some languages (for example, Python, or C#, a lambda refers to a specific syntax for an anonymous function)
* A closure is an open function (it depends on its environment) that has been converted to a closed function (it contains its own environment) by the compiler.
* In general, a closure could be formed by any kind of function (both named functions and unnamed lambdas) but in practice some languages don't allow nested named functions so closures are only ever formed by lambdas (C# 6 example below)
```
	// This is not legal C# (pre C# 7 anyways) -- -- methods cannot be nested
	Func<int> A(int p) { 
	   int B() { 
		 return p;
	   }
	   return B;
	}
	
	// Lambdas in C# can be turned into closures
	Func<int> A(int p) { 
	   Func<int> B = () => p;
	   return B;
	}
	
	// Lambdas may be closed to begin with, so 
	// the compiler-closure-magic that generates a class 
	// that stores environmental variables to extend their lifetime
	// isn't necessary. 'p' goes away when A returns here.
	Func<int> A(int p) { 
	   Func<int> B = () => 1;
	   return B;
	}
```

<script src='/hljs/highlight.js'> </script>
