// Lowlevel wrappers around webgl functions
function Shader(src, type, gl) {
    this.id = gl.createShader(type);
    this.src = src;
    this.type = type;
    gl.shaderSource(this.id, src);
    gl.compileShader(this.id);
    if (!gl.getShaderParameter(this.id, gl.COMPILE_STATUS)) {
	console.error("GLSL ERROR: ", gl.getShaderInfoLog(this.id));
    }
}

function Program(fs_src, vs_src, gl) {
    this.id = gl.createProgram();
    this.gl = gl;
    this.attachShader(new Shader(fs_src, gl.FRAGMENT_SHADER, gl));
    this.attachShader(new Shader(vs_src, gl.VERTEX_SHADER, gl));
    gl.linkProgram(this.id);
    if (!gl.getProgramParameter(this.id, gl.LINK_STATUS))
	throw gl.getProgramInfoLog(this.id);
    ['pos', 'uv'].map(attr => {
	idx = gl.getAttribLocation(this.id, attr);
	if (idx >= 0) gl.enableVertexAttribArray(idx);
    });
}
Program.prototype.attachShader = function(p) { this.gl.attachShader(this.id, p.id) };
Program.prototype.enable = function() { this.gl.useProgram(this.id) };
Program.prototype.setPointer = function(name) {
    var args = [].slice.apply(arguments);
    args[0] = gl.getAttribLocation(this.id, name);
    gl.vertexAttribPointer.apply(gl, args);
}

function Mesh(vertices, indices, gl) {
    this.vertbuffer = gl.createBuffer();
    this.vertexcount = vertices.length;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    this.indexbuffer = gl.createBuffer();
    this.indexcount = indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexbuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    this.setPointers = function() {
	gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
	gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);	 
    };
}

Program.prototype.drawMesh = function(m) {
    var gl = this.gl;
    this.enable();
    gl.uniform1f(gl.getUniformLocation(this.id, 't'), this.t);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.vertbuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.indexbuffer);	
    m.setPointers();
    gl.drawElements(gl.TRIANGLES, m.indexcount, gl.UNSIGNED_SHORT, 0);
}

function Matrix4(data) { this.data = data || [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]; }
Matrix4.prototype.add = (o) => new Matrix4(this.data.map((x, i) => x + o.data[i]))
Matrix4.prototype.compose = function(o) {
    var data = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    for(var i=0; i<4; i++)
	for(var j=0; j<4; j++) {
	    for(var n = 0; n < 4; n++) { 
		data[i * 4 + j] += this.data[i * 4 + n] * o.data[n * 4 + j];
	    }
	}
    return new Matrix4(data);
};
Matrix4.prototype.transform = function(v) {
    var m = this.data;
    return [
	v[0]*m[0]+v[1]*m[4]+v[2]*m[8]+v[3]*m[12],
	v[0]*m[1]+v[1]*m[5]+v[2]*m[9]+v[3]*m[13],
	v[0]*m[2]+v[1]*m[6]+v[2]*m[10]+v[3]*m[14],
	v[0]*m[3]+v[1]*m[7]+v[2]*m[11]+v[3]*m[15]
    ];
};
Matrix4.translate = (x, y, z) => new Matrix4([1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1]);
Matrix4.scale = (x, y, z) => new Matrix4([x,0,0,0, 0,y,0,0, 0,0,z,0,0,0,0,1]);
Matrix4.rotateAxis = (th, x, y, z) => {
    var s = Math.sin(th), c = Math.cos(th), t = 1 - c;
    return new Matrix4([
	1+t*x*x-t, -z*s+t*x*y, y*s+t*x*z, 0,
	z*s+t*x*y, 1+t*y*y-t, -x*s+t*y*z, 0,
	-y*s+t*x*z, x*s+t*y*z, 1+t*z*z-t, 0,
	0, 0, 0, 1])};
function V3(x,y,z) { this.x = x; this.y = y; this.z = z }
V3.prototype.add = function(o) { return new V3(this.x+o.x, this.y + o.y, this.z+o.z) }
V3.prototype.sub = function(o) { return new V3(this.x-o.x, this.y-o.y, this.z-o.z) }
V3.prototype.mul = function(n) { return new V3(this.x*n, this.y*n, this.z*n) }

var MOV=Matrix4.translate, SIZE=Matrix4.scale, ROT=Matrix4.rotateAxis
function _quad(m, h, w, v, i, n, q) {
    var o = m.transform([0,0,0,1]);
    var dy = m.transform([0, h, 0, 0]);
    var dx = m.transform([w/2, 0,0, 0]);
    var V = v.length/5, T = 0.8;
    v.push(
	o[0]-dx[0], o[1]-dx[1], o[2]-dx[2],   n, q,
	o[0]-T*dx[0]+dy[0],o[1]-T*dx[1]+dy[1],o[2]-T*dx[2]+dy[2], n, q,
	o[0]+dx[0],o[1]+dx[1],o[2]+dx[2], n, q,
	o[0]+T*dx[0]+dy[0],o[1]+T*dx[1]+dy[1],o[2]+T*dx[2]+dy[2], n, q,
    );
    i.push(V, V+1, V+2, V+2, V+1, V+3);
}
function Tree(n, m, gl) {
    var v = [], i = [], q = Math.random();
    function _tree(n, m) { 
	if (n === 0) return;
	
	// draw the current level branch geometry
	var w = 0.01 * n + 0.02, h = 0.2 + Math.random() * 0.2;
	_quad(m, h, w, v, i, n, q);

	// recurse at a smaller size and a random angle
	var r=0.8, th=0.5;
	var axisx = Math.random()
	var axisy = Math.random()
	var axisz = 1 - axisx * axisx - axisy * axisy;
	_tree(n-1,ROT(th, axisx, axisy, axisz)
	      .compose(SIZE(r,r,r))
	      .compose(MOV(0, h, 0))
	      .compose(m), v, i);
	_tree(n-1,ROT(-th, axisx, axisy, axisz)
	      .compose(SIZE(r,r,r))
	      .compose(MOV(0, h, 0))
	      .compose(m), v, i);
    }
    _tree(n || 10, m || new Matrix4());
    return new Mesh(v, i, gl)
}

function TreeDemo(main) { 
    var gl = main.getContext('webgl');
    var n = new Tree(null, null, gl)
    var p = new Program(fshader.innerHTML, vshader.innerHTML, gl);
    var w = gl.canvas.width = gl.canvas.clientWidth;
    var h = gl.canvas.height = gl.canvas.clientHeight;
    gl.viewport(0, 0, w, w);
    trees = [];
    for(var i=0; i<20; i++) {
	s = 0.2 + Math.random();
	trees.push(new Tree(10, SIZE(s,s,s).compose(
	    MOV(0.5 * Math.sin(i), 0, 0.5 * Math.cos(i))
	), gl),);
    }
    (function (t) {
	p.t = t;
	trees.map(i => p.drawMesh(i));
	requestAnimationFrame(arguments.callee);
    })();
}
TreeDemo(main);
