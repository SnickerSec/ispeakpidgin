const { spawn } = require('child_process');
const path = require('path');

/**
 * Scrape Google SERP using Botasaurus (Python)
 * This provides better anti-detection than Puppeteer
 */
async function scrapeSerpBotasaurus(keyword, type = 'all') {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'scraper.py');
    const venvPython = path.join(__dirname, '..', 'venv', 'bin', 'python');

    // Use venv Python if available, otherwise system Python
    const pythonCmd = require('fs').existsSync(venvPython) ? venvPython : 'python3';

    const args = [scriptPath, keyword, '--type', type];
    const child = spawn(pythonCmd, args, {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      // Try to parse JSON from stdout
      try {
        // Find JSON in output (Botasaurus may print other stuff)
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          result.keyword = keyword;
          result.timestamp = new Date().toISOString();
          resolve(result);
        } else {
          reject(new Error(`No JSON output found. stdout: ${stdout}, stderr: ${stderr}`));
        }
      } catch (err) {
        reject(new Error(`Failed to parse scraper output: ${err.message}. stdout: ${stdout}, stderr: ${stderr}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to spawn Python scraper: ${err.message}`));
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      child.kill();
      reject(new Error('Scraper timeout after 60 seconds'));
    }, 60000);
  });
}

/**
 * Scrape Google SERP for a keyword
 * Uses Botasaurus (Python) for better anti-detection
 * @param {string} keyword - Search keyword
 * @param {object} options - Scraping options
 * @returns {object} - SERP data including PAA, PASF, and results
 */
async function scrapeSerp(keyword, options = {}) {
  const {
    includePaa = true,
    includePasf = true,
    checkOurSite = true
  } = options;

  try {
    // Use Botasaurus scraper
    const type = includePaa && includePasf ? 'all' : (includePaa ? 'paa' : 'pasf');
    const result = await scrapeSerpBotasaurus(keyword, type);

    // Normalize result structure
    return {
      keyword: result.keyword || keyword,
      paa: result.paa || [],
      pasf: result.pasf || [],
      relatedSearches: result.pasf || [], // Same as PASF
      organicResults: (result.organic || []).map((item, idx) => ({
        position: item.position || idx + 1,
        title: item.title || '',
        url: item.url || '',
        snippet: ''
      })),
      ourPosition: checkOurSite ? findOurPosition(result.organic || []) : null,
      featuredSnippet: result.featured_snippet || null,
      timestamp: result.timestamp || new Date().toISOString(),
      success: result.success !== false,
      error: result.error || null
    };
  } catch (err) {
    // Return error result
    return {
      keyword,
      paa: [],
      pasf: [],
      relatedSearches: [],
      organicResults: [],
      ourPosition: null,
      featuredSnippet: null,
      timestamp: new Date().toISOString(),
      success: false,
      error: err.message
    };
  }
}

/**
 * Find our site's position in organic results
 */
function findOurPosition(results) {
  if (!results || !Array.isArray(results)) return null;

  for (let i = 0; i < results.length; i++) {
    if (results[i].url && results[i].url.includes('chokepidgin.com')) {
      return i + 1;
    }
  }
  return null;
}

/**
 * Quick PAA lookup
 */
async function getPaa(keyword) {
  const result = await scrapeSerpBotasaurus(keyword, 'paa');
  return result.paa || [];
}

/**
 * Quick PASF lookup
 */
async function getPasf(keyword) {
  const result = await scrapeSerpBotasaurus(keyword, 'pasf');
  return result.pasf || [];
}

module.exports = { scrapeSerp, getPaa, getPasf };
