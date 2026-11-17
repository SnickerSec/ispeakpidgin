/**
 * CORS policy for the Express server.
 *
 * A disallowed Origin is answered with a plain 403 here. Previously the `cors` origin callback
 * was handed `new Error('Not allowed by CORS')`, which Express's default error handler turned
 * into a 500 and a full stack trace in the Railway logs for every foreign-origin request (bots,
 * proxies, scrapers) -- noise that tripped the error watch and reported a server fault for what
 * is an ordinary client rejection. Blocking semantics are unchanged: the request still never
 * reaches a route handler.
 */

const cors = require('cors');

const PROD_ORIGINS = ['https://chokepidgin.com', 'https://www.chokepidgin.com'];
const DEV_ORIGINS = ['http://localhost:3000', 'http://localhost:8080'];

function corsPolicy({ isDev = process.env.NODE_ENV === 'development' } = {}) {
    const allowed = isDev ? DEV_ORIGINS : PROD_ORIGINS;
    const handler = cors({ origin: allowed, credentials: true, optionsSuccessStatus: 200 });

    return function corsPolicyMiddleware(req, res, next) {
        const origin = req.headers.origin;
        if (origin && !allowed.includes(origin)) {
            res.vary('Origin');
            return res.status(403).type('text/plain').send('Origin not allowed');
        }
        return handler(req, res, next);
    };
}

module.exports = { corsPolicy, PROD_ORIGINS, DEV_ORIGINS };
