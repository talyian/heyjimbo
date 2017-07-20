## FizzBuzz, Syntax Abuse, and the Pursuit of Perfect Code

If you're a programmer, you have likely seen the "FizzBuzz" problem at some point. 

> Write a program that prints the numbers from 1 to 100. But for multiples of three print "Fizz" instead of the number and for the multiples of five print "Buzz". For numbers which are multiples of both three and five print "FizzBuzz".

The nice thing about "FizzBuzz" as an interview question is that it is on the lower threshold of triviality, yet it manages to cover I/O, looping, conditionals, and arithmetic. With that said, here is how I'd write out FizzBuzz:

    static void FizzBuzz() { 
		for(int i=0; i<100; i++) { 
			Console.WriteLine(
				i % 15 == 0 ? "FizzBuzz" :
				i % 3 == 0 ? "Fizz" :
				i % 5 == 0 ? "Buzz" : 
				(i.ToString()));
		}
    }

Hmmm. For some reason, this small bit of code is already going to cause discussion. You could easily find a zillion different ways of writing FizzBuzz, the classic almost-trivial program, and everyone will have differing opinions on how to write it. As it stands, I've heard feedback such as "ugh, ternary operator is obfuscation" or "you need to comment that modulus operation since your maintainer won't understand it." 

Ultimately, **I can't say that these differing opinions are wrong**. Everyone is a [Blub Programmer](http://www.paulgraham.com/avg.html), me included, So things we don't use look *goddamn cryptic* and things we've decided not to use look *childlike in their simplicity*. However, it seems to me that you'd be most productive in a team with other programmers of the same Blub-index, or at least in a team where everyone's index falls into the tolerance level for everyone else. Perhaps programmers get righteous in defending their favorite programming language or coding style in hopes that they convert others to their Blub level?

My most proficient languages are C#, F#, Javacript, Python, and Java. Perhaps it's just because it's what I write at work every day, but my Blub-level is somewhere between C# and F#. For every language that I write in, some parts feel really pleasant, like the ease of manipulating the shape of data in LINQ, or refining a DOM selection in jQuery (which Microsoft should totally have paid jresig to call Linq2DOM), or mocking an interface in Java with an anonymous instance. And other parts feel kind of awkward. But how much of that is the implicit tradeoffs we as programmers make every day versus the habits that I've built up, I'm not really sure.

[Code Bits]
[Code Musing]
[Language Rants]