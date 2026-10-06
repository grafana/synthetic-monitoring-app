import { type Check } from 'types';

export const PREFIXED_LABEL_SEARCH_ORIGIN = 'grafana-synthetic-monitoring-app/label-migration';

// Worded and tested in Assistant against a stack mid-migration, so change it
// deliberately. `{{ $labels.label_ }}` is Go-template text for Assistant to
// search for; only `{{labelKeys}}` and `{{prefixedLabelKeys}}` are ours.
const PROMPT_TEMPLATE = [
  'I am migrating my Synthetic Monitoring check labels from prefixed names, where each key has a label_ prefix, ' +
    'to unprefixed names that use the key alone. ' +
    'Find every object in this Grafana stack that still uses the old prefixed label names, so I can update them ' +
    'before prefixed labels stop being written. Check alert routing (notification policies) first: a route matcher ' +
    'that no longer matches fails with no error, and alerts go to the default receiver without anyone noticing.',
  '',
  'My check label keys: {{labelKeys}}',
  'Search for these exact prefixed names: {{prefixedLabelKeys}}',
  '',
  'Check all of these, in this order:',
  '1. Notification policies: route matchers on label_, and group_by settings.',
  '2. Contact point and notification templates that use .Labels.label_.',
  '3. Silences and mute timings with matchers on label_.',
  '4. Alert rules (Grafana-managed and data-source-managed): query expressions, label_replace() arguments, rule ' +
    'labels, and annotations or summaries that use {{ $labels.label_ }}.',
  '5. Dashboards: panel queries, template variables (including label_values(sm_check_info, label_)), ' +
    'transformations, field overrides, and panel or data links.',
  '6. Recording rules that select or aggregate on these labels.',
  '7. SLOs whose queries filter or group on these labels.',
  '',
  'Rules:',
  '- Ignore PromQL/LogQL functions such as label_replace, label_join, label_format and label_values, unless their ' +
    'arguments use one of my prefixed label names.',
  '- The Synthetic Monitoring per-check alert rules copy all sm_check_info labels. Do not mark the rule queries as ' +
    'broken, but do mark any notification policy or template that depends on the prefixed labels those alerts carry.',
  '- For each finding, give: object type, name with a link, the exact place (panel, variable, route, query), the ' +
    'current text, and the suggested unprefixed replacement.',
  '- Say if an object is provisioned or managed as code (Terraform, file provisioning, a plugin). For those objects, ' +
    'the change must be made in the source and not in the UI.',
  '- List what you could not check or search completely, so I know where gaps remain.',
  '- Do not change anything. Report only.',
].join('\n');

/** Distinct label names across the tenant's checks, in a stable, readable order. */
export function getCheckLabelKeys(checks: Check[]): string[] {
  const keys = new Set(checks.flatMap((check) => check.labels.map(({ name }) => name)));

  return [...keys].sort((a, b) => a.localeCompare(b));
}

/** The Assistant prompt with the tenant's label keys in place of the template's placeholders. */
export function buildPrefixedLabelSearchPrompt(labelKeys: string[]): string {
  const values = {
    labelKeys: labelKeys.join(', '),
    prefixedLabelKeys: labelKeys.map((key) => `label_${key}`).join(', '),
  };

  // One pass, so substituted text is never itself scanned for placeholders.
  return PROMPT_TEMPLATE.replace(
    /\{\{(labelKeys|prefixedLabelKeys)\}\}/g,
    (_, name: keyof typeof values) => values[name]
  );
}
