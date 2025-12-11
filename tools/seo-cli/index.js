#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const { scrapeSerp } = require('./lib/serp-scraper');
const { generateKeywords } = require('./lib/keyword-generator');
const { exportResults } = require('./lib/exporter');
const { loadConfig, saveConfig } = require('./lib/config');

const program = new Command();

program
  .name('pidgin-seo')
  .description('CLI tool for scraping PAA, PASF, and SERP data for ChokePidgin SEO')
  .version('1.0.0');

// Main scrape command
program
  .command('scrape')
  .description('Scrape Google SERP for PAA, PASF, and ranking data')
  .option('-k, --keyword <keyword>', 'Single keyword to search')
  .option('-f, --file <file>', 'File with keywords (one per line)')
  .option('-a, --auto', 'Auto-generate keywords from site content')
  .option('-l, --limit <number>', 'Limit number of keywords to process', '10')
  .option('-o, --output <format>', 'Output format: json, csv, console', 'console')
  .option('-d, --delay <ms>', 'Delay between requests in ms', '2000')
  .option('--no-paa', 'Skip PAA extraction')
  .option('--no-pasf', 'Skip PASF extraction')
  .option('--headless', 'Run browser in headless mode', true)
  .action(async (options) => {
    console.log(chalk.cyan.bold('\n🔍 Pidgin SEO Scraper\n'));

    let keywords = [];

    // Get keywords from various sources
    if (options.keyword) {
      keywords = [options.keyword];
    } else if (options.file) {
      const fs = require('fs');
      try {
        keywords = fs.readFileSync(options.file, 'utf-8')
          .split('\n')
          .map(k => k.trim())
          .filter(k => k.length > 0);
      } catch (err) {
        console.error(chalk.red(`Error reading file: ${err.message}`));
        process.exit(1);
      }
    } else if (options.auto) {
      const spinner = ora('Generating keywords from site content...').start();
      try {
        keywords = await generateKeywords(parseInt(options.limit));
        spinner.succeed(`Generated ${keywords.length} keywords`);
      } catch (err) {
        spinner.fail(`Error generating keywords: ${err.message}`);
        process.exit(1);
      }
    } else {
      console.log(chalk.yellow('No keywords specified. Use -k, -f, or -a flag.'));
      console.log(chalk.gray('Example: pidgin-seo scrape -k "hawaiian pidgin phrases"'));
      console.log(chalk.gray('Example: pidgin-seo scrape -a --limit 20'));
      process.exit(1);
    }

    // Limit keywords
    keywords = keywords.slice(0, parseInt(options.limit));
    console.log(chalk.gray(`Processing ${keywords.length} keyword(s)...\n`));

    const results = [];
    const delay = parseInt(options.delay);

    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      const spinner = ora(`[${i + 1}/${keywords.length}] Searching: "${keyword}"`).start();

      try {
        const result = await scrapeSerp(keyword, {
          includePaa: options.paa !== false,
          includePasf: options.pasf !== false,
          headless: options.headless
        });

        results.push(result);
        spinner.succeed(`[${i + 1}/${keywords.length}] "${keyword}" - ${result.paa?.length || 0} PAA, ${result.pasf?.length || 0} PASF`);

        // Delay between requests to avoid rate limiting
        if (i < keywords.length - 1) {
          await new Promise(r => setTimeout(r, delay));
        }
      } catch (err) {
        spinner.fail(`[${i + 1}/${keywords.length}] "${keyword}" - Error: ${err.message}`);
        results.push({ keyword, error: err.message });
      }
    }

    // Export results
    console.log('');
    await exportResults(results, options.output);
  });

// Generate keywords command
program
  .command('keywords')
  .description('Generate keyword suggestions from site content')
  .option('-l, --limit <number>', 'Number of keywords to generate', '50')
  .option('-c, --category <category>', 'Filter by category: dictionary, phrases, stories')
  .option('-o, --output <format>', 'Output format: json, csv, console', 'console')
  .action(async (options) => {
    console.log(chalk.cyan.bold('\n📝 Keyword Generator\n'));

    const spinner = ora('Analyzing site content...').start();

    try {
      const keywords = await generateKeywords(parseInt(options.limit), options.category);
      spinner.succeed(`Generated ${keywords.length} keyword suggestions\n`);

      if (options.output === 'console') {
        keywords.forEach((kw, i) => {
          console.log(chalk.white(`${i + 1}. ${kw.keyword}`));
          console.log(chalk.gray(`   Type: ${kw.type} | Priority: ${kw.priority}`));
        });
      } else {
        await exportResults(keywords, options.output, 'keywords');
      }
    } catch (err) {
      spinner.fail(`Error: ${err.message}`);
      process.exit(1);
    }
  });

// Analyze command - check current rankings
program
  .command('analyze')
  .description('Analyze current SERP positions for site pages')
  .option('-u, --url <url>', 'Specific URL to check')
  .option('-l, --limit <number>', 'Number of top keywords to check', '20')
  .action(async (options) => {
    console.log(chalk.cyan.bold('\n📊 SERP Position Analyzer\n'));

    const spinner = ora('Analyzing rankings...').start();

    try {
      const keywords = await generateKeywords(parseInt(options.limit));
      spinner.text = `Checking ${keywords.length} keywords...`;

      const results = [];
      for (const kw of keywords.slice(0, 10)) {
        const result = await scrapeSerp(kw.keyword, {
          includePaa: false,
          includePasf: false,
          checkOurSite: true
        });
        results.push(result);
        await new Promise(r => setTimeout(r, 2000));
      }

      spinner.succeed('Analysis complete\n');

      results.forEach(r => {
        const position = r.ourPosition || 'Not found';
        const color = r.ourPosition && r.ourPosition <= 10 ? 'green' :
                      r.ourPosition && r.ourPosition <= 30 ? 'yellow' : 'red';
        console.log(chalk[color](`${r.keyword}: Position ${position}`));
      });

    } catch (err) {
      spinner.fail(`Error: ${err.message}`);
    }
  });

// Quick PAA lookup
program
  .command('paa <keyword>')
  .description('Quick PAA lookup for a single keyword')
  .action(async (keyword) => {
    console.log(chalk.cyan.bold(`\n❓ People Also Ask: "${keyword}"\n`));

    const spinner = ora('Fetching PAA...').start();

    try {
      const result = await scrapeSerp(keyword, { includePaa: true, includePasf: false });
      spinner.stop();

      if (result.paa && result.paa.length > 0) {
        result.paa.forEach((q, i) => {
          console.log(chalk.white(`${i + 1}. ${q}`));
        });
      } else {
        console.log(chalk.yellow('No PAA questions found.'));
      }
    } catch (err) {
      spinner.fail(`Error: ${err.message}`);
    }
  });

// Quick PASF lookup
program
  .command('pasf <keyword>')
  .description('Quick PASF lookup for a single keyword')
  .action(async (keyword) => {
    console.log(chalk.cyan.bold(`\n🔗 People Also Search For: "${keyword}"\n`));

    const spinner = ora('Fetching PASF...').start();

    try {
      const result = await scrapeSerp(keyword, { includePaa: false, includePasf: true });
      spinner.stop();

      if (result.pasf && result.pasf.length > 0) {
        result.pasf.forEach((q, i) => {
          console.log(chalk.white(`${i + 1}. ${q}`));
        });
      } else {
        console.log(chalk.yellow('No PASF suggestions found.'));
      }
    } catch (err) {
      spinner.fail(`Error: ${err.message}`);
    }
  });

program.parse();
