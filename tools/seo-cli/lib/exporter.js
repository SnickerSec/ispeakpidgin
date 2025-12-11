const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { createObjectCsvWriter } = require('csv-writer');

/**
 * Export results to various formats
 * @param {Array} results - Data to export
 * @param {string} format - Output format: json, csv, console
 * @param {string} prefix - Filename prefix
 */
async function exportResults(results, format = 'console', prefix = 'serp') {
  const timestamp = new Date().toISOString().split('T')[0];
  const outputDir = path.join(process.cwd(), 'output');

  // Ensure output directory exists
  if (format !== 'console' && !fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  switch (format) {
    case 'json':
      await exportJson(results, outputDir, prefix, timestamp);
      break;
    case 'csv':
      await exportCsv(results, outputDir, prefix, timestamp);
      break;
    case 'console':
    default:
      exportConsole(results);
      break;
  }
}

/**
 * Export to JSON file
 */
async function exportJson(results, outputDir, prefix, timestamp) {
  const filename = `${prefix}-${timestamp}.json`;
  const filepath = path.join(outputDir, filename);

  const output = {
    generated: new Date().toISOString(),
    count: results.length,
    data: results
  };

  fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
  console.log(chalk.green(`Exported to ${filepath}`));
}

/**
 * Export to CSV file
 */
async function exportCsv(results, outputDir, prefix, timestamp) {
  const filename = `${prefix}-${timestamp}.csv`;
  const filepath = path.join(outputDir, filename);

  // Flatten results for CSV
  const flatResults = flattenResults(results);

  if (flatResults.length === 0) {
    console.log(chalk.yellow('No data to export'));
    return;
  }

  // Determine headers from first result
  const headers = Object.keys(flatResults[0]).map(key => ({
    id: key,
    title: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
  }));

  const csvWriter = createObjectCsvWriter({
    path: filepath,
    header: headers
  });

  await csvWriter.writeRecords(flatResults);
  console.log(chalk.green(`Exported to ${filepath}`));
}

/**
 * Export to console (formatted output)
 */
function exportConsole(results) {
  if (!results || results.length === 0) {
    console.log(chalk.yellow('No results to display'));
    return;
  }

  results.forEach((result, index) => {
    console.log(chalk.cyan.bold(`\n${'─'.repeat(60)}`));
    console.log(chalk.cyan.bold(`Keyword: ${result.keyword}`));
    console.log(chalk.cyan.bold(`${'─'.repeat(60)}`));

    if (result.error) {
      console.log(chalk.red(`Error: ${result.error}`));
      return;
    }

    // Position info
    if (result.ourPosition) {
      console.log(chalk.green(`Our Position: #${result.ourPosition}`));
    } else if (result.ourPosition === null) {
      console.log(chalk.yellow('Our Position: Not in top results'));
    }

    // PAA Questions
    if (result.paa && result.paa.length > 0) {
      console.log(chalk.white.bold('\nPeople Also Ask:'));
      result.paa.forEach((q, i) => {
        console.log(chalk.gray(`  ${i + 1}. ${q}`));
      });
    }

    // PASF Suggestions
    if (result.pasf && result.pasf.length > 0) {
      console.log(chalk.white.bold('\nPeople Also Search For:'));
      result.pasf.forEach((s, i) => {
        console.log(chalk.gray(`  ${i + 1}. ${s}`));
      });
    }

    // Related Searches
    if (result.relatedSearches && result.relatedSearches.length > 0) {
      console.log(chalk.white.bold('\nRelated Searches:'));
      result.relatedSearches.forEach((s, i) => {
        console.log(chalk.gray(`  ${i + 1}. ${s}`));
      });
    }

    // Top organic results
    if (result.organicResults && result.organicResults.length > 0) {
      console.log(chalk.white.bold('\nTop Results:'));
      result.organicResults.slice(0, 5).forEach((r) => {
        console.log(chalk.gray(`  ${r.position}. ${r.title}`));
        console.log(chalk.gray(`     ${r.url}`));
      });
    }

    // Featured snippet
    if (result.featuredSnippet) {
      console.log(chalk.white.bold('\nFeatured Snippet:'));
      console.log(chalk.gray(`  ${result.featuredSnippet.substring(0, 200)}...`));
    }
  });

  console.log(chalk.cyan.bold(`\n${'─'.repeat(60)}`));
  console.log(chalk.cyan(`Total results: ${results.length}`));
}

/**
 * Flatten nested results for CSV export
 */
function flattenResults(results) {
  const flat = [];

  results.forEach(result => {
    // If it's a keyword object (from keyword generator)
    if (result.keyword && result.type) {
      flat.push({
        keyword: result.keyword,
        type: result.type,
        priority: result.priority,
        source: result.source,
        word: result.word || ''
      });
      return;
    }

    // If it's a SERP result
    const base = {
      keyword: result.keyword,
      ourPosition: result.ourPosition || 'Not found',
      paaCount: result.paa?.length || 0,
      pasfCount: result.pasf?.length || 0,
      relatedCount: result.relatedSearches?.length || 0,
      timestamp: result.timestamp
    };

    // Add PAA as separate rows or combined
    if (result.paa && result.paa.length > 0) {
      result.paa.forEach((q, i) => {
        flat.push({
          ...base,
          dataType: 'PAA',
          question: q,
          index: i + 1
        });
      });
    }

    // Add PASF as separate rows
    if (result.pasf && result.pasf.length > 0) {
      result.pasf.forEach((s, i) => {
        flat.push({
          ...base,
          dataType: 'PASF',
          suggestion: s,
          index: i + 1
        });
      });
    }

    // Add related searches
    if (result.relatedSearches && result.relatedSearches.length > 0) {
      result.relatedSearches.forEach((s, i) => {
        flat.push({
          ...base,
          dataType: 'Related',
          suggestion: s,
          index: i + 1
        });
      });
    }

    // If no nested data, add base row
    if (flat.filter(r => r.keyword === result.keyword).length === 0) {
      flat.push(base);
    }
  });

  return flat;
}

/**
 * Export summary report
 */
function exportSummary(results) {
  const summary = {
    totalKeywords: results.length,
    withPaa: results.filter(r => r.paa?.length > 0).length,
    withPasf: results.filter(r => r.pasf?.length > 0).length,
    ranking: {
      top10: results.filter(r => r.ourPosition && r.ourPosition <= 10).length,
      top30: results.filter(r => r.ourPosition && r.ourPosition <= 30).length,
      notRanking: results.filter(r => !r.ourPosition).length
    },
    uniquePaa: [...new Set(results.flatMap(r => r.paa || []))],
    uniquePasf: [...new Set(results.flatMap(r => r.pasf || []))]
  };

  console.log(chalk.cyan.bold('\n📊 Summary Report'));
  console.log(chalk.white(`Keywords analyzed: ${summary.totalKeywords}`));
  console.log(chalk.white(`With PAA data: ${summary.withPaa}`));
  console.log(chalk.white(`With PASF data: ${summary.withPasf}`));
  console.log(chalk.green(`Ranking top 10: ${summary.ranking.top10}`));
  console.log(chalk.yellow(`Ranking top 30: ${summary.ranking.top30}`));
  console.log(chalk.red(`Not ranking: ${summary.ranking.notRanking}`));
  console.log(chalk.white(`Unique PAA questions: ${summary.uniquePaa.length}`));
  console.log(chalk.white(`Unique PASF suggestions: ${summary.uniquePasf.length}`));

  return summary;
}

module.exports = { exportResults, exportSummary };
