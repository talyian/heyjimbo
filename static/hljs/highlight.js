var link = document.createElement('link')
link.rel = 'stylesheet'
link.href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/androidstudio.min.css"
var script = document.createElement('script')
script.src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/highlight.min.js";
document.body.appendChild(link);
document.body.appendChild(script);
hljs.initHighlightingOnLoad();
