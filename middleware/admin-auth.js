/**
 * Admin Authentication Middleware
 * Handles JWT authentication, password hashing, account lockout, and audit logging
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Configuration
const BCRYPT_ROUNDS = 12;
const JWT_EXPIRY = '24h';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Get Supabase admin client (with service role key)
 * Must be passed in from server.js
 */
let supabaseAdmin = null;

/**
 * Initialize the middleware with Supabase admin client
 * @param {Object} client - Supabase client with service role
 */
function initializeAuth(client) {
    supabaseAdmin = client;
}

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password) {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Stored hash
 * @returns {Promise<boolean>} - True if password matches
 */
async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object with id and username
 * @returns {string} - JWT token
 */
function generateToken(user) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is required');
    }

    return jwt.sign(
        {
            userId: user.id,
            username: user.username,
            role: user.role
        },
        secret,
        { expiresIn: JWT_EXPIRY }
    );
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded payload or null if invalid
 */
function verifyToken(token) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return null;
    }

    try {
        return jwt.verify(token, secret);
    } catch (error) {
        return null;
    }
}

/**
 * Hash a token for storage (used for session tracking)
 * @param {string} token - JWT token
 * @returns {string} - SHA256 hash of token
 */
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create a session record in the database
 * @param {string} userId - User ID
 * @param {string} token - JWT token
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} - Session record
 */
async function createSession(userId, token, req) {
    if (!supabaseAdmin) {
        throw new Error('Supabase admin client not initialized');
    }

    const decoded = verifyToken(token);
    const expiresAt = new Date(decoded.exp * 1000).toISOString();

    const { data, error } = await supabaseAdmin
        .from('admin_sessions')
        .insert({
            user_id: userId,
            token_hash: hashToken(token),
            expires_at: expiresAt,
            ip_address: req.ip || req.connection?.remoteAddress,
            user_agent: req.get('User-Agent')
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating session:', error);
        throw error;
    }

    return data;
}

/**
 * Revoke a session
 * @param {string} token - JWT token to revoke
 * @returns {Promise<boolean>} - True if revoked successfully
 */
async function revokeSession(token) {
    if (!supabaseAdmin) {
        throw new Error('Supabase admin client not initialized');
    }

    const tokenHash = hashToken(token);

    const { error } = await supabaseAdmin
        .from('admin_sessions')
        .update({
            revoked: true,
            revoked_at: new Date().toISOString()
        })
        .eq('token_hash', tokenHash);

    return !error;
}

/**
 * Check if a session is valid (not revoked or expired)
 * @param {string} token - JWT token
 * @returns {Promise<boolean>} - True if session is valid
 */
async function isSessionValid(token) {
    if (!supabaseAdmin) {
        return false;
    }

    const tokenHash = hashToken(token);

    const { data, error } = await supabaseAdmin
        .from('admin_sessions')
        .select('*')
        .eq('token_hash', tokenHash)
        .eq('revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single();

    return !error && !!data;
}

/**
 * Check if user account is locked
 * @param {Object} user - User object
 * @returns {boolean} - True if account is locked
 */
function isAccountLocked(user) {
    if (!user.locked_until) return false;
    return new Date(user.locked_until) > new Date();
}

/**
 * Increment failed login attempts for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Updated user
 */
async function incrementFailedAttempts(userId) {
    if (!supabaseAdmin) {
        throw new Error('Supabase admin client not initialized');
    }

    // Get current user
    const { data: user } = await supabaseAdmin
        .from('admin_users')
        .select('failed_attempts')
        .eq('id', userId)
        .single();

    const newAttempts = (user?.failed_attempts || 0) + 1;
    const updateData = { failed_attempts: newAttempts };

    // Lock account if max attempts reached
    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        updateData.locked_until = lockUntil.toISOString();
    }

    const { data, error } = await supabaseAdmin
        .from('admin_users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Reset failed login attempts for a user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function resetFailedAttempts(userId) {
    if (!supabaseAdmin) {
        throw new Error('Supabase admin client not initialized');
    }

    await supabaseAdmin
        .from('admin_users')
        .update({
            failed_attempts: 0,
            locked_until: null,
            last_login: new Date().toISOString()
        })
        .eq('id', userId);
}

/**
 * Log an admin action to the audit log
 * @param {Object} params - Audit log parameters
 * @param {string} params.userId - User ID (optional)
 * @param {string} params.username - Username
 * @param {string} params.action - Action performed
 * @param {string} params.resource - Resource affected (optional)
 * @param {Object} params.details - Additional details (optional)
 * @param {Object} params.req - Express request object
 * @returns {Promise<Object>} - Audit log entry
 */
async function logAuditAction({ userId, username, action, resource, details, req }) {
    if (!supabaseAdmin) {
        console.warn('Supabase admin client not initialized, skipping audit log');
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from('admin_audit_log')
        .insert({
            user_id: userId,
            username: username,
            action: action,
            resource: resource,
            details: details,
            ip_address: req?.ip || req?.connection?.remoteAddress,
            user_agent: req?.get?.('User-Agent')
        })
        .select()
        .single();

    if (error) {
        console.error('Error logging audit action:', error);
    }

    return data;
}

/**
 * Express middleware to require admin authentication
 * Extracts token from Authorization header, validates it, and attaches user to request
 */
async function requireAdminAuth(req, res, next) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const token = authHeader.substring(7);

        // Verify token
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Check if session is still valid (not revoked)
        const sessionValid = await isSessionValid(token);
        if (!sessionValid) {
            return res.status(401).json({ error: 'Session has been revoked' });
        }

        // Get user from database
        const { data: user, error } = await supabaseAdmin
            .from('admin_users')
            .select('id, username, role')
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Attach user and token to request
        req.adminUser = user;
        req.adminToken = token;

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ error: 'Authentication error' });
    }
}

/**
 * Express middleware to require super admin role
 * Must be used after requireAdminAuth
 */
function requireSuperAdmin(req, res, next) {
    if (!req.adminUser || req.adminUser.role !== 'super_admin') {
        return res.status(403).json({ error: 'Super admin access required' });
    }
    next();
}

/**
 * Get user by username
 * @param {string} username - Username
 * @returns {Promise<Object|null>} - User object or null
 */
async function getUserByUsername(username) {
    if (!supabaseAdmin) {
        throw new Error('Supabase admin client not initialized');
    }

    const { data, error } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .single();

    if (error) return null;
    return data;
}

/**
 * Create a new admin user
 * @param {string} username - Username
 * @param {string} password - Plain text password
 * @param {string} role - User role (admin or super_admin)
 * @returns {Promise<Object>} - Created user
 */
async function createAdminUser(username, password, role = 'admin') {
    if (!supabaseAdmin) {
        throw new Error('Supabase admin client not initialized');
    }

    const passwordHash = await hashPassword(password);

    const { data, error } = await supabaseAdmin
        .from('admin_users')
        .insert({
            username: username,
            password_hash: passwordHash,
            role: role
        })
        .select('id, username, role, created_at')
        .single();

    if (error) throw error;
    return data;
}

/**
 * Check if any admin users exist
 * @returns {Promise<boolean>} - True if at least one admin exists
 */
async function hasAdminUsers() {
    if (!supabaseAdmin) {
        throw new Error('Supabase admin client not initialized');
    }

    const { count, error } = await supabaseAdmin
        .from('admin_users')
        .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count > 0;
}

module.exports = {
    initializeAuth,
    hashPassword,
    verifyPassword,
    generateToken,
    verifyToken,
    hashToken,
    createSession,
    revokeSession,
    isSessionValid,
    isAccountLocked,
    incrementFailedAttempts,
    resetFailedAttempts,
    logAuditAction,
    requireAdminAuth,
    requireSuperAdmin,
    getUserByUsername,
    createAdminUser,
    hasAdminUsers,
    LOCKOUT_DURATION_MS,
    MAX_FAILED_ATTEMPTS
};
