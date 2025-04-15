import fs from 'fs/promises';
import path from 'path';
import { Project } from 'ts-morph';

import { formatEventsAsMarkdown } from './outputFormats/markdown.mts';
import { findAnalyticsEvents } from './findAllEvents.mts';

const CREATE_EVENT_FACTORY_PATH = path.resolve('src/features/tracking/createEventFactory.ts');
const SOURCE_FILE_PATTERNS = ['**/*.ts'];
const OUTPUT_FORMAT = 'markdown';

const project = new Project({
  tsConfigFilePath: path.resolve('tsconfig.json'),
});
const files = project.getSourceFiles(SOURCE_FILE_PATTERNS);

const events = findAnalyticsEvents(files, CREATE_EVENT_FACTORY_PATH);

if (OUTPUT_FORMAT === 'markdown') {
  const markdown = await formatEventsAsMarkdown(events);
  // console.log(markdown);

  await fs.writeFile('analytics-report.md', markdown);
} else {
  console.log(JSON.stringify(events, null, 2));
}
