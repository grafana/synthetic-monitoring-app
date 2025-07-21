import { fail, markdown, warn } from 'danger';

import { bundleSizeDiff, CRITICAL_THRESHOLD, Outcome, SIGNIFICANT_THRESHOLD } from './bundleSize';

doDanger();

function doDanger() {
  try {
    const { outcomes, scriptResults, totals } = bundleSizeDiff();

    if (outcomes.critical.length) {
      outcomes.critical.map(({ name }) => fail(messageGenerator(name, Outcome.Critical)));
    }

    if (outcomes.significant.length) {
      outcomes.significant.map(({ name }) => warn(messageGenerator(name, Outcome.Significant)));
    }

    const header = `
| Name | +/- | Main | This PR | Outcome |
| ---- | --- | ---- | ------- | ------- |`;

    markdown(`
## Script size changes
${header}
${scriptResults.map(bundleSizeRow).join('\n')}

## Totals
${header}
${bundleSizeRow(totals.scripts)}
${bundleSizeRow(totals.otherAssets)}
${bundleSizeRow(totals.all)}
    `);
  } catch (e) {
    fail(`DangerJS was unable to run. The error returned was ${e.message}`);
  }
}

function bundleSizeRow({ name, change, main, current, outcome }) {
  const emoji = emojiOutcome(outcome);

  return `| [${name}] | **${change}** | ${main} | ${current} | ${emoji} |`;
}

function emojiOutcome(outcome) {
  if (outcome === Outcome.Critical) {
    return ':rotating_light:';
  }

  if (outcome === Outcome.Significant) {
    return ':warning:';
  }

  if (outcome === Outcome.Ok) {
    return ':white_check_mark:';
  }

  return '';
}

function messageGenerator(name, outcome) {
  const thresholdMap = {
    [Outcome.Critical]: CRITICAL_THRESHOLD * 100,
    [Outcome.Significant]: SIGNIFICANT_THRESHOLD * 100,
  };

  return `**${name}** has exceeded the ${outcome} threshold of a ${thresholdMap[outcome]}% size increase in this PR.`;
}
