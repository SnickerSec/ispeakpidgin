const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * OG Image Generator Utility
 * Creates beautiful, category-specific social sharing images
 */

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

// Category-based color schemes
const COLOR_SCHEMES = {
    'general': { bg: 'linear-gradient(45deg, #3b82f6, #2563eb)', accent: '#60a5fa', icon: '🏝️' },
    'food': { bg: 'linear-gradient(45deg, #f59e0b, #d97706)', accent: '#fbbf24', icon: '🍱' },
    'slang': { bg: 'linear-gradient(45deg, #8b5cf6, #7c3aed)', accent: '#a78bfa', icon: '🤙' },
    'nature': { bg: 'linear-gradient(45deg, #10b981, #059669)', accent: '#34d399', icon: '🌋' },
    'culture': { bg: 'linear-gradient(45deg, #ef4444, #dc2626)', accent: '#f87171', icon: '🌺' },
    'greeting': { bg: 'linear-gradient(45deg, #06b6d4, #0891b2)', accent: '#22d3ee', icon: '👋' },
    'action': { bg: 'linear-gradient(45deg, #ec4899, #db2777)', accent: '#f472b6', icon: '🔥' },
    'default': { bg: 'linear-gradient(45deg, #6366f1, #4f46e5)', accent: '#818cf8', icon: '🌴' }
};

/**
 * Escapes characters for SVG
 */
function escapeSvg(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Bold Arial/Liberation Sans averages ~0.6em per character; regular ~0.47em.
const BOLD_CHAR_EM = 0.6;
const REGULAR_CHAR_EM = 0.47;
const TEXT_WIDTH = 900; // card spans x=100..1100, text starts at x=150

/**
 * Largest font size (capped at max) at which text fits on one line of the card
 */
function fitFontSize(text, max, min) {
    const fitted = Math.floor(TEXT_WIDTH / (Math.max(text.length, 1) * BOLD_CHAR_EM));
    return Math.max(min, Math.min(max, fitted));
}

/**
 * Greedy word wrap into at most maxLines lines; the last line gets an ellipsis if cut
 */
function wrapText(text, fontSize, maxLines) {
    const maxChars = Math.floor(TEXT_WIDTH / (fontSize * REGULAR_CHAR_EM));
    const lines = [];
    let line = '';
    for (const word of text.split(/\s+/).filter(Boolean)) {
        const next = line ? `${line} ${word}` : word;
        if (next.length <= maxChars || !line) {
            line = next;
            continue;
        }
        lines.push(line);
        line = word;
        if (lines.length === maxLines) break;
    }
    if (lines.length < maxLines && line) {
        lines.push(line);
    } else if (lines.length === maxLines) {
        lines[maxLines - 1] = lines[maxLines - 1].slice(0, maxChars - 3).trimEnd() + '...';
    }
    return lines;
}

// librsvg renders text with system fonts via fontconfig. A container without fonts
// (node:20-slim) draws every glyph as a box, and every social preview ships as tofu.
let fontCheckDone = false;
function warnIfNoFonts() {
    if (fontCheckDone || process.platform !== 'linux') return;
    fontCheckDone = true;
    try {
        const fonts = require('child_process').execSync('fc-list', { encoding: 'utf8' });
        if (fonts.trim()) return;
    } catch (_) { /* fc-list missing means fontconfig is missing */ }
    console.error('❌ No system fonts found: OG images will render as empty boxes. Install fonts-liberation2 (see Dockerfile).');
}

/**
 * Generates an OG image and saves it to disk
 */
async function generateOgImage(options) {
    const {
        title,
        subtitle,
        category = 'general',
        outputDir,
        filename
    } = options;

    warnIfNoFonts();

    const scheme = COLOR_SCHEMES[category.toLowerCase()] || COLOR_SCHEMES.default;

    const titleSize = fitFontSize(title || '', 90, 44);
    const subtitleSize = 36;
    const subtitleLines = wrapText(subtitle || '', subtitleSize, 2);
    const subtitleTspans = subtitleLines
        .map((line, i) => `<tspan x="150" dy="${i === 0 ? 0 : subtitleSize * 1.25}">${escapeSvg(line)}</tspan>`)
        .join('');

    // SVG Template
    const svg = `
    <svg width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${scheme.bg.split(',')[1].trim()};stop-opacity:1" />
                <stop offset="100%" style="stop-color:${scheme.bg.split(',')[2].trim().replace(')', '')};stop-opacity:1" />
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="10" />
                <feOffset dx="0" dy="10" result="offsetblur" />
                <feComponentTransfer>
                    <feFuncA type="linear" slope="0.3" />
                </feComponentTransfer>
                <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>

        <!-- Background -->
        <rect width="100%" height="100%" fill="url(#bgGrad)" />
        
        <!-- Decorative Elements -->
        <circle cx="1100" cy="100" r="250" fill="white" opacity="0.05" />
        <circle cx="50" cy="550" r="150" fill="white" opacity="0.05" />
        <path d="M0,500 Q300,450 600,500 T1200,500 L1200,630 L0,630 Z" fill="white" opacity="0.1" />

        <!-- Card Container -->
        <rect x="100" y="100" width="1000" height="430" rx="30" fill="white" opacity="0.95" filter="url(#shadow)" />
        
        <!-- Logo Top Left -->
        <text x="150" y="170" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="${scheme.bg.split(',')[1].trim()}">
            ChokePidgin.com
        </text>

        <!-- Category Badge -->
        <rect x="150" y="200" width="140" height="40" rx="20" fill="${scheme.bg.split(',')[1].trim()}" />
        <text x="220" y="227" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">
            ${category.toUpperCase()}
        </text>

        <!-- Main Title (The Word/Phrase) -->
        <text x="150" y="320" font-family="Arial, sans-serif" font-size="${titleSize}" font-weight="900" fill="#1f2937">
            ${escapeSvg(title)}
        </text>

        <!-- Subtitle (The Meaning) -->
        <text x="150" y="395" font-family="Arial, sans-serif" font-size="${subtitleSize}" font-weight="500" fill="#4b5563">${subtitleTspans}</text>

        <!-- Footer Call to Action -->
        <rect x="0" y="560" width="1200" height="70" fill="rgba(0,0,0,0.2)" />
        <text x="600" y="605" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">
            Learn Hawaiian Pidgin - Da Best Local Dictionary &amp; Tools!
        </text>
    </svg>
    `;

    try {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputPath = path.join(outputDir, filename);
        
        // Skip if already exists
        if (fs.existsSync(outputPath)) {
            return true;
        }
        
        // Generate image from SVG in requested format
        const pipeline = sharp(Buffer.from(svg));
        const ext = path.extname(filename).toLowerCase();
        if (ext === '.png') {
            await pipeline.png({ quality: 80, compressionLevel: 9 }).toFile(outputPath);
        } else if (ext === '.jpg' || ext === '.jpeg') {
            await pipeline.jpeg({ quality: 80 }).toFile(outputPath);
        } else {
            await pipeline.webp({ quality: 80 }).toFile(outputPath);
        }
            
        return true;
    } catch (err) {
        console.error(`Error generating OG image for ${title}:`, err.message);
        return false;
    }
}

module.exports = {
    generateOgImage
};
