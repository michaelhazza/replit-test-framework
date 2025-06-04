#!/usr/bin/env node

/**
 * Automated Replit Setup Script for Universal Test Framework
 * Run with: node replit-setup.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Setting up Universal Test Framework...\n');

// Check if we're in a submodule or direct installation
const isSubmodule = fs.existsSync('../package.json');
const targetDir = isSubmodule ? '..' : '.';

// Helper function to safely execute commands
function runCommand(command, description) {
  try {
    console.log(`📦 ${description}...`);
    execSync(command, { cwd: targetDir, stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.log(`⚠️  ${description} failed, continuing...\n`);
  }
}

// Helper function to copy files
function copyRecursive(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const files = fs.readdirSync(src);
    files.forEach(file => {
      if (file !== '.git' && file !== 'node_modules') {
        copyRecursive(path.join(src, file), path.join(dest, file));
      }
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// 1. Install required dependencies
const dependencies = [
  'vitest',
  '@testing-library/react',
  '@testing-library/jest-dom',
  '@testing-library/user-event',
  'jsdom',
  '@vitest/coverage-v8'
];

console.log('📦 Installing test framework dependencies...');
dependencies.forEach(dep => {
  runCommand(`npm install ${dep}`, `Installing ${dep}`);
});

// 2. Copy test framework files to target directory
console.log('📁 Copying test framework files...');
const testFrameworkDir = path.join(targetDir, 'test-framework');
if (!fs.existsSync(testFrameworkDir)) {
  fs.mkdirSync(testFrameworkDir, { recursive: true });
}

// Copy core test files
const coreDirs = ['core', 'components', 'utils', 'types'];
coreDirs.forEach(dir => {
  if (fs.existsSync(`./${dir}`)) {
    copyRecursive(`./${dir}`, path.join(testFrameworkDir, dir));
  }
});

console.log('✅ Test framework files copied\n');

// 3. Update package.json scripts
const packageJsonPath = path.join(targetDir, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  console.log('📝 Updating package.json scripts...');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  // Add test scripts
  packageJson.scripts.test = 'vitest';
  packageJson.scripts['test:ui'] = 'vitest --ui';
  packageJson.scripts['test:coverage'] = 'vitest --coverage';
  packageJson.scripts['test:run'] = 'vitest run';
  packageJson.scripts['test:watch'] = 'vitest --watch';
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Package.json updated\n');
}

// 4. Create vitest config
console.log('⚙️  Creating Vitest configuration...');
const vitestConfig = `
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test-framework/core/base-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test-framework/',
        '**/*.test.{js,ts,jsx,tsx}',
        '**/*.spec.{js,ts,jsx,tsx}'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@test': resolve(__dirname, './test-framework')
    }
  }
});
`;

const vitestConfigPath = path.join(targetDir, 'vitest.config.ts');
if (!fs.existsSync(vitestConfigPath)) {
  fs.writeFileSync(vitestConfigPath, vitestConfig);
  console.log('✅ Vitest configuration created\n');
}

// 5. Create test directory structure
console.log('📂 Creating test directory structure...');
const testDirs = ['tests', 'tests/api', 'tests/components', 'tests/integration'];
testDirs.forEach(dir => {
  const fullPath = path.join(targetDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// 6. Create example test files
console.log('📋 Creating example test files...');

const exampleApiTest = `
import { describe, it, expect } from 'vitest';

describe('API Tests', () => {
  it('should handle health check', async () => {
    const response = await fetch('/api/health');
    expect(response.ok).toBe(true);
  });

  it('should handle user authentication', async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'test@example.com', 
        password: 'password123' 
      })
    });
    expect(response.status).toBeDefined();
  });
});
`;

const exampleComponentTest = `
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

// Example component test
describe('Component Tests', () => {
  it('should render button component', () => {
    const ButtonComponent = () => <button>Click me</button>;
    render(<ButtonComponent />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
`;

fs.writeFileSync(path.join(targetDir, 'tests/api/example.test.js'), exampleApiTest);
fs.writeFileSync(path.join(targetDir, 'tests/components/example.test.jsx'), exampleComponentTest);

console.log('✅ Example test files created\n');

// 7. Create test status route integration
console.log('🔗 Creating test status route integration...');
const routeIntegration = `
// Add this to your server routes file (e.g., server/routes.ts)

import { setupTestRoutes } from './test-framework/core/test-runner';

export function registerRoutes(app) {
  // Your existing routes...
  
  // Add test framework routes (development/staging only)
  if (process.env.NODE_ENV !== 'production') {
    setupTestRoutes(app);
  }
  
  // Rest of your routes...
}
`;

fs.writeFileSync(path.join(targetDir, 'test-integration-example.js'), routeIntegration);

// 8. Create environment configuration
console.log('⚙️  Creating test environment configuration...');
const envConfig = `
# Test Framework Environment Variables
NODE_ENV=development
VITEST_UI=true

# Optional: Test database configuration
TEST_DATABASE_URL=your-test-database-url-here

# Optional: Coverage thresholds
COVERAGE_THRESHOLD_STATEMENTS=80
COVERAGE_THRESHOLD_BRANCHES=80
COVERAGE_THRESHOLD_FUNCTIONS=80
COVERAGE_THRESHOLD_LINES=80
`;

const envTestPath = path.join(targetDir, '.env.test.example');
if (!fs.existsSync(envTestPath)) {
  fs.writeFileSync(envTestPath, envConfig);
  console.log('✅ Test environment template created (.env.test.example)\n');
}

// 9. Final instructions
console.log('🎉 Universal Test Framework Setup Complete!\n');
console.log('📋 Next Steps:');
console.log('1. Run your first test: npm test');
console.log('2. View test UI: npm run test:ui');
console.log('3. Generate coverage report: npm run test:coverage');
console.log('4. Add test status routes to your server (see test-integration-example.js)');
console.log('');
console.log('📚 Available Commands:');
console.log('- npm test - Run tests in watch mode');
console.log('- npm run test:run - Run tests once');
console.log('- npm run test:ui - Open interactive test UI');
console.log('- npm run test:coverage - Generate coverage report');
console.log('');
console.log('🔗 Test Status Dashboard:');
console.log('- Access at /test-status when server is running');
console.log('- View real-time test results and coverage');
console.log('- Monitor test performance and history');
console.log('');
console.log('📂 Directory Structure:');
console.log('- tests/api/ - API endpoint tests');
console.log('- tests/components/ - React component tests');
console.log('- tests/integration/ - Full workflow tests');
console.log('- test-framework/ - Framework core files');
console.log('');
console.log('📖 Documentation: See test-framework/README.md for detailed usage');