// @ts-check
import { readFile, writeFile } from 'fs/promises';
import { format } from 'prettier';
import { pseudoize } from 'pseudoizer';

/**
 * @param {string} key
 * @param {unknown} value
 */
function pseudoizeJsonReplacer(key, value) {
  if (typeof value === 'string') {
    // Split string on brace-enclosed segments. Odd indices will be {{variables}}
    const phraseParts = value.split(/(\{\{[^}]+}\})/g);
    const translatedParts = phraseParts.map((str, index) => (index % 2 ? str : pseudoize(str)));
    return translatedParts.join('');
  }

  return value;
}
/**
 * @param {string} inputPath
 * @param {string} outputPath
 */
async function pseudoizeJson(inputPath, outputPath) {
  const baseJson = await readFile(inputPath, 'utf-8');
  const enMessages = JSON.parse(baseJson);
  const pseudoJson = JSON.stringify(enMessages, pseudoizeJsonReplacer, 2);
  const prettyPseudoJson = await format(pseudoJson, {
    parser: 'json',
  });

  await writeFile(outputPath, prettyPseudoJson);
  console.log('Wrote', outputPath);
}

// Plugin translations
await pseudoizeJson('../src/locales/en-US.json', '../src/locales/pseudo-LOCALE.json');
