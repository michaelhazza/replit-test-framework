# Test Framework Deployment Strategies

## Overview

Here are multiple approaches to deploy and maintain the test framework across your Replit repositories:

## Strategy 1: Git Submodules (Recommended)

### Setup
```bash
# In your target repository
git submodule add https://github.com/YOUR_USERNAME/universal-test-framework.git test-framework
git submodule init && git submodule update
```

### Updates
```bash
# Single command to update framework
npm run test:update
# Or manually: git submodule update --remote test-framework
```

### Benefits
- Version control integration
- Automatic updates across all repos
- Maintains framework history
- Works with any Git hosting

## Strategy 2: NPM Package

### Setup
```bash
# Publish once
npm publish universal-test-framework

# Install in each project
npm install universal-test-framework
```

### Updates
```bash
# Update in all projects
npm update universal-test-framework
```

### Benefits
- Standard Node.js workflow
- Semantic versioning
- Dependency management
- Private registry support

## Strategy 3: Direct Repository Sync

### Setup
```bash
# Clone framework separately
git clone https://github.com/YOUR_USERNAME/universal-test-framework.git
```

### Updates
```bash
# Pull latest changes
cd universal-test-framework && git pull
# Copy to target projects as needed
```

### Benefits
- Simple approach
- Full control over updates
- No external dependencies

## Recommended Workflow

### Initial Setup
1. Create GitHub repository for the test framework
2. Push the test-framework-export contents to it
3. Use git submodules to include in each project

### Daily Usage
```bash
# In any project using the framework
npm run test:generate  # Generate tests for your app
npm run test           # Run all tests
npm run test:coverage  # Check coverage
```

### Framework Updates
```bash
# Update framework across all projects
npm run test:update
npm run test:generate  # Regenerate with new patterns
```

### Version Management
- Use semantic versioning (1.0.0, 1.1.0, 2.0.0)
- Tag releases in the framework repository
- Pin specific versions in production projects

## Multi-Environment Support

### Development
```bash
git submodule update --remote test-framework
```

### Staging
```bash
git submodule update --remote --depth 1
```

### Production
```bash
# Pin to specific version
git submodule update --init --recursive
```

## Automation Scripts

The framework includes scripts for:
- Automatic setup in new repositories
- Framework updates across projects
- Test generation and validation
- Integration with CI/CD pipelines

This approach ensures you maintain consistent, up-to-date test coverage across all your applications while minimizing maintenance overhead.