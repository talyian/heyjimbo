## F# Raytracer Part 1 -- Getting Started

For my inaugural blog series, I think I'll start by talking a bit about ray tracing. 3D Graphics has always been one of my interests, and an easy way to get to understand some of the concepts is by writing your own ray tracer! Plus, the end result is fairly pretty.

![Example output!](http://i.imgur.com/4ljFFvE.png)

### A brief 3D math refresher

* **Vectors** - A vector is a sequence of N numbers that represents a point or direction in space. We'll mostly be using 3D vectors such as (0,0,0), since we're dealing with 3D space. We will have to add vectors, scale vectors, take the length of a vector, and take the cross product of two vectors. 

* **Matrices** - Where a vector is a sequence of N numbers, a matrix is a sequence of NxN numbers. Matrices are useful in 3D Math because they can be used to define *transformations* on vectors. Rotation, translation, scale, perspective, can all be encoded as Matrices. 

* **Coordinate Systems** - We commonly work in multiple frames of reference. The one that is most familiar is "world coordinates", in which X,Y, and Z represent direction along 3 orthogonal vectors. By one convention, X is left/right, Y is up/down, and Z is in/out. Another coordinate system we'll be dealing with is "screen coordinates", in which X and Y go from -1 to 1 as the point goes from the bottom left corner of the screen to the top right corner. 

    1. **Object Space** - coordinates relative to a particular object. The origin will usually correspond to the "center" or "pivot point" of that object.
    1. **World Space** - coordinates that are "fixed". Objects and the camera view will move relative to world space.
    1. **Camera Space** (Eye Space) - Coordinates centered on the current view. This is a system that is usually rotated and translated from world coordinates but not stretched or scaled in any way (they are *isometrically isomorphic*, if you want to be precise)
    1. **Clip Space** - Okay, this is the first non-linear space we've encountered. This means that a rectangle in clip-space is not a rectangle in world space. Clip Space exists inside a frustum that is bounded by the camera bounds on the X- and Y- axes and the near/far clip planes on the Z- axis. All our visible objects lie within this clip-space rectangle (which is actually a frustum)
    1. **Screen Space** - Clip space is easily normalized by dividing by W. This results in X/Y ranging from -1 to 1, which we can map to pixel-based window coordinates easily based on the size of our window and the number of pixels.
    
### Outline of a Ray Tracer

Okay. Lets get started. I'm going to use OpenTK as a 3D Matrix/vector library. 

**The data** of our scene we can just define up front. I'm going to simplify things and place the camera at the world origin. Then we can express all object data in world coordinates as well and ignore the difference between object/world/camera space. This laziness allows us to skip using a model-view transformation. Also, I'll only deal with Spheres for now. This simplifies our data definition to:

    let scene = [
        Sphere(Vector3(0.f, -1000.f, 0.f), 998.f)
        Sphere(Vector3(-1.f, -0.f, 5.f), 1.f)
        Sphere(Vector3(2.f, -0.f, 5.f), 2.f)
    ]
    let Lights = [ ] // TODO
        
**The main body** of our ray tracer is going to trace one ray for each pixel on the screen. One key assumption we can start off with is that each ray is independent of every other ray. This way, our main loop is trivially simple. 

    for y in 0..h-1 do 
        for x in 0..w-1 do
            data.[x,y] <- raytrace(x,y)
            
for each pixel coordinate, we need to transform to screen space, pick a near/far value for Z, then "unproject" a ray into camera/world space based on our camera values. Since we're working in a vastly simplified "clip space = world space" assumption, unproject 
simply returns the input vector's X/Y/Z coordinates as the ray endpoint.

    let windowToScreen (wx, xy) = (float wx - w) / w, (float wy - h) / h
    
    (* given a point in clipspace, convert to world-space *)
    let unproject (v4:Vector4) = 
        // our unproject is an identity transform, which is why ray.Dir is v4.XYZ
        { Dir = v4.Xyz; Pos = Vector3.Zero }
    let raytrace (row, column) = 
        let screenx, screeny = windowToScreen (row,column)
        let ray = unproject (Vector4(screenx,screeny,1,1))
        match closestIntersection scene ray with
        | None -> Color.Black
        | Some(item) -> Color.White

[Here is our total code so far](/pages/raytracer_pt1.fsx) ... and the output. Haha. It's black! We haven't coded any lighting, ray intersections, or shading yet.

<div style='background:black;width:500px;height:300px;'> 
</div>

### Projected Blog series
* Part 2: Ray/Sphere Intersections
* Part 3: Simple Phong Shading
* Part 4: Specular Reflection
* Part 5: More Geometry Types
* Part 6: Ambient Occlusion
* Part 7: Environment Mapping
* Part 8: Spherical Harmonics
