#r "OpenTK.dll"
open System
open System.Diagnostics
open System.Drawing
open OpenTK
open OpenTK.Graphics

let dot a b = Vector3.Dot(a,b)
let clamp x a b = if x < a then a elif x > b then b else x

(* Renders a 2D color array to a file and displays it *)
let viewimage buffer = 
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

type Ray = { Pos : Vector3; Dir : Vector3; N : int }
type Light = { Pos : Vector3; Color : Color4; Intensity : float }
type Intersection<'T> = { time : float32; point:Vector3; normal:Vector3; shape:'T }

type Shape () = 
    abstract IntersectRay : Ray -> Intersection<Shape> option
    override this.IntersectRay ray = None
