#!/usr/bin/env node

/**
 * Automated Replit Setup Script for Universal Test Framework (ES Module Version)
 * Run with: node replit-setup.mjs
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const coreDirs = ['core', 'components', 'utils', 'patterns'];
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

console.log('🎉 Universal Test Framework Setup Complete!\n');
console.log('📋 Next Steps:');
console.log('1. Run your first test: npm test');
console.log('2. View test UI: npm run test:ui');
console.log('3. Generate coverage report: npm run test:coverage');