import * as Express from 'express';
import * as fs from 'fs';
import * as marked from 'marked';
import * as Feed from 'feed';

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
app.use(Express.static(__dirname + '/../static'));
app.use('/styles', Express.static(__dirname + '/../styles'));
app.use('/images', Express.static(__dirname + '/../images'));
app.use(Express.static(__dirname + '/../../httproot'));

app.set('view engine', 'ejs');
function ewrap(f) { return function() {
    try { f.apply(null, arguments); }
    catch(e) { arguments[1].end(e.toString()); }
}}

app.get('/post/:name', ewrap(async function (req, resp) {
    var name = sanitizeFile(req.params.name)
    var content = await asyncReadFile(`pages/${name}.md`)
    resp.render('post', {
	content: marked(content.toString()),
	posts: _meta.slice(0, 5),
    });
}))

app.get('/gallery', ewrap(async function (req, resp) {
    var list = await asyncListDir('pages/gallery');
    resp.json(list);
}))
app.get('/gallery/:name', ewrap(async function (req, resp) {
    var name = sanitizeFile(req.params.name)
    var content = await asyncReadFile(`pages/gallery/${name}`);
    resp.render('post', {content: content.toString()});
}))

app.get('/', ewrap(async function(req, resp) {
    var name = _meta[0].filename;
    var content = await asyncReadFile(`pages/${name}.md`)
    resp.render('post', {
	content: marked(content.toString()),
	posts: _meta.slice(0, 5),
    });
}));

app.get('/post', ewrap(listPosts));
var _meta: any = null;
async function getMeta() {
    var meta_str = (await asyncReadFile('pages/pages.meta.json')).toString();
    var meta = meta_str.split('\n').filter(x => x)
	.map(s => { try { return JSON.parse(s) } catch (e) { return null }})
	.filter(x => x);
    meta.map(m => {
	m.tags = m.tags || [];
	m.filename = m.filename.replace('.md', '');
    });
    meta.sort((a,b) => -(a.created||0) + (b.created||0));
    return _meta = meta;
}
async function listPosts(req, resp) {
    resp.render('pagelist', {content: await getMeta()});
}

app.get('/about', ewrap(async function (req, resp) {
    resp.render('about');
}));

let feedinfo = new Feed({
    title: 'Heyjimbo',
    description: 'A blag about procedural generation, functional programming, security, and electronics.',
    id: 'http://heyjimbo.com/',
    link: 'http://heyjimbo.com/',
    image: null,  favicon: null,
    generator: '_',
    author: { name: 'Jimmy Tang' }
})

async function loadFeed() {
    var results = await getMeta();
    for(var i=0; i<results.length; i++) {
	var x = results[i];
	feedinfo.addItem({
	    title: x.title,
	    id: 'https://heyjimbo.com/post/' + x.filename,
	    link: 'https://heyjimbo.com/post/' + x.filename,
	    description: x.blurb,
	    content: marked((await asyncReadFile(`pages/${x.filename}.md`)).toString()),
	    author: [{name: "Jimmy Tang"}],
	    date: new Date(x.created),
	    image: x.image,
	});
    }
}
loadFeed();
async function feed (req, resp) { resp.end(feedinfo.atom1()); }
app.get('/atom.xml', ewrap(feed));
app.get('/feed', ewrap(feed));

app.listen(8081, function () {console.log (this.address())})
