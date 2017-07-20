## A Platformer Level Generator ##

* [Play](http://moosekk.github.io/procedural_level/)
* [Code](http://github.com/moosekk/procedural_level/)

My second [/r/proceduralgeneration](http://www.reddit.com/r/proceduralgeneration) contest entry! I spent less effort on this than the previous round, but apparently there was just a lot less participation in general because of the steep hurdle of *having to create a game* in order for creating a level to be particularly meaningful. Instead of using F#, I decided to go with Typescript for this round, since I wanted an interactive online demo level that people could play around with. This was my first time using Typescript but it turned out to be pretty nice to work with; The platformer/level generator wound up just shy of 300 lines of code, most of which were not involved in actual level generation.

![screenshot](/images/procedural_level/screenshot.png)

### Generating Platforms ###

The core of the generation function is at [Github:level.ts](https://github.com/moosekk/procedural_level/blob/master/level.ts). I basically roll a die, randomly chooseing a direction up, up-left, up-right, right, or down. Before going in any given direction, I make sure it doesn't interfere too much with the previous direction (for example, I wouldn't go up, then immediate go down.) To build the level, I start with an initial platform at 0, 0, pick a direction, build a random number of platforms out in that direction, and then repeat. In the following example code, for example, I would start with an initial platform, build right, then right again, then up-left.

        var platform = new Box(0, 0, 1, 1);
        platform = linkRight(platform, 3, 1, 1); // make a 1x1 box 3 units right from the first one
        platform = linkRight(platform, 1, 2, 10); // make a 2x10 box 1 unit away from the second box
        platform = linkUpl(platform); // make a box up and to the left from the third one

### Series of Platforms ###

![zoom-out](/images/procedural_level/zoomed.png)

However, a level that goes in a random direction for every platform would turn out looking pretty .. [random](https://simple.wikipedia.org/wiki/Random_walk). While the random walk pattern looks nice for creating a cavelike network structure, it feels pretty aimless for a platformer level. It helps when you have a stronger direction of flow, both locally at the small scale (platforms form 'set pieces' that go in a particular direction) and at the large scale (the entire level doesn't double back on itself too often). For the first point, if I want to build platforms towards the right, I might as well build 3 or 4 platforms in a series. I encapsulate this in the repeat function, which will update the state of the platform and repeatedly call a link function.

        platform = repeat(3, linkRight);

For the second point, the generator tracks the last direction it was building new platforms in. Certain transitions are forbidden. RIGHT->RIGHT [which results in a long horizontal string of platforms towards the right] is forbidden, as well as "drops of faith" (large downward drops marked by caution blocks) when you've just been ascending up or leftwards (to prevent dropping back onto previously placed platforms).

    var new_dir = randarr([RIGHT, RIGHT, RIGHT, UPRIGHT, UPLEFT, UP, DROP, DROP, DROP]);
    switch (new_dir) {
        ...
        case DROP:
            if (prev_dir == UPLEFT || prev_dir == UP) continue;
            newbox.navi = "drop";
            yield * repeat(randi(1, 3), drop); break;

### Doodads ###

![doodads](/images/procedural_level/doodads.png)

The level looks kind of boring when it's just a bunch of platforms, so I scatter little decorations, like rocks, bushes, and grass, randomly throughout the level. Since we want to keep the distribution uniform, the number of doodads on each block is proportional to the width of the block.

    function * getDoodads() {
        ...
        for(var box of this.boxes) {
            for(var j = box.w * 2; j --> 0;)
                if (random() < 0.2)
                    yield [randarr(["bush", "grass", "rock",
                        "grass", "bush", "grass",
                        "rock", "mushroomBrown", "mushroomRed"]),
                        new Point(box.x + 0.5 + random() * (box.w-1), box.t + 0.5)];
        }
        ...
    }

### Keeping Track of Completion ###

Kind of a last-minute feature I threw in: save completed levels to Local Storage. 1) This gives you a sense of progress, and 2) it allows players to share particularly interesting level seeds with each other (or with me, if you want to report a bug).

### [Try it out!](http://moosekk.github.io/procedural_level/) ###
