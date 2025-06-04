import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq, desc } from 'drizzle-orm';

export interface TestResult {
  suite: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  stackTrace?: string;
}

export interface TestRunResult {
  status: 'passed' | 'failed';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  tests: TestResult[];
  errorSummary?: string;
}

export class TestRunner {
  private testRunId: number | null = null;
  private startTime: number = 0;
  private db: any;
  private testRuns: any;
  private testCases: any;

  constructor(database: any, testRunsTable: any, testCasesTable: any) {
    this.db = database;
    this.testRuns = testRunsTable;
    this.testCases = testCasesTable;
  }

  async startTestRun(commitHash?: string, branch: string = 'main', totalFiles: number = 0): Promise<number> {
    this.startTime = Date.now();
    
    const [testRun] = await this.db
      .insert(this.testRuns)
      .values({
        commitHash,
        branch,
        status: 'running',
        startedAt: new Date(),
        totalFiles,
        completedFiles: 0,
        currentFile: null,
        currentPhase: 'backend',
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
      })
      .returning();

    this.testRunId = testRun.id;
    console.log(`🧪 TEST RUN STARTED: ID ${this.testRunId}`);
    return testRun.id;
  }

  async updateFileProgress(currentFile: string, completedFiles: number, currentPhase: 'backend' | 'frontend', totalFiles: number = 45): Promise<void> {
    if (!this.testRunId) {
      console.warn('⚠️ No current test run ID available for progress update');
      return;
    }

    const retryOperation = async (attempts: number = 3): Promise<void> => {
      for (let i = 0; i < attempts; i++) {
        try {
          await this.db
            .update(this.testRuns)
            .set({
              currentFile,
              completedFiles,
              currentPhase,
              totalFiles,
            })
            .where(eq(this.testRuns.id, this.testRunId!));
          
          console.log(`📊 Progress: ${completedFiles}/${totalFiles} files (${currentPhase}): ${currentFile}`);
          return;
        } catch (error: any) {
          if (i === attempts - 1) {
            console.warn(`⚠️ Failed to update file progress after ${attempts} attempts: ${error.message}`);
            console.log(`📊 Progress (local): ${completedFiles}/${totalFiles} files (${currentPhase}): ${currentFile}`);
          } else {
            console.warn(`⚠️ Database retry ${i + 1}/${attempts} for file progress update`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      }
    };

    await retryOperation();
  }

  async updateTestCounts(passedTests: number, failedTests: number, totalTests: number): Promise<void> {
    if (!this.testRunId) {
      console.warn('⚠️ No current test run ID available for test count update');
      return;
    }

    const retryOperation = async (attempts: number = 3): Promise<void> => {
      for (let i = 0; i < attempts; i++) {
        try {
          await this.db
            .update(this.testRuns)
            .set({
              totalTests,
              passedTests,
              failedTests,
            })
            .where(eq(this.testRuns.id, this.testRunId!));
          
          console.log(`📊 Test Counts: ${passedTests}/${totalTests} passed, ${failedTests} failed`);
          return;
        } catch (error: any) {
          if (i === attempts - 1) {
            console.warn(`⚠️ Failed to update test counts after ${attempts} attempts: ${error.message}`);
          } else {
            console.warn(`⚠️ Database retry ${i + 1}/${attempts} for test count update`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      }
    };

    await retryOperation();
  }

  async completeTestRun(result: TestRunResult): Promise<void> {
    if (!this.testRunId) {
      console.warn('⚠️ No current test run ID available for completion');
      return;
    }

    const duration = Date.now() - this.startTime;
    
    try {
      await this.db
        .update(this.testRuns)
        .set({
          status: result.status,
          totalTests: result.totalTests,
          passedTests: result.passedTests,
          failedTests: result.failedTests,
          duration,
          completedAt: new Date(),
          errorSummary: result.errorSummary,
        })
        .where(eq(this.testRuns.id, this.testRunId));

      // Store test case details
      if (result.tests && result.tests.length > 0) {
        await this.db.insert(this.testCases).values(
          result.tests.map(test => ({
            testRunId: this.testRunId!,
            testSuite: test.suite,
            testName: test.name,
            status: test.status,
            duration: test.duration,
            errorMessage: test.error,
            stackTrace: test.stackTrace,
          }))
        );
      }

      console.log(`✅ TEST RUN COMPLETED: ${result.status} (${result.passedTests}/${result.totalTests} passed)`);
    } catch (error) {
      console.error('❌ Failed to complete test run:', error);
    }
  }

  async getLatestTestRun(): Promise<any> {
    const [latest] = await this.db
      .select({
        id: this.testRuns.id,
        commitHash: this.testRuns.commitHash,
        branch: this.testRuns.branch,
        status: this.testRuns.status,
        totalTests: this.testRuns.totalTests,
        passedTests: this.testRuns.passedTests,
        failedTests: this.testRuns.failedTests,
        duration: this.testRuns.duration,
        startedAt: this.testRuns.startedAt,
        completedAt: this.testRuns.completedAt,
        errorSummary: this.testRuns.errorSummary,
        totalFiles: this.testRuns.totalFiles,
        completedFiles: this.testRuns.completedFiles,
        currentFile: this.testRuns.currentFile,
        currentPhase: this.testRuns.currentPhase,
      })
      .from(this.testRuns)
      .orderBy(desc(this.testRuns.id))
      .limit(1);

    return latest;
  }

  async updateTestRunProgress(testRunId: number, progress: { totalTests: number; passedTests: number; failedTests: number; status: string }): Promise<void> {
    await this.db
      .update(this.testRuns)
      .set({
        totalTests: progress.totalTests,
        passedTests: progress.passedTests,
        failedTests: progress.failedTests,
        status: progress.status,
      })
      .where(eq(this.testRuns.id, testRunId));
  }

  async updateRunningDuration(testRunId: number): Promise<void> {
    const [run] = await this.db
      .select({ startedAt: this.testRuns.startedAt })
      .from(this.testRuns)
      .where(eq(this.testRuns.id, testRunId));

    if (run) {
      const duration = Date.now() - new Date(run.startedAt).getTime();
      await this.db
        .update(this.testRuns)
        .set({ duration })
        .where(eq(this.testRuns.id, testRunId));
    }
  }
}