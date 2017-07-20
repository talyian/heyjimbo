## FSharp Raytracer Part 2 - Spheres

If our naive plan for raytracing is simply "find the intersection of each object with our ray" we still need to write a function that intersects a ray with a sphere. One very valuable compilation of intersection algorithms is the [Real-time Rendering](http://www.realtimerendering.com/intersections.html) website (which has a very excellent companion book). 

A Sphere is all the points that are some distance R away from a center point. A ray is the locus of points `origin + t * direction` for all `t > 0`. Thus, we can substitute the ray equation (`point(t) = ray.origin + t * ray.direction`) into the circle equation (`| point - center | = radius`) to get `|rayOrigin - center + t * rayDirection| = radius`. This produces a quadratic equation in `t` that we can use the quadratic formula to solve.

    // solving for t after expanding combined ray and circle equations.
    A = |rayDirection|^2
    B = 2 * (rayDirection . (rayOrigin - center))
    C = |(rayOrigin - center)|^2 - radius ^ 2 
    A * t^2 + B * t + C = 0

Full intersection code:

    let raysphere pos, r, ray = 
        let RC = ray.Pos - pos
        let A = ray.Dir.LengthSquared
        let B = dot (2.0f * ray.Dir) RC
        let C = RC.LengthSquared - r * r
        let disc = B*B - 4.0f * A * C
        if disc < 0.0f then None // no intersection
        else
            // we only take the negative root here so we only take the near (front) point
            let t = (-B-sqrt(disc))/2.0f/A
            if t < 0.0f then None // sphere is behind camera
            else
                let point = t * ray.Dir + ray.Pos
                let normal = Vector3.Normalize(point - pos)
                Some({ time = t; point = point; normal = normal; shape = this })

Now that we have a good way of detecting intersections, we need to figure out a good way to decide what color the intersection point should be rendered as. For the next post, I'll talk about one of the most popular and simple shaders out there: Phong shading. For now, we can write a dummy shader that just dumps a random color based on the hash of the object:

    let dummyShade intersection = 
        let n = intersection.shape.GetHashCode()
        Vector3(n / 100.f % 1.f, n / 1000.f % 1.f, n / 10000.f % 1.f)
        
And here is the result, in all its glory: ![](http://i.imgur.com/AHsbYAR.png)

[Full code for this section](raytracer_pt2.fsx)

Up next: Phong shading! So our spheres look a little bit more 3D.