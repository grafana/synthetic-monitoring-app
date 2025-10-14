#!/bin/bash

# Terraform validation script
# This script validates both JSON and HCL formats

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

# Prevent duplicate configurations (move HCL file)
echo "🧪 Prevent duplicate configurations..."
if [ -f "testTerraformConfig.tf" ]; then
    echo "  → Moving HCL file temporarily..."
    mv testTerraformConfig.tf testTerraformConfig.tf.bak
fi

# Initialize terraform if not already done (now only JSON exists)
if [ ! -d ".terraform" ]; then
    echo "📦 Initializing terraform..."
    terraform init
    echo
fi
echo "  → Running terraform validate for JSON..."
terraform validate
echo "✅ JSON validation passed!"
echo "  → Removing JSON file..."
rm testTerraformConfig.tf.json
echo

# Restore HCL file and validate HCL format
echo "🧪 Restoring HCL configuration..."
if [ -f "testTerraformConfig.tf.bak" ]; then
    echo "  → Restoring HCL file..."
    mv testTerraformConfig.tf.bak testTerraformConfig.tf
fi

echo "  → Running terraform validate for HCL..."
terraform validate
echo "✅ HCL validation passed!"

echo
echo "✅ Both JSON and HCL terraform validation completed successfully!" 