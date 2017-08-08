# Arduino Door Remote

So, I currently live in a walkup in New York City. No doorman, no lobby. My frequent Amazon orders come in via a variety of carriers - Fedex, UPS, USPS, and various local logistics third parties that Amazon partners with. The standard protocol is that the deliveryman leaves packages inside my mailroom area, behind the (locked) front door. Quite often, the deliveryman does not have keys to my building's front door, which means he isn't able to leave the package. This makes receiving deliveries quite difficult for me, since I have to take time off to be home to await packages. Even worse, the delivery window is usually "somewhere between 10AM and 8PM" so I can't even go anywhere for fear of missing the package.

All I needed was a way to remotely open the front door when the deliveryman arrives so he can drop off the package. This seemed like an idea for an electronics project!

Instead of the Arduino, I decided to get an ESP8266, which includes a Wifi antenna. There's an arduino-compatible driver for it so I can use the standard Arduino Studio workflow to compile and upload firmware to it via a USB-to-serial FTDI adapter.

### The Overall Script

1. A delivery guy calls me and tells me he's got my package. I tell him to ring my doorbell, which triggers an ESP8266 that's reading the voltage on the doorbell wire.
2. The 8266 sends a POST request to <server>/door, which blocks and waits for step 4.
3. We send a link with a one-time-use token http://doorserver/open/SECRETTOKENHERE to my email address.
4. Two things could occur:
   A) The link is clicked within 5 minutes, and we return a "open" command to the 8266, which sends a signal to open the door as if we were pressing the buzzer from within the room.
   B) A timeout occurs after 5 minutes, and we return 'timeout'. The token is invalidated. If any /open/ link is clicked with a stale token, the client is informed that they were too slow.
5. The 8266 goes back to the waiting state.

### The Server side

The server code is 59 lines of typescript at https://github.com/talyian/door_server/blob/master/src/index.ts. 
Dependencies: 

1. Express, for the HTTP server part
2. Sendmail, for the sending email part
3. Crypto, for the generating cryptographically sound random bytes part.

Nothing particularly outrageous, just a standard nodejs+express server that accepts a /door query and holds it open while waiting on another client to respond on the /open endpoint with the appropriate secret token. The token in question is simply a global variable, `secret`, but without too much further work this could be adapted to support multiple doors and email addresses. 

```typescript
// endpoint for Button to notify us
app.get('/button', function(req, resp, next) {
    var mailer = Sendmail();
    secret = Crypto.randomBytes(32).toString('hex');
    mailer({
        'from': 'door-server@app.example.com'
        'to': 'admin-email@example.com'
        'subject': 'door',
        'html': `Requesting Access: <a href="http://${req.hostname}/open/${secret}">Click Here</a>`
    }, function(err: any, reply: any) {
        if (!err) {
		
    ... 
```

### The Client Code (explicit state machine on the Arduino loop)

The client side code is 106 lines of Arduino-flavored C. (https://gist.github.com/talyian/58b93d15451dcb418808213faa7e5a35) Okay, I'll be the first to admit, I'm not an Arduino expert. I kind of bumbled my way through implementing a state-machine-via-giant-switch-statement in the main loop for this application, although it smells like something you'd really want a coroutine library for. 

```C
void loop() {
  static int state = STARTING, counter = 0, status = 0;
  switch(state) {
  case STARTING:
    status = WiFi.status();
    if (status == WL_CONNECTED) {
      state = READY;
    }
  case READY: // connected to wifi, wait for button press
    if (check_button_pressed()) {
      state = NOTIFYING;
    }
    break;
  // Ask the internet for permission to open the door
  // will mutate state when done	
  case NOTIFYING: return client_loop(state);
  ...
  
void client_loop (int &main_state) {
  enum { BEGIN, CONNECTING, RECEIVING, ...
  static int state = BEGIN;
  switch(state) { 
      ...
	  case RECEIVING:
	      if (!client.connected()) { // disconnected from web server
		       main_state = READY;
			   state = BEGIN;
			   return;
          }
		  else if (!client.available()) { // waiting on bytes to come in
		       return;
		  }
		  // process response!
	      String content = client.readString();
		  ....
```

### Picture

![Photo of ESP8266 and Breadboard](/images/doorserver/photo.jpg)

### Next Steps

#### Power

Currently, the USB connection is providing the power. This is kind of a pain -- I'd like to drive it directly off the 11V wires powering the doorbell itself. I have a few buck converters lying around I can use for this.

#### Breadboard

I need to move this project to a prototype board to cut down on the bulk.

#### Interface

My phone doesn't do a great job of getting emails reliably. I may want to use twilio or something to send 
texts instead. Also, instead of having to click the link in the email, perhaps just replying "open" or "Y"/"N" would be easier to do from my phone's lock screen.
