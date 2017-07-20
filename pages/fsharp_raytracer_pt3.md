##FSharp Raytracer Part 3 - Phong Shading / Lambertian Reflection

Shading is the process of taking a point on a surface and calculating exactly what color we see there. In real life, a surface absorbs and emits light in all directions. The light that we see is the portion of light from that surface that is emitted directly towards our eyes (or camera). 

<div style='background:white;margin:5px auto;width:500px;'>
![Phong reflection](http://upload.wikimedia.org/math/5/3/0/53034e777d8232db9d66852d9698806a.png)
</div>
Here is the formula for the Phong reflection model. Don't be scared by the formula, it is actually quite basic (plus, we're actually going to only use 1/3 of it!) In plain English, the Phone reflection model assumes that all light is composed of a global ambient light factor *k<sub>a</sub>* plus a diffuse reflection + a glossy reflection for each individual light in the scene. 

In this installment, we'll simplify the equation down to just the diffuse reflection, i.e. the *k<sub>d</sub>* term. This is called [Lambertian reflection](http://en.wikipedia.org/wiki/Lambertian_reflectance), after the guy who proposed this model in the 1700's. 

Shading function for lambert reflection:

    let lambert (i:Intersection<Shape>) = 
        let rawcolor = dummyshade i
        let illumination (l:Light) = 
            let lm' = l.Pos - i.point |> Vector3.Normalize // direction from point to light (normalized)
            rawcolor * dot lm' i.normal
        Lights |> Seq.map illumination |> Seq.reduce (+) 

Note that we just use our buddy from the last post, dummyshade, to grab a random color for each shape as the base color. We then write a function `illumination` that calculates the contribution of color from each light in the scene. then in the final line of F# `Lights |> Seq.map illumination |> Seq.reduce (+)` just a `map/reduce` telling us to sum up all the illuminations for every light, and return the sum.

![](http://i.imgur.com/4ljFFvE.png)