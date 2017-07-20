## Double Dispatch and Game logic and Message Handling.

My previous survey of opinionated elf logic wasn't purely an academic exercise. I originally wrote the argument for `dynamic` multimethods in C# using Steve's Opinionated Elf example because I was explaining to someone how to handle Message routing between client and server in a multiplayer game. Namely, I have a set of Message types that all subclass a base Message:

	class Message { }
	class ChatMessage { }
	class MoveMessage { }
	class ActionEventMessage { }
	class LoginMessage { }

and I was trying to explain how to divide up the logic between client-side and server-side components. you could write different client/server logic for individual message types. 

    class ClientsideMessageHandler { 
		void Route(Message m) { Handle((dynamic)m); } 
		void Handle(Message m) { /* unhandled message type ? */ }
		void Handle(ChatMessage m) { ChatWindow.Show(m.MessageSource, m.MessageText); }
		void Handle(MoveMessave m) { Entities.Find(m.EntityID).Move(m.newLocation); }
		// etc
	}
    class ServerMessageHandler { 
		void Route(Message m) { Handle((dynamic) m); }
		void Handle(Message m) { /* unhandled message type ? */ }
		void Handle(ChatMessage m) { /* route chat message to listening clients */ }
		void Handle(MoveMessage m) { /* validate then update nearby clients */ }
    }

In my opinion this approach is better than explicit type-checking, both in terms of DRY and in terms of maintaining type heirarchies. 

    void Route(Message m) { 
		var c = m as ChatMessage; 
		if (c != null) { Handle(c); return; }
		.. etc..
    }

### Is DYNAMIC slow?!?!!

So after that example, lets examine the performance. With the caveat the benchmarks can be misleading, here are some numbers from running a simple MessageHandler that counts the number of different types of messages it's getting. I implemented a basic no-runtime-typing handler that maintains separate typed queues for each message type. 

**1 Million Message Calls:**

* No Virtual calls: 2.5ms
* Explicit Type Checking: 15ms (*)
* Visitor: 17ms
* `dynamic`: 236ms

So, a basic method dispatch takes a couple nanoseconds, adding in some basic type checking adds 10 nanoseconds, but with a caveat: this takes time proportional the number of types you're checking. for 20 or 30 types, the time would be 10 times as large. The Visitor Pattern manages to be the fastest double-dispatch mechanism, taking 17 nanoseconds regardless of how many types are used. Finally, dynamic turns out to be the slowest method, taking a full 235 nanoseconds per invocation. A quick sanity check in CPython:

	>> timeit('for m in items: handler.handle(m)')
    0.201900066844

Shows that this is about the same as the cost of a dynamic method invocation in Python. So, how many messages are you going to be routing per second? 100? A 23 microsecond routing cost is fairly easy to swallow in exchange for the simple code. Routing a 100,000 messages per second? If you only have 10 microseconds to respond to each message, it might be better not to waste 200+ nanoseconds per message on the routing dispatch. 