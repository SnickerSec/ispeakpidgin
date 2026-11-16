/**
 * Cache-Control for static CSS/JS served by express.static.
 *
 * build.js (versionAssetUrls) stamps `?v=<first 10 hex of md5(file)>` onto every local
 * .js/.css reference. express.static ignores the query string and always serves whatever
 * file is on disk with 200 OK, so trusting any hex-looking `v` would let a request for an
 * upcoming hash -- made before Railway cuts over, or landing on a draining container during
 * the cutover -- pin the OLD bytes under the NEW cache key as `immutable` for a year at
 * Cloudflare and in browsers.
 *
 * So `immutable` is only granted when `v` equals the served file's actual content hash.
 * A mismatched `v` gets `no-cache` (self-heals once the right container answers);
 * no `v` keeps the 1-hour default.
 */

const crypto = require('crypto');
const fs = require('fs');

const IMMUTABLE = 'public, max-age=31536000, immutable';
const UNVERSIONED = 'public, max-age=3600';
const MISMATCHED = 'public, no-cache, must-revalidate';

// filePath -> { key: "<mtimeMs>:<size>", hash }
const hashCache = new Map();

function contentHash(filePath, stat) {
    const key = stat ? `${stat.mtimeMs}:${stat.size}` : null;
    const cached = hashCache.get(filePath);
    if (cached && key && cached.key === key) return cached.hash;
    let hash = null;
    try {
        hash = crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex').slice(0, 10);
    } catch (_) {
        hash = null;
    }
    if (key) hashCache.set(filePath, { key, hash });
    return hash;
}

function versionParam(rawUrl) {
    const q = String(rawUrl || '').indexOf('?');
    if (q === -1) return null;
    const v = new URLSearchParams(String(rawUrl).slice(q + 1)).get('v');
    return v === null ? null : v;
}

/**
 * @param {string} filePath absolute path of the file express.static is serving
 * @param {string} rawUrl   request URL including query string
 * @param {fs.Stats} [stat] stat express.static already took (used to invalidate the memo)
 * @returns {string} Cache-Control header value
 */
function assetCacheControl(filePath, rawUrl, stat) {
    const v = versionParam(rawUrl);
    if (v === null) return UNVERSIONED;
    const hash = contentHash(filePath, stat);
    return hash && v.toLowerCase() === hash ? IMMUTABLE : MISMATCHED;
}

module.exports = { assetCacheControl, IMMUTABLE, UNVERSIONED, MISMATCHED };
