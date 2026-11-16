/**
 * Non-render-blocking stylesheet markup that works under our CSP.
 *
 * The classic `<link media="print" onload="this.media='all'">` trick is an
 * inline event-handler attribute, which Helmet's default `script-src-attr 'none'`
 * blocks (CSP3 applies script-src-attr to handlers, overriding script-src
 * 'unsafe-inline'). The stylesheet then stays on media="print" forever.
 * An inline <script> is governed by script-src (which allows 'unsafe-inline'),
 * so we flip media from a script placed right after the <link>. Crucially, we
 * defer the `l.media = 'all'` flip past the first painted frame (`rAF` + macrotask)
 * so that when Google Fonts' tiny CSS responds faster than our local stylesheet
 * (`tailwind.css`), Blink does not activate the cross-origin `.woff2` font
 * downloads (~155 KB) before First Contentful Paint / Largest Contentful Paint
 * (+1,680ms slow-4G penalty when `l.sheet` flipped synchronously before FCP).
 */
function asyncStylesheet(href, indent = '    ') {
    return `<link rel="stylesheet" href="${href}" media="print">\n` +
        `${indent}<script>(function(l){if(!l)return;var a=function(){l.media='all'},f=function(){if(typeof requestAnimationFrame==='function')requestAnimationFrame(function(){setTimeout(a,0)});else setTimeout(a,0)};if(l.sheet)f();else l.addEventListener('load',f)})(document.currentScript&&document.currentScript.previousElementSibling)</script>\n` +
        `${indent}<noscript><link rel="stylesheet" href="${href}"></noscript>`;
}

module.exports = { asyncStylesheet };
