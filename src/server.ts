import * as Express from 'express';
import * as fs from 'fs';
import * as marked from 'marked';

function Async(f){
    return async function(...args:any[]) {
	var g = function(ret, err) { f.apply(null, args.concat([function(e,r) { e ? err(e) : ret(r) }]))};
	return new Promise(g);
    }
}
const asyncReadFile = Async(fs.readFile);
const sanitizeFile = name => (/^[.\-a-zA-Z0-9]+$/.exec(name)||[])[0];

const app = Express()
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
	var content = 'welcome!';
	resp.render('post', {content: content.toString()});
    } catch(e) { resp.end(e.toString()); }
}

app.listen(9123, function () {console.log (this.address())})
