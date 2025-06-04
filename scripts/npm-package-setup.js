#!/usr/bin/env node
/**
 * NPM Package Setup for Test Framework
 * Alternative to git submodules - publish as NPM package
 */

const fs = require('fs');
const path = require('path');

// Generate package.json for NPM publication
const packageJson = {
  "name": "universal-test-framework",
  "version": "1.0.0",
  "description": "Production-ready test framework for React/TypeScript applications",
  "main": "index.js",
  "types": "index.d.ts",
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  },
  "keywords": [
    "testing",
    "react",
    "typescript",
    "vitest",
    "test-framework",
    "replit"
  ],
  "author": "Your Name",
  "license": "MIT",
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@tanstack/react-query": "^5.0.0",
    "wouter": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0"
  },
  "files": [
    "dist/",
    "config/",
    "templates/",
    "patterns/",
    "utils/",
    "scripts/",
    "components/",
    "README.md"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/universal-test-framework.git"
  }
};

// Create index.js for NPM exports
const indexJs = `
// Universal Test Framework - Main Exports
export * from './config/app-config.template';
export * from './templates/page-test-generator';
export * from './patterns/api-test-generator';
export * from './utils/test-generator';
export * from './core/base-setup';

// Re-export test status page component
export { default as TestStatusPage } from './components/test-status-page';
`;

// Create TypeScript declaration file
const indexDts = `
// Universal Test Framework - Type Definitions
export * from './config/app-config.template';
export * from './templates/page-test-generator';
export * from './patterns/api-test-generator';
export * from './utils/test-generator';
export * from './core/base-setup';

export { default as TestStatusPage } from './components/test-status-page';
`;

// Installation script for consumer projects
const installScript = `#!/usr/bin/env node
/**
 * Post-install script for Universal Test Framework
 * Automatically sets up test configuration in consumer projects
 */

const fs = require('fs');
const path = require('path');

console.log('Setting up Universal Test Framework...');

// Create test configuration if it doesn't exist
const configPath = path.join(process.cwd(), 'test-config.ts');
if (!fs.existsSync(configPath)) {
  const templateConfig = \`import { TestConfig } from 'universal-test-framework';

// Configure this for your application
export const testConfig: TestConfig = {
  appName: "Your App Name",
  domain: "your-domain",
  
  entities: ["users", "projects", "tasks"],
  
  roles: [
    { name: "user", permissions: ["read_own"] },
    { name: "admin", permissions: ["read_all", "write_all"] }
  ],
  
  pages: [
    {
      name: "Home",
      path: "/",
      component: "HomePage",
      viewModes: ["user"]
    }
  ],
  
  apiEndpoints: [
    {
      path: "/api/users",
      methods: ["GET", "POST"],
      requiresAuth: true
    }
  ],
  
  dbTables: [
    {
      name: "users",
      requiredFields: ["id", "email"],
      relationships: []
    }
  ]
};
\`;

  fs.writeFileSync(configPath, templateConfig);
  console.log('✅ Created test-config.ts');
}

// Update package.json scripts
const pkgPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.scripts = pkg.scripts || {};
  
  if (!pkg.scripts['test:generate']) {
    pkg.scripts['test:generate'] = 'node -e "const { TestGenerator } = require(\\'universal-test-framework\\'); const { testConfig } = require(\\'./test-config\\'); const generator = new TestGenerator(testConfig); const tests = generator.generateAllTests(); Object.entries(tests).forEach(([file, content]) => { const fs = require(\\'fs\\'); const path = require(\\'path\\'); const dir = path.dirname(file); if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(file, content); });"';
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log('✅ Added test:generate script to package.json');
  }
}

console.log('\\n🎉 Universal Test Framework setup complete!');
console.log('\\nNext steps:');
console.log('1. Edit test-config.ts with your app details');
console.log('2. Run: npm run test:generate');
console.log('3. Run: npm test');
`;

// Write all files
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
fs.writeFileSync('index.js', indexJs);
fs.writeFileSync('index.d.ts', indexDts);
fs.writeFileSync('scripts/postinstall.js', installScript);

console.log('✅ NPM package setup complete!');
console.log('');
console.log('To publish as NPM package:');
console.log('1. npm login');
console.log('2. npm publish');
console.log('');
console.log('Consumer projects can then install with:');
console.log('npm install universal-test-framework');