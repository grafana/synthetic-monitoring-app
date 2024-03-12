// echo $(ARTIFACTS_DIR)/$(VERSION)/$(PACKAGE_NAME)
// gh release create $(VERSION) --title $(VERSION) -F ./CHANGELOG.md --draft --latest $(ARTIFACTS_DIR)/$(VERSION)/$(PACKAGE_NAME)

const { Octokit } = require('octokit');
const packageJson = require('../package.json');
const { readFileSync } = require('fs');
revision = require('child_process').execSync('git rev-parse HEAD').toString().trim();

const token = process.env.GITHUB_TOKEN;

const octokit = new Octokit({ auth: token });
const version = packageJson.version;

const changelog = readFileSync('./CHANGELOG.md', 'utf-8');
const split = changelog.split(/\n\s*\n/);
const message = split.slice(1, 3).join('\n\n');

octokit.rest.repos
  .createRelease({
    owner: 'grafana',
    repo: 'synthetic-monitoring-app',
    target_commitish: revision,
    tag_name: version,
    name: version,
    body: message,
    draft: true,
    prerelease: true,
  })
  .then((response) => {
    console.log('Created release');
  });
