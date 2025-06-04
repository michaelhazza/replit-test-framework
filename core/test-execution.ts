import { execSync } from 'child_process';
import { TestRunner, TestResult, TestRunResult } from './test-runner';

// Batch database updates to reduce overhead
let pendingDbUpdate = false;

// Parse test output efficiently with batched database updates
function parseAndUpdateTestCounts(output: string, testRunner: TestRunner, testResults: TestResult[]): { passed: number; failed: number; total: number } {
  const lines = output.split('\n');
  let filePassed = 0;
  let fileFailed = 0;
  let fileTotal = 0;
  
  // Use regex for faster parsing
  const passedRegex = /^✓\s+(.+?)\s+(\d+)ms$/;
  const failedRegex = /^✗\s+(.+?)\s+(\d+)ms$/;
  const skippedRegex = /^↓\s+(.+)$/;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('✓')) {
      filePassed++;
      fileTotal++;
      const match = trimmed.match(passedRegex);
      if (match) {
        const parts = match[1].split(' > ');
        testResults.push({
          suite: parts[0] || 'unknown',
          name: parts.slice(1).join(' > ') || match[1],
          status: 'passed',
          duration: parseInt(match[2]) || 0
        });
      }
    }
    else if (trimmed.startsWith('✗')) {
      fileFailed++;
      fileTotal++;
      const match = trimmed.match(failedRegex);
      if (match) {
        const parts = match[1].split(' > ');
        testResults.push({
          suite: parts[0] || 'unknown',
          name: parts.slice(1).join(' > ') || match[1],
          status: 'failed',
          duration: parseInt(match[2]) || 0,
          error: 'Test failed - check logs for details'
        });
      }
    }
    else if (trimmed.startsWith('↓')) {
      fileTotal++;
      const match = trimmed.match(skippedRegex);
      if (match) {
        const parts = match[1].split(' > ');
        testResults.push({
          suite: parts[0] || 'unknown',
          name: parts.slice(1).join(' > ') || match[1],
          status: 'skipped',
          duration: 0
        });
      }
    }
  }
  
  return { passed: filePassed, failed: fileFailed, total: fileTotal };
}

/**
 * Run the complete test suite using vitest with progress reporting
 */
export async function runTestSuite(testRunner: TestRunner): Promise<void> {
  let durationUpdateInterval: NodeJS.Timeout | undefined;
  
  try {
    console.log('🧪 STARTING TEST SUITE');
    console.log('='.repeat(50));
    
    // Get all test files for comprehensive testing
    const allTestFiles = execSync('find tests/ \\( -name "*.test.ts" -o -name "*.test.tsx" \\)', { encoding: 'utf8' }).trim().split('\n').filter(f => f);
    const totalFiles = allTestFiles.length;
    console.log(`📁 Found ${totalFiles} test files`);
    
    const testRunId = await testRunner.startTestRun('HEAD', 'main', totalFiles);
    
    // Set up duration updates for running tests
    durationUpdateInterval = setInterval(async () => {
      try {
        await testRunner.updateRunningDuration(testRunId);
      } catch (error) {
        console.warn('Failed to update running duration:', error);
      }
    }, 5000);
    
    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;
    const allTestResults: TestResult[] = [];
    
    // Run tests by category for progressive reporting
    const testCategories = [
      { pattern: 'tests/integration/', phase: 'backend' as const, name: 'Integration Tests' },
      { pattern: 'tests/auth/', phase: 'backend' as const, name: 'Authentication Tests' },
      { pattern: 'tests/storage/', phase: 'backend' as const, name: 'Storage Tests' },
      { pattern: 'tests/api/', phase: 'backend' as const, name: 'API Tests' },
      { pattern: 'tests/components/', phase: 'frontend' as const, name: 'Component Tests' },
      { pattern: 'tests/pages/', phase: 'frontend' as const, name: 'Page Tests' },
      { pattern: 'tests/e2e/', phase: 'frontend' as const, name: 'End-to-End Tests' }
    ];
    
    let completedFiles = 0;
    
    for (const category of testCategories) {
      const categoryFiles = allTestFiles.filter(file => file.startsWith(category.pattern));
      if (categoryFiles.length === 0) {
        console.log(`⏭️ Skipping ${category.name} (no files found)`);
        continue;
      }
      
      console.log(`\n🔍 Running ${category.name}...`);
      await testRunner.updateFileProgress(`${category.name}`, completedFiles, category.phase, totalFiles);
      
      try {
        // Run tests for this category
        const vitestOutput = execSync(`npx vitest run ${category.pattern} --reporter=verbose`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        const categoryResults: TestResult[] = [];
        const categoryStats = parseAndUpdateTestCounts(vitestOutput, testRunner, categoryResults);
        
        totalPassed += categoryStats.passed;
        totalFailed += categoryStats.failed;
        totalTests += categoryStats.total;
        allTestResults.push(...categoryResults);
        
        completedFiles += categoryFiles.length;
        
        // Update progress after each category
        await testRunner.updateTestCounts(totalPassed, totalFailed, totalTests);
        await testRunner.updateFileProgress(`Completed ${category.name}`, completedFiles, category.phase, totalFiles);
        
        console.log(`✅ ${category.name}: ${categoryStats.passed}/${categoryStats.total} passed`);
        
      } catch (error: any) {
        console.error(`❌ ${category.name} failed:`, error.message);
        
        // Parse error output for failed tests
        const errorOutput = error.stdout || error.stderr || '';
        const categoryResults: TestResult[] = [];
        const categoryStats = parseAndUpdateTestCounts(errorOutput, testRunner, categoryResults);
        
        totalPassed += categoryStats.passed;
        totalFailed += categoryStats.failed;
        totalTests += categoryStats.total;
        allTestResults.push(...categoryResults);
        
        completedFiles += categoryFiles.length;
        await testRunner.updateTestCounts(totalPassed, totalFailed, totalTests);
        await testRunner.updateFileProgress(`Completed ${category.name} (with errors)`, completedFiles, category.phase, totalFiles);
      }
      
      // Small delay between categories for database stability
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Final test result
    const finalResult: TestRunResult = {
      status: totalFailed === 0 ? 'passed' : 'failed',
      totalTests,
      passedTests: totalPassed,
      failedTests: totalFailed,
      duration: 0, // Will be calculated by testRunner
      tests: allTestResults,
      errorSummary: totalFailed > 0 ? `${totalFailed} test(s) failed` : undefined
    };
    
    await testRunner.completeTestRun(finalResult);
    
    console.log('\n' + '='.repeat(50));
    console.log('🏁 TEST SUITE COMPLETED');
    console.log(`📊 Results: ${totalPassed}/${totalTests} passed, ${totalFailed} failed`);
    console.log('='.repeat(50));
    
  } catch (error: any) {
    console.error('❌ Test suite execution failed:', error.message);
    
    const errorResult: TestRunResult = {
      status: 'failed',
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      duration: 0,
      tests: [],
      errorSummary: `Test execution failed: ${error.message}`
    };
    
    await testRunner.completeTestRun(errorResult);
    throw error;
  } finally {
    if (durationUpdateInterval) {
      clearInterval(durationUpdateInterval);
    }
  }
}

export { TestResult, TestRunResult };