# Universal Test Framework - Replit Setup

## Quick Setup for Replit Projects

This test framework provides comprehensive automated testing for your Replit projects. Choose your preferred deployment method below.

## Method 1: Git Submodule (Recommended for Updates)

### Step A: Create GitHub Repository (One-time setup)

If you haven't already created a repository for this package:

1. **Create new GitHub repository:**
   - Go to GitHub and create repository named `replit-test-framework`
   - Make it public (or private if preferred)
   - Don't initialize with README

2. **Upload package to GitHub:**
   ```bash
   # In your current Replit project
   cd test-framework-export
   git init
   git add .
   git commit -m "Initial commit: Universal Test Framework"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/replit-test-framework.git
   git push -u origin main
   ```

### Step B: Add to Any Replit Project

1. **Add as submodule to your target project:**
   ```bash
   git submodule add https://github.com/YOUR_USERNAME/replit-test-framework.git test-framework
   ```

2. **Run automated setup:**
   ```bash
   # For CommonJS projects (most projects)
   cd test-framework && node replit-setup.js
   
   # For ES module projects (if you get "require is not defined" error)
   cd test-framework && node replit-setup.mjs
   ```

3. **Done!** Testing framework is installed and configured.

### Step C: Update Framework (Future updates)

When you improve the test framework:
```bash
# In any project using the framework
git submodule update --remote test-framework
cd test-framework && node replit-setup.js
```

## Method 2: Direct Deployment

### Option 1: Automated Setup

1. **Copy the setup script to your project:**
   ```bash
   curl -o setup-tests.js https://raw.githubusercontent.com/YOUR_USERNAME/replit-test-framework/main/replit-setup.js
   ```

2. **Run the setup script:**
   ```bash
   node setup-tests.js
   ```

3. **Done!** Your testing framework is installed and ready.

### Option 2: Manual Setup (3 minutes)

#### Step 1: Add the Test Framework
1. Create a new folder called `test-framework` in your project root
2. Copy all files from this `test-framework-export` folder into your `test-framework` folder

#### Step 2: Install Dependencies
Run this command in your Replit shell:
```bash
npm install vitest @testing-library/react @testing-library/jest-dom jsdom
```

#### Step 3: Add Test Scripts
Add these scripts to your `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

#### Step 4: Start Testing
```bash
npm test
```

### What You Get

- **Automated Test Discovery** - Finds and runs all tests automatically
- **Real-time Test Monitoring** - Live dashboard showing test status
- **Coverage Reporting** - Know exactly what code is tested
- **Component Testing** - Built-in React component test utilities
- **API Testing** - Automated endpoint verification
- **Integration Testing** - Full workflow testing capabilities

### Usage Examples

Create tests easily:
```javascript
// tests/api.test.js
import { describe, it, expect } from 'vitest';

describe('API Tests', () => {
  it('should handle user login', async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password' })
    });
    expect(response.ok).toBe(true);
  });
});
```

### Live Test Dashboard

Access your test dashboard at `/test-status` to see:
- Test execution results in real-time
- Code coverage metrics
- Performance benchmarks
- Test history and trends

That's it! Your Replit project now has enterprise-grade testing capabilities.

## Daily Usage

In any project using the framework:
```bash
npm run test:generate  # Create tests for your app
npm run test           # Run all tests  
npm run test:update    # Get latest framework version
```

The framework adapts to any application type - e-commerce, social media, productivity tools, etc.