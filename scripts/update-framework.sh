#!/bin/bash
# Update Test Framework Script
# Run this in any repository using the test framework to get latest updates

set -e

echo "🔄 Updating Test Framework..."

# Method 1: If using git submodule
if [ -d "test-framework/.git" ]; then
    echo "📦 Updating via git submodule..."
    git submodule update --remote test-framework
    echo "✅ Framework updated via submodule"
    exit 0
fi

# Method 2: If using NPM package
if grep -q "universal-test-framework" package.json 2>/dev/null; then
    echo "📦 Updating via NPM..."
    npm update universal-test-framework
    echo "✅ Framework updated via NPM"
    exit 0
fi

# Method 3: If using direct download
if [ -d "test-framework" ]; then
    echo "📦 Updating via direct download..."
    rm -rf test-framework
    curl -L https://github.com/YOUR_USERNAME/universal-test-framework/archive/main.zip -o framework.zip
    unzip framework.zip
    mv universal-test-framework-main test-framework
    rm framework.zip
    echo "✅ Framework updated via download"
    exit 0
fi

echo "❌ No test framework installation found"
echo "Run setup script first: ./test-framework/scripts/setup-git-submodule.sh"