const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(process.cwd(), '.pidgin-seo.json');

const DEFAULT_CONFIG = {
  // Target site to check rankings for
  targetDomain: 'chokepidgin.com',

  // Request settings
  requestDelay: 2000,        // ms between requests
  timeout: 30000,            // request timeout
  maxRetries: 2,             // retry failed requests

  // Browser settings
  headless: true,
  viewport: {
    width: 1920,
    height: 1080
  },

  // Scraping options
  includePaa: true,
  includePasf: true,
  includeRelated: true,
  maxResults: 10,            // organic results to capture

  // Output settings
  outputDir: './output',
  defaultFormat: 'console',

  // Keyword generation
  keywordLimit: 50,
  priorityKeywords: [
    'hawaiian pidgin',
    'pidgin english',
    'hawaii slang',
    'hawaiian phrases'
  ],

  // Supabase (from environment variables)
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_ANON_KEY || ''
};

/**
 * Load configuration from file or return defaults
 */
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const userConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      return { ...DEFAULT_CONFIG, ...userConfig };
    }
  } catch (err) {
    console.warn(`Warning: Could not load config file: ${err.message}`);
  }
  return DEFAULT_CONFIG;
}

/**
 * Save configuration to file
 */
function saveConfig(config) {
  try {
    // Only save user-modifiable settings (exclude sensitive data)
    const safeConfig = {
      targetDomain: config.targetDomain,
      requestDelay: config.requestDelay,
      timeout: config.timeout,
      maxRetries: config.maxRetries,
      headless: config.headless,
      includePaa: config.includePaa,
      includePasf: config.includePasf,
      includeRelated: config.includeRelated,
      maxResults: config.maxResults,
      outputDir: config.outputDir,
      defaultFormat: config.defaultFormat,
      keywordLimit: config.keywordLimit,
      priorityKeywords: config.priorityKeywords
    };

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(safeConfig, null, 2));
    return true;
  } catch (err) {
    console.error(`Error saving config: ${err.message}`);
    return false;
  }
}

/**
 * Get a specific config value
 */
function getConfigValue(key) {
  const config = loadConfig();
  return config[key];
}

/**
 * Set a specific config value
 */
function setConfigValue(key, value) {
  const config = loadConfig();
  config[key] = value;
  return saveConfig(config);
}

/**
 * Reset config to defaults
 */
function resetConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
  }
  return DEFAULT_CONFIG;
}

/**
 * Display current config
 */
function displayConfig() {
  const config = loadConfig();
  console.log('\nCurrent Configuration:');
  console.log('─'.repeat(40));
  Object.entries(config).forEach(([key, value]) => {
    // Hide sensitive keys
    if (key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')) {
      console.log(`  ${key}: ****`);
    } else {
      console.log(`  ${key}: ${JSON.stringify(value)}`);
    }
  });
  console.log('─'.repeat(40));
}

module.exports = {
  loadConfig,
  saveConfig,
  getConfigValue,
  setConfigValue,
  resetConfig,
  displayConfig,
  DEFAULT_CONFIG
};
