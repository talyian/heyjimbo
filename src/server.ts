import * as Express from 'express';
import * as fs from 'fs';
import * as marked from 'marked';
import * as Feed from 'feed';
import * as ejs from 'ejs';

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

async function post(name) {
    var meta = _meta.filter(x => x.name == name || x.filename == name)[0];
    if (!meta) {
	meta = {
	    filename: name,
	    title: 'unknown',
	}
    }
    var filename = `pages/${meta.filename}`;
    var content: any = await asyncReadFile(filename);
    if (!content) return null;
    content = content.toString();
    if (/\.md$/.exec(filename)) content = marked(content)
    return {info: meta, title: meta.title, content: content, posts: _meta.slice(0, 5), tags:_tags}
}

app.get('/post/:name', ewrap(async function (req, resp) {
    var name = sanitizeFile(req.params.name)
    var data = await post(name);
    if (!data) { return resp.sendStatus(404); }
    resp.render('post', (await post(name)));
}))
app.get('/post/gallery/:name', ewrap(async function (req, resp) {
    var data = await post('gallery/' + sanitizeFile(req.params.name))
    if (!data) { return resp.sendStatus(404); }
    data.posts = null;
    resp.render('post', data);
}))
app.get('/tag/:tag', ewrap(async function (req, resp) {
    var list = _meta.filter(x => x.tags.indexOf(req.params.tag) >= 0);
    ejs.renderFile('views/pagelist.ejs', {content: list}, {}, (err, content) => {
	resp.render('post', {title:0, info:{}, posts:[], content: content})
    });
}))
app.get('/post', ewrap((q, r) => {
    ejs.renderFile('views/pagelist.ejs', {content: _meta}, {}, (err, content) => {
	r.render('post', {title:0, info:{}, posts:[], content: content})
    });
}));

app.get('/', ewrap(async function(req, resp) {
    resp.render('post', (await post(_meta[0].filename)));
}));
app.get('/about', ewrap(async function (req, resp) { resp.render('about'); }));

var _meta: any = null;
var _tags: any = null;
async function getMeta() {
    var meta_str = (await asyncReadFile('pages/pages.meta.json')).toString();
    var meta = meta_str.split('\n').filter(x => x)
	.map(s => { try { return JSON.parse(s) } catch (e) { return null }})
	.filter(x => x);
    meta.map(m => {
	m.name = m.name || m.filename.replace(/\.\w+$/, '');
	m.tags = m.tags || []; });
    meta.sort((a,b) => -(a.created||0) + (b.created||0));
    var _t = {};
    meta.map(m => m.tags.map(t => {if (t.indexOf('series') < 0) {_t[t] = 1 }}));
    _tags = Object.keys(_t);
    return _meta = meta;
}

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
	    id: 'https://heyjimbo.com/post/' + x.name,
	    link: 'https://heyjimbo.com/post/' + x.name,
	    description: x.blurb,
	    content: marked((await asyncReadFile(`pages/${x.filename}`)).toString()),
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
