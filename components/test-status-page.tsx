/**
 * Complete Test Status Page Component
 * Production-ready test runner interface with real-time monitoring
 * Includes the complete /test-status page functionality
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle, XCircle, Clock, ChevronDown, Play, AlertTriangle, Target, Filter } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface TestCase {
  id: number;
  testSuite: string;
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  errorMessage?: string;
  stackTrace?: string;
}

interface TestRun {
  id: number;
  status: 'running' | 'passed' | 'failed';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  startedAt: string;
  completedAt?: string;
  errorSummary?: string;
  testCases: TestCase[];
  totalFiles?: number;
  completedFiles?: number;
  currentFile?: string;
  currentPhase?: string;
}

interface DeployStatus {
  ready: boolean;
  reason?: string;
}

export default function TestStatus() {
  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.round(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const formatTestDuration = (milliseconds: number): string => {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    }
    const seconds = Math.round(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const queryClient = useQueryClient();
  const [expandedRuns, setExpandedRuns] = useState<Set<number>>(new Set());
  const [isRunning, setIsRunning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  
  const [filters, setFilters] = useState({
    skipped: true,
    failed: true
  });
  const [currentProgress, setCurrentProgress] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [previousRunStatus, setPreviousRunStatus] = useState<string | null>(null);

  // API Queries for test status data
  const { data: testRuns, isLoading: runsLoading, refetch: refetchRuns } = useQuery({
    queryKey: ['/api/test-status/runs'],
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: deployStatus, isLoading: deployLoading, refetch: refetchDeploy } = useQuery({
    queryKey: ['/api/test-status/deploy-ready'],
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: latestRun, refetch: refetchLatest } = useQuery({
    queryKey: ['/api/test-status/latest'],
    refetchInterval: isRunning ? 2000 : false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: coverageReport, isLoading: coverageLoading, refetch: refetchCoverage } = useQuery({
    queryKey: ['/api/test-status/coverage'],
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Real-time test monitoring with state synchronization
  useEffect(() => {
    if (latestRun && (latestRun as any).status) {
      const currentStatus = (latestRun as any).status;
      
      if (currentStatus === 'running' && !isRunning && !isStarting) {
        setIsRunning(true);
        setIsStarting(false);
        setCurrentProgress('Processing test files...');
        setProgressPercent(0);
      } else if ((currentStatus === 'passed' || currentStatus === 'failed' || currentStatus === 'completed') && (isRunning || isStarting)) {
        setIsRunning(false);
        setIsStarting(false);
        setCurrentProgress(currentStatus === 'passed' ? 'All tests passed!' : 'Tests completed');
        setProgressPercent(100);
        
        // Refresh all data after completion
        queryClient.invalidateQueries({ queryKey: ['/api/test-status/coverage'] });
        queryClient.invalidateQueries({ queryKey: ['/api/test-status/deploy-ready'] });
        queryClient.invalidateQueries({ queryKey: ['/api/test-status/runs'] });
        
        setTimeout(() => {
          refetchRuns();
          refetchLatest();
          refetchCoverage();
          refetchDeploy();
        }, 500);
      }
      
      // Update progress in real-time
      if (currentStatus === 'running' && (latestRun as any).completedFiles !== undefined) {
        const completed = (latestRun as any).completedFiles || 0;
        const total = (latestRun as any).totalFiles || 45;
        const newProgress = `${completed} / ${total} files processed`;
        const newPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        if (currentProgress !== newProgress) {
          setCurrentProgress(newProgress);
          setProgressPercent(newPercent);
          
          // Synchronized refresh of all sections
          Promise.all([
            queryClient.invalidateQueries({ queryKey: ['/api/test-status/latest'] }),
            queryClient.invalidateQueries({ queryKey: ['/api/test-status/runs'] }),
            queryClient.invalidateQueries({ queryKey: ['/api/test-status/coverage'] }),
            queryClient.invalidateQueries({ queryKey: ['/api/test-status/deploy-ready'] })
          ]).then(() => {
            refetchRuns();
            refetchLatest();
          });
        }
      }
      
      setPreviousRunStatus(currentStatus);
    }
  }, [(latestRun as any)?.status, (latestRun as any)?.completedFiles, previousRunStatus, isRunning, queryClient]);

  // Trigger test run with real-time feedback
  const triggerTestRun = async (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    try {
      setIsStarting(true);
      setCurrentProgress('Initializing test run...');
      setProgressPercent(0);
      
      const response = await fetch('/api/test-status/run', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Test run failed: ${errorData.error || errorData.details || response.statusText}`);
      }
      
      setCurrentProgress('Test run starting...');
      
      // Clear cache for fresh data
      queryClient.removeQueries({ queryKey: ['/api/test-status/runs'] });
      queryClient.removeQueries({ queryKey: ['/api/test-status/latest'] });
      queryClient.removeQueries({ queryKey: ['/api/test-status/coverage'] });
      queryClient.removeQueries({ queryKey: ['/api/test-status/deploy-ready'] });
      
      setTimeout(() => {
        setIsStarting(false);
        setIsRunning(true);
        setCurrentProgress('Tests are now running...');
        
        // Coordinated refresh for all sections
        const synchronizedRefresh = async () => {
          try {
            await Promise.all([
              refetchRuns(),
              refetchLatest(),
              refetchCoverage(),
              refetchDeploy()
            ]);
            
            // Multiple refresh waves for perfect synchronization
            for (let wave = 0; wave < 3; wave++) {
              setTimeout(async () => {
                await Promise.all([
                  refetchRuns(),
                  refetchLatest()
                ]);
              }, wave * 200);
            }
          } catch (error) {
            console.warn('Synchronization error:', error);
          }
        };
        
        synchronizedRefresh();
      }, 300);
      
    } catch (error) {
      console.error('Failed to trigger test run:', error);
      setIsStarting(false);
      setIsRunning(false);
      setCurrentProgress(`Error: ${error instanceof Error ? error.message : String(error)}`);
      setProgressPercent(0);
      
      setTimeout(() => {
        setCurrentProgress('');
      }, 5000);
    }
  };

  const toggleExpanded = (runId: number) => {
    const newExpanded = new Set(expandedRuns);
    if (newExpanded.has(runId)) {
      newExpanded.delete(runId);
    } else {
      newExpanded.add(runId);
    }
    setExpandedRuns(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running': return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'skipped': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      passed: 'default',
      completed: 'default',
      failed: 'destructive',
      running: 'secondary',
      skipped: 'outline'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>;
  };

  if (runsLoading || deployLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-6 w-6 animate-spin" />
          <h1 className="text-3xl font-bold">Loading Test Status...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Test Status Dashboard</h1>
        <Button 
          type="button"
          role="button"
          onClick={triggerTestRun} 
          disabled={isRunning || isStarting} 
          className="flex items-center gap-2 transition-all duration-200"
          onMouseDown={(e) => e.preventDefault()}
        >
          {isStarting ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Starting...
            </>
          ) : isRunning ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run Tests
            </>
          )}
        </Button>
      </div>

      {/* Test Coverage and Deploy Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Coverage KPI */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6 text-blue-500" />
              Test Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {coverageLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm text-muted-foreground">Analyzing coverage...</span>
              </div>
            ) : coverageReport ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-blue-600">
                    {(coverageReport as any).coveragePercentage}%
                  </div>
                  <Badge 
                    variant={
                      (coverageReport as any).coveragePercentage >= 80 ? "default" : 
                      (coverageReport as any).coveragePercentage >= 60 ? "secondary" : "destructive"
                    }
                    className="text-lg px-3 py-1"
                  >
                    {(coverageReport as any).coveragePercentage >= 80 ? "Excellent" : 
                     (coverageReport as any).coveragePercentage >= 60 ? "Good" : "Needs Work"}
                  </Badge>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      (coverageReport as any).coveragePercentage >= 80 ? 'bg-green-500' : 
                      (coverageReport as any).coveragePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(coverageReport as any).coveragePercentage}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">{Array.isArray((coverageReport as any).testedFiles) ? (coverageReport as any).testedFiles.length : (coverageReport as any).testedFiles}</span>
                    <span className="text-muted-foreground"> files tested</span>
                  </div>
                  <div>
                    <span className="font-medium">{(coverageReport as any).totalFiles - (Array.isArray((coverageReport as any).testedFiles) ? (coverageReport as any).testedFiles.length : (coverageReport as any).testedFiles)}</span>
                    <span className="text-muted-foreground"> files uncovered</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No coverage data available</div>
            )}
          </CardContent>
        </Card>

        {/* Deploy Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Deploy Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {deployStatus?.ready ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
                <div>
                  <div className="font-semibold">
                    {deployStatus?.ready ? 'Ready to Deploy' : 'Not Ready'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {deployStatus?.reason || 'All tests must pass before deployment'}
                  </div>
                </div>
              </div>
              <Badge variant={deployStatus?.ready ? "default" : "destructive"}>
                {deployStatus?.ready ? 'Ready' : 'Blocked'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Running Tests Progress */}
      {(isRunning || isStarting || currentProgress) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-6 w-6 animate-spin text-blue-500" />
              Running Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{currentProgress}</span>
                <span className="text-sm text-muted-foreground">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Test Run Details */}
      {latestRun && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon((latestRun as any).status)}
              Current Test Run
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-green-600">{(latestRun as any).passedTests}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{(latestRun as any).failedTests}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{(latestRun as any).totalTests}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{formatDuration((latestRun as any).duration)}</div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Run History with Expandable Details */}
      <Card>
        <CardHeader>
          <CardTitle>Test Run History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testRuns && Array.isArray(testRuns) && testRuns.length > 0 ? (
              testRuns.map((run: TestRun) => (
                <Collapsible key={run.id} open={expandedRuns.has(run.id)}>
                  <CollapsibleTrigger 
                    onClick={() => toggleExpanded(run.id)}
                    className="flex items-center justify-between w-full p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(run.status)}
                      <div>
                        <div className="font-semibold">Run #{run.id}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(run.startedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(run.status)}
                        <Badge variant="outline">{run.passedTests}/{run.totalTests} passed</Badge>
                        <Badge variant="outline">{formatDuration(run.duration)}</Badge>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    <div className="mt-4 space-y-2">
                      {run.testCases
                        .filter(tc => filters.failed ? tc.status === 'failed' : true)
                        .filter(tc => filters.skipped ? tc.status === 'skipped' : true)
                        .map((testCase, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded border">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(testCase.status)}
                              <div>
                                <div className="font-medium">{testCase.testName}</div>
                                <div className="text-sm text-muted-foreground">{testCase.testSuite}</div>
                                {testCase.errorMessage && (
                                  <div className="text-sm text-red-600 mt-1">{testCase.errorMessage}</div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(testCase.status)}
                              <span className="text-sm text-muted-foreground">
                                {formatTestDuration(testCase.duration)}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No test runs found. Click "Run Tests" to start your first test run.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}