#!/bin/bash

# Terraform validation script
# This script changes to the terraform validation directory and runs terraform validate

set -e

TERRAFORM_DIR="artifacts/terraform-validation"

# Check if the terraform directory exists
if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "❌ Error: Terraform validation directory not found: $TERRAFORM_DIR"
    echo "💡 Run 'yarn build:generate-terraform-test-config' first to generate the test configuration"
    exit 1
fi

# Check if the terraform configuration file exists
if [ ! -f "$TERRAFORM_DIR/testTerraformConfig.tf.json" ]; then
    echo "❌ Error: Terraform configuration file not found: $TERRAFORM_DIR/testTerraformConfig.tf.json"
    echo "💡 Run 'yarn build:generate-terraform-test-config' first to generate the test configuration"
    exit 1
fi

echo "🔧 Validating terraform configuration in $TERRAFORM_DIR..."
echo

# Change to terraform directory and run validation
cd "$TERRAFORM_DIR"

# Initialize terraform if not already done
if [ ! -d ".terraform" ]; then
    echo "📦 Initializing terraform..."
    terraform init
    echo
fi

# Run terraform validate
echo "🧪 Running terraform validate..."
terraform validate

echo
echo "✅ Terraform validation completed successfully!" 