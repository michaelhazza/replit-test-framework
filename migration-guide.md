# Test Framework Migration Guide

This package contains a complete, production-ready test framework extracted from a comprehensive financial planning application. It provides robust testing patterns that can be adapted to any Replit project.

## Quick Start

### 1. Copy Core Files to Your New Repository

```bash
# Copy these essential files to your new repo
cp test-framework-export/core/base-setup.ts your-repo/tests/setup.ts
cp test-framework-export/config/app-config.template.ts your-repo/test.config.ts
cp test-framework-export/utils/test-generator.ts your-repo/scripts/
```

### 2. Install Dependencies

Add these to your `package.json`:

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/react": "^14.1.2", 
    "@testing-library/user-event": "^14.5.1",
    "@vitest/coverage-v8": "^1.0.4",
    "@vitest/ui": "^1.0.4",
    "jsdom": "^23.0.1",
    "vitest": "^1.0.4"
  },
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "generate-tests": "tsx scripts/test-generator.ts"
  }
}
```

### 3. Configure for Your Application

Edit `test.config.ts` with your app's specifics:

```typescript
export const myAppConfig: TestConfig = {
  appName: "Your App Name",
  domain: "your-domain",
  
  // Replace with your entities
  entities: ["projects", "tasks", "users"],
  
  // Define your user roles
  roles: [
    { name: "user", permissions: ["view_own"] },
    { name: "admin", permissions: ["full_access"] }
  ],
  
  // Map your pages
  pages: [
    {
      name: "Dashboard",
      path: "/dashboard", 
      component: "DashboardPage",
      viewModes: ["user"]
    }
  ],
  
  // List your API endpoints
  apiEndpoints: [
    {
      path: "/api/projects",
      methods: ["GET", "POST"],
      requiresAuth: true
    }
  ]
};
```

### 4. Generate Your Test Suite

```bash
npm run generate-tests
```

This creates comprehensive tests covering:
- Page component rendering
- API endpoint functionality  
- Role-based access control
- Database operations
- Error handling scenarios

## Framework Features

### Comprehensive Coverage
- **Page Tests**: Validates component rendering, view modes, navigation
- **API Tests**: Tests all HTTP methods, authentication, error cases
- **Integration Tests**: Database operations, user workflows, mimic functionality
- **Role Access Tests**: Validates permissions across all endpoints

### Domain Agnostic
- Configuration-driven test generation
- Reusable test patterns
- No hardcoded business logic
- Adaptable to any application schema

### Production Ready
- Error boundary testing
- Network failure simulation
- Data validation testing
- Security boundary validation

## Customization Examples

### Adding Custom Page Tests
```typescript
// Add to your config
pages: [
  {
    name: "ProductCatalog",
    component: "CatalogPage", 
    viewModes: ["customer", "admin-edit"],
    hasTabNavigation: true,
    mimicFunctionality: true // If you have impersonation features
  }
]
```

### Adding API Endpoint Tests
```typescript
// Add to your config
apiEndpoints: [
  {
    path: "/api/orders",
    methods: ["GET", "POST", "PUT"],
    requiresAuth: true,
    allowedRoles: ["customer", "admin"]
  }
]
```

### Database Schema Testing
```typescript
// Add to your config
dbTables: [
  {
    name: "orders",
    requiredFields: ["id", "customerId", "total", "status"],
    relationships: ["customers", "orderItems"]
  }
]
```

## Advanced Features

### Mimic/Impersonation Testing
If your app has user impersonation features:

```typescript
mimicConfig: {
  enabled: true,
  adminViewMode: "admin-edit",
  userListEndpoint: "/api/admin/users",
  sessionEndpoint: "/api/session/:sessionId/mimic"
}
```

### Custom Test Patterns
Extend the framework with your own patterns:

```typescript
// Create custom test generators
export const generateEcommerceTests = (config) => {
  // Your domain-specific test logic
};
```

## File Structure After Migration

```
your-repo/
├── tests/
│   ├── setup.ts                    # Base test configuration
│   ├── pages/                      # Generated page tests
│   ├── api/                        # Generated API tests  
│   ├── integration/                # Integration tests
│   └── utils/                      # Test utilities
├── scripts/
│   └── test-generator.ts           # Test generation script
├── test.config.ts                  # Your app configuration
├── vitest.config.ts                # Vitest configuration
└── package.json                    # Updated with test dependencies
```

## Best Practices

1. **Start Small**: Begin with basic page and API tests, then expand
2. **Customize Gradually**: Adapt the generated tests to your specific needs
3. **Maintain Coverage**: Aim for the same comprehensive coverage as the source
4. **Use Real Data**: Connect to your actual database schema and API endpoints
5. **Test Boundaries**: Focus on authentication, authorization, and error scenarios

## Support

This framework is based on a production system with 85+ test files providing comprehensive coverage. The patterns have been proven in a real-world application with complex user roles, multi-step workflows, and advanced features like session impersonation.

For questions about adapting specific patterns to your use case, refer to the generated test examples or the original source patterns in the template files.