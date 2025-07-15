#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const DOCUMENTATION_URL =
  'https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/set-up/set-up-private-probes/#add-a-new-probe-in-your-grafana-instance';
const MAPPINGS_FILE = 'src/page/NewProbe/probeAPIServerMappings.json';

interface ProbeMapping {
  region: string;
  provider: string;
  apiServerURL: string;
  backendAddress: string;
}

/**
 * Fetches the HTML content from the Grafana documentation page
 */
async function fetchDocumentationPage(): Promise<string> {
  try {
    const response = await fetch(DOCUMENTATION_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch documentation: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error fetching documentation:', (error as Error).message);
    process.exit(1);
  }
}

/**
 * Parses the HTML to extract probe mappings from the table
 */
function parseProbeTableFromHtml(html: string): ProbeMapping[] {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Find the table containing probe mappings
  const tables = document.querySelectorAll('table');
  let probeTable: Element | null = null;

  for (const table of tables) {
    const headerRow = table.querySelector('tr');
    if (headerRow && headerRow.textContent?.includes('Region') && headerRow.textContent?.includes('Provider')) {
      probeTable = table;
      break;
    }
  }

  if (!probeTable) {
    throw new Error('Could not find probe mappings table in documentation');
  }

  const mappings: ProbeMapping[] = [];
  const rows = probeTable.querySelectorAll('tr');

  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.querySelectorAll('td');

    if (cells.length >= 4) {
      const region = cells[0].textContent?.trim() || '';
      const provider = cells[1].textContent?.trim() || '';
      const apiServerURL = cells[2].textContent?.trim() || '';
      const backendAddress = cells[3].textContent?.trim() || '';

      mappings.push({
        region,
        provider,
        apiServerURL,
        backendAddress,
      });
    }
  }

  return mappings;
}

/**
 * Loads the current mappings from the JSON file
 */
function loadCurrentMappings(): ProbeMapping[] {
  try {
    const filePath = path.resolve(MAPPINGS_FILE);
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content) as ProbeMapping[];
  } catch (error) {
    console.error('Error reading current mappings file:', (error as Error).message);
    process.exit(1);
  }
}

/**
 * Compares two mapping arrays for equality
 */
function compareMappings(current: ProbeMapping[], documentation: ProbeMapping[]): boolean {
  if (current.length !== documentation.length) {
    return false;
  }

  // Sort both arrays for comparison
  const sortFn = (a: ProbeMapping, b: ProbeMapping): number => {
    if (a.region !== b.region) {
      return a.region.localeCompare(b.region);
    }
    return a.provider.localeCompare(b.provider);
  };

  const sortedCurrent = [...current].sort(sortFn);
  const sortedDocumentation = [...documentation].sort(sortFn);

  for (let i = 0; i < sortedCurrent.length; i++) {
    const currentItem = sortedCurrent[i];
    const docItem = sortedDocumentation[i];

    if (
      currentItem.region !== docItem.region ||
      currentItem.provider !== docItem.provider ||
      currentItem.apiServerURL !== docItem.apiServerURL ||
      currentItem.backendAddress !== docItem.backendAddress
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Displays the differences between current and documentation mappings
 */
function displayDifferences(current: ProbeMapping[], documentation: ProbeMapping[]): void {
  console.log('\n📋 Comparison Results:');
  console.log(`Current file has ${current.length} entries`);
  console.log(`Documentation has ${documentation.length} entries`);

  if (current.length !== documentation.length) {
    console.log('\n❌ Entry count mismatch!');
  }

  const sortFn = (a: ProbeMapping, b: ProbeMapping): number => {
    if (a.region !== b.region) {
      return a.region.localeCompare(b.region);
    }
    return a.provider.localeCompare(b.provider);
  };

  const sortedCurrent = [...current].sort(sortFn);
  const sortedDocumentation = [...documentation].sort(sortFn);

  console.log('\n🔍 Detailed comparison:');

  // Check for missing entries in current file
  for (const docItem of sortedDocumentation) {
    const found = sortedCurrent.find((item) => item.region === docItem.region && item.provider === docItem.provider);

    if (!found) {
      console.log(`❌ Missing in current file: ${docItem.region} (${docItem.provider})`);
    }
  }

  // Check for extra entries in current file
  for (const currentItem of sortedCurrent) {
    const found = sortedDocumentation.find(
      (item) => item.region === currentItem.region && item.provider === currentItem.provider
    );

    if (!found) {
      console.log(`❌ Extra in current file: ${currentItem.region} (${currentItem.provider})`);
    }
  }

  // Check for differences in matching entries
  for (const currentItem of sortedCurrent) {
    const docItem = sortedDocumentation.find(
      (item) => item.region === currentItem.region && item.provider === currentItem.provider
    );

    if (docItem) {
      if (currentItem.apiServerURL !== docItem.apiServerURL) {
        console.log(`❌ API Server URL mismatch for ${currentItem.region} (${currentItem.provider}):`);
        console.log(`   Current: ${currentItem.apiServerURL}`);
        console.log(`   Documentation: ${docItem.apiServerURL}`);
      }

      if (currentItem.backendAddress !== docItem.backendAddress) {
        console.log(`❌ Backend Address mismatch for ${currentItem.region} (${currentItem.provider}):`);
        console.log(`   Current: ${currentItem.backendAddress}`);
        console.log(`   Documentation: ${docItem.backendAddress}`);
      }
    }
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('🔍 Verifying probe API server mappings...');
  console.log(`📄 Fetching documentation from: ${DOCUMENTATION_URL}`);

  const html = await fetchDocumentationPage();
  const documentationMappings = parseProbeTableFromHtml(html);
  const currentMappings = loadCurrentMappings();

  console.log(`📊 Found ${documentationMappings.length} entries in documentation`);
  console.log(`📊 Found ${currentMappings.length} entries in current file`);

  if (compareMappings(currentMappings, documentationMappings)) {
    console.log('✅ Probe API server mappings are up to date!');
    process.exit(0);
  } else {
    console.log('❌ Probe API server mappings are outdated!');
    displayDifferences(currentMappings, documentationMappings);
    console.log('\n💡 Please update the probeAPIServerMappings.json file to match the documentation.');
    process.exit(1);
  }
}

// Handle missing dependencies
try {
  require('jsdom');
} catch (error) {
  console.error('Missing dependency: jsdom. Please install it with: npm install jsdom');
  process.exit(1);
}

// Run the main function
main().catch((error: Error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
