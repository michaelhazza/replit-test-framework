# Universal Test Framework Package

A comprehensive, reusable test framework designed for modern full-stack TypeScript applications. This framework provides standardized testing patterns, utilities, and configurations that can be easily integrated into any project.

## Features

- **Complete Test Runner**: Full test execution engine with progress tracking and database storage
- **Live Test Dashboard**: Real-time test status page with coverage visualization 
- **Vitest Configuration**: Optimized setup for TypeScript, React, and Node.js testing
- **Test Utilities**: Reusable helpers for common testing scenarios
- **Environment Setup**: Consistent test environment configuration
- **Coverage Analysis**: Built-in coverage reporting and analysis tools
- **Progressive Test Runner**: Advanced test execution with intelligent batching
- **API Routes**: Complete backend endpoints for test management
- **Generic Test Patterns**: Reusable test templates for common scenarios

## Installation

### Method 1: Direct Copy (Replit-to-Replit)
1. Copy the entire `test-framework-export` folder to your project root
2. Run `npm install` to install dependencies
3. Update your `package.json` scripts
4. Configure your test environment

### Method 2: Git Submodule (Professional)
```bash
# Add as submodule
git submodule add <repository-url> test-framework

# Install dependencies
cd test-framework && npm install

# Link to your project
ln -s ./test-framework/vitest.config.ts ./vitest.config.ts
```

## Quick Start

1. **Configure Vitest**:
   ```typescript
   // Import the base configuration
   import { defineConfig } from './test-framework/vitest.config'
   
   export default defineConfig({
     // Your custom overrides
   })
   ```

2. **Add Test Scripts**:
   ```json
   {
     "scripts": {
       "test": "vitest",
       "test:run": "vitest run",
       "test:coverage": "vitest run --coverage",
       "test:progressive": "node test-framework/progressive-runner.js"
     }
   }
   ```

3. **Use Test Utilities**:
   ```typescript
   import { createTestEnvironment, mockApiRequest } from './test-framework/utils'
   
   describe('Your Component', () => {
     const { cleanup } = createTestEnvironment()
     afterEach(cleanup)
     
     // Your tests here
   })
   ```

## Architecture

The framework is designed with modularity and reusability in mind:

- `vitest.config.ts` - Base Vitest configuration
- `setup.ts` - Global test setup and teardown
- `utils/` - Reusable testing utilities
- `progressive-runner.ts` - Advanced test execution
- `coverage-analyzer.ts` - Coverage analysis tools

## Customization

The framework is designed to be easily customized for different project types:

1. **Web Applications**: Full frontend and backend testing
2. **API Services**: Backend-focused testing with database mocking
3. **Component Libraries**: UI component testing with visual regression
4. **Microservices**: Service integration and contract testing

## Dependencies

Core dependencies included:
- `vitest` - Fast unit test framework
- `@testing-library/react` - React component testing
- `@testing-library/jest-dom` - Extended DOM matchers
- `jsdom` - DOM environment for testing

## Best Practices

- Use descriptive test names
- Group related tests with `describe` blocks
- Clean up after each test
- Mock external dependencies
- Test error conditions
- Aim for high coverage on critical paths

## Support

This framework is designed to be self-contained and documentation-driven. All utilities include TypeScript types and JSDoc comments for IDE support.