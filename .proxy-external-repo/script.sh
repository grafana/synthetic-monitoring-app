#!/bin/bash

set -e
set -o pipefail
set -u

setup() {
  if ! command -v go &> /dev/null; then
    echo "Go is not installed. Please install Go before running this script."
    exit 1
  fi

  if ! command -v bingo &> /dev/null; then
    go install github.com/bwplotka/bingo@latest
    if command -v bingo &> /dev/null; then
      echo "bingo installed successfully."
    else
      echo "E: bingo failed to install. Stop."
      exit 1
    fi
  fi

  if ! bingo get ; then
    echo "E: bingo get failed. Stop."
    exit 1
  fi
}

setup_betterer() {
  # Copy packages/grafana-eslint-rules to root directory
  # This is necessary for betterer to find the rules
  info "Copying $from_dir/packages/grafana-eslint-rules to root directory..."

  mkdir -p "${to_dir}/packages"
  cp -r "${from_dir}/packages/grafana-eslint-rules" "${to_dir}/packages/"

  if ! grep -q '^packages/$' .gitignore ; then
    cat <<-EOT >> .gitignore
	
	# Directory for i18n eslint rules
	packages/
	EOT
  fi

  info "Installing betterer..."
  yarn add @betterer/betterer
  yarn add @betterer/cli
  info "Betterer successfully installed!"

  "${GUM}" spin --title="Running betterer..." -- "${bin_path}/betterer" --update --silent

  info "Betterer file successfully updated!"
  info "Now that you have added the appropriate packages and run betterer, you should commit the changes to the repository."
}

copy_i18n_files() {
  i18n_dst_default='src/components/i18n'

  i18n_dst=$("${GUM}" input \
    --header="$("${GUM}" style --bold --foreground=3 'Where would you like the name-spaced i18n Trans and t functions installed?')" \
    --prompt='> ' \
    --width=0 \
    --placeholder="enter the path to a directory (default: ${i18n_dst_default})"
  )

  if test -z "${i18n_dst}" ; then
    i18n_dst="${i18n_dst_default}"
  fi

  info "Installing i18n functions to '${i18n_dst}'"

  mkdir -p "${i18n_dst}"
  # TODO(mem): Is this the right source directory for this?
  cp -r "${from_dir}/i18n/"* "${i18n_dst}"
}


info() {
  "${GUM}" log --level info "$@"
}

error() {
  "${GUM}" log --level error "$@"
  exit 10
}

setup

. ./.bingo/variables.env

# TODO(mem): IIRC 'readlink -m' is not available on macOS
from_dir=$(readlink -m ".proxy-external-repo")
to_dir=$(readlink -m ".config-i18n")
bin_path=$(yarn bin)

info "Setting up i18n tooling..."

if "${GUM}" confirm "Would you like to set up betterer?" --default=yes ; then
  setup_betterer
else
  info "Betterer not set up."
fi

copy_i18n_files

if "${GUM}" confirm "Would you like to use crowdin to manage your translation files?" --default=yes ; then
  info "Installing crowdin CLI tool..."
  yarn add @crowdin/cli
  # 1. Copy crowdin.yml
  # 2. Add i18n scripts to package.json
  # 3. Add commands to Makefile?
  info "Crowdin successfully installed!"
  if "${GUM}" confirm "Would you like to add CI/CD steps?" --default=yes ; then
    # 4. Add CI/CD steps
    :
  fi
fi
