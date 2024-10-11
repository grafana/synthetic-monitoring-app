#!/bin/sh
set -e

# GitHub CLI
gh_version='2.36.0'

# Requirements for ubuntu:latest image (bash is already installed).
# NOTE: This script can't be a Makefile target if make is not yet installed.
export DEBIAN_FRONTEND=noninteractive
apt-get update >/dev/null && apt-get install -y \
  git \
  libreadline8 \
  make \
  wget \
  zip \
  curl \
  >/dev/null

wget -q https://github.com/cli/cli/releases/download/v${gh_version}/gh_${gh_version}_linux_amd64.deb
dpkg -i gh_${gh_version}_linux_amd64.deb >/dev/null
rm gh_${gh_version}_linux_amd64.deb
