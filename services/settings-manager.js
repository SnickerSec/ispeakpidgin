/**
 * Settings Manager Service
 * Loads settings from Supabase with caching, auto-refresh, and environment variable fallback
 */

// Settings cache
let settingsCache = new Map();
let lastRefresh = 0;
let refreshInterval = 60 * 1000; // Default 60 seconds
let refreshTimer = null;
let supabaseClient = null;
let initialized = false;

/**
 * Initialize the settings manager with Supabase client
 * @param {Object} client - Supabase client with service role
 */
async function initialize(client) {
    supabaseClient = client;

    try {
        await loadAllSettings();
        startAutoRefresh();
        initialized = true;
        console.log('✅ Settings manager initialized');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize settings manager:', error.message);
        // Fall back to environment variables
        return false;
    }
}

/**
 * Load all settings from Supabase
 * @returns {Promise<void>}
 */
async function loadAllSettings() {
    if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabaseClient
        .from('site_settings')
        .select('*');

    if (error) {
        throw error;
    }

    // Update cache
    settingsCache.clear();
    data.forEach(setting => {
        settingsCache.set(setting.key, {
            value: parseValue(setting.value, setting.value_type),
            rawValue: setting.value,
            type: setting.value_type,
            category: setting.category,
            description: setting.description,
            isSecret: setting.is_secret
        });
    });

    lastRefresh = Date.now();

    // Update refresh interval from settings
    const newInterval = get('settings_refresh_interval');
    if (newInterval && typeof newInterval === 'number') {
        refreshInterval = newInterval * 1000;
    }
}

/**
 * Parse a setting value based on its type
 * @param {string} value - Raw string value
 * @param {string} type - Value type (string, number, boolean, json)
 * @returns {*} - Parsed value
 */
function parseValue(value, type) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    switch (type) {
        case 'number':
            const num = parseFloat(value);
            return isNaN(num) ? null : num;
        case 'boolean':
            return value === 'true' || value === '1';
        case 'json':
            try {
                return JSON.parse(value);
            } catch {
                return null;
            }
        default:
            return value;
    }
}

/**
 * Get a setting value with environment variable fallback
 * @param {string} key - Setting key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} - Setting value
 */
function get(key, defaultValue = null) {
    // Check cache first
    const cached = settingsCache.get(key);
    if (cached !== undefined && cached.value !== null) {
        return cached.value;
    }

    // Check environment variable fallback (uppercase, underscored)
    const envKey = key.toUpperCase();
    if (process.env[envKey] !== undefined) {
        return process.env[envKey];
    }

    return defaultValue;
}

/**
 * Get raw string value (for display in admin panel)
 * @param {string} key - Setting key
 * @returns {string|null} - Raw value
 */
function getRaw(key) {
    const cached = settingsCache.get(key);
    return cached?.rawValue ?? null;
}

/**
 * Get all settings in a category
 * @param {string} category - Category name
 * @returns {Object} - Settings object keyed by setting key
 */
function getByCategory(category) {
    const result = {};
    settingsCache.forEach((setting, key) => {
        if (setting.category === category) {
            result[key] = {
                value: setting.value,
                type: setting.type,
                description: setting.description,
                isSecret: setting.isSecret
            };
        }
    });
    return result;
}

/**
 * Get all settings grouped by category
 * @param {boolean} maskSecrets - Whether to mask secret values
 * @returns {Object} - Settings grouped by category
 */
function getAllGrouped(maskSecrets = true) {
    const grouped = {};

    settingsCache.forEach((setting, key) => {
        if (!grouped[setting.category]) {
            grouped[setting.category] = [];
        }

        grouped[setting.category].push({
            key: key,
            value: maskSecrets && setting.isSecret ? maskValue(setting.rawValue) : setting.rawValue,
            type: setting.type,
            description: setting.description,
            isSecret: setting.isSecret
        });
    });

    // Sort settings within each category
    Object.keys(grouped).forEach(category => {
        grouped[category].sort((a, b) => a.key.localeCompare(b.key));
    });

    return grouped;
}

/**
 * Mask a secret value for display
 * @param {string} value - Value to mask
 * @returns {string} - Masked value
 */
function maskValue(value) {
    if (!value || value.length < 4) {
        return '********';
    }
    return value.substring(0, 4) + '********';
}

/**
 * Update a setting in the database
 * @param {string} key - Setting key
 * @param {string} value - New value (as string)
 * @returns {Promise<Object>} - Updated setting
 */
async function set(key, value) {
    if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabaseClient
        .from('site_settings')
        .update({ value: value })
        .eq('key', key)
        .select()
        .single();

    if (error) {
        throw error;
    }

    // Update cache
    settingsCache.set(key, {
        value: parseValue(data.value, data.value_type),
        rawValue: data.value,
        type: data.value_type,
        category: data.category,
        description: data.description,
        isSecret: data.is_secret
    });

    return data;
}

/**
 * Update multiple settings at once
 * @param {Object} updates - Object with key-value pairs
 * @returns {Promise<number>} - Number of updated settings
 */
async function setBulk(updates) {
    if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
    }

    let updatedCount = 0;

    for (const [key, value] of Object.entries(updates)) {
        try {
            await set(key, value);
            updatedCount++;
        } catch (error) {
            console.error(`Failed to update setting ${key}:`, error.message);
        }
    }

    return updatedCount;
}

/**
 * Force refresh settings from database
 * @returns {Promise<void>}
 */
async function refresh() {
    await loadAllSettings();
    console.log('✅ Settings refreshed from database');
}

/**
 * Start auto-refresh timer
 */
function startAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }

    refreshTimer = setInterval(async () => {
        try {
            await loadAllSettings();
        } catch (error) {
            console.error('Auto-refresh failed:', error.message);
        }
    }, refreshInterval);
}

/**
 * Stop auto-refresh timer
 */
function stopAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
}

/**
 * Check if the settings manager is initialized
 * @returns {boolean}
 */
function isInitialized() {
    return initialized;
}

/**
 * Get the time since last refresh
 * @returns {number} - Milliseconds since last refresh
 */
function timeSinceRefresh() {
    return Date.now() - lastRefresh;
}

/**
 * Get all available categories
 * @returns {string[]} - Array of category names
 */
function getCategories() {
    const categories = new Set();
    settingsCache.forEach(setting => {
        categories.add(setting.category);
    });
    return Array.from(categories).sort();
}

/**
 * Check if a feature is enabled
 * @param {string} featureKey - Feature key (without _enabled suffix)
 * @returns {boolean} - True if feature is enabled
 */
function isFeatureEnabled(featureKey) {
    // Try exact key first
    let enabled = get(featureKey);
    if (typeof enabled === 'boolean') {
        return enabled;
    }

    // Try with _enabled suffix
    enabled = get(`${featureKey}_enabled`);
    if (typeof enabled === 'boolean') {
        return enabled;
    }

    // Default to true if setting doesn't exist
    return true;
}

module.exports = {
    initialize,
    loadAllSettings,
    get,
    getRaw,
    getByCategory,
    getAllGrouped,
    set,
    setBulk,
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
    isInitialized,
    timeSinceRefresh,
    getCategories,
    isFeatureEnabled,
    maskValue
};
