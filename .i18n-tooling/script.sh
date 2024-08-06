#!/bin/bash
echo -n "Would you like to set up betterer? (y/n): "
read input
echo $input

if [ $input == "y" ]; then
  # Copy packages/grafana-eslint-rules to root directory
  # This is necessary for betterer to find the rules
  echo "---------------------------------"
  echo "Copying i18n-tooling/packages/grafana-eslint-rules to root directory..."
  mkdir -p ./packages/grafana-eslint-rules
  cp -r ./.i18n-tooling/packages/grafana-eslint-rules ./packages

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
  echo "Betterer installed!"
  echo "---------------------------------"

  # Run betterer
  echo "---------------------------------"
  echo "Running betterer..."
  echo "---------------------------------"
  yarn i18n:betterer-update

  # Ask user to commit results
  echo "---------------------------------"
  echo "Betterer file updated!"
  echo "---------------------------------"
  echo "Now that you have added the appropriate packages and run betterer, you should commit the changes to the repository."
  echo "---------------------------------"

else
  echo "Betterer not set up."
fi
