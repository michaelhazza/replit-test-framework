#!/bin/bash
# Git Submodule Setup Script for Test Framework
# Run this in each Replit repository that needs the test framework

set -e

echo "🔧 Setting up Test Framework as Git Submodule..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📝 Initializing git repository..."
    git init
fi

# Add test framework as submodule
echo "📦 Adding test framework submodule..."
git submodule add https://github.com/$1/universal-test-framework.git test-framework

# Initialize and update submodule
git submodule init
git submodule update

# Copy configuration template
echo "📋 Setting up configuration..."
cp test-framework/config/app-config.template.ts ./test-config.ts

# Install test dependencies
echo "📦 Installing test dependencies..."
npm install --save-dev \
  vitest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @vitest/ui \
  @vitest/coverage-v8 \
  jsdom

# Copy test scripts to package.json
echo "📝 Adding test scripts..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts['test'] = 'vitest';
pkg.scripts['test:ui'] = 'vitest --ui';
pkg.scripts['test:coverage'] = 'vitest run --coverage';
pkg.scripts['test:generate'] = 'node test-framework/scripts/generate-tests.js';
pkg.scripts['test:update'] = 'git submodule update --remote test-framework';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

# Create vitest config
echo "⚙️ Creating vitest configuration..."
cp test-framework/config/vitest.config.template.ts ./vitest.config.ts

echo "✅ Test framework setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit test-config.ts with your application details"
echo "2. Run: npm run test:generate"
echo "3. Run: npm run test"
echo ""
echo "To update framework: npm run test:update"