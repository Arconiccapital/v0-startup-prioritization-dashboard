const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CSV_FILE = '/Users/alanyang/Downloads/12000companies_with_explanationsAY.csv';
const API_URL = 'http://localhost:3002/api/startups';
const BATCH_SIZE = 100;

// Parse CSV line with proper quote handling
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

// Map CSV row to database schema
function mapRowToStartup(headers, values) {
  const row = {};
  headers.forEach((header, i) => {
    row[header] = values[i] || '';
  });

  const startup = {
    id: require('crypto').randomUUID(),
    name: row.name || 'Unknown',
    sector: row.Industry || row['Sub-Industry'] || 'Unknown',
    country: row.Country || '',
    description: row.description || '',
    score: parseFloat(row.LLM_Score) || 0,
    pipelineStage: 'Deal Flow',

    // AI Scores
    aiScores: {
      llm: parseFloat(row.LLM_Score) || 0,
      ml: parseFloat(row.ML_Score) || 0,
    },

    // Company Info
    companyInfo: {
      website: row.urls || row.Domain || '',
      linkedin: row['LinkedIn URL'] || '',
      location: row.Location || row.Country || '',
      area: row.favoriteAddress || '',
      founded: row['Founding Year'] || '',
      ventureCapitalFirm: row['Venture Capital Firm'] || '',
      founders: row.Founders || '',
      employeeCount: row['# Employees'] || row.Size || '',
    },

    // Market Info
    marketInfo: {
      b2bOrB2c: row['B2B or B2C'] || '',
      subIndustry: row['Sub-Industry'] || '',
      industry: row.Industry || '',
      marketSize: row['Market Size'] || '',
      aiDisruptionPropensity: row['AI Disruption Propensity'] || '',
      targetPersona: row['Target Persona'] || '',
    },

    // Product Info
    productInfo: {
      productName: row['Product Name'] || '',
      problemSolved: row['Problem Solved'] || '',
      horizontalOrVertical: row['Horizontal or Vertical'] || '',
      moat: row.Moat || '',
    },

    // Business Model
    businessModelInfo: {
      revenueModel: row['Revenue Model'] || '',
      pricingStrategy: row['Pricing Strategy'] || '',
      unitEconomics: row['Unit Economics'] || '',
    },

    // Sales Info
    salesInfo: {
      salesMotion: row['Sales Motion'] || '',
      salesCycleLength: row['Sales Cycle Length'] || '',
      salesComplexity: row['Sales Complexity'] || '',
      gtmStrategy: row['Go-to-Market Strategy'] || '',
      channels: row.Channels || '',
    },

    // Team Info
    teamInfo: {
      foundersEducation: row["Founders' Education"] || '',
      foundersPriorExperience: row["Founders' Prior Experience"] || '',
      keyTeamMembers: row['Key Team Members'] || '',
      teamDepth: row['Team Depth'] || '',
    },

    // Competitive Info
    competitiveInfo: {
      competitors: row.Competitors || '',
      industryMultiples: row['Industry Multiples'] || '',
    },

    // Risk Info
    riskInfo: {
      regulatoryRisk: row['Regulatory Risk'] || '',
    },

    // Opportunity Info
    opportunityInfo: {
      exitPotential: row['Exit Potential'] || '',
    },
  };

  return startup;
}

async function uploadBatch(batch, batchNumber, totalBatches) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Batch ${batchNumber} failed: ${error}`);
    }

    const result = await response.json();
    console.log(`✓ Batch ${batchNumber}/${totalBatches} uploaded (${result.count} companies)`);
    return result.count;
  } catch (error) {
    console.error(`✗ Batch ${batchNumber} failed:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting CSV upload...\n');
  console.log(`Reading: ${CSV_FILE}`);

  const fileStream = fs.createReadStream(CSV_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let headers = null;
  let batch = [];
  let totalProcessed = 0;
  let totalUploaded = 0;
  let currentLine = '';
  let inQuotes = false;

  for await (const line of rl) {
    // Handle multi-line CSV values (quoted fields with newlines)
    currentLine += line;

    // Count quotes to see if we're inside a quoted field
    for (let char of line) {
      if (char === '"') inQuotes = !inQuotes;
    }

    // If we're still in quotes, continue to next line
    if (inQuotes) {
      currentLine += '\n';
      continue;
    }

    // We have a complete row
    const values = parseCSVLine(currentLine);
    currentLine = '';

    if (!headers) {
      headers = values;
      console.log(`\nFound ${headers.length} columns`);
      console.log(`Key columns: ${headers.slice(0, 5).join(', ')}\n`);
      continue;
    }

    // Skip empty rows
    if (values.length < headers.length || !values[0]) {
      continue;
    }

    const startup = mapRowToStartup(headers, values);
    batch.push(startup);
    totalProcessed++;

    // Upload when batch is full
    if (batch.length >= BATCH_SIZE) {
      const batchNumber = Math.ceil(totalProcessed / BATCH_SIZE);
      const uploaded = await uploadBatch(batch, batchNumber, '???');
      totalUploaded += uploaded;
      batch = [];
    }
  }

  // Upload remaining batch
  if (batch.length > 0) {
    const batchNumber = Math.ceil(totalProcessed / BATCH_SIZE);
    const uploaded = await uploadBatch(batch, batchNumber, batchNumber);
    totalUploaded += uploaded;
  }

  console.log(`\n✅ Upload complete!`);
  console.log(`Total processed: ${totalProcessed}`);
  console.log(`Total uploaded: ${totalUploaded}`);

  // Recalculate ranks
  console.log('\n🔄 Recalculating ranks...');
  try {
    const rankResponse = await fetch('http://localhost:3002/api/startups/recalculate-ranks', {
      method: 'POST',
    });

    if (rankResponse.ok) {
      const rankResult = await rankResponse.json();
      console.log(`✓ ${rankResult.message}`);
    } else {
      console.warn('⚠ Rank recalculation failed, but upload succeeded');
    }
  } catch (error) {
    console.error('✗ Rank recalculation error:', error.message);
  }

  console.log('\n🎉 All done!');
}

main().catch(console.error);
