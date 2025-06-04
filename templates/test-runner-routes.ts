/**
 * Test Runner API Routes Template
 * Add these routes to your server/routes.ts file for complete test functionality
 */

import { TestRunner } from '../core/test-runner';
import { runTestSuite } from '../core/test-execution';
import { eq, desc } from 'drizzle-orm';
import type { Express } from 'express';

export function addTestRunnerRoutes(app: Express, db: any, testRunsTable: any, testCasesTable: any) {
  
  // Initialize test runner instance
  const testRunner = new TestRunner(db, testRunsTable, testCasesTable);

  // Get all test runs
  app.get('/api/test-status/runs', async (req, res) => {
    try {
      const runs = await db
        .select({
          id: testRunsTable.id,
          status: testRunsTable.status,
          totalTests: testRunsTable.totalTests,
          passedTests: testRunsTable.passedTests,
          failedTests: testRunsTable.failedTests,
          duration: testRunsTable.duration,
          startedAt: testRunsTable.startedAt,
          completedAt: testRunsTable.completedAt,
          errorSummary: testRunsTable.errorSummary,
        })
        .from(testRunsTable)
        .orderBy(desc(testRunsTable.id))
        .limit(10);

      // Get test cases for each run
      const runsWithCases = await Promise.all(
        runs.map(async (run) => {
          const cases = await db
            .select()
            .from(testCasesTable)
            .where(eq(testCasesTable.testRunId, run.id));
          
          return {
            ...run,
            testCases: cases
          };
        })
      );

      res.json(runsWithCases);
    } catch (error) {
      console.error('Error fetching test runs:', error);
      res.status(500).json({ error: 'Failed to fetch test runs' });
    }
  });

  // Get latest test run
  app.get('/api/test-status/latest', async (req, res) => {
    try {
      const latest = await testRunner.getLatestTestRun();
      res.json(latest || {});
    } catch (error) {
      console.error('Error fetching latest test run:', error);
      res.status(500).json({ error: 'Failed to fetch latest test run' });
    }
  });

  // Start a new test run
  app.post('/api/test-status/run', async (req, res) => {
    try {
      console.log('🚀 Starting new test run...');
      
      // Start test execution in background
      setTimeout(async () => {
        try {
          await runTestSuite(testRunner);
        } catch (error) {
          console.error('Test suite execution failed:', error);
        }
      }, 100);

      res.json({ 
        message: 'Test run started successfully',
        status: 'running' 
      });
    } catch (error) {
      console.error('Error starting test run:', error);
      res.status(500).json({ 
        error: 'Failed to start test run',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get test coverage report
  app.get('/api/test-status/coverage', async (req, res) => {
    try {
      // Calculate test coverage based on existing files
      const { execSync } = require('child_process');
      
      // Get all source files that could be tested
      const allFiles = execSync('find . -name "*.ts" -o -name "*.tsx" | grep -E "(server|client|shared)" | grep -v ".test." | grep -v node_modules', 
        { encoding: 'utf8' }).trim().split('\n').filter(f => f);
      
      // Get all test files
      const testFiles = execSync('find tests/ -name "*.test.ts" -o -name "*.test.tsx"', 
        { encoding: 'utf8' }).trim().split('\n').filter(f => f);
      
      const totalFiles = allFiles.length;
      const testedFiles = testFiles.length;
      const coveragePercentage = totalFiles > 0 ? Math.round((testedFiles / totalFiles) * 100) : 0;

      res.json({
        coveragePercentage,
        totalFiles,
        testedFiles,
        untested: totalFiles - testedFiles
      });
    } catch (error) {
      console.error('Error calculating coverage:', error);
      res.json({
        coveragePercentage: 0,
        totalFiles: 0,
        testedFiles: 0,
        untested: 0
      });
    }
  });

  // Get deploy readiness status
  app.get('/api/test-status/deploy-ready', async (req, res) => {
    try {
      const latest = await testRunner.getLatestTestRun();
      
      const ready = latest && 
                   (latest.status === 'passed' || latest.status === 'completed') && 
                   latest.failedTests === 0;
      
      res.json({
        ready,
        reason: ready 
          ? 'All tests passing - ready for deployment' 
          : latest?.status === 'running' 
            ? 'Tests currently running' 
            : 'Tests must pass before deployment'
      });
    } catch (error) {
      console.error('Error checking deploy status:', error);
      res.json({
        ready: false,
        reason: 'Unable to determine test status'
      });
    }
  });

  console.log('✅ Test runner routes added');
}