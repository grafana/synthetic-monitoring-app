#!/bin/bash
echo -n "Would you like to set up betterer? (y/n): "
read input
echo $input

if [ $input == "y" ]; then
  echo "-----------------------------------"
  echo "Copying i18n-tooling/packages/grafana-eslint-rules to root directory..."
  mkdir -p ./packages/grafana-eslint-rules
  cp -r ./.i18n-tooling/packages/grafana-eslint-rules ./packages

  echo "-----------------------------------"
  echo "Installing betterer..."
  # npm install -g betterer
  echo "Betterer installed!"
  echo "You can now run 'betterer init' to create a betterer config file."
else
  echo "Betterer not installed."
fi
