#r "OpenTK.dll"
open System
open System.IO
open System.Drawing
open OpenTK
open System.Linq
open OpenTK.Graphics
open OpenTK.Graphics.OpenGL

#load "raytracerutils.fsx"
open Raytracerutils

type Sphere (pos: Vector3, r: float32) = 
    inherit Shape () 
    override this.IntersectRay (ray:Ray) =
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

// ************************* SHADERS ***************************************
let phong pt (ks,(kd:Color4),ka,a) lights N v =
    let illumination (l:Light) = 
        let lm' = l.Pos - pt |> Vector3.Normalize // direction from point to light (normalized)
        let rm' = 2.0f * (dot lm' N) * N - lm'    // reflection vector (normalized)
        let ratio = clamp (dot lm' N) 0.0f 1.0f
        Vector3(kd.R * ratio, kd.G * ratio, kd.B * ratio)
    // color is ambient + the sum of illumination over all lights
    ka + Seq.reduce (+) (Seq.map illumination lights)

// ************************* DATA ******************************************
let rand = new Random(0)
let rr a b = (rand.NextDouble() |> float32)*(b-a) + a
// let camera = Vector3.Zero
let scene = [
    Sphere(Vector3(0.f, -1000.f, 0.f), 998.f)
    Sphere(Vector3(-1.f, -0.f, 5.f), 1.f)
    Sphere(Vector3(2.f, -0.f, 5.f), 2.f) ] @ [ for i in 0..10 -> Sphere(Vector3(rr -5.f 5.f, rr -1.f 1.f, rr -5.f 5.f), rr 1.f 2.f) ]
let Lights = [
    { Light.Pos = Vector3(10.f, 20.f, -10.f); Color = Color4.White; Intensity = 1.2 }
]
// ************************* RAYTRACER *************************************

type RayTracer () = 
    (* given a point in clipspace, convert to world-space *)
    let unproject (v4:Vector4) = 
        { Dir = v4.Xyz; Pos = Vector3.Zero; N = 3 }

    (* given a ray , returns the closest object in the scene that intersects with it, as well as the intersection point and normal *)
    let closestIntersection scene ray = 
        scene 
        |> Seq.map (fun (x:Shape) -> x.IntersectRay ray)
        |> Seq.minBy (fun i -> if i.IsNone then Single.PositiveInfinity else i.Value.time)

    (* given the ray, returns a vector color of its value *)
    let rec raytrace ray =
        match closestIntersection (scene |> Seq.cast) ray with
        | None -> Vector3.Zero
        | Some(item) -> 
            let color = Color4(Color.FromArgb(item.shape.GetHashCode() * 31547 >>> 8))
            let cvector = phong item.point (0.7f,color,Vector3.Zero,0.2f) Lights item.normal (ray.Pos - item.point)
            if ray.N = 0 then
                cvector
            else
                let ri = Vector3.Normalize item.point
                let rr = ri - 2.f * item.normal * (dot ri item.normal)
                cvector + 0.5f * raytrace { Pos = item.point; Dir = Vector3.Normalize rr; N = ray.N - 1 }

    let rec getPixel ray = 
        // tone mapping
        let cvector:Vector3 = raytrace ray 
        let f a = clamp (int(Math.Log(float a * (Math.E - 1.0) + 1.0) * 255.0)) 0 255
        Color.FromArgb(f cvector.X, f cvector.Y, f cvector.Z)

    member this.Render (w,h) = 
        (* given a pair of pixel coordinates on the window, convert to a point in normalized screen space *)
        let windowToScreen (wx, wy) = 
            let w,h = float32 w,float32 h
            2.f * float32 wx / h - w / h, 1.f - 2.f * float32 wy / h

        let data = Array2D.zeroCreate w h
        for y in 0..h-1 do 
            for x in 0..w-1 do
                let sx,sy = windowToScreen(x,y)
                let ray = unproject (Vector4(sx,sy,1.0f,1.0f))
                data.[x,y] <- getPixel ray
        viewimage data

(new RayTracer()).Render(1200,800)