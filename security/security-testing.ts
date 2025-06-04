interface SecurityTest {
  name: string;
  description: string;
  test: () => Promise<SecurityTestResult>;
}

interface SecurityTestResult {
  passed: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
}

export class SecurityTester {
  private baseUrl: string;
  
  constructor(baseUrl: string = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
  }

  async runAllSecurityTests(): Promise<Record<string, SecurityTestResult>> {
    const tests: SecurityTest[] = [
      {
        name: 'sql_injection_test',
        description: 'Test for SQL injection vulnerabilities',
        test: () => this.testSqlInjection()
      },
      {
        name: 'xss_test',
        description: 'Test for Cross-Site Scripting vulnerabilities',
        test: () => this.testXSS()
      },
      {
        name: 'csrf_test',
        description: 'Test for Cross-Site Request Forgery protection',
        test: () => this.testCSRF()
      },
      {
        name: 'brute_force_test',
        description: 'Test rate limiting against brute force attacks',
        test: () => this.testBruteForce()
      },
      {
        name: 'session_security_test',
        description: 'Test session security measures',
        test: () => this.testSessionSecurity()
      },
      {
        name: 'password_policy_test',
        description: 'Test password strength enforcement',
        test: () => this.testPasswordPolicy()
      },
      {
        name: 'authorization_test',
        description: 'Test authorization controls',
        test: () => this.testAuthorization()
      },
      {
        name: 'data_exposure_test',
        description: 'Test for sensitive data exposure',
        test: () => this.testDataExposure()
      }
    ];

    const results: Record<string, SecurityTestResult> = {};
    
    for (const test of tests) {
      console.log(`Running security test: ${test.name}`);
      try {
        results[test.name] = await test.test();
      } catch (error) {
        results[test.name] = {
          passed: false,
          severity: 'high',
          message: `Test failed with error: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
    
    return results;
  }

  private async testSqlInjection(): Promise<SecurityTestResult> {
    const maliciousPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "' UNION SELECT * FROM users --",
      "admin'--",
      "' OR 1=1 #"
    ];
    
    for (const payload of maliciousPayloads) {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: payload,
          password: 'password'
        })
      });
      
      const responseText = await response.text();
      
      // Check for database error messages that might indicate SQL injection vulnerability
      if (responseText.includes('SQL') || 
          responseText.includes('syntax error') ||
          responseText.includes('database error') ||
          response.status === 500) {
        return {
          passed: false,
          severity: 'critical',
          message: 'Potential SQL injection vulnerability detected',
          details: { payload, response: responseText }
        };
      }
    }
    
    return {
      passed: true,
      severity: 'low',
      message: 'No SQL injection vulnerabilities detected'
    };
  }

  private async testXSS(): Promise<SecurityTestResult> {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '"><script>alert("XSS")</script>',
      "javascript:alert('XSS')",
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>'
    ];
    
    for (const payload of xssPayloads) {
      // Test user registration with XSS payload
      const response = await fetch(`${this.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          firstName: payload,
          lastName: 'Test',
          password: 'password123'
        })
      });
      
      if (response.ok) {
        // Check if the payload is reflected without proper encoding
        const userData = await response.json();
        if (userData.firstName && userData.firstName.includes('<script>')) {
          return {
            passed: false,
            severity: 'high',
            message: 'XSS vulnerability detected - user input not properly sanitized',
            details: { payload, response: userData }
          };
        }
      }
    }
    
    return {
      passed: true,
      severity: 'low',
      message: 'No XSS vulnerabilities detected'
    };
  }

  private async testCSRF(): Promise<SecurityTestResult> {
    // Test if CSRF protection is implemented
    const response = await fetch(`${this.baseUrl}/api/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: 'old',
        newPassword: 'new'
      })
    });
    
    // Should require CSRF token or proper authentication
    if (response.status === 200) {
      return {
        passed: false,
        severity: 'medium',
        message: 'Potential CSRF vulnerability - sensitive operation allowed without proper protection'
      };
    }
    
    return {
      passed: true,
      severity: 'low',
      message: 'CSRF protection appears to be in place'
    };
  }

  private async testBruteForce(): Promise<SecurityTestResult> {
    const startTime = Date.now();
    let attemptCount = 0;
    let rateLimitDetected = false;
    
    // Attempt multiple failed logins rapidly
    while (attemptCount < 10 && !rateLimitDetected) {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      });
      
      if (response.status === 429) {
        rateLimitDetected = true;
        break;
      }
      
      attemptCount++;
      
      // Small delay to simulate realistic attack
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!rateLimitDetected) {
      return {
        passed: false,
        severity: 'high',
        message: 'Rate limiting not detected - vulnerable to brute force attacks',
        details: { attempts: attemptCount }
      };
    }
    
    return {
      passed: true,
      severity: 'low',
      message: `Rate limiting detected after ${attemptCount} attempts`,
      details: { attempts: attemptCount }
    };
  }

  private async testSessionSecurity(): Promise<SecurityTestResult> {
    // Test session fixation
    const loginResponse = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const sessionCookies = loginResponse.headers.get('set-cookie');
    
    if (!sessionCookies) {
      return {
        passed: false,
        severity: 'medium',
        message: 'Session cookies not properly set'
      };
    }
    
    // Check for secure session attributes
    const hasSecureFlag = sessionCookies.includes('Secure');
    const hasHttpOnlyFlag = sessionCookies.includes('HttpOnly');
    const hasSameSiteFlag = sessionCookies.includes('SameSite');
    
    if (!hasSecureFlag || !hasHttpOnlyFlag || !hasSameSiteFlag) {
      return {
        passed: false,
        severity: 'medium',
        message: 'Session cookies missing security attributes',
        details: {
          secure: hasSecureFlag,
          httpOnly: hasHttpOnlyFlag,
          sameSite: hasSameSiteFlag
        }
      };
    }
    
    return {
      passed: true,
      severity: 'low',
      message: 'Session security appears properly configured'
    };
  }

  private async testPasswordPolicy(): Promise<SecurityTestResult> {
    const weakPasswords = [
      'password',
      '123456',
      'abc123',
      'test',
      'admin'
    ];
    
    for (const weakPassword of weakPasswords) {
      const response = await fetch(`${this.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test${Date.now()}@example.com`,
          firstName: 'Test',
          lastName: 'User',
          password: weakPassword
        })
      });
      
      if (response.ok) {
        return {
          passed: false,
          severity: 'medium',
          message: 'Weak password policy - allows insecure passwords',
          details: { weakPassword }
        };
      }
    }
    
    return {
      passed: true,
      severity: 'low',
      message: 'Password policy appears to enforce strong passwords'
    };
  }

  private async testAuthorization(): Promise<SecurityTestResult> {
    // Test access to admin endpoints without proper authorization
    const adminEndpoints = [
      '/api/admin/users',
      '/api/admin/audit-logs',
      '/api/admin/users/bulk-operations'
    ];
    
    for (const endpoint of adminEndpoints) {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET'
      });
      
      if (response.status === 200) {
        return {
          passed: false,
          severity: 'critical',
          message: 'Authorization bypass detected - admin endpoints accessible without authentication',
          details: { endpoint }
        };
      }
    }
    
    return {
      passed: true,
      severity: 'low',
      message: 'Authorization controls appear to be working'
    };
  }

  private async testDataExposure(): Promise<SecurityTestResult> {
    // Test for sensitive data in responses
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
    });
    
    const responseText = await response.text();
    
    // Check for sensitive data exposure
    const sensitivePatterns = [
      /password/i,
      /database/i,
      /connection/i,
      /secret/i,
      /private_key/i,
      /api_key/i
    ];
    
    for (const pattern of sensitivePatterns) {
      if (pattern.test(responseText)) {
        return {
          passed: false,
          severity: 'medium',
          message: 'Potential sensitive data exposure in error responses',
          details: { pattern: pattern.source }
        };
      }
    }
    
    return {
      passed: true,
      severity: 'low',
      message: 'No obvious sensitive data exposure detected'
    };
  }

  generateSecurityReport(results: Record<string, SecurityTestResult>): string {
    let report = '\n=== Security Test Report ===\n\n';
    
    const criticalIssues = Object.entries(results).filter(([_, result]) => result.severity === 'critical' && !result.passed);
    const highIssues = Object.entries(results).filter(([_, result]) => result.severity === 'high' && !result.passed);
    const mediumIssues = Object.entries(results).filter(([_, result]) => result.severity === 'medium' && !result.passed);
    const lowIssues = Object.entries(results).filter(([_, result]) => result.severity === 'low' && !result.passed);
    
    report += `Critical Issues: ${criticalIssues.length}\n`;
    report += `High Issues: ${highIssues.length}\n`;
    report += `Medium Issues: ${mediumIssues.length}\n`;
    report += `Low Issues: ${lowIssues.length}\n\n`;
    
    if (criticalIssues.length > 0) {
      report += '🚨 CRITICAL ISSUES:\n';
      criticalIssues.forEach(([name, result]) => {
        report += `  - ${name}: ${result.message}\n`;
      });
      report += '\n';
    }
    
    if (highIssues.length > 0) {
      report += '⚠️ HIGH ISSUES:\n';
      highIssues.forEach(([name, result]) => {
        report += `  - ${name}: ${result.message}\n`;
      });
      report += '\n';
    }
    
    if (mediumIssues.length > 0) {
      report += '⚡ MEDIUM ISSUES:\n';
      mediumIssues.forEach(([name, result]) => {
        report += `  - ${name}: ${result.message}\n`;
      });
      report += '\n';
    }
    
    const passedTests = Object.entries(results).filter(([_, result]) => result.passed);
    if (passedTests.length > 0) {
      report += '✅ PASSED TESTS:\n';
      passedTests.forEach(([name, result]) => {
        report += `  - ${name}: ${result.message}\n`;
      });
    }
    
    return report;
  }
}