var showError = s => s && console.error(s);
var $ = x => document.getElementById(x);
function draw(gl, program, buffers) {
    gl.useProgram(program.p);
    gl.uniform1f(gl.getUniformLocation(program.p, 't'), +new Date() / 1000 % 1.0);
    gl.vertexAttribPointer(gl.getAttribLocation(program.p, "pos"), 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}
function initBuffers(gl) {
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ 1, 1, -1, 1, 1, -1,-1, 1, 1, -1, -1, -1]), gl.STATIC_DRAW);
    return buf;
}
function Program(gl, shaders) {
    this.p = gl.createProgram();
    shaders.map(s => gl.attachShader(this.p, s.id));
    gl.linkProgram(this.p);
    showError(this.error = gl.getProgramInfoLog(this.p));
    gl.enableVertexAttribArray(gl.getAttribLocation(this.p, "pos"));
}
function Shader(gl, src, type) {
    this.id = gl.createShader(type);
    gl.shaderSource(this.id, src)
    gl.compileShader(this.id);
    showError(this.error = gl.getShaderInfoLog(this.id));
}
Shader.loadSrc = function (gl, id) { return new Shader(gl, $(id).innerHTML, $(id).type == 'x-shader/fragment' ? gl.FRAGMENT_SHADER : gl.VERTEX_SHADER) };
cv.height = $('post-content').clientHeight;
cv.width = $('post-content').clientWidth;
var gl = $('cv').getContext('webgl');
var pp = new Program(gl, [Shader.loadSrc(gl, 'frag'), Shader.loadSrc(gl, 'vert')]);
pp.error || (function render() { draw(gl, pp, [initBuffers(gl)]); requestAnimationFrame(render); })();

