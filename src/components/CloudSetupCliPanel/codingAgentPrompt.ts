export function getCodingAgentPrompt(stackUrl: string) {
  return `Set up Grafana Synthetic Monitoring checks for this project on ${stackUrl}.

1. Install gcx if needed using https://grafana.com/docs/grafana-cloud/ai-tools/gcx/installation/ and connect to this stack. Keep credentials in the CLI.

2. Load the relevant Synthetic Monitoring skill through gcx, installing it if needed. Follow its instructions and CLI help.

3. Inspect this project and existing checks to avoid duplicates. Ask for the deployed URL if needed. Propose a few useful checks with targets, probe locations, and frequency. Include only failed-check alerts by default, with an option to disable them. TLS-expiry and other alerts require opt-in.

4. Verify alerts route to contact points with real destinations. Resolve missing or placeholder configuration with me, then ask me to approve the plan before creation.

5. After approval, create the agreed checks and alerts, verify their configuration and notification routing, and show their status and links. Offer to export the checks as Terraform.`;
}
