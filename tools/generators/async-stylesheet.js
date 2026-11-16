/**
 * Non-render-blocking stylesheet markup that works under our CSP.
 *
 * The classic `<link media="print" onload="this.media='all'">` trick is an
 * inline event-handler attribute, which Helmet's default `script-src-attr 'none'`
 * blocks (CSP3 applies script-src-attr to handlers, overriding script-src
 * 'unsafe-inline'). The stylesheet then stays on media="print" forever.
 * An inline <script> is governed by script-src (which allows 'unsafe-inline'),
 * so we flip media from a script placed right after the <link>. If the sheet is
 * already loaded (cache hit) it flips immediately; otherwise on 'load'.
 */
function asyncStylesheet(href, indent = '    ') {
    return `<link rel="stylesheet" href="${href}" media="print">\n` +
        `${indent}<script>(function(l){if(!l)return;var f=function(){l.media='all'};if(l.sheet)f();else l.addEventListener('load',f)})(document.currentScript&&document.currentScript.previousElementSibling)</script>\n` +
        `${indent}<noscript><link rel="stylesheet" href="${href}"></noscript>`;
}

module.exports = { asyncStylesheet };
