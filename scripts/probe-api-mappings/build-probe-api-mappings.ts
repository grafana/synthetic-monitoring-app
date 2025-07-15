#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import {
  MAPPINGS_FILE,
  ProbeMapping,
  fetchDocumentationPage,
  parseProbeTableFromHtml,
  loadCurrentMappings,
  compareMappings,
} from './utils';

main().catch((error: Error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

async function main(): Promise<void> {
  console.log('🔧 Building probe API server mappings...');

  const html = await fetchDocumentationPage();
  const documentationMappings = parseProbeTableFromHtml(html);
  const currentMappings = loadCurrentMappings();

  if (compareMappings(currentMappings, documentationMappings)) {
    console.log('✅ Probe API server mappings are already up to date!');
    process.exit(0);
  } else {
    console.log('🔄 Probe API server mappings need to be updated!');
    displayChanges(currentMappings, documentationMappings);

    console.log('\n🔧 Updating mappings file...');
    saveMappings(documentationMappings);

    console.log('\n🎉 Probe API server mappings have been successfully updated!');
    process.exit(0);
  }
}

function saveMappings(mappings: ProbeMapping[]): void {
  try {
    const filePath = path.resolve(MAPPINGS_FILE);
    const content = JSON.stringify(mappings, null, 2) + '\n';
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Successfully updated ${MAPPINGS_FILE}`);
  } catch (error) {
    console.error('Error saving mappings file:', (error as Error).message);
    process.exit(1);
  }
}

function displayChanges(current: ProbeMapping[], documentation: ProbeMapping[]): void {
  console.log('\n📋 Changes to be made:');
  console.log(`Current file has ${current.length} entries`);
  console.log(`Documentation has ${documentation.length} entries`);

  if (current.length !== documentation.length) {
    console.log('\n🔄 Entry count will change!');
  }

  const sortFn = (a: ProbeMapping, b: ProbeMapping): number => {
    if (a.region !== b.region) {
      return a.region.localeCompare(b.region);
    }
    return a.provider.localeCompare(b.provider);
  };

  const sortedCurrent = [...current].sort(sortFn);
  const sortedDocumentation = [...documentation].sort(sortFn);

  console.log('\n🔍 Detailed changes:');

  // Check for entries that will be removed
  for (const currentItem of sortedCurrent) {
    const found = sortedDocumentation.find(
      (item) => item.region === currentItem.region && item.provider === currentItem.provider
    );

    if (!found) {
      console.log(`🗑️  Will remove: ${currentItem.region} (${currentItem.provider})`);
    }
  }

  // Check for entries that will be added
  for (const docItem of sortedDocumentation) {
    const found = sortedCurrent.find((item) => item.region === docItem.region && item.provider === docItem.provider);

    if (!found) {
      console.log(`➕ Will add: ${docItem.region} (${docItem.provider})`);
    }
  }

  // Check for entries that will be updated
  for (const currentItem of sortedCurrent) {
    const docItem = sortedDocumentation.find(
      (item) => item.region === currentItem.region && item.provider === currentItem.provider
    );

    if (docItem) {
      if (currentItem.apiServerURL !== docItem.apiServerURL) {
        console.log(`🔄 Will update API Server URL for ${currentItem.region} (${currentItem.provider}):`);
        console.log(`   From: ${currentItem.apiServerURL}`);
        console.log(`   To: ${docItem.apiServerURL}`);
      }

      if (currentItem.backendAddress !== docItem.backendAddress) {
        console.log(`🔄 Will update Backend Address for ${currentItem.region} (${currentItem.provider}):`);
        console.log(`   From: ${currentItem.backendAddress}`);
        console.log(`   To: ${docItem.backendAddress}`);
      }
    }
  }
}
