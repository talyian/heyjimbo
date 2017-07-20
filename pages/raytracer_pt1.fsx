#if INTERACTIVE
#r "OpenTK.dll"
#else
module HeyJimbo.MooRay
#endif

open System
open System.IO
open System.Drawing
open OpenTK
open System.Linq
open OpenTK.Graphics
open OpenTK.Graphics.OpenGL
open System.Diagnostics

// ************************* UTILITIES *************************************
let dot a b = Vector3.Dot(a,b)
let clamp x a b = if x < a then a elif x > b then b else x
(* Renders a 2D color array to a file and displays it *)
let view buffer = 
    let w,h = Array2D.length1 buffer, Array2D.length2 buffer
    let bmp = new System.Drawing.Bitmap(w,h)
    let data = bmp.LockBits(
        new Rectangle(Point.Empty,bmp.Size), 
        Imaging.ImageLockMode.WriteOnly, 
        Imaging.PixelFormat.Format32bppArgb)
    let ptr = NativeInterop.NativePtr.ofNativeInt data.Scan0
    for y in 0..h-1 do for x in 0..w-1 do
        let color : Color = buffer.[x,y]
        NativeInterop.NativePtr.set ptr (y * w + x) (color.ToArgb())
    bmp.UnlockBits(data)
    bmp.Save("temp.png",Drawing.Imaging.ImageFormat.Png)
    Process.Start("temp.png")

// ************************* TYPES *****************************************
type Ray = { Pos : Vector3; Dir : Vector3 }
type Light = { Pos : Vector3; Color : Color4; Intensity : float }
type Intersection<'T> = { time : float32; point:Vector3; normal:Vector3; shape:'T }

type Shape () = 
    abstract IntersectRay : Ray -> Intersection<Shape> option
    override this.IntersectRay ray = None
// ************************* SHAPES ****************************************
type Sphere (pos: Vector3, r: float32) = inherit Shape () 
// ************************* DATA ******************************************
// let camera = Vector3.Zero
let scene : Shape list = [
    Sphere(Vector3(0.f, -1000.f, 0.f), 998.f)
    Sphere(Vector3(-1.f, -0.f, 5.f), 1.f)
    Sphere(Vector3(2.f, -0.f, 5.f), 2.f)
]
let Lights = [ ] // TODO
// ************************* RAYTRACER *************************************
(* given a point in clipspace, convert to world-space *)
let unproject (v4:Vector4) = 
    { Dir = v4.Xyz; Pos = Vector3.Zero }

let closestIntersection scene ray = None // TODO

(* given the pixel coordinates px and py, returns the color of the output at that location *)
let raytrace (sx,sy) =
    let ray = unproject (Vector4(sx,sy,1.0f,1.0f));
    match closestIntersection scene ray with
    | None -> Color.Black
    | Some(item) -> Color.White

let render (w,h) = 
    let data = Array2D.zeroCreate w h

    (* given a pair of pixel coordinates on the window, convert to a point in normalized screen space *)
    let windowToScreen (wx, wy) = 
        let w,h = float32 w,float32 h
        2.f * float32 wx / h - w / h, 1.f - 2.f * float32 wy / h

    for y in 0..h-1 do 
        for x in 0..w-1 do
            data.[x,y] <- raytrace(windowToScreen(x,y))
    view data

render (800,600)