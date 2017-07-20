import * as Express from 'express';
import * as fs from 'fs';
import * as marked from 'marked';

function Async(f){
    return async function(...args:any[]) {
	var g = function(ret, err) { f.apply(null, args.concat([function(e,r) { e ? err(e) : ret(r) }]))};
	return new Promise(g);
    }
}
const asyncListDir = Async(fs.readdir);
const asyncReadFile = Async(fs.readFile);
const sanitizeFile = name => (/^[_.\-a-zA-Z0-9]+$/.exec(name)||[])[0];

const app = Express()
app.use('/styles', Express.static(__dirname + '/../styles'));
app.use('/images', Express.static(__dirname + '/../images'));
app.use(Express.static(__dirname + '/../../httproot'));

app.set('view engine', 'ejs');
app.get('/post/:name', getPost)

async function getPost(req, resp) {
    try {
	var name = sanitizeFile(req.params.name)
	var content = await asyncReadFile(`pages/${name}.md`)
	resp.render('post', {content: marked(content.toString())});
    } catch(e) { resp.end(e.toString()); }
}

app.get('/gallery/:name', getGallery)
async function getGallery(req, resp) {
    try {
	var name = sanitizeFile(req.params.name)
	var content = await asyncReadFile(`pages/gallery/${name}`);
	resp.render('post', {content: content.toString()});
    } catch(e) { resp.end(e.toString()); }
}

app.get('/', getIndex);
async function getIndex(req, resp) {
    try {
	await listPosts(req, resp);
    } catch(e) { resp.end(e.toString()); }
}

app.get('/post', listPosts);
async function listPosts(req, resp) {
    try {
	var meta_str = (await asyncReadFile('pages/pages.meta.json')).toString();
	var meta = meta_str.split('\n').filter(x => x)
	    .map(s => { try { return JSON.parse(s) } catch (e) { return null }})
	    .filter(x => x);
	meta.map(m => {
	    m.tags = m.tags || [];
	    m.filename = m.filename.replace('.md', '');
	});
	meta.sort((a,b) => -(a.created||0) + (b.created||0));
	resp.render('pagelist', {content: meta});
    } catch(e) { resp.end(e.toString()); }
}

app.listen(8081, function () {console.log (this.address())})
