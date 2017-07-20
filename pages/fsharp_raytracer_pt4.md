##FSharp Raytracer Part 4 - Specular Reflection and Mirrors

This episode, we're going to add reflection into our system! Luckily, reflections are extremely easy to add to a standard raytracer. Lets take a look at our previous raytrace function:

    let raytrace ray =
        match closestIntersection (scene |> Seq.cast) ray with
        | None -> Vector3.Zero
        | Some(i) -> lambert i lights

We first need to add a depth-counter to the `Ray` type so we know when to stop reflecting. Otherwise, we'd keep bouncing around for too long in a scene with a lot of reflections. We'll initialize it so something like `N=3` when we start the ray-cast. Then we'll have to calculate the reflected ray for each intersection. Luckily, we already have our incoming ray and normal vector, so it is a matter of simple vector math to arrive at the formula for the reflected ray:

    let incident = Vector3.Normalize(-ray.Dir)
    let reflected = 2.f * item.normal * (dot incident i.normal) - incident

We then recursively call raytrace again with the new ray, taking the current lambert term and adding 30% of the reflected light to our current point.

    let rec raytrace ray =
        if ray.N < 0 then Vector3.Zero
        else match closestIntersection (scene |> Seq.cast) ray with
        | None -> Vector3.Zero
        | Some(i) -> 
            let incident = Vector3.Normalize(-ray.Dir)
            let reflected = 2.f * i.normal * (dot incident i.normal) - incident
            lambert i lights + 0.3f * raytrace { Pos = i.point; Dir = reflected; N = ray.N - 1 }

![](http://i.imgur.com/V1WZYua.png)