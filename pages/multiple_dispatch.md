## Visiting Some Opinionated Elves

Dear reader, have you experienced the treat that is Steve Yegge's writing? If not, I suggest that you go read some of his best writings now instead of wasting time here. Partly because his writings are charmingly entertaining, and partly because I want to discuss a topic that he's already written a bit about.

> Now let's say one of your users wants to come in and write a little OpinionatedElf monster. ... Let's say the OpinionatedElf's sole purpose in life is to proclaim whether it likes other monsters or not. It sits on your shoulder, and whenever you run into, say, an Orc, it screams bloodthirstily: "I hate Orcs!!! Aaaaaargh!!!"

Steve's elf is a fairly harmless creature; it sits on your shoulder and simply judges everyone it meets. Some creatures it likes, some creatures it hates. Let's example some different ways to tackle this problem. Note that Steve covers a lot of ground, such as extensibility. I'm going to focus on the slightly narrower problem of code ugliness and maintenance hassle, but ultimately adhering to strong principles of encapsulation helps us out with extensibility as well.

**Idea #1: Polymorphic method**: Standard OOP logic. If you have a behavior that all creatures share but differ on implementation, it should be a virtual method. Make `Creature` define a `virtual bool doesTheElfLikeMe()` method, and creatures have to extend. The good thing about this is that with a proper type heirarchy, you can defer to base implementations. The bad thing is that a very abstract class, `Creature` now has a very specific concern, `doesTheElfLikeMe`, in its definition.

	Creature::doesTheElfLikeMe () { return true; }

    Orc::doesTheElfLikeMe() { return false; }

    Spider::doesTheElfLikeMe() { return false; }

	HarmlessPetSpider::doesTheElfLikeMe() { return true; }

	class Elf {
		void Greet(Creature c) {
			say(c.doesTheElfLikeMe() ? "hi, friend" : "DIE FIEND");
		}
	}
In this example, The elf can be perfectly happy about a `HarmLessPetSpider`, which subclasses `Spider`, while still hating Shelob the EvilGiantSpider, and EvilGiantSpider doesn't even need its own implementation of doesTheElfLikeMe because it defaults to the generic Spider behavior. However, adding a new Elf, or an OpinionatedGoose, involves goine to each individual Creature source file (possibly ones you don't have source access to), and adding a new method. This seems like a maintenance nightmare.

**Idea #2: Monkey-patching** Steve gives an example of a Ruby definition where when the Elf file gets loaded, it opens up all the classes it cares about and patches in a `doesTheElfLikeMe` function. This avoids the design issue of having the Elf's preferences scattered around a large number of different code files. This works in most dynamic languages. Here's an example of Ruby and Javascript.

	// in the Elf.rb:
    class HarmlessPetSpider
    def doesElfLikeMe; return true; end
    end

	// in Elf.js
    Spider.prototype.doesElfLikeMe = function() { return false; };

The main issue that remains with monkeypatching (aside from incompatibility with static type systems) is that the data is still not encapsulated in the `Elf` module. Now, this may be simply my preference and experience with statically typed languages, but I don't like the idea of a system design where modules and types are giving each other functions all willy-nilly. Where is the separation of concerns? the encapsulation?

**Idea #3: Runtime type checks** Why does `Creature` need to define `doesTheElfLikeMe` in the polymorphic example? Shouldn't the Elf figure out whether he likes a creature or not? The code does seem to be very backwards. If we added an OpinionatedGoose we shouldn't have to open up every single creature file again to add a `doesTheGooseLikeMe` method as well. If we simply put the logic in the Elf or Goose class, maintenance of the feature becomes simpler.

    class Elf {
		bool DoesElfLike(Creature c) {
			if (c instanceof Orc) return false;
			if (c instanceof HarmlessPetSpider) return true;
			if (c instanceof Spider) return false;
			return true;
		}
    }

Of course, this has its own drawbacks. Now we've lost the type-heirachy. meaning, if I accidentally put the `instanceof Spider` check before the `instanceof HarmlessPetSpider` check, our type system is not going to tell me that I made a logic error, I've simply introduced a bug into the code.

**Idea #4 -- Visitor Pattern** Ah, The good old Gang of Four has not deserted us in our time of need. As it turns out, runtime multiple-dispatch is a fairly common pattern, common enough that quite programmers frequently independently come up with a pattern on their own that has come to be known as the *Visitor* pattern.

	interface CreatureVisitor {
		void DoesElfLike(Creature c);
		void DoesElfLike(Orc c);
		void DoesElfLike(Spider c);
		void DoesElfLike(HarmlessPetSpider c);
	}
	class Orc : Creature {
		void accept(CreatureVisitor v) { v.Visit(this); }
    }
	class Spider : Creature {
		void accept(CreatureVisitor v) { v.Visit(this); }
    }
    .. etc ..

	class Elf : CreatureVisitor {
		void DoesElfLike(Creature c) { c.accept(this); }
		void Visit(Creature c) { Greet(true); }
		void Visit(Spider s) { Greet(false); }
		void Visit(HarmlessPetSpider s) { Greet(true); }
		void Visit(Orc o) { Greet(false); }
	}

hmmm. Well, now we've added a bunch of boilerplate on every single Creature type, since every single one of them has to define its accept method. And now, your "list of all subclasses of creature" is hard-wired into your CreatureVisitor. When you need to add a new Creature, you'll have to add it to the list of all your visitors and your base CreatureVisitor interface. This could really be a big issue. Shelob herself is not going to bother us a whole lot, since her GiantEvilSpider can still inherit Spider.accept behavior, but actually adding a new type that the Elf has an opinion on involves changing CreatureVisitor and all its implementors, including any OpinionatedGeese, even if their opinion hasn't changed. Is this much boilerplate really worth the hassle?

Well, maybe. In "enterprise"-land, You'd expect the CreatureVisitor bits to be downstream of the Creature bits. So you could manage change by first adding a new Creature, then updating your Visitors in one go. Incidentally, this suggests that writing general-use visitor types actually leads to more brittle code, since you'd want them packaged as close to the implemetation of the visitors as possible to void breakage. Your Creature taxonomy becomes aggravating to modify, but your Visitor taxonomy becomes easier to modify. The benefit becomes noticeble when you get more Visitor-like things. When your OpinionatedGoose and his pal OpinionatedToaster, or even other functions based on Creatures, such as Serializers or Renderers or what-have-you, come around and they have their own ideas about what they want to do to a Creature, then your machinery is already there; the `accept`s and `Visit` slots are ready for implementation. Incidentally, this Creature-axis rigidity behavior comes up in functional programming languages fairly often, since in one of my random musings I realized the visitor pattern is an OOP analogue of functional pattern matching. But that is another story and shall be told another time.

But there will always be a little nagging voice in the back of your head. Your sense of DRY is tingling a bit because of the duplicated accept on all Creature types, and especially the list of types on the CreatureVisitor interface. Why do we have to add this boilerplate to implement something as fundamental as double dispatch?

**Idea #5 -- polymorphic dynamic dispatch in C#** C++/Java/C# resolve virtual functions via runtime-dispatch the type of the bound object but not on the types of the arguments. Our dynamic language friends such as Python/Ruby/  do not support a polymorphic dispatch; although they do route method calls at run-time, they do not discriminate method signatures based on type arguments. Some typed languages, such as Lisp, support dispatching based on the runtime types of the argument. While neither naive dynamic binding nor naive static binding can implement multimethods, the introduction of scoped dynamic dispatch in C# gives us a new way of implementing our OpinionatedElf:

    class Elf {
		bool DoesElfLike(Creature c) { return doesElfLikeType((dynamic)c); }
        bool DoesElfLikeType(Creature c) { return true; }
		bool DoesElfLikeType(Spider s) { return false; }
		bool DoesElfLikeType(HarmlessPetSpider s) { return true; }
		bool DoesElfLikeType(Orc o) { return false; }
    }

And there we go. We avoid touching external files like Idea #1 (adding methods to all Creatures for each opinion). We have all the logic encapsulated in our class without monkey patching anything like in Idea #2. We are about as succinct as explicit type-checking in Idea #3 without losing the type heirarchy information and being subject to ordering errors. And, we avoid the boilerplate required for Idea #4, the Visitor pattern.

<script src=/hljs/highlight.js> </script>
