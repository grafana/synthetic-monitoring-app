import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

export const DOCUMENTATION_URL =
  'https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/set-up/set-up-private-probes/#add-a-new-probe-in-your-grafana-instance';
export const MAPPINGS_FILE = 'src/data/probeAPIServerMappings.json';

export interface ProbeMapping {
  region: string;
  provider: string;
  apiServerURL: string;
  backendAddress: string;
}

/**
 * Fetches the HTML content from the Grafana documentation page
 */
export async function fetchDocumentationPage(): Promise<string> {
  try {
    console.log(`📄 Fetching documentation from: ${DOCUMENTATION_URL}`);
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
export function parseProbeTableFromHtml(html: string): ProbeMapping[] {
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

  console.log(`📊 Found ${mappings.length} entries in documentation`);
  return mappings;
}

/**
 * Loads the current mappings from the JSON file
 */
export function loadCurrentMappings(): ProbeMapping[] {
  try {
    const filePath = path.resolve(MAPPINGS_FILE);
    if (!fs.existsSync(filePath)) {
      console.log('📄 Mappings file does not exist, will create it');
      return [];
    }
    const content = fs.readFileSync(filePath, 'utf8');

    const parsedContent: ProbeMapping[] = JSON.parse(content);
    console.log(`📊 Found ${parsedContent.length} entries in current file`);

    return parsedContent;
  } catch (error) {
    console.error('Error reading current mappings file:', (error as Error).message);
    process.exit(1);
  }
}

/**
 * Compares two mapping arrays for equality
 */
export function compareMappings(current: ProbeMapping[], documentation: ProbeMapping[]): boolean {
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
