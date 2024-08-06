#!/bin/bash

from_dir=".proxy-external-repo"
to_dir=".i18n-tooling"

echo -n "Would you like to set up betterer? (y/n): "
read input
echo $input

if [ $input == "y" ]; then
  # Copy packages/grafana-eslint-rules to root directory
  # This is necessary for betterer to find the rules
  echo "---------------------------------"
  echo "Copying $from_dir/packages/grafana-eslint-rules to root directory..."
  mkdir -p ./$to_dir/packages/grafana-eslint-rules
  cp -r ./$from_dir/packages/grafana-eslint-rules ./$to_dir/packages/grafana-eslint-rules

  # Add packages directory to .gitignore
  echo "" >> .gitignore
  echo "# Directory for i18n eslint rules" >> .gitignore
  echo "packages/" >> .gitignore

  # Install betterer
  echo "---------------------------------"
  echo "Installing betterer..."
  echo "---------------------------------"
  yarn add @betterer/betterer
  yarn add @betterer/cli
  echo "---------------------------------"
  echo "Betterer successfully installed!"

  # Run betterer
  echo "---------------------------------"
  echo "Running betterer..."
  echo "---------------------------------"
  betterer --update --silent

  # Ask user to commit results
  echo "---------------------------------"
  echo "Betterer file successfully updated!"
  echo "---------------------------------"
  echo "Now that you have added the appropriate packages and run betterer, you should commit the changes to the repository."
  echo "---------------------------------"

else
  echo "Betterer not set up."
fi
