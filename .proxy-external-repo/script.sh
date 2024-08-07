#!/bin/bash

set -e
set -o pipefail
set -u

from_dir=".proxy-external-repo"
to_dir=".config-i18n"
bin_path=$(yarn bin)
AUTOPILOT=false

setup() {
  if ! command -v go &> /dev/null; then
    echo "Go is not installed. Please install Go before running this script."
    exit 1
  fi

  BINGO=$(command -v bingo 2> /dev/null)

  if test -z "${BINGO}" ; then
    # No bingo on the path. Is GOBIN not in the user's path?
    GOBIN=$(go env GOBIN)
    if test -z "${GOBIN}" ; then
      GOBIN=$(go env GOPATH)/bin
    fi

    # Try again with this path.
    BINGO=$(command -v "${GOBIN}/bingo" 2> /dev/null)

    if test -z "${BINGO}" ; then
      # Still no bingo. Install it.
      go install github.com/bwplotka/bingo@latest

      # Is it there yet?
      BINGO=$(command -v "${GOBIN}/bingo" 2> /dev/null)

      if test -z "${BINGO}" ; then
        echo "E: bingo failed to install. Stop."
        exit 2
      else
        echo "bingo installed successfully."
      fi
    fi
  fi

  if ! "${BINGO}" get ; then
    echo "E: bingo get failed. Stop."
    exit 3
  fi

  . ./.bingo/variables.env
}

setup_betterer() {
  # Copy packages/grafana-eslint-rules to root directory
  # This is necessary for betterer to find the rules
  info "Copying $from_dir/packages/grafana-eslint-rules to root directory..."

  mkdir -p "./packages/grafana-eslint-rules"
  cp -r "./${from_dir}/packages/grafana-eslint-rules" "./packages/"
  cp -r "./${from_dir}/.betterer.ts" "./"
  cp -r "./${from_dir}/.betterer.results" "./"

  if ! grep -q '^packages/$' .gitignore ; then
    cat <<-EOT >> .gitignore
	
	# Directory for i18n eslint rules
	packages/
	EOT
  fi

  info "Updating package.json to include betterer scripts..."

  local tmpfile
  tmpfile=$(mktemp)
  jq --slurpfile input "${from_dir}/betterer-scripts.json" '.scripts += $input[0]' package.json > "${tmpfile}" &&
    mv "${tmpfile}" package.json

  local tmpfile
  tmpfile=$(mktemp)
  jq --slurpfile input "${from_dir}/betterer-packages.json" '.devDependencies += $input[0]' package.json > "${tmpfile}" &&
    mv "${tmpfile}" package.json

  cat "${from_dir}/betterer.mk" >> "${to_dir}/Makefile"

  info "package.json successfully updated!"

  info "Installing betterer..."
  yarn add @betterer/betterer
  yarn add @betterer/cli
  info "Betterer successfully installed!"

  "${GUM}" spin --title="Running betterer..." -- yarn i18n:betterer

  info "Betterer file successfully updated!"

  info "Now that you have added the appropriate packages and run betterer, you should commit the changes to the repository."
}

setup_i18n() {
  info "Setting up basic i18n tooling..."

  i18n_dst_default='src/components/i18n'

  if ! "${AUTOPILOT}" ; then
    i18n_dst=$("${GUM}" input \
      --header="$("${GUM}" style --bold --foreground=3 'Where would you like the name-spaced i18n Trans and t functions installed?')" \
      --prompt='> ' \
      --width=0 \
      --placeholder="enter the path to a directory (default: ${i18n_dst_default})"
    )
  fi

  i18n_dst="${i18n_dst:-${i18n_dst_default}}"

  mkdir -p "${to_dir}"

  cp "${from_dir}/i18next-parser.config.cjs" "${to_dir}"
  cp "${from_dir}/Makefile" "${to_dir}"
  cp "${from_dir}/pseudo.mjs" "${to_dir}"
  cp "${from_dir}/README.md" "${to_dir}"
  cp -a "${from_dir}/packages" "${to_dir}"

  info "Installing i18n functions to '${i18n_dst}'"

  mkdir -p "${i18n_dst}"
  # TODO(mem): Is this the right source directory for this?
  cp -r "${from_dir}/i18n/"* "${i18n_dst}"

  info "Updating package.json to include basic i18n scripts..."

  local tmpfile
  tmpfile=$(mktemp)
  jq --slurpfile input "${from_dir}/i18n-scripts.json" '.scripts += $input[0]' package.json > "${tmpfile}" &&
    mv "${tmpfile}" package.json

  info "package.json successfully updated!"

  info "Setting up basic i18n tooling... done!"
}

setup_crowdin() {
  info "Installing crowdin CLI tool..."
  yarn add @crowdin/cli
  # 1. Copy crowdin.yml
  # 2. Add i18n scripts to package.json
  # 3. Add commands to Makefile?
  info "Crowdin successfully installed!"

  info "Updating package.json to include crowdin scripts..."

  local tmpfile
  tmpfile=$(mktemp)
  jq --slurpfile input "${from_dir}/crowdin-scripts.json" '.scripts += $input[0]' package.json > "${tmpfile}" &&
    mv "${tmpfile}" package.json

  cat "${from_dir}/crowdin.mk" >> "${to_dir}/Makefile"

  info "package.json successfully updated!"
}

setup_crowdin_cicd() {
  # 4. Add CI/CD steps
  true
}

info() {
  "${GUM}" log --level info "$@"
}

error() {
  "${GUM}" log --level error "$@"
  exit 10
}

setup

info "Setting up i18n tooling..."

if "${GUM}" confirm "Would you like to set up the i18n tooling with the recommended defaults?" --default=yes ; then
  AUTOPILOT=true
fi

setup_i18n

if "${AUTOPILOT}" || "${GUM}" confirm "Would you like to set up betterer?" --default=yes ; then
  setup_betterer
else
  info "Skipping betterer setup."
fi

if "${AUTOPILOT}" || "${GUM}" confirm "Would you like to use crowdin to manage your translation files?" --default=yes ; then
  setup_crowdin

  if "${AUTOPILOT}" || "${GUM}" confirm "Would you like to add CI/CD steps?" --default=yes ; then
    setup_crowdin_cicd
  fi
else
  info "Skipping crowdin setup."
fi

"${GUM}" style --border=normal --align=center --width=50 --bold --foreground=3 "$("${GUM}" format -t emoji 'i18n tooling setup complete! :tada:')"
