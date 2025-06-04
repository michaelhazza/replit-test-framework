/**
 * Application Test Configuration Template
 * Copy this file to your new project and customize for your domain
 */

export interface TestConfig {
  // Your application domain and name
  appName: string;
  domain: string;
  
  // Database entities (replace with your app's entities)
  entities: string[];
  
  // User roles in your system
  roles: {
    name: string;
    permissions: string[];
  }[];
  
  // Main pages/routes in your application
  pages: {
    name: string;
    path: string;
    component: string;
    viewModes: string[];
    requiredRole?: string;
    hasTabNavigation?: boolean;

  }[];
  
  // API endpoints to test
  apiEndpoints: {
    path: string;
    methods: string[];
    requiresAuth: boolean;
    allowedRoles?: string[];
  }[];
  

  
  // Database schema tables
  dbTables: {
    name: string;
    requiredFields: string[];
    relationships?: string[];
  }[];
}

// Example configuration for a project management app
export const exampleConfig: TestConfig = {
  appName: "Project Manager",
  domain: "project-management",
  
  entities: ["projects", "tasks", "teams", "users"],
  
  roles: [
    { name: "user", permissions: ["view_own_projects", "edit_own_tasks"] },
    { name: "manager", permissions: ["view_all_projects", "edit_team_projects", "assign_tasks"] },
    { name: "admin", permissions: ["full_access", "user_management", "system_config"] }
  ],
  
  pages: [
    {
      name: "Dashboard",
      path: "/dashboard",
      component: "DashboardPage",
      viewModes: ["user"],
      hasTabNavigation: false
    },
    {
      name: "Projects",
      path: "/projects",
      component: "ProjectsPage",
      viewModes: ["user", "manager-view"],
      hasTabNavigation: true
    },
    {
      name: "Admin",
      path: "/admin",
      component: "AdminPage",
      viewModes: ["admin-edit"],
      requiredRole: "admin",
      hasTabNavigation: true
    }
  ],
  
  apiEndpoints: [
    {
      path: "/api/projects",
      methods: ["GET", "POST"],
      requiresAuth: true,
      allowedRoles: ["user", "manager", "admin"]
    },
    {
      path: "/api/admin/users",
      methods: ["GET", "POST", "PUT", "DELETE"],
      requiresAuth: true,
      allowedRoles: ["admin"]
    },
    {
      path: "/api/tasks",
      methods: ["GET", "POST", "PUT", "DELETE"],
      requiresAuth: true
    }
  ],
  
  dbTables: [
    {
      name: "users",
      requiredFields: ["id", "email", "role", "isActive"],
      relationships: ["projects", "tasks"]
    },
    {
      name: "projects",
      requiredFields: ["id", "name", "userId", "status"],
      relationships: ["users", "tasks"]
    },
    {
      name: "tasks",
      requiredFields: ["id", "title", "projectId", "assignedUserId", "status"],
      relationships: ["projects", "users"]
    }
  ]
};

// Helper functions to adapt configuration
export const adaptConfigForDomain = (baseConfig: TestConfig, domainSpecific: Partial<TestConfig>): TestConfig => {
  return {
    ...baseConfig,
    ...domainSpecific,
    pages: domainSpecific.pages || baseConfig.pages,
    apiEndpoints: domainSpecific.apiEndpoints || baseConfig.apiEndpoints,
    roles: domainSpecific.roles || baseConfig.roles
  };
};