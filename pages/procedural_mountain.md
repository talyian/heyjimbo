## The Mountain from the Noise

![](/images/procedural_mountain/mountain.jpg)

So [this month's procedural generation challenge](https://www.reddit.com/r/proceduralgeneration/comments/5afjxp/) was 'mountains.' Mountains are one of the most commonly encountered procedural generation subjects, since they are easy to generate using a 2D heightmap. I decided to start with the basic strategy of "simplex noise on a plane" and work out what kind of enhancements I could add from there. This project turned out to be a good exploration into building a noise function as well.

## Setting up the mountain development environment.

I won't cover this in too great of detail, but broadly speaking you need to be able to do a couple things: Generate a 2D heightmap, and then convert that heightmap to a 3D view. One simple way I could think of is to write out an image to a file, and [loading it up in Blender or other program as a heightmap](https://en.wikibooks.org/wiki/Blender_3D:_Noob_to_Pro/Making_Landscapes_with_heightmaps). You could also generate a 3D mesh from the heightmap (I took this route).

### Purely Random Hash Function
Instead of using some variant of `Math.Random()`, which is for generating a single pseudorandom stream of data, I'd rather use some hash function applied to the x and y coordinates of the heightmap pixel I'm sampling. A well-written hash function should produce pseudorandom output when fed non-repeating inputs, and this ensures determinism.

Warning! I came up with this hash function (truncating digits of `sin()`) without much thought. It doesn't pass as a quality hash function by most metrics. It's random *enough* for the purposes of this post, but do your research before blindly copying this code!

```
let hash v = (sin (v * 100.0) * 100.0 + 100.0) % 1.0  

let hash2 a b = hash(a + hash(b))  

let noise x y = hash2 x y
```

![](/images/procedural_mountain/step1.jpg)
![](/images/procedural_mountain/step1.1.jpg)

### Quantized random function

Hmmm. The last hash function was a bit too much like static. Lets try to tone down how much it changes by only changing every 1 unit of distance (which i've scaled to about 1/10th of a screen).

```
let squarenoise x y = hash2 (floor x), (floory)
```
<tr><td>

![](/images/procedural_mountain/step2.jpg)
<td>

![](/images/procedural_mountain/step2.1.jpg)

### Smoothed Quantized random function

Alright, now lets get rid of those hard edges by taking the 4 corners of each square and blending them together. If wonder what
the operation is for "linearly blending 4 values in 2D", you can search for things like "bilinear interpolation". This gets us a continuous noise function.

Note that this `smoothnoise` function blends the corners of the square containing the current point. We could also have written a function that calculates the noise value at the corners of a containing equilateral triangle (which is also called a simplex). The simplex experiences less 'bias' in non-aligned directions and scales better into higher dimensions. I actually used a simplex-based smoothnoise, but it involves a small bit of trigonometry so I figured the square-based noise cell would be easier to understand.

```
// linearly interpolate between two values A, B
let lerp a b ratio =
    (1.0 - ratio) * a + ratio * b

// bilinearly interpolate between 4 values
let bilerp (a,b,c,d) (x,y) =
    lerp (lerp a b x) (lerp c d x) y

let smoothnoise x y =
    let fx, fy = floor x, floor y
    let rx, ry = x % 1.0, y % 1.0
    (bilerp
       (squarenoise fx fy,
        squarenoise (fx + 1.0) fy,
        squarenoise fx (fy + 1.0),
        squarenoise (fx + 1.0) (fy + 1.0))
       (rx, ry))
```
<tr><td>

![](/images/procedural_mountain/step3.jpg)
<td>

![](/images/procedural_mountain/step3.1.jpg)

### Noise Octaves

Notice a problem with the previous continuous noise function? The level of detail is too low! If we make each square smaller, we eventually get back to our original problem, which was that the noise is too random!. What we want is called *coherent* noise, which means that between any two nearby points, the noise doesn't change too much. One easy way to get coherent noise is to Take the noise and overlay itself against smaller copies of itself. Each smaller iteration adds smaller detail, but that detail doesn't have as large an effect. As an analogy, you can think the result of mixing pebbles, boulders, and sand together. One thing you'll notice is instead of just adding noise (2<sup>i</sup> . x), i use (i + 2<sup>i</sup> . x). This is to deal with an issue where near x=0, all the noise values tend to be the same value, breaking the randomness. Adding a slight offset to each iteration removes the fixed point and randomness is restored.

```
let octavenoise x y =
    List.sum [for i in 1..8 -> (2.0 ** -i) * smoothnoise (i + x * 2.0**i) (i + y * 2.0**i)]
```
<tr><td>

![](/images/procedural_mountain/step4.jpg)
<td>

![](/images/procedural_mountain/step4.1.jpg)

### Flattening out the edges

I the edge of my zone to be pretty flat so I can admire the mountains in the center. One easy way is to multiply by a curve that approaches 0 in all directions but is 1 near the center:

```
// N is a scaling value - larger produces a sharp, narrow peak
// smaller produces a smoother wider curve
let N = 1
let curve x y = 1.0 / (1.0 + N * x * x + N * y * y)
```
<tr><td>

![](/images/procedural_mountain/step5.jpg)
<td>

![](/images/procedural_mountain/step5.1.jpg)

<tr><td>

```
let finalFunction x y =
    (octavenoise x y) * (curve x y)
```
<tr><td>

![](/images/procedural_mountain/step6.jpg)
<td>

![](/images/procedural_mountain/step6.1.jpg)

</table>

As you can see, we can iteratively go from "random values -- wat" to a nice, mountain-shaped mound! Here are few pictures of stuff I continued to experiment with:

Early On, I tried to export the heightmap to Blender to render. This turned out to be more work than it was worth, but here's a render from when the height function was in "island mode": `if y < 0 then y = 0`

![](/images/procedural_mountain/rendered.jpg)

### Spherical Harmonic Lighting

I had some code for simple spherical harmonic lighting in GLSL available, so I tried a few lighting schemes. The results were interesting,
although I copied the spherical harmonics values from somewhere on the internet
instead of doing true image-based harmonics calculations.

![](/images/procedural_mountain/lighting1.jpg)
![](/images/procedural_mountain/lighting2.jpg)
![](/images/procedural_mountain/lighting3.jpg)

### Snow

There's a super easy way to add a "buried-in-snow effect" to a mountain :) Just take the heightmap, blur it, and use the blurred map as a heightmap for a second plane. "blurring" the heightmap means that the peaks
of the snow are lower than the peaks of the rock, but the troughs are higher. This means that the snow covers all the low areas. Then just make minor adjustments to vertical scale and height of the snow to match
how much "snowiness" you want in your scene.

![](/images/procedural_mountain/snow.jpg)

To go from a single mountain to a range of mountains, I just decreased the scale of the noise. Also, /u/stewsters on reddit commented that the snow could just as easily be used for sand as well. I liked that idea, so I rendered a sand preview as well.

![](/images/procedural_mountain/desert2.jpg)
![](/images/procedural_mountain/mountain.jpg)

<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/androidstudio.min.css">
<script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/highlight.min.js"></script>
<script>hljs.initHighlightingOnLoad();</script>
