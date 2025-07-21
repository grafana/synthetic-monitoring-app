#!/usr/bin/env node

import {
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
  console.log('🔍 Verifying probe API server mappings...');

  const html = await fetchDocumentationPage();
  const documentationMappings = parseProbeTableFromHtml(html);
  const currentMappings = loadCurrentMappings();

  if (compareMappings(currentMappings, documentationMappings)) {
    console.log('✅ Probe API server mappings are up to date!');
    process.exit(0);
  } else {
    console.log('❌ Probe API server mappings are outdated!');
    displayDifferences(currentMappings, documentationMappings);
    console.log(
      '\n💡 Please update the probeAPIServerMappings.json file to match the documentation by running `yarn build:probe-api-mappings`'
    );
    process.exit(1);
  }
}

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
