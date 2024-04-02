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
const branchName = `release-${version}`;

octokit.rest.git
  .createRef({
    owner: 'grafana',
    repo: 'synthetic-monitoring-app',
    ref: `refs/heads/${branchName}`,
    sha: revision,
  })
  .then((response) => {
    octokit.rest.repos
      .createRelease({
        owner: 'grafana',
        repo: 'synthetic-monitoring-app',
        target_commitish: branchName,
        tag_name: version,
        name: version,
        body: message,
      })
      .then((releaseResp) => {
        console.log('Created release');
      });
  });
