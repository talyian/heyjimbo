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
function ewrap(f) { return function() { try { f.apply(null, arguments); } catch(e) { arguments[1].end(e.toString()); }}}
app.get('/post/:name', ewrap(async function (req, resp) {
    var name = sanitizeFile(req.params.name)
    var content = await asyncReadFile(`pages/${name}.md`)
    resp.render('post', {content: marked(content.toString())});
}))

app.get('/gallery/:name', ewrap(async function (req, resp) {
    var name = sanitizeFile(req.params.name)
    var content = await asyncReadFile(`pages/gallery/${name}`);
    resp.render('post', {content: content.toString()});
}))

app.get('/', ewrap(listPosts));
app.get('/post', ewrap(listPosts));
async function listPosts(req, resp) {
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
}

app.get('/about', ewrap(async function (req, resp) {
    resp.render('about');
}));
app.listen(8081, function () {console.log (this.address())})
