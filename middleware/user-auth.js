/**
 * User Authentication Middleware
 * Handles JWT authentication for regular users
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Configuration
const BCRYPT_ROUNDS = 12;
const JWT_EXPIRY = '30d'; // Longer for regular users

let supabaseAdmin = null;

function initializeAuth(client) {
    supabaseAdmin = client;
}

async function hashPassword(password) {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

function generateToken(user) {
    const secret = process.env.JWT_SECRET;
    return jwt.sign(
        { userId: user.id, email: user.email, type: 'user' },
        secret,
        { expiresIn: JWT_EXPIRY }
    );
}

function verifyToken(token) {
    const secret = process.env.JWT_SECRET;
    try {
        const decoded = jwt.verify(token, secret);
        if (decoded.type !== 'user') return null;
        return decoded;
    } catch (error) {
        return null;
    }
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

async function createSession(userId, token, req) {
    const decoded = verifyToken(token);
    const expiresAt = new Date(decoded.exp * 1000).toISOString();

    const { data, error } = await supabaseAdmin
        .from('user_sessions')
        .insert({
            user_id: userId,
            token_hash: hashToken(token),
            expires_at: expiresAt,
            ip_address: req.ip || req.connection?.remoteAddress,
            user_agent: req.get('User-Agent')
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function isSessionValid(token) {
    const tokenHash = hashToken(token);
    const { data, error } = await supabaseAdmin
        .from('user_sessions')
        .select('*')
        .eq('token_hash', tokenHash)
        .eq('revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single();

    return !error && !!data;
}

async function requireUserAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        
        if (!decoded || !(await isSessionValid(token))) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }

        const { data: user, error } = await supabaseAdmin
            .from('user_profiles')
            .select('id, email, display_name')
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        req.userToken = token;
        next();
    } catch (error) {
        return res.status(500).json({ error: 'Authentication error' });
    }
}

module.exports = {
    initializeAuth,
    hashPassword,
    verifyPassword,
    generateToken,
    requireUserAuth,
    createSession
};
